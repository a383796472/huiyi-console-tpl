// routes/b2b-orders.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/b2b-orders.controller');
const orderImportController = require('../controllers/order-import.controller');
const orderUpload = require('../middleware/orderUpload');
const { verifyToken } = require('../middleware/auth');

// 0. 上传文件导入（当天/当月/全部）
router.post('/import', verifyToken, orderUpload, orderImportController.importB2b);

// 1. 筛选选项（必须放在 /:id 之前）
router.get('/options', verifyToken, controller.getOptions);

// 2. 列表（分页、筛选）
router.get('/', verifyToken, controller.getOrders);

// 3. 详情（含明细）
router.get('/:id', verifyToken, controller.getOrderById);

// 4. 保存编辑（订单头 + 明细）
router.put('/:id', verifyToken, controller.updateOrder);

module.exports = router;
