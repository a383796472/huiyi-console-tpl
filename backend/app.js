// app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

const userController = require('./controllers/users.controller');
const userRoutes = require('./routes/users.routes');

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 登录接口
app.post('/api/login', userController.login);

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

app.listen(3000, () => {
  console.log('✅ 后端服务已运行在 http://localhost:3000');
});

module.exports = app;