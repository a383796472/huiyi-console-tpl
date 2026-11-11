/**
 * 产品系列表初始化（幂等）
 * 服务启动时执行：建表 + 写入默认系列 + 补齐产品表中已在使用但列表里缺失的系列
 */
const db = require('../config/db');

const DEFAULT_SERIES = [
  '单品系列',
  'MS系列',
  'MT系列',
  'MW系列',
  'M66系列',
  'ST06双向充系列',
  'CZ车载支架系列',
  'GT运动相机系列'
];

async function ensureProductSeries() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_series (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_product_series_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const values = DEFAULT_SERIES.map((name, i) => [name, (i + 1) * 10]);
  await db.query('INSERT IGNORE INTO product_series (name, sort_order) VALUES ?', [values]);

  await db.query(`
    INSERT IGNORE INTO product_series (name, sort_order)
    SELECT DISTINCT series, 900 FROM products
    WHERE series IS NOT NULL AND series <> ''
  `);

  return true;
}

module.exports = ensureProductSeries;
