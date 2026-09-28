-- ============================================================
-- 任务管理系统 数据库迁移
-- 日期: 2026-08-18
-- 数据库: console-backend
-- ============================================================

-- 1. 任务分类表（看板列）
CREATE TABLE IF NOT EXISTS `task_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称，如：研发-产品结构样',
  `code_prefix` VARCHAR(20) NOT NULL COMMENT '任务编号前缀，如 BCSJ',
  `color` VARCHAR(20) NOT NULL DEFAULT '#1989fa' COMMENT '标签颜色（Element Plus 颜色名）',
  `description` VARCHAR(500) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '列排序，从左到右',
  `created_by` INT DEFAULT NULL COMMENT '创建人 user.id',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort_order`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务分类（看板列）';

-- 2. 任务主表（支持父子 = 子任务）
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL COMMENT '自动生成的编号，如 BCSJ-27',
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT COMMENT '任务描述（支持 Markdown）',
  `category_id` INT NOT NULL COMMENT '所属分类',
  `parent_task_id` INT DEFAULT NULL COMMENT '父任务 id（子任务时填写，自引用）',
  `status` ENUM('pending','in_progress','blocked','done','cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态：pending=待开始 in_progress=进行中 blocked=已阻塞 done=已完成 cancelled=已取消',
  `priority` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium' COMMENT '优先级',
  `assignee_id` INT DEFAULT NULL COMMENT '主负责人 user.id',
  `creator_id` INT NOT NULL COMMENT '创建人 user.id',
  `due_date` DATE DEFAULT NULL COMMENT '截止日期',
  `started_at` DATETIME DEFAULT NULL COMMENT '首次进入 in_progress 的时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '同列内排序',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_category_status` (`category_id`, `status`),
  KEY `idx_parent` (`parent_task_id`),
  KEY `idx_assignee` (`assignee_id`),
  KEY `idx_creator` (`creator_id`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务主表';

-- 3. 任务协作人（多人多对多）
CREATE TABLE IF NOT EXISTS `task_assignees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('owner','collaborator','watcher') NOT NULL DEFAULT 'collaborator' COMMENT 'owner=主负责人 collaborator=协作人 watcher=关注人',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_user` (`task_id`, `user_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务协作人';

-- 4. 任务操作日志
CREATE TABLE IF NOT EXISTS `task_activities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL COMMENT 'created / assigned / status_changed / commented / updated / attached / subtask_added',
  `detail` JSON DEFAULT NULL COMMENT '操作详情，JSON 格式',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_created` (`task_id`, `created_at`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务操作日志';

-- ============================================================
-- 外键（独立执行，便于回滚）
-- ============================================================

-- 任务分类.创建人 -> users.id
ALTER TABLE `task_categories`
  ADD CONSTRAINT `fk_task_categories_creator`
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 任务.分类 -> task_categories.id
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_category`
  FOREIGN KEY (`category_id`) REFERENCES `task_categories` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 任务.父任务 -> tasks.id（自引用）
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_parent`
  FOREIGN KEY (`parent_task_id`) REFERENCES `tasks` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 任务.主负责人 -> users.id
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_assignee`
  FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 任务.创建人 -> users.id
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_creator`
  FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 任务协作人.任务 -> tasks.id
ALTER TABLE `task_assignees`
  ADD CONSTRAINT `fk_task_assignees_task`
  FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 任务协作人.用户 -> users.id
ALTER TABLE `task_assignees`
  ADD CONSTRAINT `fk_task_assignees_user`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 任务活动.任务 -> tasks.id
ALTER TABLE `task_activities`
  ADD CONSTRAINT `fk_task_activities_task`
  FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 任务活动.用户 -> users.id
ALTER TABLE `task_activities`
  ADD CONSTRAINT `fk_task_activities_user`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 初始数据：示例分类（老大可以后台调整）
-- ============================================================
INSERT INTO `task_categories` (`name`, `code_prefix`, `color`, `description`, `sort_order`, `created_by`) VALUES
  ('研发-产品结构样', 'YJCSJ', '#f56c6c', '研发部门-产品结构样品', 10, NULL),
  ('研发-基础卖点维护', 'YJMD', '#67c23a', '研发部门-基础卖点维护', 20, NULL),
  ('产研-说明书内容审', 'CRSMS', '#e6a23c', '产研部门-说明书内容审核', 30, NULL),
  ('品牌-产品卖点讨', 'PPMDT', '#909399', '品牌部门-产品卖点讨论', 40, NULL),
  ('产研-包材结构BO', 'CRBCJG', '#1989fa', '产研部门-包材结构 BO', 50, NULL),
  ('品牌-彩盒设计', 'PPCX', '#9b59b6', '品牌部门-彩盒设计', 60, NULL);