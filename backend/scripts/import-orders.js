/**
 * 订单中心 - 数据导入脚本（四平台 → orders 表）
 * 读取各平台每日拉取的 CSV/JSON/XLSX，聚合为统一订单行后幂等入库
 * （UNIQUE KEY platform+order_no，重复导入自动覆盖为最新状态）
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

const PATHS = {
  shopify: 'D:\\myCode\\huiyi\\DataSync\\shopify\\data',
  jushuitan: 'D:\\TraeWork Data\\聚水潭订单拉取\\data',
  alibaba1688: 'D:\\myCode\\huiyi\\DataSync\\alibaba1688\\data',
  tmall: 'D:\\TraeWork Data\\天猫手动导出',
};

// ---------- 通用工具 ----------
const EMPTY = (v) => (v === undefined || v === null || String(v).trim() === '' || String(v).trim() === '-' ? null : String(v).trim());

const num = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[¥$,\s]/g, '');
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const dt = (v) => {
  const s = EMPTY(v);
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (m) return `${m[1]} ${m[2]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  return null;
};

const dOnly = (v) => {
  const s = EMPTY(v);
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

// 16位以上大整数转字符串防丢精度
const safeParse = (text) =>
  JSON.parse(text.replace(/("(?:[^"\\]|\\.)*")|(-?\b\d{16,}\b)/g, (m, str, big) => (str ? str : `"${big}"`)));

// CSV 解析（支持双引号包裹、内嵌逗号/引号）
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { /* skip */ }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const clean = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (!clean.length) return [];
  const headers = clean[0].map((h) => h.trim());
  return clean.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, idx) => { o[h] = r[idx] !== undefined ? r[idx] : ''; });
    return o;
  });
}

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

// ---------- 状态归一化 ----------
function statusCode(platform, status, extra = {}) {
  const s = String(status || '').trim();
  // Shopify 的状态在 extra 里（财务/履约两个维度），需在空值短路前处理
  if (platform === 'shopify') {
    if (extra.cancelled) return 'cancelled';
    const fin = extra.financial, ful = extra.fulfillment;
    if (ful === 'FULFILLED') return extra.closed ? 'completed' : 'shipped';
    if (fin === 'PAID') return 'paid';
    if (fin === 'PENDING') return 'pending';
    if (fin === 'VOIDED' || fin === 'REFUNDED') return 'cancelled';
    return 'other';
  }
  if (!s || s === '-') return 'other';
  if (/等待买家付款|待付款/.test(s)) return 'pending';
  if (/(等待卖家发货|待发货|等待发货)/.test(s)) return 'paid';
  if (/(等待买家收货|等待买家确认收货|卖家已发货)/.test(s) || s === '已发货') return 'shipped';
  if (/交易成功/.test(s)) return 'completed';
  if (/(交易取消|交易关闭|已取消|作废|取消)/.test(s)) return 'cancelled';
  return 'other';
}

// ---------- 各平台适配器 ----------
// 每个返回 [{ ...统一字段, raw_data: {...} }]

