/**
 * 批量创建 10 个测试用户
 * 用法（服务器上）：node scripts/seed-test-users.js
 * 注意：不要加 --env-file，直接用 db.js 内置的服务器凭据
 *
 * 生成账号：test01 ~ test10，密码统一 123456，角色 user
 * 已存在的用户名自动跳过，可重复执行
 */
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const PASSWORD = '123456';
const USER_COUNT = 10;

async function seed() {
  try {
    console.log('🚀 开始批量创建测试用户...\n');

    // 1. 找一个部门（优先"无部门"，否则取第一个）
    const [depts] = await db.query(
      "SELECT id, name FROM departments ORDER BY (name = '无部门') DESC, sort_order, id LIMIT 1"
    );
    if (depts.length === 0) {
      console.error('❌ departments 表为空，请先在系统里创建部门');
      process.exit(1);
    }
    const dept = depts[0];
    console.log(`📁 使用部门：${dept.name} (id=${dept.id})\n`);

    // 2. 预加密密码（10 个用户共用一个 hash 即可）
    const hashed = await bcrypt.hash(PASSWORD, 10);

    // 3. 逐个插入，跳过已存在
    let created = 0, skipped = 0;
    for (let i = 1; i <= USER_COUNT; i++) {
      const num = String(i).padStart(2, '0');
      const username = `test${num}`;
      const realName = `测试用户${num}`;

      const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existing.length > 0) {
        console.log(`  ⏭️  ${username} 已存在，跳过`);
        skipped++;
        continue;
      }

      await db.query(
        'INSERT INTO users (username, password, email, phone, real_name, department_id, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [username, hashed, `${username}@test.local`, null, realName, dept.id, 'user']
      );
      console.log(`  ✅ ${username}（${realName}）创建成功`);
      created++;
    }

    console.log(`\n🎉 完成：新增 ${created} 个 / 跳过 ${skipped} 个`);
    console.log(`   账号：test01 ~ test10，密码统一：${PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行失败：', error.message);
    process.exit(1);
  }
}

seed();
