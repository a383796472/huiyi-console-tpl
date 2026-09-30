// 联调用：为库内真实用户生成临时JWT（不落库、不改数据）
const jwt = require('jsonwebtoken');
const db = require('../config/db');

(async () => {
  const [rows] = await db.query(
    "SELECT id, username, role FROM users WHERE status = 1 ORDER BY role = 'super_admin' DESC, id ASC LIMIT 1"
  );
  if (!rows.length) {
    console.error('库里没有可用用户');
    process.exit(1);
  }
  const u = rows[0];
  const secret = process.env.JWT_SECRET || 'huiyi_console_secret_key_2024';
  const token = jwt.sign({ id: u.id, username: u.username, role: u.role }, secret, { expiresIn: '2h' });
  console.log(JSON.stringify({ token, userInfo: { id: u.id, username: u.username, role: u.role } }));
  process.exit(0);
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
