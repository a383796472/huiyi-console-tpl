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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== 请求超时保护：30秒无响应则返回 504 =====
app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(504).json({ code: 504, message: '请求超时，请稍后重试' });
    }
  });
  next();
});

// 请求日志
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// 管理员操作日志
const logOperation = (req, action) => {
  const user = req.user ? `${req.user.username}(${req.user.id})` : '未认证';
  console.log(`📝 [操作日志] ${user} ${action} ${req.method} ${req.originalUrl}`);
};

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
});

module.exports = app;