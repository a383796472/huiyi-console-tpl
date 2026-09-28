const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'a88953746',database:'huiyi_test'});
  await c.query('CREATE TABLE IF NOT EXISTS departments (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL UNIQUE, parent_id INT DEFAULT NULL, sort_order INT NOT NULL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
  await c.query('INSERT IGNORE INTO departments (name, sort_order) VALUES (?, ?), (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)', ['无部门', 0, 'GR海外销售', 1, 'GR国内品牌', 2, 'GR国内销售', 3, 'GR海外品牌', 4, 'GR国内电商', 5]);
  console.log('departments表已创建');
  await c.end();
})().catch(e => console.error(e));
