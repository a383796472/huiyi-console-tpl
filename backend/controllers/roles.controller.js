const db = require('../config/db');

exports.getRoles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, display_name, description, is_system, created_at FROM roles ORDER BY id');
    res.status(200).json({ code: 200, message: '获取角色列表成功', data: rows });
  } catch (error) {
    console.error('获取角色列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [roleRows] = await db.query('SELECT id, name, display_name, description, is_system FROM roles WHERE id = ?', [id]);
    if (roleRows.length === 0) {
      return res.status(404).json({ code: 404, message: '角色不存在' });
    }

    const [permRows] = await db.query(
      `SELECT p.id, p.name, p.display_name, p.group_name
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [id]
    );

    res.status(200).json({
      code: 200,
      message: '获取角色详情成功',
      data: { ...roleRows[0], permissions: permRows }
    });
  } catch (error) {
    console.error('获取角色详情失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getAllPermissions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, display_name, group_name FROM permissions ORDER BY group_name, id');
    res.status(200).json({ code: 200, message: '获取权限列表成功', data: rows });
  } catch (error) {
    console.error('获取权限列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    const [roleRows] = await db.query('SELECT id, is_system FROM roles WHERE id = ?', [id]);
    if (roleRows.length === 0) {
      return res.status(404).json({ code: 404, message: '角色不存在' });
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ code: 400, message: '权限ID列表格式错误' });
    }

    await db.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    if (permissionIds.length > 0) {
      const values = permissionIds.map(pid => [id, pid]);
      await db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
    }

    res.status(200).json({ code: 200, message: '角色权限更新成功' });
  } catch (error) {
    console.error('更新角色权限失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
