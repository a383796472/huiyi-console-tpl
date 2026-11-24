// 产品系列管理：查询 / 新增 / 删除
const db = require('../config/db');

// 1. 系列列表（含各系列产品数）
exports.getSeries = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.name, s.sort_order,
             (SELECT COUNT(*) FROM products p WHERE p.series = s.name) AS product_count
      FROM product_series s
      ORDER BY s.sort_order ASC, s.id ASC
    `);
    res.json({
      code: 200,
      data: rows.map((r) => ({ id: r.id, name: r.name, productCount: Number(r.product_count) }))
    });
  } catch (error) {
    console.error('获取产品系列失败：', error);
    res.status(500).json({ code: 500, message: '获取产品系列失败' });
  }
};

// 2. 新增系列
exports.addSeries = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ code: 400, message: '请输入系列名称' });
    if (name.length > 100) return res.status(400).json({ code: 400, message: '系列名称不能超过 100 个字符' });

    const [exists] = await db.query('SELECT id FROM product_series WHERE name = ?', [name]);
    if (exists.length) return res.status(400).json({ code: 400, message: `系列「${name}」已存在` });

    const [[maxRow]] = await db.query('SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM product_series');
    const [result] = await db.query('INSERT INTO product_series (name, sort_order) VALUES (?, ?)', [
      name,
      Number(maxRow.max_sort) + 10
    ]);

    res.json({ code: 200, message: '添加成功', data: { id: result.insertId, name, productCount: 0 } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '该系列已存在' });
    }
    console.error('新增产品系列失败：', error);
    res.status(500).json({ code: 500, message: '新增产品系列失败' });
  }
};

// 3. 编辑系列名称（重名校验 + 级联更新 products.series）
exports.updateSeries = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM product_series WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ code: 404, message: '系列不存在' });

    const oldName = rows[0].name;
    const newName = String(req.body.name || '').trim();
    if (!newName) return res.status(400).json({ code: 400, message: '请输入系列名称' });
    if (newName.length > 100) return res.status(400).json({ code: 400, message: '系列名称不能超过 100 个字符' });
    if (newName === oldName) return res.json({ code: 200, message: '未修改', data: { id: rows[0].id, name: oldName } });

    // 重名校验（排除自身）
    const [dup] = await db.query('SELECT id FROM product_series WHERE name = ? AND id <> ?', [newName, req.params.id]);
    if (dup.length) return res.status(400).json({ code: 400, message: `系列「${newName}」已存在` });

    // 事务：更新系列名 + 级联更新 products.series
    await db.query('UPDATE product_series SET name = ? WHERE id = ?', [newName, req.params.id]);
    const [affected] = await db.query('UPDATE products SET series = ? WHERE series = ?', [newName, oldName]);

    res.json({
      code: 200,
      message: '修改成功',
      data: { id: rows[0].id, name: newName, cascadeProducts: Number(affected.affectedRows) }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '该系列已存在' });
    }
    console.error('编辑产品系列失败：', error);
    res.status(500).json({ code: 500, message: '编辑产品系列失败' });
  }
};

// 4. 删除系列（系列下仍有产品时禁止删除，避免产品数据出现孤立系列）
exports.deleteSeries = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM product_series WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ code: 404, message: '系列不存在' });

    const series = rows[0];
    const [[countRow]] = await db.query('SELECT COUNT(*) AS n FROM products WHERE series = ?', [series.name]);
    const productCount = Number(countRow.n);
    if (productCount > 0) {
      return res.status(400).json({
        code: 400,
        message: `「${series.name}」下还有 ${productCount} 个产品，请先将这些产品改为其他系列`
      });
    }

    await db.query('DELETE FROM product_series WHERE id = ?', [series.id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除产品系列失败：', error);
    res.status(500).json({ code: 500, message: '删除产品系列失败' });
  }
};
