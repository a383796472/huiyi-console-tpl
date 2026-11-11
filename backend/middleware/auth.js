const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'huiyi_console_secret_key_2024';

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }

  req.user = decoded;

  // 旧 token 不含 department_id，这里补查一次，供数据范围判断使用
  if (req.user.department_id === undefined) {
    try {
      const [rows] = await db.query('SELECT department_id FROM users WHERE id = ?', [decoded.id]);
      req.user.department_id = rows.length > 0 ? rows[0].department_id : null;
    } catch (error) {
      console.error('加载用户部门失败：', error);
      return res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  }

  next();
};

// 全局管理员：超管 + 管理员（可跨部门操作）
exports.isGlobalAdmin = (user) => !!user && (user.role === 'super_admin' || user.role === 'admin');

// 部门管理员：只能操作本部门
exports.isDeptAdmin = (user) => !!user && user.role === 'dept_admin';

exports.requireGlobalAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ code: 401, message: '未认证' });
  }
  if (!exports.isGlobalAdmin(req.user)) {
    return res.status(403).json({ code: 403, message: '权限不足' });
  }
  next();
};

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未认证' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }
    next();
  };
};

exports.requirePermission = (permissionName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未认证' });
    }

    // 超级管理员拥有所有权限
    if (req.user.role === 'super_admin') {
      return next();
    }

    try {
      const [rows] = await db.query(
        `SELECT 1 FROM role_permissions rp
         INNER JOIN permissions p ON p.id = rp.permission_id
         INNER JOIN roles r ON r.id = rp.role_id
         WHERE r.name = ? AND p.name = ?`,
        [req.user.role, permissionName]
      );

      if (rows.length === 0) {
        return res.status(403).json({ code: 403, message: '权限不足' });
      }

      next();
    } catch (error) {
      console.error('权限检查失败：', error);
      res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  };
};

exports.JWT_SECRET = JWT_SECRET;
