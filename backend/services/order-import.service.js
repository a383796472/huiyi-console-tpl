/**
 * 订单导入服务
 * C 端：Shopify / 聚水潭 / 1688 / 天猫（自动识别平台）
 * B 端：金蝶「销售订单」月报 Excel
 *
 * 同时服务于：
 *   - 命令行脚本 scripts/import-orders.js、scripts/import-b2b-orders.js
 *   - 后台上传接口 POST /api/orders/import、POST /api/b2b-orders/import
 */
const path = require('path');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const db = require('../config/db');

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
  const src = String(text).replace(/^\uFEFF/, '');
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

// ---------- 状态归一化 ----------
function statusCode(platform, status, extra = {}) {
  const s = String(status || '').trim();
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

// ---------- 各平台行构建（返回统一订单行） ----------

// Shopify：订单级 CSV + 明细 CSV
function buildShopifyRows(orders, lineRows, fileLabel, syncDate) {
  const itemsByOrder = {};
  for (const l of lineRows) {
    const no = EMPTY(l['订单号']);
    if (!no) continue;
    (itemsByOrder[no] = itemsByOrder[no] || []).push(l);
  }
  return orders
    .filter((o) => EMPTY(o['订单号']))
    .map((o) => {
      const no = o['订单号'].trim();
      const items = itemsByOrder[no] || [];
      return {
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
        raw_data: { source: 'shopify', file: fileLabel, order: o, items },
        sync_date: syncDate || null,
      };
    });
}

// 聚水潭：订单明细数组，按内部订单号聚合
function buildJushuitanRows(rows, fileLabel, syncDate) {
  const groups = new Map();
  for (const r of rows) {
    const key = String(r['内部订单号'] || '');
    if (!key || key === '-') continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const all = [];
  for (const [no, g] of groups) {
    const head = g[0];
    const status = String(head['状态'] || '');
    const counted = /^已发货$/.test(status) || /^待发货$/.test(status) || /^等待发货/.test(status);
    const firstOk = (fn) => {
      for (const r of g) { const v = fn(r); if (v !== null && v !== undefined && v !== '') return v; }
      return null;
    };
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
      item_count: g.reduce((s, r) => s + (num(r['数量']) || 0), 0),
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
        file: fileLabel,
        order: { ...head, 状态: status, 内部订单号: no },
        items: g.map((r) => ({
          款号: r['款号'], 商品编码: r['商品编码'], 规格颜色: r['颜色及规格'], 数量: r['数量'],
          商品金额: r['商品金额'], 买家实付: r['买家实付'], 卖家实收: r['卖家实收'],
          子订单编号: r['子订单编号'], 线上子订单编号: r['线上子订单编号'],
        })),
      },
      sync_date: syncDate || null,
    });
  }
  return all;
}

// 1688：明细级 CSV，按订单号聚合
function build1688Rows(rows, fileLabel, syncDate) {
  const groups = new Map();
  for (const r of rows) {
    const key = EMPTY(r['订单号']);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const all = [];
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
        file: fileLabel,
        order: head,
        items: g.map((r) => ({
          商品标题: r['商品标题'], 子订单号: r['子订单号'], 单价: r['单价'], 数量: r['数量'],
          行金额: r['行金额'], 行退款: r['行退款'],
        })),
      },
      sync_date: syncDate || null,
    });
  }
  return all;
}

// 天猫：明细级，按订单编号聚合
function buildTmallRows(dict, fileLabel, syncDate) {
  const groups = new Map();
  for (const r of dict) {
    const key = EMPTY(r['订单编号']);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  const all = [];
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
      is_counted: ['交易成功', '卖家已发货，等待买家确认', '等待买家确认收货'].includes(status) ? 1 : 0,
      logistics_no: firstOk((r) => EMPTY(r['物流单号'])),
      logistics_company: null,
      remark: firstOk((r) => EMPTY(r['买家留言'])) || firstOk((r) => EMPTY(r['商家备注'])) || firstOk((r) => EMPTY(r['订单关闭原因'])),
      raw_data: {
        source: 'tmall',
        file: fileLabel,
        order: { 订单编号: no, 订单状态: status, 是否计入业绩: head['是否计入业绩'], 店铺名称: head['店铺名称'] },
        items: g.map((r) => ({
          商品标题: r['商品标题'], 商家编码: r['商家编码'], 数量: r['宝贝总数量'],
          实付: r['买家实付金额'], 退款: r['退款金额'],
        })),
      },
      sync_date: syncDate || dOnly(firstOk((r) => dt(r['订单付款时间']))) || dOnly(firstOk((r) => dt(r['订单创建时间']))),
    });
  }
  return all;
}

