const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'a88953746',database:'huiyi_test'});
  await c.query('UPDATE users SET role = ?, department_id = ? WHERE username = ?', ['super_admin', 1, 'admin']);
  console.log('admin角色已更新');
  await c.end();
})().catch(e => console.error(e));
