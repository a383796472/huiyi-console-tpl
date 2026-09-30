/**
 * 订单中心 - 数据库迁移脚本（建 orders 表）
 * 用法：node scripts/migrate-orders.js
 */
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const sqlFile = path.join(__dirname, '..', 'db', 'migrations', '2026-09-29_create_orders_table.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  try {
    await db.query(sql);
    console.log('✅ orders 表创建成功（或已存在）');
    const [rows] = await db.query("SHOW TABLES LIKE 'orders'");
    console.log('验证:', rows.length > 0 ? '表存在' : '表不存在');
    process.exit(0);
  } catch (err) {
    console.error('❌ orders 表创建失败:', err.message);
    process.exit(1);
  }
}

migrate();
