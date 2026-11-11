/**
 * B端销售订单 - Excel 导入脚本
 *
 * 数据源：金蝶「销售订单」月报导出（一行 = 一个订单行，同一单据编号多行）
 * 用途：
 *   1) 按「单据编号」聚合成订单头 + 明细行，幂等写入本地库 b2b_orders / b2b_order_items
 *   2) 同时生成可直接上传宝塔导入 console-backend 的 .sql 文件
 *
 * 解析/入库逻辑与后台上传接口共用 services/order-import.service.js
 *
 * 用法：
 *   node scripts/import-b2b-orders.js "D:\TraeWork Data\B端订单\10月B端月报销售订单数据.xlsx"
 *   node scripts/import-b2b-orders.js "xxx.xlsx" --sql-out "D:\xxx\b2b_orders.sql"
 *   node scripts/import-b2b-orders.js "xxx.xlsx" --no-sql     # 只入本地库
 */
const fs = require('fs');
const path = require('path');
const {
  parseB2bWorkbook,
  saveB2bOrders,
  B2B_ORDER_FIELDS,
  B2B_ITEM_FIELDS,
} = require('../services/order-import.service');

const DEFAULT_XLSX = 'D:\\TraeWork Data\\B端订单\\10月B端月报销售订单数据.xlsx';
const DEFAULT_SQL_DIR = 'D:\\myCode\\huiyi\\DataSync\\订单SQL导入';
const MIGRATION_SQL = path.join(__dirname, '..', 'db', 'migrations', '2026-11-10_create_b2b_orders.sql');

// ---------- 参数解析 ----------
const argv = process.argv.slice(2);
const inputFile = argv.find((a) => !a.startsWith('--')) || DEFAULT_XLSX;
const sqlOutIdx = argv.indexOf('--sql-out');
const sqlOutArg = sqlOutIdx >= 0 ? argv[sqlOutIdx + 1] : null;
const noSql = argv.includes('--no-sql');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------- 生成线上导入 SQL ----------
const sqlEscape = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '')}'`;
};

function buildSql(orders) {
  const migration = fs.readFileSync(MIGRATION_SQL, 'utf8');
  const lines = [
    '-- B端销售订单导入（console-backend）',
    `-- 生成时间: ${new Date().toISOString()}`,
    '-- 说明: 仅创建/写入 b2b_orders、b2b_order_items 两张表，不影响 C 端 orders 及其他业务表',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
    migration.trim(),
    ''
  ];

  for (const o of orders) {
    lines.push(
      `REPLACE INTO \`b2b_orders\` (${B2B_ORDER_FIELDS.map((f) => `\`${f}\``).join(', ')}) VALUES (${B2B_ORDER_FIELDS.map((f) => sqlEscape(o[f])).join(', ')});`
    );
  }

  lines.push('');

  for (const o of orders) {
    for (const it of o.items) {
      const values = B2B_ITEM_FIELDS.map((f) => sqlEscape(it[f]));
      const orderIdExpr = `(SELECT id FROM b2b_orders WHERE order_no = ${sqlEscape(o.order_no)} LIMIT 1)`;
      lines.push(
        `REPLACE INTO \`b2b_order_items\` (\`order_id\`, ${B2B_ITEM_FIELDS.map((f) => `\`${f}\``).join(', ')}) VALUES (${[orderIdExpr, ...values].join(', ')});`
      );
    }
  }

  lines.push('', 'SET FOREIGN_KEY_CHECKS = 1;', '');
  return lines.join('\n');
}

// ---------- 主流程 ----------
(async () => {
  try {
    console.log(`📖 读取: ${inputFile}`);
    if (!fs.existsSync(inputFile)) throw new Error(`Excel 文件不存在：${inputFile}`);
    const orders = parseB2bWorkbook(fs.readFileSync(inputFile));
    const itemCount = orders.reduce((n, o) => n + o.items.length, 0);
    const totalAmount = round2(orders.reduce((n, o) => n + o.total_amount, 0));
    console.log(`✅ 解析完成: 订单 ${orders.length} 单 / 明细 ${itemCount} 行 / 价税合计 ${totalAmount}`);

    const insertedItems = await saveB2bOrders(orders);
    console.log(`✅ 已写入本地库: 订单 ${orders.length} 单 / 明细 ${insertedItems} 行`);

    if (!noSql) {
      const month = (orders.map((o) => o.biz_date).filter(Boolean).sort().pop() || '').slice(0, 7) || 'unknown';
      const outFile = sqlOutArg || path.join(DEFAULT_SQL_DIR, `b2b_orders_${month}.sql`);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, buildSql(orders), 'utf8');
      console.log(`✅ 线上导入 SQL 已生成: ${outFile} (${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ 导入失败:', err.message);
    process.exit(1);
  }
})();
