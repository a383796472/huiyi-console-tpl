const db = require('../config/db');

exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.max(parseInt(req.query.pageSize) || 10, 1);
    const offset = (page - 1) * pageSize;
    const keyword = req.query.keyword || '';
    const salesStatus = req.query.salesStatus || '';

    const conditions = [];
    const params = [];

    // 非超级管理员只能看到自己部门的产品
    if (req.user.role !== 'super_admin') {
      const [userRows] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
      const userDeptId = userRows.length > 0 ? userRows[0].department_id : null;
      if (userDeptId) {
        conditions.push('p.department_id = ?');
        params.push(userDeptId);
      } else {
        // 无部门用户看不到任何产品
        return res.status(200).json({
          code: 200,
          message: '获取产品列表成功',
          data: { list: [], total: 0, page, pageSize }
        });
      }
    }

    if (keyword) {
      conditions.push('(p.name LIKE ? OR p.SKU LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (salesStatus) {
      conditions.push('p.sales_status = ?');
      params.push(salesStatus);
    }

    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
    const [rows] = await db.query(`SELECT p.*, d.name AS department_name FROM products p LEFT JOIN departments d ON p.department_id = d.id ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset]);

    res.status(200).json({
      code: 200,
      message: '获取产品列表成功',
      data: {
        list: rows,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取产品列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    if (!id) {
      return res.status(400).json({ code: 400, message: '缺少产品ID' });
    }
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '未找到该产品' });
    }

    // 非超管需校验产品所属部门
    if (req.user.role !== 'super_admin') {
      const [userRows] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
      const userDeptId = userRows[0]?.department_id;
      if (rows[0].department_id !== userDeptId) {
        return res.status(403).json({ code: 403, message: '无权查看该产品' });
      }
    }

    res.status(200).json({
      code: 200,
      message: '获取产品详情成功',
      data: rows[0]
    });
  } catch (error) {
    console.error('获取产品详情失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const {
      name, englishName, productCode, SKU, categoryL1, categoryL2,
      productType, eanCode, usBarcode, compatibleVehicles,
      salesStatus, costPriceRmb, retailPriceUsd, retailPriceEur, retailPriceRmb,
      certification, patent, acquisitionMethod, color, referenceLink,
      netWeight, grossWeight, wholeBoxWeight, unit, productSize,
      packagingSizeMm, innerBoxSize, outerBoxSize, innerBoxQty, packingQty,
      declareCategory, hsCode, declareNameCn, declareNameEn, declareValueUsd,
      materialCn, materialEn, usageCn, usageEn,
      hasBattery, hasSpecialGoods, hasMagnetism, hasNonLiquidCosmetics, isCounterfeit,
      customsName, customsMaterial, extraInfo, accessoryInfo, extraImages, sellingPoints, sellingDetail,
      image, desc
    } = req.body;

    if (!name || !SKU) {
      return res.status(400).json({ code: 400, message: '产品名称和SKU编号是必填项' });
    }

    const [userRows] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
    const deptId = userRows.length > 0 ? userRows[0].department_id : null;

    const sql = `INSERT INTO products (
      name, english_name, product_code, SKU, category_l1, category_l2,
      product_type, ean_code, us_barcode, compatible_vehicles,
      sales_status, cost_price_rmb, retail_price_usd, retail_price_eur, retail_price_rmb,
      certification, patent, acquisition_method, color, reference_link,
      net_weight, gross_weight, whole_box_weight, unit, product_size,
      packaging_size_mm, inner_box_size, outer_box_size, inner_box_qty, packing_qty,
      declare_category, hs_code, declare_name_cn, declare_name_en, declare_value_usd,
      material_cn, material_en, usage_cn, usage_en,
      has_battery, has_special_goods, has_magnetism, has_non_liquid_cosmetics, is_counterfeit,
      customs_name, customs_material, department_id, created_by,
      extra_info, accessory_info, extra_images, selling_points, selling_detail,
      image, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      name, englishName || null, productCode || null, SKU, categoryL1 || null, categoryL2 || null,
      productType || null, eanCode || null, usBarcode || null, compatibleVehicles || null,
      salesStatus || null, costPriceRmb || null, retailPriceUsd || null, retailPriceEur || null, retailPriceRmb || null,
      certification || null, patent || null, acquisitionMethod || null, color || null, referenceLink || null,
      netWeight || null, grossWeight || null, wholeBoxWeight || null, unit || null, productSize || null,
      packagingSizeMm || null, innerBoxSize || null, outerBoxSize || null, innerBoxQty || null, packingQty || null,
      declareCategory || null, hsCode || null, declareNameCn || null, declareNameEn || null, declareValueUsd || null,
      materialCn || null, materialEn || null, usageCn || null, usageEn || null,
      hasBattery || null, hasSpecialGoods || null, hasMagnetism || null, hasNonLiquidCosmetics || null, isCounterfeit || null,
      customsName || null, customsMaterial || null, deptId, req.user.id,
      extraInfo || null, accessoryInfo || null, extraImages || null, sellingPoints || null, sellingDetail || null,
      image || null, desc || null
    ];

    const [result] = await db.query(sql, params);

    res.status(201).json({
      code: 200,
      message: '产品添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加产品发生错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ code: 400, message: '缺少产品ID' });
    }

    // 非超管需校验产品所属部门
    if (req.user.role !== 'super_admin') {
      const [check] = await db.query('SELECT department_id FROM products WHERE id = ?', [id]);
      const [userRows] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
      const userDeptId = userRows[0]?.department_id;
      if (check.length === 0 || check[0].department_id !== userDeptId) {
        return res.status(403).json({ code: 403, message: '无权操作该产品' });
      }
    }

    const {
      name, englishName, productCode, SKU, categoryL1, categoryL2,
      productType, eanCode, usBarcode, compatibleVehicles,
      salesStatus, costPriceRmb, retailPriceUsd, retailPriceEur, retailPriceRmb,
      certification, patent, acquisitionMethod, color, referenceLink,
      netWeight, grossWeight, wholeBoxWeight, unit, productSize,
      packagingSizeMm, innerBoxSize, outerBoxSize, innerBoxQty, packingQty,
      declareCategory, hsCode, declareNameCn, declareNameEn, declareValueUsd,
      materialCn, materialEn, usageCn, usageEn,
      hasBattery, hasSpecialGoods, hasMagnetism, hasNonLiquidCosmetics, isCounterfeit,
      customsName, customsMaterial, extraInfo, accessoryInfo, extraImages, sellingPoints, sellingDetail,
      image, desc
    } = req.body;

    if (!name || !SKU) {
      return res.status(400).json({ code: 400, message: '产品名称和SKU编号是必填项' });
    }

    const sql = `UPDATE products SET
      name=?, english_name=?, product_code=?, SKU=?, category_l1=?, category_l2=?,
      product_type=?, ean_code=?, us_barcode=?, compatible_vehicles=?,
      sales_status=?, cost_price_rmb=?, retail_price_usd=?, retail_price_eur=?, retail_price_rmb=?,
      certification=?, patent=?, acquisition_method=?, color=?, reference_link=?,
      net_weight=?, gross_weight=?, whole_box_weight=?, unit=?, product_size=?,
      packaging_size_mm=?, inner_box_size=?, outer_box_size=?, inner_box_qty=?, packing_qty=?,
      declare_category=?, hs_code=?, declare_name_cn=?, declare_name_en=?, declare_value_usd=?,
      material_cn=?, material_en=?, usage_cn=?, usage_en=?,
      has_battery=?, has_special_goods=?, has_magnetism=?, has_non_liquid_cosmetics=?, is_counterfeit=?,
      customs_name=?, customs_material=?, extra_info=?, accessory_info=?, extra_images=?, selling_points=?, selling_detail=?,
      image=?, description=?
      WHERE id=?`;

    const params = [
      name, englishName || null, productCode || null, SKU, categoryL1 || null, categoryL2 || null,
      productType || null, eanCode || null, usBarcode || null, compatibleVehicles || null,
      salesStatus || null, costPriceRmb || null, retailPriceUsd || null, retailPriceEur || null, retailPriceRmb || null,
      certification || null, patent || null, acquisitionMethod || null, color || null, referenceLink || null,
      netWeight || null, grossWeight || null, wholeBoxWeight || null, unit || null, productSize || null,
      packagingSizeMm || null, innerBoxSize || null, outerBoxSize || null, innerBoxQty || null, packingQty || null,
      declareCategory || null, hsCode || null, declareNameCn || null, declareNameEn || null, declareValueUsd || null,
      materialCn || null, materialEn || null, usageCn || null, usageEn || null,
      hasBattery || null, hasSpecialGoods || null, hasMagnetism || null, hasNonLiquidCosmetics || null, isCounterfeit || null,
      customsName || null, customsMaterial || null, extraInfo || null, accessoryInfo || null, extraImages || null, sellingPoints || null, sellingDetail || null,
      image || null, desc || null, id
    ];

    const [result] = await db.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '产品未找到' });
    }
    res.status(200).json({ code: 200, message: '产品更新成功' });
  } catch (error) {
    console.error('更新产品失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ code: 400, message: '缺少产品 ID' });
    }

    // 非超管需校验产品所属部门
    if (req.user.role !== 'super_admin') {
      const [check] = await db.query('SELECT department_id FROM products WHERE id = ?', [id]);
      const [userRows] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
      const userDeptId = userRows[0]?.department_id;
      if (check.length === 0 || check[0].department_id !== userDeptId) {
        return res.status(403).json({ code: 403, message: '无权操作该产品' });
      }
    }

    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '产品未找到，可能已被删除' });
    }

    res.status(200).json({ code: 200, message: '产品删除成功' });
  } catch (error) {
    console.error('删除产品失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