// ---------- C 端入库 ----------
const CEND_COLS = [
  'platform', 'shop_name', 'order_no', 'online_order_no', 'order_time', 'pay_time', 'fulfill_time',
  'buyer_name', 'buyer_account', 'province', 'item_count', 'item_kind_count', 'currency',
  'total_amount', 'paid_amount', 'freight_amount', 'discount_amount', 'refund_amount',
  'order_status', 'status_code', 'is_counted', 'logistics_no', 'logistics_company',
  'remark', 'raw_data', 'sync_date',
];

async function saveCendOrders(rows) {
  if (!rows.length) return 0;
  const CHUNK = 400; // 26 列 × 400 = 10400 个占位符，远低于上限
  const updateSet = CEND_COLS.filter((c) => c !== 'platform' && c !== 'order_no')
    .map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => `(${CEND_COLS.map(() => '?').join(',')})`).join(',');
    const args = [];
    for (const r of chunk) {
      for (const c of CEND_COLS) {
        let v = r[c];
        if (c === 'raw_data') v = v ? JSON.stringify(v) : null;
        args.push(v);
      }
    }
    await db.query(
      `INSERT INTO orders (\`${CEND_COLS.join('`, `')}\`) VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE ${updateSet}`,
      args
    );
  }
  return rows.length;
}

// ---------- B 端解析 / 入库 ----------
const B2B_ORDER_FIELDS = [
  'order_no', 'biz_date', 'doc_type', 'supplier', 'status', 'department', 'sales_person',
  'clerk', 'purchase_order_no', 'customer_type', 'created_time', 'customer', 'delivery_method',
  'address', 'country', 'province', 'city', 'customer_source', 'ship_status', 'customer_email',
  'line_count', 'item_count', 'total_amount', 'untaxed_amount', 'purchase_amount',
  'refund_amount', 'gross_profit', 'currency', 'remark',
];

const B2B_ITEM_FIELDS = [
  'order_no', 'line_no', 'material_no', 'material_name', 'spec', 'unit_price', 'quantity',
  'pre_amount', 'local_amount', 'untaxed_total', 'untaxed_line_amount', 'sales_fx_amount',
  'sales_local_amount', 'tax_amount', 'purchase_price', 'purchase_total', 'purchase_order_total',
  'return_amount', 'gross_profit', 'gross_profit_rate', 'remark',
];

const text = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const numPlain = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function excelDate(v) {
  if (typeof v === 'number' && v > 20000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = text(v);
  if (!s) return null;
  const m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null;
}

function excelDateTime(v) {
  const s = text(v);
  if (!s) return null;
  const m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})[ T](\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (!m) return null;
  const p = (x) => String(x).padStart(2, '0');
  return `${m[1]}-${p(m[2])}-${p(m[3])} ${p(m[4])}:${p(m[5])}:${p(m[6])}`;
}

