/**
 * B端订单 - 数据库迁移脚本（建 b2b_orders / b2b_order_items 表）
 * 用法：node scripts/migrate-b2b-orders.js
 */
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const sqlFile = path.join(__dirname, '..', 'db', 'migrations', '2026-11-10_create_b2b_orders.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  try {
    const body = sql
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    for (const stmt of body.split(/;\s*(?:\r?\n|$)/)) {
      const s = stmt.trim();
      if (!s) continue;
      await db.query(s);
    }
    console.log('✅ b2b_orders / b2b_order_items 表创建成功（或已存在）');
    const [rows] = await db.query("SHOW TABLES LIKE 'b2b_%'");
    console.log('验证:', rows.map((r) => Object.values(r)[0]).join(', ') || '表不存在');
    process.exit(0);
  } catch (err) {
    console.error('❌ B端订单表创建失败:', err.message);
    process.exit(1);
  }
}

migrate();
