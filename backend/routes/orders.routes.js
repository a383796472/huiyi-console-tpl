// routes/orders.js

const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const orderImportController = require('../controllers/order-import.controller');
const orderUpload = require('../middleware/orderUpload');
const { verifyToken } = require('../middleware/auth');

// 0. 上传文件导入（当天/当月/全部）
router.post('/import', verifyToken, orderUpload, orderImportController.importCend);

// 1. 获取订单详情（含 raw_data 完整原始数据）
router.get('/:id', verifyToken, ordersController.getOrderById);

// 2. 获取订单列表（分页、筛选）
router.get('/', verifyToken, ordersController.getOrders);

module.exports = router;