// 金蝶月报 Excel（Buffer 或文件路径均可），返回订单头 + 明细
function parseB2bWorkbook(input) {
  const wb = typeof input === 'string' ? XLSX.readFile(input) : XLSX.read(input, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // 第 1 行为大标题，第 2 行为表头
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true, range: 1 });

  const groups = new Map();
  for (const r of rows) {
    const orderNo = text(r['单据编号行']) || text(r['单据编号']);
    if (!orderNo) continue; // 跳过表尾空行/合计行
    if (!groups.has(orderNo)) groups.set(orderNo, []);
    groups.get(orderNo).push(r);
  }

  const orders = [];
  for (const [orderNo, lines] of groups) {
    const first = lines[0];
    const pick = (key) => {
      for (const l of lines) {
        const v = text(l[key]);
        if (v) return v;
      }
      return null;
    };

    const items = lines
      .map((l) => ({
        order_no: orderNo,
        line_no: text(l['单据行号']) || '10',
        material_no: text(l['物料编号']),
        material_name: text(l['物料名称']),
        spec: text(l['规格型号']),
        unit_price: numPlain(l['销售单价']),
        quantity: numPlain(l['销售数量']) ?? 0,
        pre_amount: numPlain(l['预收金额(核算币种)']) ?? 0,
        local_amount: numPlain(l['金额（本位币）']) ?? 0,
        untaxed_total: numPlain(l['未税总金额(交易币种)']) ?? 0,
        untaxed_line_amount: numPlain(l['销售订单行.未税金额(交易币种)']) ?? 0,
        sales_fx_amount: numPlain(l['销售总额(核算币种)']) ?? 0,
        sales_local_amount: numPlain(l['销售总额(本币)']) ?? 0,
        tax_amount: numPlain(l['价税合计(核算币种)']) ?? 0,
        purchase_price: numPlain(l['采购单价']),
        purchase_total: numPlain(l['采购总金额']) ?? 0,
        purchase_order_total: numPlain(l['采购单总额']) ?? 0,
        return_amount: numPlain(l['退货金额']) ?? 0,
        gross_profit: numPlain(l['单品毛利润']) ?? 0,
        gross_profit_rate: numPlain(l['单品毛利润率']),
        remark: text(l['备注']),
      }))
      .sort((a, b) => Number(a.line_no) - Number(b.line_no));

    const sum = (key) => round2(items.reduce((acc, it) => acc + (Number(it[key]) || 0), 0));

    orders.push({
      order_no: orderNo,
      biz_date: excelDate(first['业务日期']),
      doc_type: pick('单据类型行'),
      supplier: pick('供应商'),
      status: pick('状态'),
      department: pick('部门'),
      sales_person: pick('销售业务员'),
      clerk: pick('业务员'),
      purchase_order_no: pick('采购订单号'),
      customer_type: pick('新老客户'),
      created_time: excelDateTime(first['创建时间']),
      customer: pick('客户'),
      delivery_method: pick('交货方式'),
      address: pick('收货地址信息'),
      country: pick('客户国家'),
      province: pick('客户省份/地区'),
      city: pick('客户城市'),
      customer_source: pick('客户来源'),
      ship_status: pick('发货情况'),
      customer_email: pick('客户邮箱'),
      line_count: items.length,
      item_count: sum('quantity'),
      total_amount: sum('tax_amount'),
      untaxed_amount: sum('untaxed_total'),
      purchase_amount: sum('purchase_total'),
      refund_amount: sum('return_amount'),
      gross_profit: sum('gross_profit'),
      currency: 'CNY',
      remark: items.map((i) => i.remark).find(Boolean) || null,
      items,
    });
  }

  orders.sort((a, b) => String(b.biz_date).localeCompare(String(a.biz_date)) || b.order_no.localeCompare(a.order_no));
  return orders;
}

