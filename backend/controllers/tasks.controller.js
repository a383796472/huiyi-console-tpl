const db = require('../config/db');

/**
 * 工具：记录任务操作日志
 */
async function logActivity(taskId, userId, action, detail = null) {
  try {
    await db.query(
      'INSERT INTO task_activities (task_id, user_id, action, detail) VALUES (?, ?, ?, ?)',
      [taskId, userId, action, detail ? JSON.stringify(detail) : null]
    );
  } catch (err) {
    console.error('[tasks] logActivity 失败：', err.message);
  }
}

/**
 * 工具：生成下一个任务编号（按分类前缀 + 自增序号）
 * 例：分类前缀 BCSJ，已存在 BCSJ-1/BCSJ-2，下一个是 BCSJ-3
 */
async function generateNextTaskCode(prefix) {
  const likePattern = `${prefix}-%`;
  const [rows] = await db.query(
    `SELECT code FROM tasks WHERE code LIKE ? ORDER BY LENGTH(code) DESC, code DESC LIMIT 1`,
    [likePattern]
  );
  let nextNum = 1;
  if (rows.length > 0) {
    const m = rows[0].code.match(/-(\d+)$/);
    if (m) nextNum = parseInt(m[1], 10) + 1;
  }
  return `${prefix}-${nextNum}`;
}

