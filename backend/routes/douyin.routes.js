/**
 * 抖店 API 路由
 * 前端通过 /api/douyin/* 调用抖店接口
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const douyin = require('../services/douyin.service');

// ==================== 授权相关 ====================

/** 获取授权链接（前端引导商家点击授权） */
router.get('/oauth/url', verifyToken, requireRole('super_admin'), (req, res) => {
  try {
    const redirectUri = req.query.redirect_uri || (req.protocol + '://' + req.get('host') + '/api/douyin/oauth/callback');
    const state = req.query.state || Date.now().toString(36);
    const url = douyin.getOAuthUrl(redirectUri, state);
    res.json({ code: 200, data: { url, state } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

/** OAuth 回调——用 code 换取 token 并缓存 */
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ code: 400, message: '缺少授权码 code' });

    const result = await douyin.exchangeCodeForToken(code);
    res.json({ code: 200, message: '授权成功', data: result.data });
  } catch (err) {
    res.status(500).json({ code: 500, message: '授权失败: ' + err.message });
  }
});

/** 查看当前 Token 状态 */
router.get('/oauth/status', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const cacheFile = path.join(__dirname, '..', 'douyin_token.json');
    if (fs.existsSync(cacheFile)) {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      // 不暴露完整 token，只给状态信息
      res.json({
        code: 200,
        data: {
          has_token: !!data.access_token,
          expired: data.expires_at ? data.expires_at < Date.now() : true,
          updated_at: data.updated_at || '-',
          expires_in_seconds: data.expires_at
            ? Math.max(0, Math.floor((data.expires_at - Date.now()) / 1000))
            : 0,
        }
      });
    } else {
      res.json({ code: 200, data: { has_token: false } });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ==================== 商品接口 ====================

router.get('/products', verifyToken, async (req, res) => {
  try {
    const result = await douyin.getProductList(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取商品列表失败: ' + err.message });
  }
});

router.get('/products/:productId', verifyToken, async (req, res) => {
  try {
    const result = await douyin.getProductDetail(req.params.productId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取商品详情失败: ' + err.message });
  }
});

// ==================== 订单接口 ====================

router.get('/orders', verifyToken, async (req, res) => {
  try {
    const result = await douyin.getOrderList(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取订单列表失败: ' + err.message });
  }
});

router.get('/orders/:orderId', verifyToken, async (req, res) => {
  try {
    const result = await douyin.getOrderDetail(req.params.orderId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取订单详情失败: ' + err.message });
  }
});

// ==================== 售后接口 ====================

router.get('/refunds', verifyToken, async (req, res) => {
  try {
    const result = await douyin.getRefundList(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取售后单失败: ' + err.message });
  }
});

// ==================== 评价接口 ====================

router.get('/comments', verifyToken, async (req, res) => {
  try {
    const result = await douyin.getCommentList(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取评价列表失败: ' + err.message });
  }
});

// ==================== 通用透传（调试/高级用途） ====================

router.post('/raw', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { apiPath, params } = req.body;
    if (!apiPath) return res.status(400).json({ code: 400, message: '缺少 apiPath' });
    const result = await douyin.callApi(apiPath, params || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
