const db = require('../config/db');

exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, parent_id, sort_order, created_at FROM departments ORDER BY sort_order'
    );
    res.status(200).json({ code: 200, message: '获取部门列表成功', data: rows });
  } catch (error) {
    console.error('获取部门列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
