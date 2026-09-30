// 订单接口冒烟测试：生成临时JWT → 调列表/详情接口校验
const jwt = require('jsonwebtoken');
const http = require('http');

const SECRET = process.env.JWT_SECRET || 'huiyi_console_secret_key_2024';
const token = jwt.sign({ id: 1, username: 'smoke', role: 'super_admin' }, SECRET, { expiresIn: '5m' });

const get = (path) =>
  new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port: 3000, path, headers: { Authorization: `Bearer ${token}` } }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
      })
      .on('error', reject);
  });

(async () => {
  // 1. 无 token 应 401
  const noAuth = await new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port: 3000, path: '/api/orders' }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });
  console.log('1) 无token:', noAuth.status, '(期望401)');

  // 2. 列表默认分页
  const list = await get('/api/orders?page=1&pageSize=5');
  console.log('2) 列表:', list.status, 'total=', list.body.data.total, '本页=', list.body.data.list.length);
  console.log('   首行字段:', Object.keys(list.body.data.list[0] || {}).join(', '));
  console.log('   含raw_data?', 'raw_data' in (list.body.data.list[0] || {}), '(期望false)');

  // 3. 平台+状态筛选
  const filtered = await get('/api/orders?platform=shopify&statusCode=completed&pageSize=3');
  console.log('3) Shopify已完成:', filtered.status, 'total=', filtered.body.data.total);
  console.log('   校验:', filtered.body.data.list.every((r) => r.platform === 'shopify' && r.status_code === 'completed') ? 'PASS' : 'FAIL');

  // 4. 关键词搜索（订单号）
  const kw = await get('/api/orders?keyword=GR1443');
  console.log('4) 搜索GR1443:', kw.status, 'total=', kw.body.data.total, '(期望1)');

  // 5. 日期范围
  const dr = await get('/api/orders?startDate=2026-08-01&endDate=2026-08-31&pageSize=1');
  console.log('5) 8月区间:', dr.status, 'total=', dr.body.data.total);

  // 6. 详情（含 raw_data）
  const one = await get('/api/orders?page=1&pageSize=1');
  const id = one.body.data.list[0].id;
  const detail = await get(`/api/orders/${id}`);
  const d = detail.body.data;
  console.log('6) 详情:', detail.status, 'id=', id, '含raw_data?', !!d.raw_data, 'items数=', (d.raw_data.items || []).length);

  // 7. 不存在的订单
  const nf = await get('/api/orders/99999999');
  console.log('7) 不存在订单:', nf.status, '(期望404)');

  console.log('=== 冒烟测试完成 ===');
  process.exit(0);
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