// Shopify：订单级CSV + 明细CSV
function importShopify() {
  const base = PATHS.shopify;
  const dirs = listDateDirs(base, null);
  const all = [];
  for (const d of dirs) {
    // 每日文件 orders_YYYY-MM-DD.csv；区间补拉文件 orders.csv —— 模糊匹配
    const dirPath = path.join(base, d);
    const orderFile = fs.readdirSync(dirPath).find((f) => /^orders(_[^_].*)?\.csv$/.test(f) || f === 'orders.csv');
    const lineFile = fs.readdirSync(dirPath).find((f) => /^order_lines(_[^_].*)?\.csv$/.test(f) || f === 'order_lines.csv');
    if (!orderFile) continue;
    const orders = readCSV(path.join(dirPath, orderFile)).filter((r) => EMPTY(r['订单号']));
    if (!orders.length) continue;
    const itemsByOrder = {};
    if (lineFile) {
      for (const l of readCSV(path.join(dirPath, lineFile))) {
        const no = EMPTY(l['订单号']);
        if (!no) continue;
        (itemsByOrder[no] = itemsByOrder[no] || []).push(l);
      }
    }
    for (const o of orders) {
      const no = o['订单号'].trim();
      const items = itemsByOrder[no] || [];
      all.push({
        platform: 'shopify',
        shop_name: 'GR Shopify 独立站',
        order_no: no,
        online_order_no: no,
        order_time: dt(o['创建时间']),
        pay_time: null,
        fulfill_time: dt(o['发货时间']),
        buyer_name: EMPTY(o['收件人']),
        buyer_account: null,
        province: null,
        item_count: items.reduce((s, i) => s + (num(i['数量']) || 0), 0),
        item_kind_count: items.length,
        currency: EMPTY(o['货币']) || 'USD',
        total_amount: num(o['订单总额']),
        paid_amount: num(o['订单总额']),
        freight_amount: num(o['运费']),
        discount_amount: num(o['折扣']),
        refund_amount: num(o['退款金额']) || 0,
        order_status: `${o['财务状态'] || '-'} / ${o['履约状态'] || '-'}`,
        status_code: statusCode('shopify', '', {
          cancelled: !!dt(o['取消时间']),
          financial: o['财务状态'],
          fulfillment: o['履约状态'],
          closed: !!dt(o['关闭时间']),
        }),
        is_counted: dt(o['取消时间']) ? 0 : 1,
        logistics_no: EMPTY(o['物流单号']),
        logistics_company: EMPTY(o['物流公司']),
        remark: EMPTY(o['折扣码']) ? `折扣码: ${o['折扣码']}` : null,
        raw_data: { source: 'shopify', file: orderFile, order: o, items },
        sync_date: d.split('_').pop(),
      });
    }
  }
  return all;
}

// 聚水潭：orders_raw.json（明细级，按内部订单号聚合）
function importJushuitan() {
  const base = PATHS.jushuitan;
  const dirs = listDateDirs(base, null);
  const all = [];
  for (const d of dirs) {
    const file = path.join(base, d, 'orders_raw.json');
    if (!fs.existsSync(file)) continue;
    let payload;
    try {
      payload = safeParse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.warn(`  ⚠ 聚水潭 ${d} JSON解析失败: ${e.message}`);
      continue;
    }
    const rows = payload.rows || [];
    if (!rows.length) continue;
    const groups = new Map();
    for (const r of rows) {
      const key = String(r['内部订单号'] || '');
      if (!key || key === '-') continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    for (const [no, g] of groups) {
      const head = g[0];
      const status = String(head['状态'] || '');
      const counted = /^已发货$/.test(status) || /^待发货$/.test(status) || /^等待发货/.test(status);
      const firstOk = (fn) => {
        for (const r of g) { const v = fn(r); if (v !== null && v !== undefined && v !== '') return v; }
        return null;
      };
      const itemCount = g.reduce((s, r) => s + (num(r['数量']) || 0), 0);
      all.push({
        platform: 'jushuitan',
        shop_name: EMPTY(head['店铺名称']),
        order_no: no,
        online_order_no: firstOk((r) => EMPTY(r['线上订单号'])),
        order_time: dt(head['下单时间']),
        pay_time: dt(head['付款日期']),
        fulfill_time: dt(firstOk((r) => EMPTY(r['发货日期']))),
        buyer_name: firstOk((r) => EMPTY(r['收货人'])) || firstOk((r) => EMPTY(r['买家帐号'])),
        buyer_account: EMPTY(head['买家帐号']),
        province: EMPTY(head['省份']),
        item_count: itemCount,
        item_kind_count: g.length,
        currency: 'CNY',
        total_amount: num(head['应付金额']),
        paid_amount: num(firstOk((r) => r['已付金额'] ?? null)) ?? num(head['应付金额']),
        freight_amount: num(head['运费']),
        discount_amount: null,
        refund_amount: num(firstOk((r) => r['订单退款金额'] ?? null)) || 0,
        order_status: status,
        status_code: statusCode('jushuitan', status),
        is_counted: counted ? 1 : 0,
        logistics_no: firstOk((r) => EMPTY(r['快递单号'])),
        logistics_company: firstOk((r) => EMPTY(r['快递公司'])),
        remark: firstOk((r) => EMPTY(r['买家留言'])) || firstOk((r) => EMPTY(r['订单备注'])),
        raw_data: {
          source: 'jushuitan',
          file: `orders_raw.json (${d})`,
          order: { ...head, 状态: status, 内部订单号: no },
          items: g.map((r) => ({
            款号: r['款号'], 商品编码: r['商品编码'], 规格颜色: r['颜色及规格'], 数量: r['数量'],
            商品金额: r['商品金额'], 买家实付: r['买家实付'], 卖家实收: r['卖家实收'],
            子订单编号: r['子订单编号'], 线上子订单编号: r['线上子订单编号'],
          })),
        },
        sync_date: d.split('_').pop(),
      });
    }
  }
  return all;
}

// 1688：orders_export_*.csv（明细级，按订单号聚合）
function import1688() {
  const base = PATHS.alibaba1688;
  const dirs = listDateDirs(base, null);
  const all = [];
  for (const d of dirs) {
    const dir = path.join(base, d);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^orders_export.*\.csv$/.test(f)) : [];
    for (const f of files) {
      const rows = readCSV(path.join(dir, f));
      const groups = new Map();
      for (const r of rows) {
        const key = EMPTY(r['订单号']);
        if (!key) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      }
      for (const [no, g] of groups) {
        const head = g[0];
        const status = String(head['订单状态'] || '');
        const paidSum = g.reduce((s, r) => s + (num(r['行金额']) || 0), 0);
        all.push({
          platform: 'alibaba1688',
          shop_name: '硕为科技 1688',
          order_no: no,
          online_order_no: no,
          order_time: dt(head['下单时间']),
          pay_time: null,
          fulfill_time: null,
          buyer_name: EMPTY(head['收件人']),
          buyer_account: EMPTY(head['买家账号']),
          province: (EMPTY(head['收件地区']) || '').split(/\s+/)[0] || null,
          item_count: g.reduce((s, r) => s + (num(r['数量']) || 0), 0),
          item_kind_count: g.length,
          currency: 'CNY',
          total_amount: num(head['订单总额']),
          paid_amount: paidSum,
          freight_amount: num(head['运费']),
          discount_amount: num(head['折扣']),
          refund_amount: num(head['订单退款']) || 0,
          order_status: status,
          status_code: statusCode('alibaba1688', status),
          is_counted: /是/.test(String(head['是否计入业绩'] || '')) ? 1 : 0,
          logistics_no: null,
          logistics_company: null,
          remark: null,
          raw_data: {
            source: 'alibaba1688',
            file: `${f} (${d})`,
            order: head,
            items: g.map((r) => ({
              商品标题: r['商品标题'], 子订单号: r['子订单号'], 单价: r['单价'], 数量: r['数量'],
              行金额: r['行金额'], 行退款: r['行退款'],
            })),
          },
          sync_date: d.split('_').pop(),
        });
      }
    }
  }
  return all;
}

