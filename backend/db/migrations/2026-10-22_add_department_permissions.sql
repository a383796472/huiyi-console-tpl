-- ============================================================
-- 部门权限与部门管理员角色
-- 日期: 2026-10-22
-- 说明:
--   1) departments 增加 负责人 / 描述 / 状态 三个字段
--   2) 新增 dept_admin（部门管理员）角色
--   3) 补齐订单、店铺数据、部门、任务、物流等模块的权限点
--   4) 配置 super_admin / admin / dept_admin / user 四个角色的权限
-- 注意:
--   本文件供手工执行或参考；实际迁移请运行
--   node scripts/migrate-department-permissions.js
--   （脚本会先检查列是否存在，可重复执行）
-- ============================================================

-- 1. 部门表扩展（仅首次执行；脚本中做了存在性检查）
ALTER TABLE `departments`
  ADD COLUMN `manager_id` INT DEFAULT NULL COMMENT '部门管理员用户ID',
  ADD COLUMN `description` VARCHAR(255) DEFAULT NULL COMMENT '部门描述',
  ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=启用, 0=停用';

-- 2. 新增部门管理员角色
INSERT IGNORE INTO `roles` (`name`, `display_name`, `description`, `is_system`)
VALUES ('dept_admin', '部门管理员', '管理本部门用户与业务数据', 1);

-- 3. 新增权限点
INSERT IGNORE INTO `permissions` (`name`, `display_name`, `group_name`) VALUES
  ('department:list',   '查看部门列表',   '部门管理'),
  ('department:create', '新增部门',       '部门管理'),
  ('department:edit',   '编辑部门',       '部门管理'),
  ('department:delete', '删除部门',       '部门管理'),
  ('order:list',        '查看订单列表',   '订单管理'),
  ('order:view',        '查看订单详情',   '订单管理'),
  ('order:export',      '导出订单',       '订单管理'),
  ('shopstats:view',    '查看店铺数据',   '店铺数据'),
  ('task:list',         '查看任务',       '任务管理'),
  ('task:edit',         '编辑任务',       '任务管理'),
  ('logistics:list',    '查看物流',       '物流管理'),
  ('logistics:edit',    '编辑物流',       '物流管理');

-- 4. 角色权限配置（INSERT IGNORE 保证可重复执行）

-- 4.1 超级管理员：全部权限
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT (SELECT id FROM `roles` WHERE `name` = 'super_admin'), `id` FROM `permissions`;

-- 4.2 管理员：全部业务权限 + 部门只读（不含部门增删改）
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT (SELECT id FROM `roles` WHERE `name` = 'admin'), `id` FROM `permissions`
WHERE `name` NOT IN ('department:create', 'department:edit', 'department:delete', 'user:role');

-- 4.3 部门管理员：本部门用户 + 本部门业务数据
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT (SELECT id FROM `roles` WHERE `name` = 'dept_admin'), `id` FROM `permissions`
WHERE `name` IN (
  'user:list', 'user:create', 'user:edit', 'user:status',
  'department:list',
  'product:list', 'product:create', 'product:edit', 'product:delete', 'product:view',
  'order:list', 'order:view', 'order:export',
  'shopstats:view',
  'task:list', 'task:edit',
  'logistics:list', 'logistics:edit'
);

-- 4.4 普通员工：只读业务数据
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT (SELECT id FROM `roles` WHERE `name` = 'user'), `id` FROM `permissions`
WHERE `name` IN ('product:list', 'product:view', 'order:list', 'order:view', 'shopstats:view', 'task:list');

-- 5. 常用索引
ALTER TABLE `users` ADD INDEX `idx_users_department` (`department_id`);
