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
        department_id INT DEFAULT NULL COMMENT '部门ID',
        role VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '角色: super_admin, admin, user',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=启用, 0=禁用',
        last_login DATETIME DEFAULT NULL COMMENT '最后登录时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'
    `);
    console.log('users 表创建成功！');

    console.log('正在重建 departments 表...');
    await db.query('DROP TABLE IF EXISTS departments');
    await db.query(`
      CREATE TABLE departments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE COMMENT '部门名称',
        parent_id INT DEFAULT NULL COMMENT '父部门ID',
        sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表'
    `);
    console.log('departments 表创建成功！');

    // 插入默认部门
    await db.query(`
      INSERT INTO departments (name, sort_order) VALUES
      ('无部门', 0),
      ('GR海外销售', 1),
      ('GR国内品牌', 2),
      ('GR国内销售', 3),
      ('GR海外品牌', 4),
      ('GR国内电商', 5)
    `);
    console.log('默认部门初始化完成！');

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
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(255) DEFAULT NULL COMMENT '产品名称',
        sku VARCHAR(100) DEFAULT NULL COMMENT 'SKU',
        product_code VARCHAR(100) DEFAULT NULL COMMENT '产品编号',
        series VARCHAR(100) DEFAULT NULL COMMENT '系列',
        series_code VARCHAR(50) DEFAULT NULL COMMENT '系列编号',
        product_status VARCHAR(50) DEFAULT NULL COMMENT '产品状态',
        product_image VARCHAR(500) DEFAULT NULL COMMENT '产品图片',
        brand_package_image VARCHAR(500) DEFAULT NULL COMMENT '品牌包装图片',
        selling_points TEXT DEFAULT NULL COMMENT '产品卖点',
        english_name VARCHAR(255) DEFAULT NULL COMMENT '英文产品名称',
        model VARCHAR(100) DEFAULT NULL COMMENT '型号',
        ean_code VARCHAR(50) DEFAULT NULL COMMENT 'EAN码',
        hs_code VARCHAR(50) DEFAULT NULL COMMENT '海关编码',
        production_process VARCHAR(100) DEFAULT NULL COMMENT '生产工艺',
        material VARCHAR(100) DEFAULT NULL COMMENT '材料',
        color VARCHAR(100) DEFAULT NULL COMMENT '颜色',
        specs TEXT DEFAULT NULL COMMENT '规格参数',
        compatible_vehicles VARCHAR(255) DEFAULT NULL COMMENT '适配车型',
        cost VARCHAR(100) DEFAULT NULL COMMENT '成本',
        cost_1 VARCHAR(100) DEFAULT NULL COMMENT '成本1',
        suggested_price VARCHAR(100) DEFAULT NULL COMMENT '建议销售价',
        suggested_price_1 VARCHAR(100) DEFAULT NULL COMMENT '建议销售价1',
        china_retail_price VARCHAR(50) DEFAULT NULL COMMENT '中国零售价',
        usd_price DECIMAL(10,2) DEFAULT NULL COMMENT '美国USD',
        eur_price DECIMAL(10,2) DEFAULT NULL COMMENT '欧洲欧元',
        moq VARCHAR(50) DEFAULT NULL COMMENT 'MOQ',
        product_supplying VARCHAR(100) DEFAULT NULL COMMENT '产品供应中',
        net_weight DECIMAL(10,4) DEFAULT NULL COMMENT '产品净重KG',
        gross_weight DECIMAL(10,4) DEFAULT NULL COMMENT '毛重KG',
        whole_box_weight DECIMAL(10,2) DEFAULT NULL COMMENT '整箱毛重KG',
        packaging_size VARCHAR(100) DEFAULT NULL COMMENT '包装规格MM',
        inner_box_size VARCHAR(100) DEFAULT NULL COMMENT '内小箱规格MM',
        outer_box_size VARCHAR(100) DEFAULT NULL COMMENT '外大箱规格MM',
        inner_box_qty VARCHAR(50) DEFAULT NULL COMMENT '内箱装箱数量',
        outer_box_qty INT DEFAULT NULL COMMENT '外箱装箱数量',
        packing_qty VARCHAR(50) DEFAULT NULL COMMENT '装箱数量',
        inner_box_sku VARCHAR(100) DEFAULT NULL COMMENT '内箱SKU代码ICS',
        outer_box_sku VARCHAR(100) DEFAULT NULL COMMENT '外箱SKU代码MCS',
        inner_barcode VARCHAR(50) DEFAULT NULL COMMENT '内纸箱条形码ICB',
        us_barcode VARCHAR(50) DEFAULT NULL COMMENT '美国条形码编号',
        competitor_price_sp VARCHAR(100) DEFAULT NULL COMMENT '海外竞对参考价美sp',
        competitor_price_ql VARCHAR(100) DEFAULT NULL COMMENT '海外竞对参考价美quadlock',
        competitor_price_sp_num DECIMAL(10,2) DEFAULT NULL COMMENT '海外竞对参考价美SP数值',
        competitor_price_ql_num VARCHAR(100) DEFAULT NULL COMMENT '海外竞对参考价美ql',
        standard_config TEXT DEFAULT NULL COMMENT '标准配置',
        package_english_name VARCHAR(255) DEFAULT NULL COMMENT '产品包装英文名称',
        remark TEXT DEFAULT NULL COMMENT '备注',
        remark_1 TEXT DEFAULT NULL COMMENT '备注1',
        remark_2 TEXT DEFAULT NULL COMMENT '备注2',
        department_id INT DEFAULT NULL COMMENT '所属部门ID',
        created_by INT DEFAULT NULL COMMENT '创建人ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品表-GR品牌SKU资料总表'
    `);
    console.log('products 表创建成功！');

    process.exit(0);
  } catch (error) {
    console.error('重建表失败：', error);
    process.exit(1);
  }
}

initDB();