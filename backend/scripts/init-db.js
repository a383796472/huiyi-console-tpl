const db = require('../config/db');

async function initDB() {
  try {
    console.log('正在重建 users 表...');
    await db.query('DROP TABLE IF EXISTS users');
    await db.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
        password VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
        email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
        phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
        real_name VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
        role VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '角色: super_admin, admin, user',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=启用, 0=禁用',
        last_login DATETIME DEFAULT NULL COMMENT '最后登录时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'
    `);
    console.log('users 表创建成功！');

    console.log('正在重建 products 表...');
    await db.query('DROP TABLE IF EXISTS products');
    await db.query(`
      CREATE TABLE products (
        id int NOT NULL AUTO_INCREMENT,
        name varchar(255) DEFAULT NULL COMMENT '产品名称',
        english_name varchar(255) DEFAULT NULL COMMENT '英文名称',
        product_code varchar(100) DEFAULT NULL COMMENT '产品编号',
        SKU varchar(100) DEFAULT NULL COMMENT 'SKU编号',
        category_l1 varchar(255) DEFAULT NULL COMMENT '一级品类',
        category_l2 varchar(255) DEFAULT NULL COMMENT '二级品类',
        product_type varchar(100) DEFAULT NULL COMMENT '产品类型',
        ean_code varchar(100) DEFAULT NULL COMMENT 'EAN码',
        us_barcode varchar(100) DEFAULT NULL COMMENT '美国条形码编号',
        compatible_vehicles varchar(255) DEFAULT NULL COMMENT '适配车型',
        sales_status varchar(50) DEFAULT NULL COMMENT '销售状态',
        cost_price_rmb varchar(50) DEFAULT NULL COMMENT '成本价RMB',
        retail_price_usd varchar(50) DEFAULT NULL COMMENT '建议零售价USD',
        retail_price_eur varchar(50) DEFAULT NULL COMMENT '建议零售价EUR',
        retail_price_rmb varchar(50) DEFAULT NULL COMMENT '建议零售价RMB',
        certification text DEFAULT NULL COMMENT '产品认证',
        patent text DEFAULT NULL COMMENT '产品专利',
        acquisition_method varchar(100) DEFAULT NULL COMMENT '取得方式',
        color varchar(50) DEFAULT NULL COMMENT '颜色',
        reference_link text DEFAULT NULL COMMENT '参考链接',
        net_weight varchar(50) DEFAULT NULL COMMENT '净重KG',
        gross_weight varchar(50) DEFAULT NULL COMMENT '毛重KG',
        whole_box_weight varchar(50) DEFAULT NULL COMMENT '整箱毛重KG',
        unit varchar(50) DEFAULT NULL COMMENT '产品单位',
        product_size varchar(255) DEFAULT NULL COMMENT '产品尺寸',
        packaging_size_mm varchar(100) DEFAULT NULL COMMENT '包装尺寸MM',
        inner_box_size varchar(100) DEFAULT NULL COMMENT '内小箱MM',
        outer_box_size varchar(100) DEFAULT NULL COMMENT '外大箱MM',
        inner_box_qty varchar(50) DEFAULT NULL COMMENT '内箱装箱数量',
        packing_qty varchar(50) DEFAULT NULL COMMENT '装箱数量',
        declare_category varchar(255) DEFAULT NULL COMMENT '申报品类',
        hs_code varchar(100) DEFAULT NULL COMMENT '海关编码',
        declare_name_cn varchar(255) DEFAULT NULL COMMENT '中文申报品名',
        declare_name_en varchar(255) DEFAULT NULL COMMENT '英文申报品名',
        declare_value_usd varchar(50) DEFAULT NULL COMMENT '申报价值USD',
        material_cn varchar(255) DEFAULT NULL COMMENT '中文材质',
        material_en varchar(255) DEFAULT NULL COMMENT '英文材质',
        usage_cn text DEFAULT NULL COMMENT '中文用途',
        usage_en text DEFAULT NULL COMMENT '英文用途',
        has_battery varchar(50) DEFAULT NULL COMMENT '是否包含电池',
        has_special_goods varchar(50) DEFAULT NULL COMMENT '是否包含特货',
        has_magnetism varchar(50) DEFAULT NULL COMMENT '是否带磁',
        has_non_liquid_cosmetics varchar(50) DEFAULT NULL COMMENT '是否含非液体化妆品',
        is_counterfeit varchar(50) DEFAULT NULL COMMENT '是否为仿制品',
        customs_name varchar(255) DEFAULT NULL COMMENT '报关名称',
        customs_material varchar(255) DEFAULT NULL COMMENT '报关专用材质',
        extra_info text DEFAULT NULL COMMENT '附加信息',
        accessory_info text DEFAULT NULL COMMENT '产品规格/配件',
        extra_images text DEFAULT NULL COMMENT '附加图片(JSON)',
        selling_points text DEFAULT NULL COMMENT '产品卖点(JSON)',
        selling_detail text DEFAULT NULL COMMENT '卖点详情',
        image varchar(255) DEFAULT NULL COMMENT '产品图片URL',
        description text DEFAULT NULL COMMENT '描述',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品表'
    `);
    console.log('products 表创建成功！');

    process.exit(0);
  } catch (error) {
    console.error('重建表失败：', error);
    process.exit(1);
  }
}

initDB();
