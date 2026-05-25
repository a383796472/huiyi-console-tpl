const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const username = 'admin';
    const password = 'admin123';

    const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      console.log(`超级管理员 "${username}" 已存在，跳过创建`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, email, phone, real_name, role, status) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [username, hashedPassword, 'admin@huiyi.com', '13800138000', '超级管理员', 'super_admin']
    );

    console.log('超级管理员创建成功！');
    console.log(`  用户名: ${username}`);
    console.log(`  密码:   ${password}`);
    console.log(`  角色:   super_admin`);
    process.exit(0);
  } catch (error) {
    console.error('创建超级管理员失败：', error);
    process.exit(1);
  }
}

seed();
