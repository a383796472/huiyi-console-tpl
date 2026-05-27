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

    console.log('正在重建 roles 表...');
    await db.query('DROP TABLE IF EXISTS role_permissions');
    await db.query('DROP TABLE IF EXISTS permissions');
    await db.query('DROP TABLE IF EXISTS roles');
    await db.query(`
      CREATE TABLE roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色标识: super_admin, admin, user',
        display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
        description VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
        is_system TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统内置: 0=否, 1=是',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表'
    `);
    console.log('roles 表创建成功！');

    console.log('正在重建 permissions 表...');
    await db.query(`
      CREATE TABLE permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE COMMENT '权限标识: user:create, product:delete',
        display_name VARCHAR(100) NOT NULL COMMENT '权限显示名称',
        group_name VARCHAR(50) NOT NULL COMMENT '权限分组: 用户管理, 产品管理',
        description VARCHAR(255) DEFAULT NULL COMMENT '权限描述',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表'
    `);
    console.log('permissions 表创建成功！');

    console.log('正在重建 role_permissions 表...');
    await db.query(`
      CREATE TABLE role_permissions (
        role_id INT NOT NULL COMMENT '角色ID',
        permission_id INT NOT NULL COMMENT '权限ID',
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-权限关联表'
    `);
    console.log('role_permissions 表创建成功！');

    // 插入默认角色
    console.log('正在初始化默认角色...');
    await db.query(`
      INSERT INTO roles (name, display_name, description, is_system) VALUES
      ('super_admin', '超级管理员', '拥有系统所有权限', 1),
      ('admin', '管理员', '拥有部分管理权限', 1),
      ('user', '普通用户', '基础权限', 1)
    `);

    // 插入默认权限
    console.log('正在初始化默认权限...');
    await db.query(`
      INSERT INTO permissions (name, display_name, group_name) VALUES
      ('user:list', '查看用户列表', '用户管理'),
      ('user:create', '创建用户', '用户管理'),
      ('user:edit', '编辑用户', '用户管理'),
      ('user:delete', '删除用户', '用户管理'),
      ('user:status', '启用/停用用户', '用户管理'),
      ('user:role', '管理角色权限', '用户管理'),
      ('product:list', '查看产品列表', '产品管理'),
      ('product:create', '新增产品', '产品管理'),
      ('product:edit', '编辑产品', '产品管理'),
      ('product:delete', '删除产品', '产品管理'),
      ('product:view', '查看产品详情', '产品管理')
    `);

    // 超级管理员拥有所有权限
    await db.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT (SELECT id FROM roles WHERE name = 'super_admin'), id FROM permissions
    `);

    // 管理员默认权限
    await db.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT (SELECT id FROM roles WHERE name = 'admin'), id FROM permissions
      WHERE name IN ('user:list', 'user:create', 'user:edit',
                     'product:list', 'product:create', 'product:edit', 'product:view')
    `);

    // 普通用户默认权限
    await db.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT (SELECT id FROM roles WHERE name = 'user'), id FROM permissions
      WHERE name IN ('product:list', 'product:view')
    `);
    console.log('默认角色和权限初始化完成！');

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
