/**
 * 导入 GR SKU 总表（含附件图片压缩包）
 *
 * 用法：
 *   node scripts/import-products.js --xlsx <总表.xlsx> --zip <附件.zip> [--backup <备份文件.json>] [--replace]
 *
 * 说明：
 *   - 默认仅“清空并全量导入”（配合 --replace 使用），执行前会把现有 products 备份为 JSON
 *   - 图片从压缩包解压到 backend/uploads/products/，数据库存 /uploads/products/xxx 形式
 *   - 系列名称统一映射为：单品系列 / MS系列 / MT系列 / MW系列 / M66系列 / ST06双向充系列 / CZ车载支架系列 / GT运动相机系列
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const JSZip = require('jszip');
const db = require('../config/db');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'products');
const UPLOAD_URL_PREFIX = '/uploads/products';

const SERIES_MAP = {
  骑行单品: '单品系列',
  MS塑胶减震: 'MS系列',
  MT套装: 'MT系列',
  MW套装: 'MW系列',
  M66手机壳: 'M66系列',
  ST06双向充款: 'ST06双向充系列',
  CZ车载支架: 'CZ车载支架系列',
  运动相机支架: 'GT运动相机系列'
};

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : null;
};

const xlsxPath = getArg('--xlsx');
const zipPath = getArg('--zip');
const backupPath = getArg('--backup');
const replaceMode = args.includes('--replace');

// 总表列名 -> 数据库字段
const COLUMN_MAP = [
  ['SKU', 'sku'],
  ['产品编号', 'product_code'],
  ['系列', 'series'],
  ['系列编号', 'series_code'],
  ['产品状态', 'product_status'],
  ['EAN码', 'ean_code'],
  ['美国条形码编号', 'us_barcode'],
  ['海关编码', 'hs_code'],
  ['产品名称', 'product_name'],
  ['英文产品名称', 'english_name'],
  ['产品包装英文名称', 'package_english_name'],
  ['型号', 'model'],
  ['中国零售价', 'china_retail_price'],
  ['美国（USD）', 'usd_price'],
  ['欧洲（€）', 'eur_price'],
  ['适配车型', 'compatible_vehicles'],
  ['产品卖点', 'selling_points'],
  ['规格参数', 'specs'],
  ['标准配置（改进后需要修改）', 'standard_config'],
  ['生产工艺', 'production_process'],
  ['材料', 'material'],
  ['颜色', 'color'],
  ['产品净重（KG）', 'net_weight'],
  ['毛重（KG）\n（包含产品，包装）', 'gross_weight'],
  ['毛重（KG）（包含产品，包装）', 'gross_weight'],
  ['整箱毛重（KG）', 'whole_box_weight'],
  ['包装规格（MM）', 'packaging_size'],
  ['内小箱规格（MM）', 'inner_box_size'],
  ['外大箱规格（MM）', 'outer_box_size'],
  ['内箱装箱数量', 'inner_box_qty'],
  ['外箱装箱数量', 'outer_box_qty'],
  ['装箱数量', 'packing_qty'],
  ['MOQ', 'moq'],
  ['内箱SKU代码（ICS）', 'inner_box_sku'],
  ['外箱SKU代码(MCS)', 'outer_box_sku'],
  ['外箱SKU代码（MCS）', 'outer_box_sku'],
  ['内纸箱条形码（ICB）', 'inner_barcode'],
  ['产品供应中', 'product_supplying'],
  ['备注（2）', 'remark_2'],
  ['成本（1）', 'cost_1'],
  ['建议销售价', 'suggested_price'],
  ['海外竞对参考价-美（quadlock）', 'competitor_price_ql'],
  ['海外竞对参考价-美（sp）', 'competitor_price_sp'],
  ['备注', 'remark'],
  ['成本', 'cost'],
  ['建议销售价（1）', 'suggested_price_1'],
  ['海外竞对参考价-美：ql', 'competitor_price_ql_num'],
  ['海外竞对参考价-美：SP', 'competitor_price_sp_num'],
  ['备注（1）', 'remark_1']
];

const IMAGE_COLUMNS = { 产品图片: 'product_image', 品牌包装图片: 'brand_package_image' };

const NUMERIC_FIELDS = new Set([
  'usd_price', 'eur_price', 'net_weight', 'gross_weight', 'whole_box_weight', 'competitor_price_sp_num'
]);
const INT_FIELDS = new Set(['outer_box_qty']);

const cellText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value.richText) return value.richText.map((t) => t.text).join('');
    if (value.text !== undefined) return String(value.text);
    if (value.result !== undefined) return String(value.result);
    if (value instanceof Date) return value.toISOString();
    return '';
  }
  return String(value);
};

// 同名图片按 (1)(2)(3) 自然排序
const naturalCompare = (a, b) => a.localeCompare(b, 'zh-CN', { numeric: true });

const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');

async function main() {
  if (!xlsxPath || !zipPath) {
    console.error('缺少参数：node scripts/import-products.js --xlsx <总表.xlsx> --zip <附件.zip> [--backup <json>] [--replace]');
    process.exit(1);
  }
  if (!replaceMode) {
    console.error('为防止误操作，请显式追加 --replace 参数（会先备份再清空 products 表）');
    process.exit(1);
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // 1. 读取总表
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  const sheet = workbook.worksheets[0];
  const headers = [];
  for (let c = 1; c <= sheet.columnCount; c++) headers.push(cellText(sheet.getRow(1).getCell(c).value).trim());

  const rows = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const line = sheet.getRow(r);
    const raw = {};
    headers.forEach((h, i) => { raw[h] = cellText(line.getCell(i + 1).value); });
    const sku = (raw['SKU'] || '').trim();
    if (!sku) continue;
    rows.push({ rowNum: r, raw });
  }
  console.log(`总表数据行：${rows.length}`);

  // 2. 解压附件并按「单元格文件名 → 文件」建立有序映射
  const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
  const filesByFolder = {};
  for (const name of Object.keys(zip.files)) {
    if (zip.files[name].dir) continue;
    const [folderRaw, file] = name.split('/');
    const folder = (folderRaw || '').trim();
    (filesByFolder[folder] = filesByFolder[folder] || []).push(file);
  }
  Object.values(filesByFolder).forEach((list) => list.sort(naturalCompare));

  const baseNameOf = (file) => file.replace(/\(\d+\)(?=\.[^.]+$)/, '');

  // 同一单元格文本可能对应多个文件（Feishu 导出时同名图片会加序号），按行出现顺序依次分配
  const buildImageAllocator = (folder) => {
    const groups = {};
    (filesByFolder[folder] || []).forEach((file) => {
      const base = baseNameOf(file);
      (groups[base] = groups[base] || []).push(file);
    });
    const cursor = {};
    return (ref) => {
      const base = (ref || '').trim();
      if (!base) return null;
      const list = groups[base] || [];
      if (!list.length) return null;
      const used = cursor[base] || 0;
      cursor[base] = used + 1;
      return list[Math.min(used, list.length - 1)];
    };
  };

  const allocProduct = buildImageAllocator('产品图片');
  const allocBrand = buildImageAllocator('品牌包装图片');

  // 3. 落盘图片（按内容 md5 命名，天然去重）
  const savedImages = new Map();
  const saveImage = async (folder, file) => {
    const entry = zip.file(`${folder}/${file}`);
    if (!entry) return null;
    const buffer = await entry.async('nodebuffer');
    const hash = md5(buffer);
    const ext = path.extname(file).toLowerCase() || '.jpg';
    const filename = `gr-${hash.slice(0, 16)}${ext}`;
    if (!savedImages.has(hash)) {
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
      savedImages.set(hash, `${UPLOAD_URL_PREFIX}/${filename}`);
    }
    return savedImages.get(hash);
  };

  const records = [];
  for (const { rowNum, raw } of rows) {
    const record = {};
    COLUMN_MAP.forEach(([header, field]) => {
      if (record[field] !== undefined) return;
      const value = (raw[header] || '').trim();
      if (!value) return;
      if (NUMERIC_FIELDS.has(field) || INT_FIELDS.has(field)) {
        const num = parseFloat(value);
        record[field] = Number.isNaN(num) ? null : (INT_FIELDS.has(field) ? Math.round(num) : num);
        return;
      }
      record[field] = value;
    });
    delete record[null];

    const rawSeries = (raw['系列'] || '').trim();
    if (rawSeries) record.series = SERIES_MAP[rawSeries] || rawSeries;

    const productFile = allocProduct(raw['产品图片']);
    const productUrl = productFile ? await saveImage('产品图片', productFile) : null;
    record.product_image = productUrl ? JSON.stringify([productUrl]) : null;

    const brandFile = allocBrand(raw['品牌包装图片']);
    const brandUrl = brandFile ? await saveImage('品牌包装图片', brandFile) : null;
    record.brand_package_image = brandUrl ? JSON.stringify([brandUrl]) : null;

    if (!record.product_name) record.product_name = record.sku;
    records.push({ rowNum, record });
  }

  console.log(`图片去重后落盘：${savedImages.size} 个 -> ${UPLOAD_DIR}`);

  // 4. 备份现有数据
  const [existing] = await db.query('SELECT * FROM products ORDER BY id');
  const backupFile = backupPath || path.join(__dirname, '..', `products-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(existing, null, 2));
  console.log(`已备份现有产品 ${existing.length} 条 -> ${backupFile}`);

  // 5. 清空并写入
  const fields = [
    'sku', 'product_code', 'series', 'series_code', 'product_status', 'ean_code', 'us_barcode', 'hs_code',
    'product_name', 'english_name', 'package_english_name', 'model',
    'china_retail_price', 'usd_price', 'eur_price', 'compatible_vehicles',
    'selling_points', 'specs', 'standard_config', 'production_process', 'material', 'color',
    'net_weight', 'gross_weight', 'whole_box_weight', 'packaging_size',
    'product_image', 'brand_package_image',
    'inner_box_size', 'outer_box_size', 'inner_box_qty', 'outer_box_qty', 'packing_qty', 'moq',
    'inner_box_sku', 'outer_box_sku', 'inner_barcode', 'product_supplying',
    'remark_2', 'cost_1', 'suggested_price',
    'competitor_price_ql', 'competitor_price_sp', 'remark', 'cost', 'suggested_price_1',
    'competitor_price_ql_num', 'competitor_price_sp_num', 'remark_1'
  ];
  const placeholders = `(${fields.map(() => '?').join(', ')})`;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM products');
    await conn.query('ALTER TABLE products AUTO_INCREMENT = 1');

    for (const { record } of records) {
      await conn.query(
        `INSERT INTO products (${fields.join(', ')}) VALUES ${placeholders}`,
        fields.map((f) => (record[f] === undefined ? null : record[f]))
      );
    }
    await conn.commit();
    // 列表按 created_at 倒序，按导入顺序递减时间，保证列表展示顺序与总表一致
    await conn.query('UPDATE products SET created_at = DATE_SUB(NOW(), INTERVAL (id - 1) SECOND)');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM products');
  const [seriesStat] = await db.query('SELECT series, COUNT(*) AS c FROM products GROUP BY series ORDER BY series');
  console.log(`导入完成，products 现有 ${total} 条`);
  console.table(seriesStat);
  process.exit(0);
}

main().catch((err) => {
  console.error('导入失败：', err);
  process.exit(1);
});
