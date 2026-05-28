// routes/products.js

const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// 1. 获取单个产品详情
router.get('/:id', verifyToken, productsController.getProductById);

// 2. 获取产品列表
router.get('/', verifyToken, productsController.getProducts);

// 3. 新增产品（超管和管理员）
router.post('/', verifyToken, requireRole('super_admin', 'admin'), productsController.addProduct);

// 4. 删除产品（超管和管理员）
router.delete('/:id', verifyToken, requireRole('super_admin', 'admin'), productsController.deleteProduct);

// 5. 更新产品（超管和管理员）
router.put('/:id', verifyToken, requireRole('super_admin', 'admin'), productsController.updateProduct);

module.exports = router;