const ExcelJS = require('exceljs');
const db = require('../config/db');

const firstImageUrl = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) return value[0] || '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed[0] || '';
  } catch (e) {
    // 非 JSON，按单张图片路径处理
  }
  return String(value);
};

exports.exportProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('产品列表');

    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 16 },
      { header: '产品图片', key: 'product_image', width: 24 },
      { header: '产品编号', key: 'product_code', width: 15 },
      { header: '系列', key: 'series', width: 16 },
      { header: '系列编号', key: 'series_code', width: 14 },
      { header: '产品状态', key: 'product_status', width: 14 },
      { header: 'EAN码', key: 'ean_code', width: 16 },
      { header: '美国条形码编号', key: 'us_barcode', width: 18 },
      { header: '海关编码', key: 'hs_code', width: 15 },
      { header: '产品名称', key: 'product_name', width: 24 },
      { header: '英文产品名称', key: 'english_name', width: 24 },
      { header: '产品包装英文名称', key: 'package_english_name', width: 26 },
      { header: '型号', key: 'model', width: 14 },
      { header: '中国零售价', key: 'china_retail_price', width: 14 },
      { header: '美国（USD）', key: 'usd_price', width: 14 },
      { header: '欧洲（€）', key: 'eur_price', width: 14 },
      { header: '适配车型', key: 'compatible_vehicles', width: 20 },
      { header: '产品卖点', key: 'selling_points', width: 26 },
      { header: '规格参数', key: 'specs', width: 26 },
      { header: '标准配置（改进后需要修改）', key: 'standard_config', width: 28 },
      { header: '生产工艺', key: 'production_process', width: 14 },
      { header: '材料', key: 'material', width: 14 },
      { header: '颜色', key: 'color', width: 14 },
      { header: '产品净重（KG）', key: 'net_weight', width: 14 },
      { header: '毛重（KG）（包含产品，包装）', key: 'gross_weight', width: 24 },
      { header: '整箱毛重（KG）', key: 'whole_box_weight', width: 16 },
      { header: '包装规格（MM）', key: 'packaging_size', width: 18 },
      { header: '品牌包装图片', key: 'brand_package_image', width: 24 },
      { header: '内小箱规格（MM）', key: 'inner_box_size', width: 18 },
      { header: '外大箱规格（MM）', key: 'outer_box_size', width: 18 },
      { header: '内箱装箱数量', key: 'inner_box_qty', width: 16 },
      { header: '外箱装箱数量', key: 'outer_box_qty', width: 16 },
      { header: '装箱数量', key: 'packing_qty', width: 12 },
      { header: 'MOQ', key: 'moq', width: 10 },
      { header: '内箱SKU代码（ICS）', key: 'inner_box_sku', width: 22 },
      { header: '外箱SKU代码(MCS)', key: 'outer_box_sku', width: 22 },
      { header: '内纸箱条形码（ICB）', key: 'inner_barcode', width: 24 },
      { header: '产品供应中', key: 'product_supplying', width: 14 },
      { header: '备注（2）', key: 'remark_2', width: 24 },
      { header: '成本（1）', key: 'cost_1', width: 12 },
      { header: '建议销售价', key: 'suggested_price', width: 14 },
      { header: '海外竞对参考价-美（quadlock）', key: 'competitor_price_ql', width: 28 },
      { header: '海外竞对参考价-美（sp）', key: 'competitor_price_sp', width: 24 },
      { header: '备注', key: 'remark', width: 24 },
      { header: '成本', key: 'cost', width: 12 },
      { header: '建议销售价（1）', key: 'suggested_price_1', width: 16 },
      { header: '海外竞对参考价-美：ql', key: 'competitor_price_ql_num', width: 22 },
      { header: '海外竞对参考价-美：SP', key: 'competitor_price_sp_num', width: 22 },
      { header: '备注（1）', key: 'remark_1', width: 24 }
    ];

    const titleRow = sheet.getRow(1);
    titleRow.font = { bold: true, size: 12 };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF409EFF' }
    };
    titleRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;

    rows.forEach(row => {
      sheet.addRow({
        ...row,
        product_image: firstImageUrl(row.product_image),
        brand_package_image: firstImageUrl(row.brand_package_image)
      });
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('导出产品失败：', error);
    res.status(500).json({ code: 500, message: '导出失败', error: error.message });
  }
};

exports.exportUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, phone, real_name, role, status, last_login, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('用户列表');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '用户名', key: 'username', width: 20 },
      { header: '邮箱', key: 'email', width: 25 },
      { header: '手机号', key: 'phone', width: 18 },
      { header: '真实姓名', key: 'real_name', width: 15 },
      { header: '角色', key: 'role', width: 15 },
      { header: '状态', key: 'status', width: 10 },
      { header: '最后登录', key: 'last_login', width: 20 },
      { header: '创建时间', key: 'created_at', width: 20 },
      { header: '更新时间', key: 'updated_at', width: 20 }
    ];

    const titleRow = sheet.getRow(1);
    titleRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF409EFF' }
    };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;

    const roleMap = {
      super_admin: '超级管理员',
      admin: '管理员',
      user: '普通用户'
    };

    rows.forEach(row => {
      const data = { ...row };
      data.role = roleMap[row.role] || row.role;
      data.status = row.status === 1 ? '启用' : '停用';
      sheet.addRow(data);
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('导出用户失败：', error);
    res.status(500).json({ code: 500, message: '导出失败', error: error.message });
  }
};
