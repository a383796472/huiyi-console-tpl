// app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

const userController = require('./controllers/users.controller');
const userRoutes = require('./routes/users.routes');

// ===== CORS 配置 =====
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Disposition']
}));

// OPTIONS 预检请求 —— 用中间件拦截所有 OPTIONS 请求
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const logOperation = (req, action) => {
  const user = req.user ? `${req.user.username}(${req.user.id})` : '未认证';
  console.log(`📝 [操作日志] ${user} ${action} ${req.method} ${req.originalUrl}`);
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 登录接口
app.post('/api/login', (req, res, next) => {
  logOperation(req, '登录');
  next();
}, userController.login);

// 挂载用户路由
app.use('/api/users', userRoutes);

// 挂载产品路由
const productRoutes = require('./routes/products.routes');
app.use('/api/products', productRoutes);

// 挂载产品系列路由
const productSeriesRoutes = require('./routes/product-series.routes');
app.use('/api/product-series', productSeriesRoutes);

// 挂载上传路由
const uploadRoutes = require('./routes/upload.routes');
app.use('/api/upload', uploadRoutes);

// 挂载角色/权限路由
const rolesRoutes = require('./routes/roles.routes');
app.use('/api/roles', rolesRoutes);

// 挂载导出路由
const exportRoutes = require('./routes/export.routes');
app.use('/api/export', exportRoutes);

// 挂载部门路由
const departmentsRoutes = require('./routes/departments.routes');
app.use('/api/departments', departmentsRoutes);

// 挂载抖店路由
const douyinRoutes = require('./routes/douyin.routes');
app.use('/api/douyin', douyinRoutes);

// 挂载任务管理路由
const taskRoutes = require('./routes/tasks.routes');
app.use('/api/tasks', taskRoutes);

// 挂载订单中心路由
const orderRoutes = require('./routes/orders.routes');
app.use('/api/orders', orderRoutes);

// 挂载B端订单路由
const b2bOrderRoutes = require('./routes/b2b-orders.routes');
app.use('/api/b2b-orders', b2bOrderRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404 处理
app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 全局错误处理
app.use((err, _req, res, _next) => {
  console.error('❌ [全局错误]', err.stack || err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('💥 [未捕获异常]', err);
  // 不退出进程，让 PM2 或其他进程管理工具决定
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️  [未处理的Promise拒绝]', reason);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 后端服务已运行在 http://localhost:${PORT}`);
  // 产品系列表初始化（建表 + 补齐默认系列，幂等）
  require('./db/ensure-product-series')()
    .then(() => console.log('✅ [DB] 产品系列表已就绪'))
    .catch((err) => console.error('⚠️ [DB] 产品系列表初始化失败:', err.message));
});

module.exports = app;