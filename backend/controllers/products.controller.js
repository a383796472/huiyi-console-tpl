const db = require('../config/db');

// 产品控制器 - 匹配GR品牌SKU资料总表字段

exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.max(parseInt(req.query.pageSize) || 10, 1);
    const offset = (page - 1) * pageSize;
    const keyword = req.query.keyword || '';
    const productStatus = req.query.productStatus || '';
    const series = req.query.series || '';

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
      // 支持产品名称和SKU模糊搜索
      conditions.push('(p.product_name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (productStatus) {
      conditions.push('p.product_status = ?');
      params.push(productStatus);
    }
    if (series) {
      conditions.push('p.series = ?');
      params.push(series);
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
      productName, sku, productCode, series, seriesCode,
      productStatus, productImage, brandPackageImage, sellingPoints,
      englishName, model, eanCode, hsCode, productionProcess,
      material, color, specs, compatibleVehicles,
      cost, cost1, suggestedPrice, suggestedPrice1, chinaRetailPrice,
      usdPrice, eurPrice, moq, productSupplying,
      netWeight, grossWeight, wholeBoxWeight,
      packagingSize, innerBoxSize, outerBoxSize,
      innerBoxQty, outerBoxQty, packingQty,
      innerBoxSku, outerBoxSku, innerBarcode, usBarcode,
      competitorPriceSp, competitorPriceQl, competitorPriceSpNum, competitorPriceQlNum,
      standardConfig, packageEnglishName, remark, remark1, remark2
    } = req.body;

    // sku和product_name为必填项
    if (!productName || !sku) {
      return res.status(400).json({ code: 400, message: '产品名称和SKU是必填项' });
    }

    const [userRows] = await db.query('SELECT department_id FROM users WHERE id = ?', [req.user.id]);
    const deptId = userRows.length > 0 ? userRows[0].department_id : null;

    const sql = `INSERT INTO products (
      product_name, sku, product_code, series, series_code,
      product_status, product_image, brand_package_image, selling_points,
      english_name, model, ean_code, hs_code, production_process,
      material, color, specs, compatible_vehicles,
      cost, cost_1, suggested_price, suggested_price_1, china_retail_price,
      usd_price, eur_price, moq, product_supplying,
      net_weight, gross_weight, whole_box_weight,
      packaging_size, inner_box_size, outer_box_size,
      inner_box_qty, outer_box_qty, packing_qty,
      inner_box_sku, outer_box_sku, inner_barcode, us_barcode,
      competitor_price_sp, competitor_price_ql, competitor_price_sp_num, competitor_price_ql_num,
      standard_config, package_english_name, remark, remark_1, remark_2,
      department_id, created_by
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )`;

    const params = [
      productName, sku, productCode || null, series || null, seriesCode || null,
      productStatus || null, productImage || null, brandPackageImage || null, sellingPoints || null,
      englishName || null, model || null, eanCode || null, hsCode || null, productionProcess || null,
      material || null, color || null, specs || null, compatibleVehicles || null,
      cost || null, cost1 || null, suggestedPrice || null, suggestedPrice1 || null, chinaRetailPrice || null,
      usdPrice || null, eurPrice || null, moq || null, productSupplying || null,
      netWeight || null, grossWeight || null, wholeBoxWeight || null,
      packagingSize || null, innerBoxSize || null, outerBoxSize || null,
      innerBoxQty || null, outerBoxQty || null, packingQty || null,
      innerBoxSku || null, outerBoxSku || null, innerBarcode || null, usBarcode || null,
      competitorPriceSp || null, competitorPriceQl || null, competitorPriceSpNum || null, competitorPriceQlNum || null,
      standardConfig || null, packageEnglishName || null, remark || null, remark1 || null, remark2 || null,
      deptId, req.user.id
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
      productName, sku, productCode, series, seriesCode,
      productStatus, productImage, brandPackageImage, sellingPoints,
      englishName, model, eanCode, hsCode, productionProcess,
      material, color, specs, compatibleVehicles,
      cost, cost1, suggestedPrice, suggestedPrice1, chinaRetailPrice,
      usdPrice, eurPrice, moq, productSupplying,
      netWeight, grossWeight, wholeBoxWeight,
      packagingSize, innerBoxSize, outerBoxSize,
      innerBoxQty, outerBoxQty, packingQty,
      innerBoxSku, outerBoxSku, innerBarcode, usBarcode,
      competitorPriceSp, competitorPriceQl, competitorPriceSpNum, competitorPriceQlNum,
      standardConfig, packageEnglishName, remark, remark1, remark2
    } = req.body;

    // sku和product_name为必填项
    if (!productName || !sku) {
      return res.status(400).json({ code: 400, message: '产品名称和SKU是必填项' });
    }

    const sql = `UPDATE products SET
      product_name=?, sku=?, product_code=?, series=?, series_code=?,
      product_status=?, product_image=?, brand_package_image=?, selling_points=?,
      english_name=?, model=?, ean_code=?, hs_code=?, production_process=?,
      material=?, color=?, specs=?, compatible_vehicles=?,
      cost=?, cost_1=?, suggested_price=?, suggested_price_1=?, china_retail_price=?,
      usd_price=?, eur_price=?, moq=?, product_supplying=?,
      net_weight=?, gross_weight=?, whole_box_weight=?,
      packaging_size=?, inner_box_size=?, outer_box_size=?,
      inner_box_qty=?, outer_box_qty=?, packing_qty=?,
      inner_box_sku=?, outer_box_sku=?, inner_barcode=?, us_barcode=?,
      competitor_price_sp=?, competitor_price_ql=?, competitor_price_sp_num=?, competitor_price_ql_num=?,
      standard_config=?, package_english_name=?, remark=?, remark_1=?, remark_2=?
      WHERE id=?`;

    const params = [
      productName, sku, productCode || null, series || null, seriesCode || null,
      productStatus || null, productImage || null, brandPackageImage || null, sellingPoints || null,
      englishName || null, model || null, eanCode || null, hsCode || null, productionProcess || null,
      material || null, color || null, specs || null, compatibleVehicles || null,
      cost || null, cost1 || null, suggestedPrice || null, suggestedPrice1 || null, chinaRetailPrice || null,
      usdPrice || null, eurPrice || null, moq || null, productSupplying || null,
      netWeight || null, grossWeight || null, wholeBoxWeight || null,
      packagingSize || null, innerBoxSize || null, outerBoxSize || null,
      innerBoxQty || null, outerBoxQty || null, packingQty || null,
      innerBoxSku || null, outerBoxSku || null, innerBarcode || null, usBarcode || null,
      competitorPriceSp || null, competitorPriceQl || null, competitorPriceSpNum || null, competitorPriceQlNum || null,
      standardConfig || null, packageEnglishName || null, remark || null, remark1 || null, remark2 || null,
      id
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