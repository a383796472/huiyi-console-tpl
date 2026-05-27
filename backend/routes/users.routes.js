const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// 登录（无需鉴权）
router.post('/login', userController.login);

// --- 以下接口需要登录鉴权 ---

// 获取当前登录用户信息
router.get('/me', verifyToken, userController.getCurrentUser);

// 更新当前登录用户个人资料（任何登录用户均可）
router.put('/me/profile', verifyToken, userController.updateProfile);

// 获取用户列表
router.get('/', verifyToken, userController.getUsers);

// 获取单个用户详情
router.get('/:id', verifyToken, userController.getUserById);

// 创建用户（仅超级管理员）
router.post('/', verifyToken, requireRole('super_admin'), userController.createUser);

// 更新用户信息
router.put('/:id', verifyToken, userController.updateUser);

// 切换用户状态（启用/停用）
router.put('/:id/status', verifyToken, userController.toggleUserStatus);

// 删除用户（仅超级管理员）
router.delete('/:id', verifyToken, requireRole('super_admin'), userController.deleteUser);

module.exports = router;
