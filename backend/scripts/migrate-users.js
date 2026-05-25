const db = require('../config/db');

async function migrate() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM users");

    const existingColumns = columns.map(c => c.Field);
    const newColumns = [];

    if (!existingColumns.includes('phone')) {
      newColumns.push("ADD COLUMN phone VARCHAR(20) DEFAULT NULL COMMENT '手机号' AFTER email");
    }
    if (!existingColumns.includes('real_name')) {
      newColumns.push("ADD COLUMN real_name VARCHAR(50) DEFAULT NULL COMMENT '真实姓名' AFTER phone");
    }
    if (!existingColumns.includes('last_login')) {
      newColumns.push("ADD COLUMN last_login DATETIME DEFAULT NULL COMMENT '最后登录时间' AFTER status");
    }

    if (newColumns.length === 0) {
      console.log('所有字段已存在，无需迁移');
      process.exit(0);
    }

    await db.query(`ALTER TABLE users ${newColumns.join(', ')}`);
    console.log(`成功添加字段：${newColumns.map(c => c.match(/`(\w+)`/)?.[1]).join(', ')}`);
    process.exit(0);
  } catch (error) {
    console.error('迁移失败：', error.message);
    process.exit(1);
  }
}

migrate();
