/**
 * 任务管理系统 - 数据库迁移脚本
 * 用法：node scripts/migrate-tasks.js
 */
const db = require('../config/db');

const SQL_STATEMENTS = [
  // 1. 任务分类表
  `CREATE TABLE IF NOT EXISTS task_categories (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '分类名称，如：研发-产品结构样',
    code_prefix VARCHAR(20) NOT NULL COMMENT '任务编号前缀，如 BCSJ',
    color VARCHAR(20) NOT NULL DEFAULT '#1989fa' COMMENT '标签颜色',
    description VARCHAR(500) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0 COMMENT '列排序',
    created_by INT DEFAULT NULL COMMENT '创建人 user.id',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sort (sort_order),
    KEY idx_created_by (created_by)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务分类（看板列）'`,

  // 2. 任务主表
  `CREATE TABLE IF NOT EXISTS tasks (
    id INT NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL COMMENT '自动生成的编号，如 BCSJ-27',
    title VARCHAR(200) NOT NULL,
    description TEXT COMMENT '任务描述',
    category_id INT NOT NULL COMMENT '所属分类',
    parent_task_id INT DEFAULT NULL COMMENT '父任务 id（子任务时填写）',
    status ENUM('pending','in_progress','blocked','done','cancelled') NOT NULL DEFAULT 'pending',
    priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    assignee_id INT DEFAULT NULL COMMENT '主负责人 user.id',
    creator_id INT NOT NULL COMMENT '创建人 user.id',
    due_date DATE DEFAULT NULL COMMENT '截止日期',
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code),
    KEY idx_category_status (category_id, status),
    KEY idx_parent (parent_task_id),
    KEY idx_assignee (assignee_id),
    KEY idx_creator (creator_id),
    KEY idx_due_date (due_date),
    KEY idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务主表'`,

  // 3. 任务协作人
  `CREATE TABLE IF NOT EXISTS task_assignees (
    id INT NOT NULL AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner','collaborator','watcher') NOT NULL DEFAULT 'collaborator',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_task_user (task_id, user_id),
    KEY idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务协作人'`,

  // 4. 任务操作日志
  `CREATE TABLE IF NOT EXISTS task_activities (
    id INT NOT NULL AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'created / assigned / status_changed / commented / updated / attached / subtask_added',
    detail JSON DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_task_created (task_id, created_at),
    KEY idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务操作日志'`
];

// 外键语句：每个独立 try，加 FK 失败不会影响表创建
const FK_STATEMENTS = [
  { sql: `ALTER TABLE task_categories ADD CONSTRAINT fk_task_categories_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE`, desc: 'task_categories.created_by -> users.id' },
  { sql: `ALTER TABLE tasks ADD CONSTRAINT fk_tasks_category FOREIGN KEY (category_id) REFERENCES task_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE`, desc: 'tasks.category_id -> task_categories.id' },
  { sql: `ALTER TABLE tasks ADD CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_task_id) REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE`, desc: 'tasks.parent_task_id -> tasks.id（自引用）' },
  { sql: `ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE`, desc: 'tasks.assignee_id -> users.id' },
  { sql: `ALTER TABLE tasks ADD CONSTRAINT fk_tasks_creator FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE`, desc: 'tasks.creator_id -> users.id' },
  { sql: `ALTER TABLE task_assignees ADD CONSTRAINT fk_task_assignees_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE`, desc: 'task_assignees.task_id -> tasks.id' },
  { sql: `ALTER TABLE task_assignees ADD CONSTRAINT fk_task_assignees_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE`, desc: 'task_assignees.user_id -> users.id' },
  { sql: `ALTER TABLE task_activities ADD CONSTRAINT fk_task_activities_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE ON UPDATE CASCADE`, desc: 'task_activities.task_id -> tasks.id' },
  { sql: `ALTER TABLE task_activities ADD CONSTRAINT fk_task_activities_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE`, desc: 'task_activities.user_id -> users.id' }
];

// 不再预置默认分类，由用户在系统里自行创建
const SEED_CATEGORIES = [];

async function migrate() {
  try {
    console.log('🚀 开始迁移任务管理表...\n');

    // 1. 建表
    for (let i = 0; i < SQL_STATEMENTS.length; i++) {
      const sql = SQL_STATEMENTS[i];
      console.log(`[${i + 1}/${SQL_STATEMENTS.length}] 建表...`);
      await db.query(sql);
    }
    console.log('✅ 4 张表创建完成\n');

    // 2. 加 FK（FK 加失败不影响主流程，记录警告）
    console.log('🔗 添加外键约束...');
    let fkOk = 0, fkSkip = 0;
    for (const fk of FK_STATEMENTS) {
      try {
        await db.query(fk.sql);
        console.log(`  ✅ ${fk.desc}`);
        fkOk++;
      } catch (err) {
        // 已存在的话跳过
        if (err.code === 'ER_FK_DUP_NAME' || err.code === 'ER_DUP_KEY') {
          console.log(`  ⏭️  ${fk.desc}（已存在，跳过）`);
          fkSkip++;
        } else {
          console.log(`  ⚠️  ${fk.desc} - ${err.message}`);
        }
      }
    }
    console.log(`外键完成：${fkOk} 新增 / ${fkSkip} 跳过\n`);

    // 3. 初始分类
    console.log('🌱 写入初始分类...');
    const [existing] = await db.query('SELECT COUNT(*) AS n FROM task_categories');
    if (existing[0].n === 0) {
      for (const c of SEED_CATEGORIES) {
        await db.query(
          'INSERT INTO task_categories (name, code_prefix, color, description, sort_order) VALUES (?, ?, ?, ?, ?)',
          [c.name, c.code_prefix, c.color, c.description, c.sort_order]
        );
      }
      console.log(`✅ 已写入 ${SEED_CATEGORIES.length} 个初始分类\n`);
    } else {
      console.log(`⏭️  task_categories 已有 ${existing[0].n} 条数据，跳过初始数据\n`);
    }

    console.log('🎉 任务管理表迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败：', error);
    process.exit(1);
  }
}

migrate();