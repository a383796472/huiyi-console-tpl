// routes/product-series.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/product-series.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. 系列列表
router.get('/', verifyToken, controller.getSeries);

// 2. 新增系列（超管和管理员）
router.post('/', verifyToken, requireRole('super_admin', 'admin'), controller.addSeries);

// 3. 编辑系列（超管和管理员）
router.put('/:id', verifyToken, requireRole('super_admin', 'admin'), controller.updateSeries);

// 4. 删除系列（超管和管理员）
router.delete('/:id', verifyToken, requireRole('super_admin', 'admin'), controller.deleteSeries);

module.exports = router;