// 天猫：ExportOrderList*.xlsx（后台手动导出，明细级，按订单编号聚合）
async function importTmall() {
  const base = PATHS.tmall;
  if (!fs.existsSync(base)) return [];
  const files = fs.readdirSync(base).filter((f) => /^ExportOrderList.*\.xlsx$/i.test(f));
  const all = [];
  const ExcelJS = require('exceljs');
  for (const f of files) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(base, f));
    const ws = wb.worksheets[0];
    const rows = [];
    ws.eachRow((row, idx) => {
      if (idx === 1) return;
      const vals = row.values.slice(1); // row.values[0] 是占位
      rows.push(vals);
    });
    const headers = [];
    ws.getRow(1).eachCell((cell, col) => { headers[col - 1] = String(cell.value ?? '').trim(); });
    const dict = rows.map((vals) => {
      const o = {};
      headers.forEach((h, i) => { o[h] = vals[i] !== undefined ? vals[i] : ''; });
      return o;
    });
    const groups = new Map();
    for (const r of dict) {
      const key = EMPTY(r['订单编号']);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    for (const [no, g] of groups) {
      const head = g[0];
      const status = String(head['订单状态'] || '');
      const firstOk = (fn) => {
        for (const r of g) { const v = fn(r); if (v !== null && v !== undefined && v !== '') return v; }
        return null;
      };
      all.push({
        platform: 'tmall',
        shop_name: EMPTY(head['店铺名称']) || 'GR旗舰店',
        order_no: no,
        online_order_no: no,
        order_time: dt(head['订单创建时间']),
        pay_time: dt(firstOk((r) => EMPTY(r['订单付款时间']))),
        fulfill_time: null,
        buyer_name: firstOk((r) => EMPTY(r['买家会员名'])),
        buyer_account: firstOk((r) => EMPTY(r['买家会员名'])),
        province: null,
        item_count: g.reduce((s, r) => s + (num(r['宝贝总数量']) || 0), 0),
        item_kind_count: g.length,
        currency: 'CNY',
        total_amount: num(head['买家应付货款']),
        paid_amount: num(head['买家实付金额']),
        freight_amount: num(head['买家应付邮费']),
        discount_amount: null,
        refund_amount: num(head['退款金额']) || 0,
        order_status: status,
        status_code: statusCode('tmall', status),
        // 天猫后台无"是否计入业绩"原生列，按状态判断（与Excel汇总口径一致）
        is_counted: ['交易成功', '卖家已发货，等待买家确认', '等待买家确认收货'].includes(status) ? 1 : 0,
        logistics_no: firstOk((r) => EMPTY(r['物流单号'])),
        logistics_company: null,
        remark: firstOk((r) => EMPTY(r['买家留言'])) || firstOk((r) => EMPTY(r['商家备注'])) || firstOk((r) => EMPTY(r['订单关闭原因'])),
        raw_data: {
          source: 'tmall',
          file: f,
          order: { 订单编号: no, 订单状态: status, 是否计入业绩: head['是否计入业绩'], 店铺名称: head['店铺名称'] },
          items: g.map((r) => ({
            商品标题: r['商品标题'], 商家编码: r['商家编码'], 数量: r['宝贝总数量'],
            实付: r['买家实付金额'], 退款: r['退款金额'],
          })),
        },
        sync_date: dOnly(firstOk((r) => dt(r['订单付款时间']))) || dOnly(firstOk((r) => dt(r['订单创建时间']))),
      });
    }
  }
  return all;
}

