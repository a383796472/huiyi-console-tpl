import request from '../utils/request'

// ===== 类型定义 =====

export interface TaskCategory {
  id: number
  name: string
  code_prefix: string
  color: string
  description?: string | null
  sort_order: number
  created_by?: number | null
  created_at: string
  updated_at: string
  task_count?: number
}

export interface Task {
  id: number
  code: string
  title: string
  description?: string | null
  category_id: number
  parent_task_id?: number | null
  status: 'pending' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: number | null
  assignee_name?: string | null
  assignee_username?: string | null
  creator_id: number
  creator_name?: string | null
  due_date?: string | null
  started_at?: string | null
  completed_at?: string | null
  sort_order: number
  category_name?: string
  category_color?: string
  subtask_count?: number
  subtask_done?: number
  created_at: string
  updated_at: string
  // 详情接口（getTaskById）额外返回
  assignees?: TaskAssignee[]
  subtasks?: Task[]
  activities?: TaskActivity[]
}

export interface TaskAssignee {
  user_id: number
  role: 'owner' | 'collaborator' | 'watcher'
  real_name?: string
  username?: string
  email?: string
  created_at: string
}

export interface TaskActivity {
  id: number
  action: string
  detail: any
  user_id?: number | null
  user_name?: string | null
  created_at: string
}

export interface CreateTaskParams {
  title: string
  description?: string
  category_id: number
  parent_task_id?: number | null
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: number | null
  due_date?: string | null
  collaborator_ids?: number[]
}

export interface UpdateTaskParams {
  title?: string
  description?: string
  category_id?: number
  status?: Task['status']
  priority?: Task['priority']
  assignee_id?: number | null
  due_date?: string | null
  sort_order?: number
}

// ===== 分类 =====

export const getCategories = () => request({ url: '/api/tasks/categories', method: 'GET' })

export const createCategory = (data: Partial<TaskCategory>) =>
  request({ url: '/api/tasks/categories', method: 'POST', data })

export const updateCategory = (id: number, data: Partial<TaskCategory>) =>
  request({ url: `/api/tasks/categories/${id}`, method: 'PUT', data })

export const deleteCategory = (id: number) =>
  request({ url: `/api/tasks/categories/${id}`, method: 'DELETE' })

// ===== 任务 =====

export const getKanban = (params?: { categoryId?: number; assigneeId?: number }) =>
  request({ url: '/api/tasks/kanban', method: 'GET', params })

export const getTasks = (params?: {
  page?: number
  pageSize?: number
  categoryId?: number
  status?: string
  priority?: string
  assigneeId?: number
  keyword?: string
  parentOnly?: boolean | string
}) => request({ url: '/api/tasks', method: 'GET', params })

export const getTaskById = (id: number) =>
  request({ url: `/api/tasks/${id}`, method: 'GET' })

export const getSubtasks = (id: number) =>
  request({ url: `/api/tasks/${id}/subtasks`, method: 'GET' })

export const createTask = (data: CreateTaskParams) =>
  request({ url: '/api/tasks', method: 'POST', data })

export const updateTask = (id: number, data: UpdateTaskParams) =>
  request({ url: `/api/tasks/${id}`, method: 'PUT', data })

export const deleteTask = (id: number) =>
  request({ url: `/api/tasks/${id}`, method: 'DELETE' })

// ===== 协作人 =====

export const addAssignee = (id: number, data: { user_id: number; role?: string }) =>
  request({ url: `/api/tasks/${id}/assignees`, method: 'POST', data })

export const removeAssignee = (id: number, userId: number) =>
  request({ url: `/api/tasks/${id}/assignees/${userId}`, method: 'DELETE' })

// ===== 操作日志 =====

export const getActivities = (id: number) =>
  request({ url: `/api/tasks/${id}/activities`, method: 'GET' })