// routes/products.js

const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');

// --- 修改开始 ---

// 1. 把获取单个详情的路由提到最前面
router.get('/:id', productsController.getProductById);

// 2. 获取产品列表放在后面
router.get('/', productsController.getProducts);

// --- 修改结束 ---

// 保存产品
router.post('/', productsController.addProduct);

// 删除产品
router.delete('/:id', productsController.deleteProduct);

// 更新产品
router.put('/:id', productsController.updateProduct);

module.exports = router;