// ============================================================
// 任务分类
// ============================================================

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, COUNT(t.id) AS task_count
       FROM task_categories c
       LEFT JOIN tasks t ON t.category_id = c.id AND t.parent_task_id IS NULL
       GROUP BY c.id
       ORDER BY c.sort_order, c.id`
    );
    res.status(200).json({ code: 200, message: '获取分类列表成功', data: rows });
  } catch (error) {
    console.error('获取分类列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, code_prefix, color = '#1989fa', description = null, sort_order = 0 } = req.body;

    if (!name || !code_prefix) {
      return res.status(400).json({ code: 400, message: '分类名称和编号前缀不能为空' });
    }

    const [result] = await db.query(
      `INSERT INTO task_categories (name, code_prefix, color, description, sort_order, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, code_prefix, color, description, sort_order, req.user.id]
    );

    res.status(201).json({
      code: 201,
      message: '分类创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建分类失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code_prefix, color, description, sort_order } = req.body;

    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (code_prefix !== undefined) { fields.push('code_prefix = ?'); params.push(code_prefix); }
    if (color !== undefined) { fields.push('color = ?'); params.push(color); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order); }

    if (fields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE task_categories SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '分类不存在' });
    }

    res.status(200).json({ code: 200, message: '分类更新成功' });
  } catch (error) {
    console.error('更新分类失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查是否还有任务
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM tasks WHERE category_id = ?',
      [id]
    );
    if (count > 0) {
      return res.status(400).json({
        code: 400,
        message: `该分类下还有 ${count} 个任务，无法删除。请先迁移或删除任务。`
      });
    }

    const [result] = await db.query('DELETE FROM task_categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '分类不存在' });
    }

    res.status(200).json({ code: 200, message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

// ============================================================
// 任务主表
// ============================================================

exports.getKanban = async (req, res) => {
  try {
    const { categoryId, assigneeId } = req.query;
    const where = ['t.parent_task_id IS NULL'];
    const params = [];

    if (categoryId) {
      where.push('t.category_id = ?');
      params.push(categoryId);
    }
    if (assigneeId) {
      where.push('t.assignee_id = ?');
      params.push(assigneeId);
    }
    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    // 一次查所有顶层任务
    const [tasks] = await db.query(
      `SELECT t.id, t.code, t.title, t.description, t.category_id, t.status, t.priority,
              t.assignee_id, t.creator_id, t.due_date, t.created_at, t.updated_at,
              u.real_name AS assignee_name, u.username AS assignee_username,
              creator.real_name AS creator_name,
              c.name AS category_name, c.color AS category_color
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users creator ON t.creator_id = creator.id
       LEFT JOIN task_categories c ON t.category_id = c.id
       ${whereSql}
       ORDER BY t.sort_order, t.created_at DESC`,
      params
    );

    // 一次查所有子任务计数（每个顶层任务的 subtask_count + done_count）
    const taskIds = tasks.map(t => t.id);
    let subtaskMap = {};
    if (taskIds.length > 0) {
      const [subtasks] = await db.query(
        `SELECT parent_task_id,
                COUNT(*) AS subtask_count,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done_count
         FROM tasks WHERE parent_task_id IN (?) GROUP BY parent_task_id`,
        [taskIds]
      );
      subtaskMap = subtasks.reduce((acc, row) => {
        acc[row.parent_task_id] = {
          total: parseInt(row.subtask_count, 10),
          done: parseInt(row.done_count || 0, 10)
        };
        return acc;
      }, {});
    }

    // 拼装结果
    const enriched = tasks.map(t => ({
      ...t,
      subtask_count: subtaskMap[t.id]?.total || 0,
      subtask_done: subtaskMap[t.id]?.done || 0
    }));

    // 按分类分组
    const [categories] = await db.query(
      'SELECT id, name, color, sort_order FROM task_categories ORDER BY sort_order, id'
    );

    const grouped = categories.map(cat => ({
      category: cat,
      tasks: enriched.filter(t => t.category_id === cat.id)
    }));

    res.status(200).json({
      code: 200,
      message: '获取看板视图成功',
      data: grouped
    });
  } catch (error) {
    console.error('获取看板视图失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
    const offset = (page - 1) * pageSize;
    const { categoryId, status, priority, assigneeId, keyword, parentOnly } = req.query;

    const conditions = [];
    const params = [];

    if (parentOnly === 'true' || parentOnly === '1') {
      conditions.push('t.parent_task_id IS NULL');
    }
    if (categoryId) { conditions.push('t.category_id = ?'); params.push(categoryId); }
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
    if (assigneeId) { conditions.push('t.assignee_id = ?'); params.push(assigneeId); }
    if (keyword) {
      conditions.push('(t.title LIKE ? OR t.code LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM tasks t ${whereSql}`,
      params
    );

    const [rows] = await db.query(
      `SELECT t.id, t.code, t.title, t.category_id, t.parent_task_id, t.status, t.priority,
              t.assignee_id, t.creator_id, t.due_date, t.created_at, t.updated_at,
              u.real_name AS assignee_name,
              c.name AS category_name, c.color AS category_color
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN task_categories c ON t.category_id = c.id
       ${whereSql}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.status(200).json({
      code: 200,
      message: '获取任务列表成功',
      data: { list: rows, total, page, pageSize }
    });
  } catch (error) {
    console.error('获取任务列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const [taskRows] = await db.query(
      `SELECT t.*,
              u.real_name AS assignee_name, u.username AS assignee_username,
              creator.real_name AS creator_name,
              c.name AS category_name, c.color AS category_color
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users creator ON t.creator_id = creator.id
       LEFT JOIN task_categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    // 协作人
    const [assignees] = await db.query(
      `SELECT ta.user_id, ta.role, ta.created_at, u.real_name, u.username, u.email
       FROM task_assignees ta
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = ?`,
      [id]
    );

    // 子任务
    const [subtasks] = await db.query(
      `SELECT t.id, t.code, t.title, t.status, t.priority, t.assignee_id,
              u.real_name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.parent_task_id = ?
       ORDER BY t.created_at ASC`,
      [id]
    );

    // 操作日志（最近 50 条）
    const [activities] = await db.query(
      `SELECT a.id, a.action, a.detail, a.created_at, a.user_id, u.real_name AS user_name
       FROM task_activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.task_id = ?
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [id]
    );

    res.status(200).json({
      code: 200,
      message: '获取任务详情成功',
      data: {
        ...taskRows[0],
        assignees,
        subtasks,
        activities
      }
    });
  } catch (error) {
    console.error('获取任务详情失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.getSubtasks = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT t.id, t.code, t.title, t.status, t.priority, t.due_date, t.created_at,
              t.assignee_id, u.real_name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.parent_task_id = ?
       ORDER BY t.created_at ASC`,
      [id]
    );
    res.status(200).json({ code: 200, message: '获取子任务成功', data: rows });
  } catch (error) {
    console.error('获取子任务失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const {
      title, description = null, category_id, parent_task_id = null,
      priority = 'medium', assignee_id = null, due_date = null,
      collaborator_ids = [] // 协作者 id 数组
    } = req.body;

    if (!title || !category_id) {
      return res.status(400).json({ code: 400, message: '标题和分类不能为空' });
    }

    // 校验分类
    const [[cat]] = await db.query(
      'SELECT id, code_prefix FROM task_categories WHERE id = ?',
      [category_id]
    );
    if (!cat) {
      return res.status(400).json({ code: 400, message: '分类不存在' });
    }

    // 校验父任务（如果有）
    if (parent_task_id) {
      const [[parent]] = await db.query(
        'SELECT id, parent_task_id FROM tasks WHERE id = ?',
        [parent_task_id]
      );
      if (!parent) {
        return res.status(400).json({ code: 400, message: '父任务不存在' });
      }
      if (parent.parent_task_id) {
        return res.status(400).json({ code: 400, message: '不支持多层嵌套（子任务不能再有子任务）' });
      }
    }

    // 生成任务编号
    let code;
    let attempts = 0;
    while (attempts < 5) {
      code = await generateNextTaskCode(cat.code_prefix);
      try {
        await db.query(
          `INSERT INTO tasks (code, title, description, category_id, parent_task_id, status, priority, assignee_id, creator_id, due_date)
           VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
          [code, title, description, category_id, parent_task_id, priority, assignee_id, req.user.id, due_date]
        );
        break;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          attempts++;
          if (attempts >= 5) throw new Error('任务编号生成冲突，请重试');
          continue;
        }
        throw err;
      }
    }

    const [taskRow] = await db.query('SELECT id, code, title FROM tasks WHERE code = ?', [code]);
    const taskId = taskRow[0].id;

    // 写入协作人
    if (assignee_id) {
      await db.query(
        `INSERT IGNORE INTO task_assignees (task_id, user_id, role) VALUES (?, ?, 'owner')`,
        [taskId, assignee_id]
      );
    }
    for (const uid of collaborator_ids) {
      if (uid !== assignee_id) {
        await db.query(
          `INSERT IGNORE INTO task_assignees (task_id, user_id, role) VALUES (?, ?, 'collaborator')`,
          [taskId, uid]
        );
      }
    }

    // 操作日志
    await logActivity(taskId, req.user.id, 'created', { title });
    if (assignee_id) {
      await logActivity(taskId, req.user.id, 'assigned', { assignee_id });
    }

    res.status(201).json({
      code: 201,
      message: '任务创建成功',
      data: { id: taskId, code }
    });
  } catch (error) {
    console.error('创建任务失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, status, priority, assignee_id, due_date, sort_order } = req.body;

    // 读取当前任务
    const [[current]] = await db.query(
      `SELECT t.* FROM tasks t WHERE t.id = ?`,
      [id]
    );
    if (!current) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }

    const fields = [];
    const params = [];
    const changes = {};

    if (title !== undefined) { fields.push('title = ?'); params.push(title); changes.title = title; }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (category_id !== undefined) { fields.push('category_id = ?'); params.push(category_id); changes.category_id = category_id; }
    if (status !== undefined && status !== current.status) {
      fields.push('status = ?');
      params.push(status);
      changes.status = { from: current.status, to: status };

      // 状态联动时间戳
      if (status === 'in_progress' && !current.started_at) {
        fields.push('started_at = NOW()');
      }
      if (status === 'done' && !current.completed_at) {
        fields.push('completed_at = NOW()');
      }
    }
    if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); changes.priority = priority; }
    if (assignee_id !== undefined && assignee_id !== current.assignee_id) {
      fields.push('assignee_id = ?');
      params.push(assignee_id);
      changes.assignee_id = { from: current.assignee_id, to: assignee_id };
    }
    if (due_date !== undefined) { fields.push('due_date = ?'); params.push(due_date); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); params.push(sort_order); }

    if (fields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    await db.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);

    // 写日志
    if (changes.status) {
      await logActivity(id, req.user.id, 'status_changed', changes.status);
    }
    if (changes.assignee_id) {
      await logActivity(id, req.user.id, 'assigned', changes.assignee_id);
      // 同步协作人表
      if (changes.assignee_id.to) {
        await db.query(
          `INSERT IGNORE INTO task_assignees (task_id, user_id, role) VALUES (?, ?, 'owner')`,
          [id, changes.assignee_id.to]
        );
      }
    }
    if (Object.keys(changes).length > 0 && !changes.status && !changes.assignee_id) {
      await logActivity(id, req.user.id, 'updated', changes);
    }

    res.status(200).json({ code: 200, message: '任务更新成功' });
  } catch (error) {
    console.error('更新任务失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }
    res.status(200).json({ code: 200, message: '任务删除成功' });
  } catch (error) {
    console.error('删除任务失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

// ============================================================
// 协作人
// ============================================================

exports.addAssignee = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'collaborator' } = req.body;

    if (!user_id) {
      return res.status(400).json({ code: 400, message: '用户 id 不能为空' });
    }

    await db.query(
      `INSERT IGNORE INTO task_assignees (task_id, user_id, role) VALUES (?, ?, ?)`,
      [id, user_id, role]
    );

    await logActivity(id, req.user.id, 'assigned', { user_id, role });

    res.status(201).json({ code: 201, message: '协作人添加成功' });
  } catch (error) {
    console.error('添加协作人失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.removeAssignee = async (req, res) => {
  try {
    const { id, userId } = req.params;
    await db.query(
      'DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?',
      [id, userId]
    );
    res.status(200).json({ code: 200, message: '协作人移除成功' });
  } catch (error) {
    console.error('移除协作人失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

// ============================================================
// 操作日志
// ============================================================

exports.getActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT a.id, a.action, a.detail, a.created_at, a.user_id, u.real_name AS user_name
       FROM task_activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.task_id = ?
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [id]
    );
    res.status(200).json({ code: 200, message: '获取活动日志成功', data: rows });
  } catch (error) {
    console.error('获取活动日志失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};