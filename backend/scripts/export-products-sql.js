/**
 * 导出 products 表为可上传宝塔的 .sql 快照，并打包产品图片
 *
 * 用法：node scripts/export-products-sql.js
 * 输出：
 *   <outDir>/products_上传宝塔_YYYYMMDD.sql   含「备份旧表 + 重建表 + 全量数据」
 *   <outDir>/products_images_上传服务器.zip     解压后得到 products/ 目录，覆盖到 backend/uploads/
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const JSZip = require('jszip');
const db = require('../config/db'); // require 即触发 .env 加载

const OUT_DIR = process.argv[2] || path.join(__dirname, '..', '..', '..', 'exports');
const IMAGE_DIR = path.join(__dirname, '..', 'uploads', 'products');
const DUMP_EXE = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const dateStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
const sqlFile = path.join(OUT_DIR, `products_上传宝塔_${dateStamp}.sql`);
const zipFile = path.join(OUT_DIR, 'products_images_上传服务器.zip');
const backupTable = `products_backup_${dateStamp}`;

const cfg = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || '3306',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'huiyi_test'
};

// 用 spawn + 文件重定向，避免 PowerShell 管道破坏中文编码
function dumpProducts() {
  return new Promise((resolve, reject) => {
    const fd = fs.openSync(sqlFile, 'w');
    const args = [
      `--user=${cfg.user}`, `--password=${cfg.password}`, `--host=${cfg.host}`, `--port=${cfg.port}`,
      '--default-character-set=utf8mb4', '--single-transaction', '--set-gtid-purged=OFF',
      '--no-tablespaces', '--skip-comments', '--skip-add-locks', '--skip-disable-keys',
      cfg.database, 'products'
    ];
    const child = spawn(DUMP_EXE, args, { stdio: ['ignore', fd, 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      fs.closeSync(fd);
      if (code === 0) return resolve();
      reject(new Error(`mysqldump 退出码 ${code}: ${stderr}`));
    });
  });
}

// 在 DROP TABLE 之前插入旧表备份语句（表不存在时跳过，避免 RENAME 报错）
function injectBackup(dumpText) {
  const header = [
    '-- 由 backend/scripts/export-products-sql.js 生成',
    `-- 生成时间：${now.toLocaleString('zh-CN', { hour12: false })}`,
    `-- 源库：${cfg.database} products`,
    'SET NAMES utf8mb4;',
    '',
    `-- 1) 备份线上现有 products 表（重复导入不会丢旧数据）`,
    `DROP TABLE IF EXISTS ${backupTable};`,
    "SET @has_products := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'products');",
    `SET @bk_sql := IF(@has_products > 0, 'RENAME TABLE products TO ${backupTable}', 'SELECT 1');`,
    'PREPARE bk_stmt FROM @bk_sql;',
    'EXECUTE bk_stmt;',
    'DEALLOCATE PREPARE bk_stmt;',
    '',
    '-- 2) 重建 products 表并写入全量数据',
    ''
  ].join('\n');
  return header + '\n' + dumpText;
}

async function zipImages() {
  const files = fs.existsSync(IMAGE_DIR) ? fs.readdirSync(IMAGE_DIR) : [];
  if (!files.length) return { count: 0, size: 0 };
  const zip = new JSZip();
  const folder = zip.folder('products');
  for (const name of files) {
    folder.file(name, fs.readFileSync(path.join(IMAGE_DIR, name)));
  }
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  fs.writeFileSync(zipFile, buffer);
  return { count: files.length, size: buffer.length };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM products');
  console.log(`本地 products：${total} 条`);

  await dumpProducts();
  const dumpText = fs.readFileSync(sqlFile, 'utf8');
  fs.writeFileSync(sqlFile, injectBackup(dumpText), 'utf8');

  const insertCount = (dumpText.match(/^INSERT INTO/gm) || []).length;
  const text = fs.readFileSync(sqlFile, 'utf8');
  if (!text.includes('CREATE TABLE')) throw new Error('导出的 SQL 缺少 CREATE TABLE，请检查 mysqldump');
  if (insertCount === 0) throw new Error('导出的 SQL 缺少 INSERT 数据');
  console.log(`SQL 已生成：${sqlFile}（CREATE TABLE 1 段，INSERT ${insertCount} 段）`);

  const imgs = await zipImages();
  console.log(`图片已打包：${zipFile}（${imgs.count} 张，${(imgs.size / 1024 / 1024).toFixed(1)} MB）`);

  process.exit(0);
}

main().catch((err) => {
  console.error('导出失败：', err);
  process.exit(1);
});
