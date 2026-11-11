const db = require('../config/db');

// B端销售订单控制器
// 数据由 scripts/import-b2b-orders.js 从金蝶月报 Excel 导入，此处提供查询与有限编辑

const LIST_COLUMNS = [
  'id', 'order_no',
  "DATE_FORMAT(biz_date, '%Y-%m-%d') AS biz_date",
  'doc_type', 'supplier', 'status', 'department', 'sales_person', 'clerk',
  'purchase_order_no', 'customer_type',
  "DATE_FORMAT(created_time, '%Y-%m-%d %H:%i:%s') AS created_time",
  'customer', 'delivery_method', 'country', 'province', 'city',
  'customer_source', 'ship_status', 'customer_email',
  'line_count', 'item_count', 'total_amount', 'untaxed_amount',
  'purchase_amount', 'refund_amount', 'gross_profit', 'currency', 'remark',
  "DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at",
  "DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at"
];

// 允许前端编辑的订单头字段
const EDITABLE_FIELDS = [
  'doc_type', 'supplier', 'status', 'department', 'sales_person', 'clerk',
  'purchase_order_no', 'customer_type', 'customer', 'delivery_method',
  'address', 'country', 'province', 'city', 'customer_source', 'ship_status',
  'customer_email', 'remark'
];

// 允许前端编辑的明细字段
const EDITABLE_ITEM_FIELDS = ['quantity', 'unit_price', 'tax_amount', 'remark'];

exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
    const offset = (page - 1) * pageSize;
    const { keyword, department, docType, status, salesPerson, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(order_no LIKE ? OR purchase_order_no LIKE ? OR customer LIKE ? OR address LIKE ? OR sales_person LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw, kw);
    }
    if (department) {
      conditions.push('department = ?');
      params.push(department);
    }
    if (docType) {
      conditions.push('doc_type = ?');
      params.push(docType);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (salesPerson) {
      conditions.push('sales_person = ?');
      params.push(salesPerson);
    }
    if (startDate) {
      conditions.push('biz_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('biz_date <= ?');
      params.push(endDate);
    }

    const whereSql = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[summary]] = await db.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(total_amount), 0) AS amount, COALESCE(SUM(item_count), 0) AS quantity
       FROM b2b_orders ${whereSql}`,
      params
    );

    const [rows] = await db.query(
      `SELECT ${LIST_COLUMNS.join(', ')} FROM b2b_orders ${whereSql}
       ORDER BY biz_date DESC, order_no DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.status(200).json({
      code: 200,
      message: '获取B端订单列表成功',
      data: {
        list: rows,
        total: summary.total,
        page,
        pageSize,
        summary: {
          total: summary.total,
          amount: Number(summary.amount),
          quantity: Number(summary.quantity)
        }
      }
    });
  } catch (error) {
    console.error('获取B端订单列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getOptions = async (_req, res) => {
  try {
    const distinct = async (column) => {
      const [rows] = await db.query(
        `SELECT DISTINCT \`${column}\` AS v FROM b2b_orders WHERE \`${column}\` IS NOT NULL AND \`${column}\` <> '' ORDER BY v`
      );
      return rows.map((r) => r.v);
    };
    const [departments, docTypes, statuses, salesPeople] = await Promise.all([
      distinct('department'),
      distinct('doc_type'),
      distinct('status'),
      distinct('sales_person')
    ]);
    res.status(200).json({
      code: 200,
      message: '获取筛选选项成功',
      data: { departments, docTypes, statuses, salesPeople }
    });
  } catch (error) {
    console.error('获取B端订单筛选项失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

async function loadDetail(id) {
  const [orders] = await db.query(
    `SELECT id, order_no, DATE_FORMAT(biz_date, '%Y-%m-%d') AS biz_date, doc_type, supplier,
            status, department, sales_person, clerk, purchase_order_no, customer_type,
            DATE_FORMAT(created_time, '%Y-%m-%d %H:%i:%s') AS created_time,
            customer, delivery_method, address, country, province, city, customer_source,
            ship_status, customer_email, line_count, item_count, total_amount, untaxed_amount,
            purchase_amount, refund_amount, gross_profit, currency, remark,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
            DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
     FROM b2b_orders WHERE id = ?`,
    [id]
  );
  if (!orders.length) return null;

  const [items] = await db.query(
    `SELECT * FROM b2b_order_items WHERE order_id = ? ORDER BY CAST(line_no AS UNSIGNED)`,
    [id]
  );
  return { ...orders[0], items };
}

exports.getOrderById = async (req, res) => {
  try {
    const detail = await loadDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ code: 404, message: '未找到该B端订单' });
    }
    res.status(200).json({ code: 200, message: '获取B端订单详情成功', data: detail });
  } catch (error) {
    console.error('获取B端订单详情失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;
    const [exists] = await conn.query('SELECT id FROM b2b_orders WHERE id = ?', [id]);
    if (!exists.length) {
      conn.release();
      return res.status(404).json({ code: 404, message: '未找到该B端订单' });
    }

    await conn.beginTransaction();

    const sets = [];
    const params = [];
    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sets.push(`\`${field}\` = ?`);
        params.push(req.body[field] === '' ? null : req.body[field]);
      }
    }
    if (sets.length) {
      await conn.query(`UPDATE b2b_orders SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    }

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    for (const item of items) {
      if (!item || !item.id) continue;
      const itemSets = [];
      const itemParams = [];
      for (const field of EDITABLE_ITEM_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(item, field)) {
          itemSets.push(`\`${field}\` = ?`);
          itemParams.push(item[field] === '' ? null : item[field]);
        }
      }
      if (itemSets.length) {
        await conn.query(
          `UPDATE b2b_order_items SET ${itemSets.join(', ')} WHERE id = ? AND order_id = ?`,
          [...itemParams, item.id, id]
        );
      }
    }

    // 明细变动后重算订单头汇总，保证列表金额与明细一致
    await conn.query(
      `UPDATE b2b_orders o SET
         o.line_count = (SELECT COUNT(*) FROM b2b_order_items WHERE order_id = o.id),
         o.item_count = (SELECT COALESCE(SUM(quantity), 0) FROM b2b_order_items WHERE order_id = o.id),
         o.total_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM b2b_order_items WHERE order_id = o.id),
         o.untaxed_amount = (SELECT COALESCE(SUM(untaxed_total), 0) FROM b2b_order_items WHERE order_id = o.id),
         o.purchase_amount = (SELECT COALESCE(SUM(purchase_total), 0) FROM b2b_order_items WHERE order_id = o.id),
         o.refund_amount = (SELECT COALESCE(SUM(return_amount), 0) FROM b2b_order_items WHERE order_id = o.id),
         o.gross_profit = (SELECT COALESCE(SUM(gross_profit), 0) FROM b2b_order_items WHERE order_id = o.id)
       WHERE o.id = ?`,
      [id]
    );

    await conn.commit();
    conn.release();

    const detail = await loadDetail(id);
    res.status(200).json({ code: 200, message: '保存成功', data: detail });
  } catch (error) {
    try {
      await conn.rollback();
    } catch (_) { /* ignore */ }
    conn.release();
    console.error('更新B端订单失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
