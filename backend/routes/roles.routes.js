const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// 获取所有角色列表
router.get('/', verifyToken, rolesController.getRoles);

// 获取所有权限列表
router.get('/permissions', verifyToken, rolesController.getAllPermissions);

// 获取单个角色详情（含权限）
router.get('/:id', verifyToken, rolesController.getRoleById);

// 更新角色权限（仅超级管理员）
router.put('/:id/permissions', verifyToken, requireRole('super_admin'), rolesController.updateRolePermissions);

module.exports = router;
