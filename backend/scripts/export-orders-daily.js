/**
 * 导出"当日拉取"订单增量 SQL —— 供导入宝塔生产库（console-backend）
 * 提取当天新入库/有更新的订单（updated_at 当日窗口），生成幂等增量文件：
 *   - REPLACE INTO 写法，可安全重复导入，已有订单自动覆盖为最新
 *   - 不含 DROP/CREATE，绝不会清空线上已有数据
 *
 * 用法：
 *   node scripts/export-orders-daily.js              # 导出今天
 *   node scripts/export-orders-daily.js 2026-10-05   # 导出指定日期（补漏）
 *
 * 输出：D:\myCode\huiyi\DataSync\订单SQL导入\orders_daily_YYYY-MM-DD.sql（保留最近30天）
 * 与全量快照（宝塔订单SQL导出）互补：日常追加用增量，灾难重建用全量
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const db = require('../config/db'); // require 即触发 .env 加载

const OUT_DIR = 'D:\\myCode\\huiyi\\DataSync\\订单SQL导入';
const KEEP_DAYS = 30;
const DUMP_EXE = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const arg = process.argv[2];
const DAY = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : fmtDate(new Date());
const [y, m, d] = DAY.split('-').map(Number);
const WIN_START = `${DAY} 00:00:00`;
const WIN_END = `${fmtDate(new Date(y, m - 1, d + 1))} 00:00:00`;
const outFile = path.join(OUT_DIR, `orders_daily_${DAY}.sql`);

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
    if (!/^orders_daily_\d{4}-\d{2}-\d{2}\.sql$/.test(f)) continue;
    const p = path.join(OUT_DIR, f);
    if (!fs.statSync(p).isFile() || fs.statSync(p).mtimeMs >= cutoff) continue;
    fs.unlinkSync(p);
  }
}

async function main() {
  const [[stat]] = await db.query(
    'SELECT COUNT(*) AS total, SUM(created_at >= ?) AS added FROM orders WHERE updated_at >= ? AND updated_at < ?',
    [WIN_START, WIN_START, WIN_END]
  );
  const total = stat.total || 0;
  if (!total) {
    console.log(`✦ ${DAY} 无新增或更新的订单（当日拉取数据可能尚未导入），未生成文件`);
    process.exit(0);
  }
  const added = Number(stat.added || 0);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const fd = fs.openSync(outFile, 'w');
  fs.writeSync(fd, `-- ============================================================\n` +
    `-- 订单每日增量（当日新增/有更新的订单）  日期: ${DAY}\n` +
    `-- 笔数: ${total}（新增 ${added} / 更新 ${total - added}）\n` +
    `-- 用途: 导入宝塔 console-backend 库（线上 orders 表）\n` +
    `-- 说明: REPLACE INTO 幂等，可安全重复执行；不含 DROP/CREATE，不影响线上其他数据\n` +
    `--       若线上还没有 orders 表，请先导入全量快照（宝塔订单SQL导出）\n` +
    `-- ============================================================\n`);

  const args = [
    `--user=${cfg.user}`, `--password=${cfg.password}`, `--host=${cfg.host}`, `--port=${cfg.port}`,
    '--default-character-set=utf8mb4', '--single-transaction', '--set-gtid-purged=OFF',
    '--no-tablespaces', '--skip-comments', '--replace', '--no-create-info',
    `--where=updated_at >= '${WIN_START}' AND updated_at < '${WIN_END}'`,
    cfg.database, 'orders',
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
  if (size < 200) throw new Error(`导出文件异常（仅 ${size} 字节）`);
  const text = fs.readFileSync(outFile, 'utf8');
  if (/DROP TABLE/i.test(text)) throw new Error('增量文件不允许包含 DROP TABLE');
  const batchRows = [...text.matchAll(/^REPLACE INTO `orders` VALUES .+$/gm)]
    .reduce((s, x) => s + (x[0].match(/\),\(/g) || []).length + 1, 0);
  if (batchRows !== total) throw new Error(`文件行数 ${batchRows} 与库内 ${total} 不一致`);
  const [[sample]] = await db.query(
    'SELECT order_no FROM orders WHERE updated_at >= ? AND updated_at < ? LIMIT 1',
    [WIN_START, WIN_END]
  );
  if (!text.includes(sample.order_no)) throw new Error('抽样订单号未出现在文件中（编码可能损坏）');

  cleanup();
  console.log(`✅ ${DAY} 增量导出成功: ${outFile}`);
  console.log(`   共 ${total} 笔（新增 ${added} / 更新 ${total - added}），${(size / 1024).toFixed(1)} KB，行数/内容校验通过`);
  process.exit(0);
}

main().catch((e) => {
  console.error('导出失败:', e.message);
  process.exit(1);
});