async function saveB2bOrders(orders) {
  if (!orders.length) return 0;
  const conn = await db.getConnection();
  let itemTotal = 0;
  try {
    await conn.beginTransaction();
    for (const o of orders) {
      const orderValues = B2B_ORDER_FIELDS.map((f) => o[f]);
      const updates = B2B_ORDER_FIELDS
        .filter((f) => f !== 'order_no')
        .map((f) => `\`${f}\` = VALUES(\`${f}\`)`)
        .join(', ');
      await conn.query(
        `INSERT INTO b2b_orders (${B2B_ORDER_FIELDS.map((f) => `\`${f}\``).join(', ')}) VALUES (?) ON DUPLICATE KEY UPDATE ${updates}`,
        [orderValues]
      );
      const [[row]] = await conn.query('SELECT id FROM b2b_orders WHERE order_no = ?', [o.order_no]);
      await conn.query('DELETE FROM b2b_order_items WHERE order_no = ?', [o.order_no]);
      const itemRows = o.items.map((it) => [row.id, ...B2B_ITEM_FIELDS.map((f) => it[f])]);
      if (itemRows.length) {
        await conn.query(
          `INSERT INTO b2b_order_items (order_id, ${B2B_ITEM_FIELDS.map((f) => `\`${f}\``).join(', ')}) VALUES ?`,
          [itemRows]
        );
        itemTotal += itemRows.length;
      }
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return itemTotal;
}

// ---------- 上传文件解析 ----------
const todayStr = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const inRange = (dateKey, range, today) => {
  if (!dateKey) return false;
  if (range === 'all') return true;
  if (range === 'today') return dateKey === today;
  if (range === 'month') return dateKey.slice(0, 7) === today.slice(0, 7);
  return true;
};

const cendOrderDate = (r) => dOnly(r.order_time) || dOnly(r.pay_time) || (r.sync_date ? String(r.sync_date).slice(0, 10) : null);

function detectCsvKind(rows) {
  if (!rows.length) return 'unknown';
  const h = new Set(Object.keys(rows[0]));
  if (h.has('内部订单号')) return 'jushuitan';
  if (h.has('财务状态') || h.has('履约状态') || h.has('取消时间')) return 'shopify-orders';
  if (h.has('子订单号') || h.has('行金额') || h.has('是否计入业绩') || h.has('订单状态')) return 'alibaba1688';
  if (h.has('SKU') || h.has('商品handle') || h.has('变体')) return 'shopify-lines';
  if (h.has('订单编号')) return 'tmall';
  if (h.has('订单号') && (h.has('商品标题') || h.has('商品名称') || h.has('数量'))) return 'shopify-lines';
  if (h.has('订单号')) return 'alibaba1688';
  return 'unknown';
}

function detectExcelKind(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const asText = (arr) => (arr || []).map((v) => String(v));
  const rows2 = XLSX.utils.sheet_to_json(ws, { header: 1, range: 1, blankrows: false });
  const header2 = asText(rows2[0]);
  if (header2.some((h) => h.includes('单据编号'))) return 'b2b';
  if (header2.some((h) => h.includes('订单编号'))) return 'tmall';
  const rows1 = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, blankrows: false });
  const header1 = asText(rows1[0]);
  if (header1.some((h) => h.includes('单据编号'))) return 'b2b';
  if (header1.some((h) => h.includes('订单编号'))) return 'tmall';
  return 'unknown';
}

async function readTmallRows(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  const headers = [];
  ws.getRow(1).eachCell((cell, col) => { headers[col - 1] = String(cell.value ?? '').trim(); });
  const dict = [];
  ws.eachRow((row, idx) => {
    if (idx === 1) return;
    const vals = row.values.slice(1); // row.values[0] 为占位
    const o = {};
    headers.forEach((h, i) => { if (h) o[h] = vals[i] !== undefined ? vals[i] : ''; });
    dict.push(o);
  });
  return dict;
}

/**
 * 导入 C 端订单文件
 * @param {Array<{originalname:string, buffer:Buffer}>} files
 * @param {'today'|'month'|'all'} range
 */
async function importCendFiles(files, range = 'today') {
  const today = todayStr();
  const fileResults = [];
  const allRows = [];
  const shopifyOrderGroups = [];
  const shopifyLineRows = [];

  for (const f of files) {
    const name = f.originalname || '未命名文件';
    const ext = path.extname(name).toLowerCase();
    const item = { name, platform: null, count: 0, skipped: 0, error: null };
    let built = null;
    try {
      if (ext === '.json') {
        const payload = safeParse(f.buffer.toString('utf8'));
        if (!Array.isArray(payload.rows)) throw new Error('未找到 rows 数组，不是聚水潭订单文件');
        item.platform = 'jushuitan';
        built = buildJushuitanRows(payload.rows, name, today);
      } else if (ext === '.csv') {
        const rows = parseCSV(f.buffer.toString('utf8'));
        if (!rows.length) throw new Error('CSV 内容为空或格式不正确');
        const kind = detectCsvKind(rows);
        if (kind === 'shopify-orders') {
          item.platform = 'shopify';
          shopifyOrderGroups.push({ index: fileResults.length, name, rows });
        } else if (kind === 'shopify-lines') {
          item.platform = 'shopify';
          shopifyLineRows.push(...rows);
        } else if (kind === 'jushuitan') {
          item.platform = 'jushuitan';
          built = buildJushuitanRows(rows, name, today);
        } else if (kind === 'alibaba1688') {
          item.platform = 'alibaba1688';
          built = build1688Rows(rows, name, today);
        } else if (kind === 'tmall') {
          throw new Error('天猫订单请上传后台导出的 .xlsx 文件');
        } else {
          throw new Error('无法识别该 CSV 所属平台');
        }
      } else if (ext === '.xlsx' || ext === '.xls') {
        const kind = detectExcelKind(f.buffer);
        if (kind === 'b2b') throw new Error('这是 B 端月报，请到「B端订单」页面导入');
        if (kind !== 'tmall') throw new Error('无法识别的 Excel，未找到「订单编号」表头');
        item.platform = 'tmall';
        const dict = await readTmallRows(f.buffer);
        built = buildTmallRows(dict, name, today);
      } else {
        throw new Error('仅支持 .csv / .json / .xlsx / .xls 文件');
      }
      if (built) {
        allRows.push(...built);
        item.count = built.length;
      }
    } catch (e) {
      item.error = e.message;
    }
    fileResults.push(item);
  }

  // Shopify 需要订单文件 + 明细文件配合，全部解析完后再聚合
  for (const g of shopifyOrderGroups) {
    const built = buildShopifyRows(g.rows, shopifyLineRows, g.name, today);
    allRows.push(...built);
    const item = fileResults[g.index];
    item.count = built.length;
    item.skipped = Math.max(g.rows.length - built.length, 0);
  }

  // 以文件内最新订单日期为基准（用户导入的常是昨日/上月数据，不能按服务器今天算）
  const allDates = allRows.map(cendOrderDate).filter(Boolean).sort();
  const refDate = allDates.length ? allDates[allDates.length - 1] : today;

  let kept = allRows;
  let skippedByRange = 0;
  let skippedNoDate = 0;
  if (range !== 'all') {
    kept = [];
    for (const r of allRows) {
      const d = cendOrderDate(r);
      if (!d) { skippedNoDate++; continue; }
      if (inRange(d, range, refDate)) kept.push(r);
      else skippedByRange++;
    }
  }

  const saved = await saveCendOrders(kept);

  const byPlatform = {};
  for (const r of kept) byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1;

  return {
    range,
    refDate,
    total: kept.length,
    saved,
    skippedByRange,
    skippedNoDate,
    byPlatform,
    files: fileResults,
  };
}

/**
 * 导入 B 端订单文件（金蝶销售订单月报 Excel）
 * @param {Array<{originalname:string, buffer:Buffer}>} files
 * @param {'today'|'month'|'all'} range
 */
async function importB2bFiles(files, range = 'today') {
  const today = todayStr();
  const fileResults = [];
  const perFile = [];
  const collected = [];

  for (const f of files) {
    const name = f.originalname || '未命名文件';
    const ext = path.extname(name).toLowerCase();
    const item = { name, count: 0, skipped: 0, error: null };
    try {
      if (ext !== '.xlsx' && ext !== '.xls') throw new Error('B 端仅支持 Excel（.xlsx / .xls）');
      const kind = detectExcelKind(f.buffer);
      if (kind !== 'b2b') throw new Error('未找到「单据编号行」表头，不是金蝶销售订单月报');
      const orders = parseB2bWorkbook(f.buffer);
      perFile.push({ item, orders });
      collected.push(...orders);
    } catch (e) {
      item.error = e.message;
    }
    fileResults.push(item);
  }

  // 以文件内最新业务日期为基准（月报常在次月导入）
  const allDates = collected.map((o) => o.biz_date).filter(Boolean).sort();
  const refDate = allDates.length ? allDates[allDates.length - 1] : today;

  for (const { item, orders } of perFile) {
    const kept = range === 'all' ? orders : orders.filter((o) => inRange(o.biz_date, range, refDate));
    item.count = kept.length;
    item.skipped = orders.length - kept.length;
  }

  // 同一单据编号以最后一个文件为准
  const filtered = range === 'all' ? collected : collected.filter((o) => inRange(o.biz_date, range, refDate));
  const map = new Map();
  for (const o of filtered) map.set(o.order_no, o);
  const orders = [...map.values()];

  const items = await saveB2bOrders(orders);
  const amount = round2(orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0));

  return { range, refDate, orders: orders.length, items, amount, files: fileResults };
}

module.exports = {
  // 通用
  EMPTY, num, dt, dOnly, parseCSV, statusCode,
  // 平台行构建（CLI 复用）
  buildShopifyRows, buildJushuitanRows, build1688Rows, buildTmallRows, readTmallRows,
  saveCendOrders, CEND_COLS,
  // B 端
  parseB2bWorkbook, saveB2bOrders, B2B_ORDER_FIELDS, B2B_ITEM_FIELDS,
  // 上传导入
  importCendFiles, importB2bFiles,
};
