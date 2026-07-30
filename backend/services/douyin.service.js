/**
 * 抖店开放平台 API 服务
 * 封装签名算法、Token 管理、接口调用
 */

const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ===== 配置——部署前请替换为实际值 =====
const DOUYIN_APP_KEY = process.env.DOUYIN_APP_KEY || '';
const DOUYIN_APP_SECRET = process.env.DOUYIN_APP_SECRET || '';
const DOUYIN_API_HOST = 'https://openapi-fxg.jinritemai.com';

// Token 本地缓存文件路径
const TOKEN_CACHE_FILE = path.join(__dirname, '..', 'douyin_token.json');

// ==================== 签名算法 ====================

/**
 * 参数排序 -> 拼接 -> md5(appSecret + str + appSecret)
 */
function sign(paramsObj, appSecret) {
  const sortedKeys = Object.keys(paramsObj).sort();
  const concatStr = sortedKeys
    .map((k) => k + paramsObj[k])
    .join('');
  const signStr = appSecret + concatStr + appSecret;
  return crypto.createHash('md5').update(signStr, 'utf8').digest('hex');
}

// ==================== Token 管理 ====================

function readTokenCache() {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const raw = fs.readFileSync(TOKEN_CACHE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[抖店] 读取Token缓存失败:', e.message);
  }
  return null;
}

function writeTokenCache(data) {
  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[抖店] 写入Token缓存失败:', e.message);
  }
}

/** 获取有效 access_token（优先读缓存，过期则自动刷新） */
let refreshPromise = null;

async function getAccessToken() {
  const cache = readTokenCache();
  // 提前5分钟过期则刷新
  if (cache && cache.access_token && cache.expires_at > Date.now() + 5 * 60 * 1000) {
    return cache.access_token;
  }

  // 防止并发刷新
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const resp = await _callOpenApi('/token/refresh', {
        grant_type: 'refresh_token',
        refresh_token: cache?.refresh_token || '',
      }, true); // skipToken = true，此接口不用 access_token

      const { access_token, expires_in, refresh_token } = resp.data.data || resp.data;
      const tokenData = {
        access_token,
        refresh_token: refresh_token || cache?.refresh_token,
        expires_at: Date.now() + (expires_in || 7200) * 1000,
        updated_at: new Date().toISOString()
      };
      writeTokenCache(tokenData);
      console.log('[抖店] Token 刷新成功');
      return access_token;
    } catch (err) {
      console.error('[抖店] Token 刷新失败:', err.message);
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 通过 OAuth code 换取初始 token（首次授权时调用）
 */
async function exchangeCodeForToken(code) {
  const params = {
    app_id: DOUYIN_APP_KEY,
    app_secret: DOUYIN_APP_SECRET,
    grant_type: 'authorization_self',
    code
  };

  const method = 'oauth2.accessToken';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signStr = DOUYIN_APP_SECRET + 'app_id' + DOUYIN_APP_KEY + 'app_secret' + DOUYIN_APP_SECRET + 'code' + code + 'grant_typeauthorization_self' + 'timestamp' + timestamp + DOUYIN_APP_SECRET;
  const signVal = crypto.createHash('md5').update(signStr, 'utf8').digest('hex');

  const resp = await axios.post(
    'https://openapi-fxg.jinritemai.com/oauth2/access_token',
    {
      app_id: DOUYIN_APP_KEY,
      app_secret: DOUYIN_APP_SECRET,
      grant_type: 'authorization_self',
      code,
      timestamp,
      sign: signVal,
      sign_method: 'md5'
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
  );

  const body = resp.data;
  if (body.code !== 10000 && body.data?.access_token) {
    // 兼容不同返回格式
  }
  if (body.data?.access_token) {
    const tokenData = {
      access_token: body.data.access_token,
      refresh_token: body.data.refresh_token,
      expires_at: Date.now() + (body.data.expires_in || 7200) * 1000,
      updated_at: new Date().toISOString()
    };
    writeTokenCache(tokenData);
  }

  return resp.data;
}

// ==================== 通用 API 调用 ====================

/**
 * @param {string}  apiPath  接口路径，如 '/product/list'
 * @param {object}  bizParams  业务参数（不需要包裹 param_json，会自动处理）
 * @param {boolean} skipToken  是否跳过 access_token（用于 token 刷新接口本身）
 */
async function _callOpenApi(apiPath, bizParams = {}, skipToken = false) {
  const method = apiPath.replace(/^\//, '').replace(/\//g, '.');
  const timestamp = String(Math.floor(Date.now() / 1000));

  const sysParams = {
    method,
    app_key: DOUYIN_APP_KEY,
    timestamp,
    v: '2',
    sign_method: 'md5',
  };

  // 业务参数序列化为 JSON 字符串
  const paramJson = JSON.stringify(bizParams);
  sysParams['param_json'] = paramJson;

  // 计算签名
  const signVal = sign(sysParams, DOUYIN_APP_SECRET);
  sysParams.sign = signVal;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (!skipToken) {
    const token = await getAccessToken();
    headers['access-token'] = token;
  }

  const url = DOUYIN_API_HOST + apiPath;

  const resp = await axios.post(url, sysParams, {
    headers,
    timeout: 15000,
  });

  return resp.data;
}

// ==================== 对外暴露的业务接口 ====================

/** 获取商品列表 */
async function getProductList(params = {}) {
  const { page = 1, size = 20, status, keyword } = params;
  const biz = { page: String(page), size: String(size) };
  if (status) biz.status = String(status);
  if (keyword) biz.name = keyword; // 按商品名搜索
  return _callOpenApi('/product/list', biz);
}

/** 获取商品详情 */
async function getProductDetail(productId) {
  return _callOpenApi('/product/detail', { product_id: String(productId) });
}

/** 获取订单列表 */
async function getOrderList(params = {}) {
  const { page = 1, size = 20, orderStatus, startTime, endTime, keyword } = params;
  const biz = { page: String(page), size: String(size) };
  if (orderStatus) biz.order_status = String(orderStatus);
  if (startTime) biz.start_time = startTime;
  if (endTime) biz.end_time = endTime;
  if (keyword) biz.keyword = keyword;
  return _callOpenApi('/order/searchList', biz);
}

/** 获取订单详情 */
async function getOrderDetail(orderId) {
  return _callOpenApi('/order/orderDetail', { order_id: String(orderId) });
}

/** 获取售后/退款单列表 */
async function getRefundList(params = {}) {
  const { page = 1, size = 20, type } = params;
  const biz = { page: String(page), size: String(size) };
  if (type) biz.type = String(type);
  return _callOpenApi('/refund/searchList', biz);
}

/** 获取评价列表 */
async function getCommentList(params = {}) {
  const { page = 1, size = 20 } = params;
  return _callOpenApi('/comment/list', { page: String(page), size: String(size) });
}

// ==================== 导出 ====================

module.exports = {
  // 授权
  getOAuthUrl,
  exchangeCodeForToken,
  getAccessToken,
  // 商品
  getProductList,
  getProductDetail,
  // 订单
  getOrderList,
  getOrderDetail,
  // 售后
  getRefundList,
  // 评价
  getCommentList,
  // 原始调用（自定义接口用）
  callApi: _callOpenApi,
};

/**
 * 生成抖店授权链接
 */
function getOAuthUrl(redirectUri, state) {
  return `https://fuwu.jinritemai.com/oauth/authorize?app_id=${DOUYIN_APP_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state || '')}`;
}