// ---------- 入库 ----------
const COLS = [
  'platform', 'shop_name', 'order_no', 'online_order_no', 'order_time', 'pay_time', 'fulfill_time',
  'buyer_name', 'buyer_account', 'province', 'item_count', 'item_kind_count', 'currency',
  'total_amount', 'paid_amount', 'freight_amount', 'discount_amount', 'refund_amount',
  'order_status', 'status_code', 'is_counted', 'logistics_no', 'logistics_company',
  'remark', 'raw_data', 'sync_date',
];

async function upsert(rows) {
  if (!rows.length) return 0;
  const placeholders = rows.map(() => `(${COLS.map(() => '?').join(',')})`).join(',');
  const updateSet = COLS.filter((c) => c !== 'platform' && c !== 'order_no')
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
  const sql = `INSERT INTO orders (\`${COLS.join('`, `')}\`) VALUES ${placeholders}
               ON DUPLICATE KEY UPDATE ${updateSet}`;
  const args = [];
  for (const r of rows) {
    for (const c of COLS) {
      let v = r[c];
      if (c === 'raw_data') v = v ? JSON.stringify(v) : null;
      args.push(v);
    }
  }
  await db.query(sql, args);
  return rows.length;
}

async function main() {
  const argv = process.argv.slice(2);
  const getArg = (k) => {
    const a = argv.find((x) => x.startsWith(`--${k}=`));
    return a ? a.slice(k.length + 3) : null;
  };
  const days = Number(getArg('days') || 0);
  const sources = (getArg('source') || 'shopify,jushuitan,tmall,alibaba1688').split(',');

  console.log('=== 订单数据导入开始 ===');
  const t0 = Date.now();
  let total = 0;

  if (sources.includes('shopify')) {
    const rows = importShopify();
    total += await upsert(rows);
    console.log(`✓ Shopify: ${rows.length} 笔`);
  }
  if (sources.includes('jushuitan')) {
    const rows = importJushuitan();
    total += await upsert(rows);
    console.log(`✓ 聚水潭: ${rows.length} 笔`);
  }
  if (sources.includes('alibaba1688')) {
    const rows = import1688();
    total += await upsert(rows);
    console.log(`✓ 1688: ${rows.length} 笔`);
  }
  if (sources.includes('tmall')) {
    const rows = await importTmall();
    total += await upsert(rows);
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
