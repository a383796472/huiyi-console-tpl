-- 产品系列管理表
CREATE TABLE IF NOT EXISTS product_series (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_series_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO product_series (name, sort_order) VALUES
('单品系列', 10),
('MS系列', 20),
('MT系列', 30),
('MW系列', 40),
('M66系列', 50),
('ST06双向充系列', 60),
('CZ车载支架系列', 70),
('GT运动相机系列', 80);

INSERT IGNORE INTO product_series (name, sort_order)
SELECT DISTINCT series, 900 FROM products
WHERE series IS NOT NULL AND series <> '';
