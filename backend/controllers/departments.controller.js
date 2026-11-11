const db = require('../config/db');

// 部门列表（所有登录用户可读，用于用户表单下拉）
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.name, d.parent_id, d.sort_order, d.manager_id, d.description, d.status,
              d.created_at, m.real_name AS manager_name, m.username AS manager_username,
              (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) AS user_count
       FROM departments d
       LEFT JOIN users m ON d.manager_id = m.id
       ORDER BY d.sort_order, d.id`
    );
    res.status(200).json({ code: 200, message: '获取部门列表成功', data: rows });
  } catch (error) {
    console.error('获取部门列表失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, parent_id, sort_order, manager_id, description, status } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ code: 400, message: '部门名称不能为空' });
    }

    const [existing] = await db.query(
      'SELECT id FROM departments WHERE name = ? AND IFNULL(parent_id, 0) = IFNULL(?, 0)',
      [String(name).trim(), parent_id || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ code: 409, message: '同一上级下已存在同名部门' });
    }

    if (parent_id) {
      const [parent] = await db.query('SELECT id FROM departments WHERE id = ?', [parent_id]);
      if (parent.length === 0) {
        return res.status(400).json({ code: 400, message: '上级部门不存在' });
      }
    }

    if (manager_id) {
      const [manager] = await db.query('SELECT id FROM users WHERE id = ?', [manager_id]);
      if (manager.length === 0) {
        return res.status(400).json({ code: 400, message: '部门管理员不存在' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO departments (name, parent_id, sort_order, manager_id, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        parent_id || null,
        Number(sort_order) || 0,
        manager_id || null,
        description || null,
        status === 0 ? 0 : 1
      ]
    );

    res.status(201).json({
      code: 200,
      message: '部门创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建部门失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, sort_order, manager_id, description, status } = req.body;

    const [existing] = await db.query('SELECT id, parent_id FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '部门不存在' });
    }

    const updateFields = [];
    const updateParams = [];
    const effectiveParent = parent_id !== undefined ? (parent_id || null) : existing[0].parent_id;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ code: 400, message: '部门名称不能为空' });
      }
      const [dup] = await db.query(
        'SELECT id FROM departments WHERE name = ? AND id != ? AND IFNULL(parent_id, 0) = IFNULL(?, 0)',
        [String(name).trim(), id, effectiveParent]
      );
      if (dup.length > 0) {
        return res.status(409).json({ code: 409, message: '同一上级下已存在同名部门' });
      }
      updateFields.push('name = ?');
      updateParams.push(String(name).trim());
    }

    if (parent_id !== undefined) {
      // 不能把自己设为自己的上级，避免层级成环
      if (Number(parent_id) === Number(id)) {
        return res.status(400).json({ code: 400, message: '上级部门不能是当前部门' });
      }
      if (parent_id) {
        const [parent] = await db.query('SELECT id FROM departments WHERE id = ?', [parent_id]);
        if (parent.length === 0) {
          return res.status(400).json({ code: 400, message: '上级部门不存在' });
        }
      }
      updateFields.push('parent_id = ?');
      updateParams.push(parent_id || null);
    }

    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      updateParams.push(Number(sort_order) || 0);
    }

    if (manager_id !== undefined) {
      if (manager_id) {
        const [manager] = await db.query('SELECT id FROM users WHERE id = ?', [manager_id]);
        if (manager.length === 0) {
          return res.status(400).json({ code: 400, message: '部门管理员不存在' });
        }
      }
      updateFields.push('manager_id = ?');
      updateParams.push(manager_id || null);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description || null);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status === 0 ? 0 : 1);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有需要更新的字段' });
    }

    updateParams.push(id);
    await db.query(`UPDATE departments SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);

    res.status(200).json({ code: 200, message: '部门更新成功' });
  } catch (error) {
    console.error('更新部门失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT id FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ code: 404, message: '部门不存在' });
    }

    const [[{ userCount }]] = await db.query(
      'SELECT COUNT(*) AS userCount FROM users WHERE department_id = ?',
      [id]
    );
    if (userCount > 0) {
      return res.status(400).json({ code: 400, message: `该部门下还有 ${userCount} 名用户，无法删除` });
    }

    const [[{ childCount }]] = await db.query(
      'SELECT COUNT(*) AS childCount FROM departments WHERE parent_id = ?',
      [id]
    );
    if (childCount > 0) {
      return res.status(400).json({ code: 400, message: `该部门下还有 ${childCount} 个子部门，无法删除` });
    }

    await db.query('DELETE FROM departments WHERE id = ?', [id]);
    res.status(200).json({ code: 200, message: '部门删除成功' });
  } catch (error) {
    console.error('删除部门失败：', error);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: error.message });
  }
};
