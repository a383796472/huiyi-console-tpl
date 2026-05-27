const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'huiyi_console_secret_key_2024';

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }
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
