/**
 * 导出 orders 表为可上传宝塔的 .sql 快照（含 DROP+CREATE+全量数据）
 * 每日导入任务第二步自动执行；也可手动运行：
 *   node scripts/export-orders-sql.js
 *
 * 输出：D:\TraeWork Data\宝塔订单SQL导出\orders_YYYY-MM-DD.sql（保留最近30天）
 * 用 spawn 的 stdio 文件重定向导出，绕开 PowerShell 管道的编码破坏（中文会变 ?）
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const db = require('../config/db'); // require 即触发 .env 加载

const OUT_DIR = 'D:\\TraeWork Data\\宝塔订单SQL导出';
const KEEP_DAYS = 30;
const DUMP_EXE = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
const outFile = path.join(OUT_DIR, `orders_${stamp}.sql`);

const cfg = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || '3306',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'huiyi_test',
};

function cleanup() {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 3600 * 1000;
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (!/^orders_\d{4}-\d{2}-\d{2}\.sql$/.test(f)) continue;
    const p = path.join(OUT_DIR, f);
    if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const fd = fs.openSync(outFile, 'w');
  const args = [
    `--user=${cfg.user}`, `--password=${cfg.password}`, `--host=${cfg.host}`, `--port=${cfg.port}`,
    '--default-character-set=utf8mb4', '--single-transaction', '--set-gtid-purged=OFF',
    '--no-tablespaces', '--skip-comments', cfg.database, 'orders',
  ];
  const dumpPath = fs.existsSync(DUMP_EXE) ? DUMP_EXE : 'mysqldump';

  const code = await new Promise((resolve, reject) => {
    const p = spawn(dumpPath, args, { stdio: ['ignore', fd, 'inherit'] });
    p.on('error', reject);
    p.on('close', resolve);
  });
  fs.closeSync(fd);

  if (code !== 0) throw new Error(`mysqldump 退出码 ${code}`);
  const size = fs.statSync(outFile).size;
  if (size < 1024) throw new Error(`导出文件异常（仅 ${size} 字节）`);

  // 与库内行数交叉验证
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM orders');
  const text = fs.readFileSync(outFile, 'utf8');
  const batchRows = [...text.matchAll(/^INSERT INTO `orders` VALUES .+$/gm)]
    .reduce((s, m) => s + (m[0].match(/\),\(/g) || []).length + 1, 0);
  if (batchRows !== n) throw new Error(`导出行数 ${batchRows} 与库内 ${n} 不一致`);
  if (!/GR Shopify|聚水潭|天猫/.test(text)) throw new Error('导出文件中文校验失败（编码可能损坏）');

  cleanup();
  console.log(`✅ 导出成功: ${outFile}（${(size / 1048576).toFixed(2)} MB，${n} 笔订单，行数与库内一致）`);
  process.exit(0);
}

main().catch((e) => {
  console.error('导出失败:', e.message);
  process.exit(1);
});
