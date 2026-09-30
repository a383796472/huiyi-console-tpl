const db = require('../config/db');

// 订单中心控制器 - 数据由 import-orders.js 定时导入，此处仅提供查询

// 列表页展示字段（不含 raw_data，减少传输量）
const LIST_FIELDS = [
  'id', 'platform', 'shop_name', 'order_no', 'online_order_no',
  'order_time', 'pay_time', 'fulfill_time',
  'buyer_name', 'buyer_account', 'province',
  'item_count', 'item_kind_count', 'currency',
  'total_amount', 'paid_amount', 'freight_amount', 'discount_amount', 'refund_amount',
  'order_status', 'status_code', 'is_counted',
  'logistics_no', 'logistics_company', 'remark', 'sync_date'
].map((f) => (f === 'sync_date' ? 'DATE_FORMAT(sync_date, "%Y-%m-%d") AS sync_date' : f));

exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
    const offset = (page - 1) * pageSize;
    const { keyword, platform, statusCode, isCounted, startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(order_no LIKE ? OR online_order_no LIKE ? OR buyer_name LIKE ? OR buyer_account LIKE ? OR logistics_no LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw, kw);
    }
    if (platform) {
      conditions.push('platform = ?');
      params.push(platform);
    }
    if (statusCode) {
      conditions.push('status_code = ?');
      params.push(statusCode);
    }
    if (isCounted === '0' || isCounted === '1') {
      conditions.push('is_counted = ?');
      params.push(Number(isCounted));
    }
    if (startDate) {
      conditions.push('order_time >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      conditions.push('order_time <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM orders ${whereSql}`, params);
    const [rows] = await db.query(
      `SELECT ${LIST_FIELDS.join(', ')} FROM orders ${whereSql} ORDER BY order_time DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.status(200).json({
      code: 200,
      message: '获取订单列表成功',
      data: { list: rows, total, page, pageSize }
    });
  } catch (error) {
    console.error('获取订单列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ code: 400, message: '缺少订单ID' });
    }
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '未找到该订单' });
    }
    res.status(200).json({
      code: 200,
      message: '获取订单详情成功',
      data: rows[0]
    });
  } catch (error) {
    console.error('获取订单详情失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
