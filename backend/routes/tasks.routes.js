const express = require('express');
const router = express.Router();
const taskController = require('../controllers/tasks.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// 所有任务接口都需要登录鉴权
router.use(verifyToken);

// ===== 任务分类（看板列） =====
// 列表（所有人可见）
router.get('/categories', taskController.getCategories);
// 创建（仅 super_admin）
router.post('/categories', requireRole('super_admin'), taskController.createCategory);
// 更新（仅 super_admin）
router.put('/categories/:id', requireRole('super_admin'), taskController.updateCategory);
// 删除（仅 super_admin）
router.delete('/categories/:id', requireRole('super_admin'), taskController.deleteCategory);

// ===== 任务主表 =====
// 看板视图（按分类分组）
router.get('/kanban', taskController.getKanban);
// 表格视图（分页/筛选/排序）
router.get('/', taskController.getTasks);
// 任务详情
router.get('/:id', taskController.getTaskById);
// 子任务列表（同一父任务下的子任务）
router.get('/:id/subtasks', taskController.getSubtasks);
// 创建任务（含可选 parent_task_id 设为子任务）
router.post('/', taskController.createTask);
// 更新任务
router.put('/:id', taskController.updateTask);
// 删除任务（含子任务）
router.delete('/:id', taskController.deleteTask);

// ===== 协作人 =====
// 添加协作人
router.post('/:id/assignees', taskController.addAssignee);
// 移除协作人
router.delete('/:id/assignees/:userId', taskController.removeAssignee);

// ===== 操作日志 =====
router.get('/:id/activities', taskController.getActivities);

module.exports = router;