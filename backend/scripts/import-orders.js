/**
 * 订单中心 - 数据导入脚本（四平台 → orders 表）
 * 读取各平台每日拉取的 CSV/JSON/XLSX，聚合为统一订单行后幂等入库
 * （UNIQUE KEY platform+order_no，重复导入自动覆盖为最新状态）
 *
 * 解析逻辑与后台上传接口共用 services/order-import.service.js
 *
 * 用法：
 *   node scripts/import-orders.js                  # 全量扫描所有日期目录 + 天猫手动导出
 *   node scripts/import-orders.js --days=3         # 只导入最近N天的每日数据（天猫除外，始终全量）
 *   node scripts/import-orders.js --source=shopify,alibaba1688   # 只导入指定源
 *
 * 数据源路径（本机绝对路径，换机器时改这里）：
 *   Shopify    D:\myCode\huiyi\DataSync\shopify\data\日期\orders_*.csv + order_lines_*.csv
 *   聚水潭     D:\TraeWork Data\聚水潭订单拉取\data\日期\orders_raw.json
 *   1688       D:\myCode\huiyi\DataSync\alibaba1688\data\日期\orders_export_*.csv
 *   天猫       D:\TraeWork Data\天猫手动导出\ExportOrderList*.xlsx（后台手动导出，放进来即并入）
 */
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const {
  parseCSV,
  buildShopifyRows,
  buildJushuitanRows,
  build1688Rows,
  buildTmallRows,
  readTmallRows,
  saveCendOrders,
} = require('../services/order-import.service');

const PATHS = {
  shopify: 'D:\\myCode\\huiyi\\DataSync\\shopify\\data',
  jushuitan: 'D:\\TraeWork Data\\聚水潭订单拉取\\data',
  alibaba1688: 'D:\\myCode\\huiyi\\DataSync\\alibaba1688\\data',
  tmall: 'D:\\TraeWork Data\\天猫手动导出',
};

const readCSV = (file) => parseCSV(fs.readFileSync(file, 'utf8'));

// 日期/区间目录列表（升序，旧→新，后导入的覆盖先导入的）
// 兼容每日目录(YYYY-MM-DD)与区间目录(YYYY-MM-DD_YYYY-MM-DD，如历史补拉)
function listDateDirs(base, days) {
  if (!fs.existsSync(base)) return [];
  let dirs = fs.readdirSync(base)
    .filter((n) => /^\d{4}-\d{2}-\d{2}(_\d{4}-\d{2}-\d{2})?$/.test(n) && fs.statSync(path.join(base, n)).isDirectory())
    .sort();
  if (days && days > 0) dirs = dirs.slice(-days);
  return dirs;
}

// ---------- 各平台适配器（目录扫描 → 统一订单行） ----------
function importShopify() {
  const base = PATHS.shopify;
  const all = [];
  for (const d of listDateDirs(base, null)) {
    const dirPath = path.join(base, d);
    // 每日文件 orders_YYYY-MM-DD.csv；区间补拉文件 orders.csv —— 模糊匹配
    const orderFile = fs.readdirSync(dirPath).find((f) => /^orders(_[^_].*)?\.csv$/.test(f) || f === 'orders.csv');
    const lineFile = fs.readdirSync(dirPath).find((f) => /^order_lines(_[^_].*)?\.csv$/.test(f) || f === 'order_lines.csv');
    if (!orderFile) continue;
    const orders = readCSV(path.join(dirPath, orderFile));
    if (!orders.length) continue;
    const lineRows = lineFile ? readCSV(path.join(dirPath, lineFile)) : [];
    all.push(...buildShopifyRows(orders, lineRows, orderFile, d.split('_').pop()));
  }
  return all;
}

function importJushuitan() {
  const base = PATHS.jushuitan;
  const all = [];
  for (const d of listDateDirs(base, null)) {
    const file = path.join(base, d, 'orders_raw.json');
    if (!fs.existsSync(file)) continue;
    let payload;
    try {
      payload = JSON.parse(
        fs.readFileSync(file, 'utf8').replace(/("(?:[^"\\]|\\.)*")|(-?\b\d{16,}\b)/g, (m, str, big) => (str ? str : `"${big}"`))
      );
    } catch (e) {
      console.warn(`  ⚠ 聚水潭 ${d} JSON解析失败: ${e.message}`);
      continue;
    }
    const rows = payload.rows || [];
    if (!rows.length) continue;
    all.push(...buildJushuitanRows(rows, `orders_raw.json (${d})`, d.split('_').pop()));
  }
  return all;
}

function import1688() {
  const base = PATHS.alibaba1688;
  const all = [];
  for (const d of listDateDirs(base, null)) {
    const dir = path.join(base, d);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^orders_export.*\.csv$/.test(f)) : [];
    for (const f of files) {
      all.push(...build1688Rows(readCSV(path.join(dir, f)), `${f} (${d})`, d.split('_').pop()));
    }
  }
  return all;
}

async function importTmall() {
  const base = PATHS.tmall;
  if (!fs.existsSync(base)) return [];
  const files = fs.readdirSync(base).filter((f) => /^ExportOrderList.*\.xlsx$/i.test(f));
  const all = [];
  for (const f of files) {
    const dict = await readTmallRows(fs.readFileSync(path.join(base, f)));
    // 天猫无目录概念，sync_date 由订单付款/创建日期推导
    all.push(...buildTmallRows(dict, f, null));
  }
  return all;
}

async function main() {
  const argv = process.argv.slice(2);
  const getArg = (k) => {
    const a = argv.find((x) => x.startsWith(`--${k}=`));
    return a ? a.slice(k.length + 3) : null;
  };
  const sources = (getArg('source') || 'shopify,jushuitan,tmall,alibaba1688').split(',');

  console.log('=== 订单数据导入开始 ===');
  const t0 = Date.now();
  let total = 0;

  if (sources.includes('shopify')) {
    const rows = importShopify();
    total += await saveCendOrders(rows);
    console.log(`✓ Shopify: ${rows.length} 笔`);
  }
  if (sources.includes('jushuitan')) {
    const rows = importJushuitan();
    total += await saveCendOrders(rows);
    console.log(`✓ 聚水潭: ${rows.length} 笔`);
  }
  if (sources.includes('alibaba1688')) {
    const rows = import1688();
    total += await saveCendOrders(rows);
    console.log(`✓ 1688: ${rows.length} 笔`);
  }
  if (sources.includes('tmall')) {
    const rows = await importTmall();
    total += await saveCendOrders(rows);
    console.log(`✓ 天猫: ${rows.length} 笔`);
  }

  const [stats] = await db.query(
    'SELECT platform, COUNT(*) n, SUM(is_counted=1) counted FROM orders GROUP BY platform'
  );
  console.log('--- 库内统计 ---');
  for (const s of stats) console.log(`  ${s.platform}: ${s.n} 笔（计入业绩 ${s.counted}）`);
  console.log(`=== 完成: 导入 ${total} 笔, 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s ===`);
  process.exit(0);
}

main().catch((e) => { console.error('导入失败:', e); process.exit(1); });
