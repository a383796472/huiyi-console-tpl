const express = require('express');
const router = express.Router();
const departmentsController = require('../controllers/departments.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// 部门列表：所有登录用户（用于用户表单下拉）
router.get('/', verifyToken, departmentsController.getDepartments);

// 部门维护：仅超级管理员
router.post('/', verifyToken, requireRole('super_admin'), departmentsController.createDepartment);
router.put('/:id', verifyToken, requireRole('super_admin'), departmentsController.updateDepartment);
router.delete('/:id', verifyToken, requireRole('super_admin'), departmentsController.deleteDepartment);

module.exports = router;
