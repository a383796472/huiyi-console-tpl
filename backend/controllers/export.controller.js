const ExcelJS = require('exceljs');
const db = require('../config/db');

exports.exportProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('产品列表');

    sheet.columns = [
      { header: '产品名称', key: 'name', width: 20 },
      { header: '英文名称', key: 'english_name', width: 20 },
      { header: '产品编号', key: 'product_code', width: 15 },
      { header: 'SKU编号', key: 'SKU', width: 15 },
      { header: '一级品类', key: 'category_l1', width: 15 },
      { header: '二级品类', key: 'category_l2', width: 15 },
      { header: '产品类型', key: 'product_type', width: 12 },
      { header: 'EAN码', key: 'ean_code', width: 15 },
      { header: '美国条形码编号', key: 'us_barcode', width: 18 },
      { header: '适配车型', key: 'compatible_vehicles', width: 20 },
      { header: '销售状态', key: 'sales_status', width: 12 },
      { header: '成本价RMB', key: 'cost_price_rmb', width: 12 },
      { header: '建议零售价USD', key: 'retail_price_usd', width: 15 },
      { header: '建议零售价EUR', key: 'retail_price_eur', width: 15 },
      { header: '建议零售价RMB', key: 'retail_price_rmb', width: 15 },
      { header: '产品认证', key: 'certification', width: 20 },
      { header: '产品专利', key: 'patent', width: 20 },
      { header: '取得方式', key: 'acquisition_method', width: 12 },
      { header: '颜色', key: 'color', width: 12 },
      { header: '参考链接', key: 'reference_link', width: 30 },
      { header: '净重KG', key: 'net_weight', width: 12 },
      { header: '毛重KG', key: 'gross_weight', width: 12 },
      { header: '整箱毛重KG', key: 'whole_box_weight', width: 12 },
      { header: '产品单位', key: 'unit', width: 10 },
      { header: '产品尺寸', key: 'product_size', width: 15 },
      { header: '包装尺寸MM', key: 'packaging_size_mm', width: 15 },
      { header: '内小箱MM', key: 'inner_box_size', width: 15 },
      { header: '外大箱MM', key: 'outer_box_size', width: 15 },
      { header: '内箱装箱数量', key: 'inner_box_qty', width: 15 },
      { header: '装箱数量', key: 'packing_qty', width: 12 },
      { header: '申报品类', key: 'declare_category', width: 15 },
      { header: '海关编码', key: 'hs_code', width: 15 },
      { header: '中文申报品名', key: 'declare_name_cn', width: 20 },
      { header: '英文申报品名', key: 'declare_name_en', width: 20 },
      { header: '申报价值USD', key: 'declare_value_usd', width: 15 },
      { header: '中文材质', key: 'material_cn', width: 20 },
      { header: '英文材质', key: 'material_en', width: 20 },
      { header: '中文用途', key: 'usage_cn', width: 20 },
      { header: '英文用途', key: 'usage_en', width: 20 },
      { header: '是否包含电池', key: 'has_battery', width: 14 },
      { header: '是否包含特货', key: 'has_special_goods', width: 14 },
      { header: '是否带磁', key: 'has_magnetism', width: 12 },
      { header: '是否含非液体化妆品', key: 'has_non_liquid_cosmetics', width: 18 },
      { header: '是否为仿制品', key: 'is_counterfeit', width: 14 },
      { header: '报关名称', key: 'customs_name', width: 20 },
      { header: '报关专用材质', key: 'customs_material', width: 20 },
      { header: '创建时间', key: 'created_at', width: 20 },
      { header: '更新时间', key: 'updated_at', width: 20 }
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
      sheet.addRow(row);
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
