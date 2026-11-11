/**
 * 部门权限与部门管理员角色 - 数据库迁移脚本
 * 用法：node scripts/migrate-department-permissions.js
 * 特点：可重复执行（列存在性检查 + INSERT IGNORE）
 */
const db = require('../config/db');

const COLUMNS = [
  { name: 'manager_id', ddl: "ADD COLUMN `manager_id` INT DEFAULT NULL COMMENT '部门管理员用户ID'" },
  { name: 'description', ddl: "ADD COLUMN `description` VARCHAR(255) DEFAULT NULL COMMENT '部门描述'" },
  { name: 'status', ddl: "ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=启用, 0=停用'" }
];

const PERMISSIONS = [
  // 用户管理
  ['user:list', '查看用户列表', '用户管理'],
  ['user:create', '创建用户', '用户管理'],
  ['user:edit', '编辑用户', '用户管理'],
  ['user:delete', '删除用户', '用户管理'],
  ['user:status', '启用/停用用户', '用户管理'],
  ['user:role', '管理角色权限', '用户管理'],
  // 部门管理
  ['department:list', '查看部门列表', '部门管理'],
  ['department:create', '新增部门', '部门管理'],
  ['department:edit', '编辑部门', '部门管理'],
  ['department:delete', '删除部门', '部门管理'],
  // 产品管理
  ['product:list', '查看产品列表', '产品管理'],
  ['product:create', '新增产品', '产品管理'],
  ['product:edit', '编辑产品', '产品管理'],
  ['product:delete', '删除产品', '产品管理'],
  ['product:view', '查看产品详情', '产品管理'],
  // 订单管理
  ['order:list', '查看订单列表', '订单管理'],
  ['order:view', '查看订单详情', '订单管理'],
  ['order:export', '导出订单', '订单管理'],
  // 店铺数据
  ['shopstats:view', '查看店铺数据', '店铺数据'],
  // 任务管理
  ['task:list', '查看任务', '任务管理'],
  ['task:edit', '编辑任务', '任务管理'],
  // 物流管理
  ['logistics:list', '查看物流', '物流管理'],
  ['logistics:edit', '编辑物流', '物流管理']
];

const ROLES = [
  ['super_admin', '超级管理员', '拥有系统所有权限', 1],
  ['admin', '管理员', '拥有全部业务管理权限', 1],
  ['dept_admin', '部门管理员', '管理本部门用户与业务数据', 1],
  ['user', '普通员工', '基础只读权限', 1]
];

const ROLE_GRANTS = {
  super_admin: { all: true },
  admin: {
    exclude: ['department:create', 'department:edit', 'department:delete', 'user:role']
  },
  dept_admin: [
    'user:list', 'user:create', 'user:edit', 'user:status',
    'department:list',
    'product:list', 'product:create', 'product:edit', 'product:delete', 'product:view',
    'order:list', 'order:view', 'order:export',
    'shopstats:view',
    'task:list', 'task:edit',
    'logistics:list', 'logistics:edit'
  ],
  user: ['product:list', 'product:view', 'order:list', 'order:view', 'shopstats:view', 'task:list']
};

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(table, indexName) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function tableExists(table) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

// 部分环境（如本地库）可能没有角色权限表，缺失时按系统标准结构补齐
async function ensureRoleTables() {
  if (!(await tableExists('roles'))) {
    await db.query(`
      CREATE TABLE roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色标识',
        display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
        description VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
        is_system TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统内置: 0=否, 1=是',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表'
    `);
    console.log('+ roles 表创建成功');
  }

  if (!(await tableExists('permissions'))) {
    await db.query(`
      CREATE TABLE permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE COMMENT '权限标识',
        display_name VARCHAR(100) NOT NULL COMMENT '权限显示名称',
        group_name VARCHAR(50) NOT NULL COMMENT '权限分组',
        description VARCHAR(255) DEFAULT NULL COMMENT '权限描述',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表'
    `);
    console.log('+ permissions 表创建成功');
  }

  if (!(await tableExists('role_permissions'))) {
    await db.query(`
      CREATE TABLE role_permissions (
        role_id INT NOT NULL COMMENT '角色ID',
        permission_id INT NOT NULL COMMENT '权限ID',
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-权限关联表'
    `);
    console.log('+ role_permissions 表创建成功');
  }
}

async function migrate() {
  try {
    // 0. 角色权限基础表
    await ensureRoleTables();

    // 1. departments 扩展字段
    for (const col of COLUMNS) {
      if (await columnExists('departments', col.name)) {
        console.log(`- departments.${col.name} 已存在，跳过`);
      } else {
        await db.query(`ALTER TABLE departments ${col.ddl}`);
        console.log(`+ departments.${col.name} 添加成功`);
      }
    }

    // 2. 系统角色（含部门管理员）
    for (const [name, displayName, description, isSystem] of ROLES) {
      await db.query(
        `INSERT IGNORE INTO roles (name, display_name, description, is_system)
         VALUES (?, ?, ?, ?)`,
        [name, displayName, description, isSystem]
      );
    }
    console.log(`+ 角色 ${ROLES.length} 个已就绪`);

    // 3. 权限点
    for (const [name, displayName, groupName] of PERMISSIONS) {
      await db.query(
        `INSERT IGNORE INTO permissions (name, display_name, group_name) VALUES (?, ?, ?)`,
        [name, displayName, groupName]
      );
    }
    console.log(`+ 权限点 ${PERMISSIONS.length} 个已就绪`);

    // 4. 角色权限
    for (const [roleName, grant] of Object.entries(ROLE_GRANTS)) {
      const [roleRows] = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);
      if (roleRows.length === 0) {
        console.warn(`! 角色 ${roleName} 不存在，跳过授权`);
        continue;
      }
      const roleId = roleRows[0].id;

      if (grant.all) {
        await db.query(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id)
           SELECT ?, id FROM permissions`,
          [roleId]
        );
        console.log(`+ ${roleName}：全部权限`);
        continue;
      }

      let permissionNames = grant.exclude
        ? (await db.query('SELECT name FROM permissions'))[0]
            .map((r) => r.name)
            .filter((n) => !grant.exclude.includes(n))
        : grant;

      if (permissionNames.length === 0) continue;

      const placeholders = permissionNames.map(() => '?').join(', ');
      await db.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id)
         SELECT ?, id FROM permissions WHERE name IN (${placeholders})`,
        [roleId, ...permissionNames]
      );
      console.log(`+ ${roleName}：${permissionNames.length} 项权限`);
    }

    // 5. 用户表部门索引
    if (await indexExists('users', 'idx_users_department')) {
      console.log('- users.idx_users_department 已存在，跳过');
    } else {
      await db.query('ALTER TABLE users ADD INDEX idx_users_department (department_id)');
      console.log('+ users.idx_users_department 添加成功');
    }

    // 校验输出
    const [deptCols] = await db.query('SHOW COLUMNS FROM departments');
    const [roleRows] = await db.query('SELECT name, display_name FROM roles ORDER BY id');
    console.log('\n部门表字段:', deptCols.map((c) => c.Field).join(', '));
    console.log('角色列表:', roleRows.map((r) => `${r.name}(${r.display_name})`).join(', '));
    console.log('\n✅ 部门权限迁移完成');
    process.exit(0);
  } catch (err) {
    console.error('❌ 部门权限迁移失败:', err.message);
    process.exit(1);
  }
}

migrate();
