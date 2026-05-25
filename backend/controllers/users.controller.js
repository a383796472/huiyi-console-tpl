const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    if (user.status === 0) {
      return res.status(403).json({ code: 403, message: '该账号已被禁用' });
    }

    const token = generateToken(user);

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录发生错误：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, phone, real_name, role, status, last_login, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.status(200).json({ code: 200, message: '获取成功', data: rows[0] });
  } catch (error) {
    console.error('获取当前用户失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.max(parseInt(req.query.pageSize) || 10, 1);
    const offset = (page - 1) * pageSize;
    const searchType = req.query.searchType || '';
    const keyword = req.query.keyword || '';
    const status = req.query.status || '';

    const conditions = [];
    const params = [];

    if (keyword) {
      if (searchType === 'username') {
        conditions.push('username LIKE ?');
        params.push(`%${keyword}%`);
      } else if (searchType === 'email') {
        conditions.push('email LIKE ?');
        params.push(`%${keyword}%`);
      } else if (searchType === 'phone') {
        conditions.push('phone LIKE ?');
        params.push(`%${keyword}%`);
      } else {
        conditions.push('(username LIKE ? OR email LIKE ? OR phone LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users ${whereSql}`,
      params
    );
    const [rows] = await db.query(
      `SELECT id, username, email, phone, real_name, role, status, last_login, created_at, updated_at FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.status(200).json({
      code: 200,
      message: '获取用户列表成功',
      data: {
        list: rows,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取用户列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT id, username, email, phone, real_name, role, status, last_login, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.status(200).json({ code: 200, message: '获取用户成功', data: rows[0] });
  } catch (error) {
    console.error('获取用户失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, email, phone, real_name, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码为必填项' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ code: 409, message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userRole = role || 'user';

    const [result] = await db.query(
      'INSERT INTO users (username, password, email, phone, real_name, role, status) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [username, hashedPassword, email || null, phone || null, real_name || null, userRole]
    );

    res.status(201).json({
      code: 200,
      message: '用户创建成功',
      data: { id: result.insertId, username, email: email || null, phone: phone || null, real_name: real_name || null, role: userRole }
    });
  } catch (error) {
    console.error('创建用户失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, phone, real_name, role, status } = req.body;

    const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const updateFields = [];
    const updateParams = [];

    if (username !== undefined) {
      const [dup] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (dup.length > 0) {
        return res.status(409).json({ code: 409, message: '用户名已被占用' });
      }
      updateFields.push('username = ?');
      updateParams.push(username);
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      updateFields.push('password = ?');
      updateParams.push(hashedPassword);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateParams.push(phone);
    }
    if (real_name !== undefined) {
      updateFields.push('real_name = ?');
      updateParams.push(real_name);
    }
    if (role !== undefined) {
      const currentUser = existing[0];
      if (currentUser.role === 'super_admin' && req.user.id !== Number(id)) {
        return res.status(403).json({ code: 403, message: '不能修改其他超级管理员的角色' });
      }
      updateFields.push('role = ?');
      updateParams.push(role);
    }
    if (status !== undefined) {
      const currentUser = existing[0];
      if (currentUser.role === 'super_admin' && req.user.id !== Number(id)) {
        return res.status(403).json({ code: 403, message: '不能禁用其他超级管理员' });
      }
      updateFields.push('status = ?');
      updateParams.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有需要更新的字段' });
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(id);

    await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);

    res.status(200).json({ code: 200, message: '用户更新成功' });
  } catch (error) {
    console.error('更新用户失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    if (existing[0].role === 'super_admin') {
      return res.status(403).json({ code: 403, message: '不能删除超级管理员' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ code: 200, message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
