<template>
  <div class="tasks-page">
    <!-- 顶部工具栏 -->
    <div class="tasks-toolbar">
      <div class="toolbar-left">
        <el-radio-group v-model="viewMode" size="default">
          <el-radio-button value="kanban">看板</el-radio-button>
          <el-radio-button value="list">列表</el-radio-button>
        </el-radio-group>

        <el-select
          v-model="filterCategoryId"
          placeholder="全部分类"
          clearable
          style="width: 160px"
          @change="refresh"
        >
          <el-option v-for="c in categories" :key="c.id" :value="c.id" :label="c.name" />
        </el-select>

        <el-select
          v-model="filterAssigneeId"
          placeholder="全部负责人"
          clearable
          filterable
          style="width: 160px"
          @change="refresh"
        >
          <el-option v-for="u in users" :key="u.id" :value="u.id" :label="u.real_name || u.username" />
        </el-select>

        <el-input
          v-if="viewMode === 'list'"
          v-model="keyword"
          placeholder="搜索标题/编号"
          clearable
          style="width: 220px"
          @keyup.enter="refresh"
          @clear="refresh"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <div class="toolbar-right">
        <el-button v-if="isSuperAdmin" @click="categoryDialogVisible = true">
          <el-icon style="margin-right: 4px"><Setting /></el-icon>分类管理
        </el-button>
        <el-button type="primary" @click="openCreate">
          <el-icon style="margin-right: 4px"><Plus /></el-icon>新建任务
        </el-button>
      </div>
    </div>

    <!-- 看板视图 -->
    <div v-if="viewMode === 'kanban'" v-loading="loading" class="kanban-container">
      <div v-if="kanbanData.length === 0 && !loading" class="kanban-empty">
        <el-empty description="暂无分类，请先由超级管理员创建分类">
          <el-button v-if="isSuperAdmin" type="primary" @click="categoryDialogVisible = true">去创建分类</el-button>
        </el-empty>
      </div>

      <div v-else class="kanban-board">
        <div
          v-for="col in kanbanData"
          :key="col.category.id"
          class="kanban-column"
          :class="{ 'drag-over': dragOverCategoryId === col.category.id }"
          @dragover.prevent="dragOverCategoryId = col.category.id"
          @dragleave="dragOverCategoryId === col.category.id && (dragOverCategoryId = null)"
          @drop="handleDrop(col.category.id)"
        >
          <div class="column-header">
            <span class="column-color" :style="{ background: col.category.color }"></span>
            <span class="column-title">{{ col.category.name }}</span>
            <span class="column-count">{{ col.tasks.length }}</span>
          </div>

          <div class="column-body">
            <div
              v-for="task in col.tasks"
              :key="task.id"
              class="card-wrapper"
              draggable="true"
              @dragstart="onDragStart(task)"
              @dragend="dragOverCategoryId = null"
            >
              <TaskCard :task="task" @click="openDetail" />
            </div>
            <div v-if="col.tasks.length === 0" class="column-empty">暂无任务</div>
          </div>

          <div class="column-footer" @click="openCreate(col.category.id)">
            <el-icon><Plus /></el-icon>
            <span>添加任务</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-container">
      <el-table :data="taskList" v-loading="loading" stripe>
        <el-table-column label="编号" prop="code" width="120">
          <template #default="{ row }">
            <span class="table-code">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column label="任务标题" prop="title" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="openDetail(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="110">
          <template #default="{ row }">
            <el-tag :color="row.category_color" effect="dark" size="small" style="border: none">
              {{ row.category_name || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.tag || 'info'" size="small" effect="light">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            {{ priorityMap[row.priority]?.label || row.priority }}
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="100">
          <template #default="{ row }">{{ row.assignee_name || '未指派' }}</template>
        </el-table-column>
        <el-table-column label="截止日期" width="110">
          <template #default="{ row }">
            <span :class="{ 'overdue-text': isOverdue(row.due_date) && row.status !== 'done' }">
              {{ row.due_date || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="110">
          <template #default="{ row }">{{ (row.created_at || '').slice(0, 10) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchList"
          @size-change="fetchList"
        />
      </div>
    </div>

    <!-- 新建/编辑任务弹窗 -->
    <TaskFormDialog
      v-model="formDialogVisible"
      :categories="categories"
      :task="editingTask"
      :default-category-id="defaultCategoryId"
      @success="refresh"
    />

    <!-- 任务详情抽屉 -->
    <TaskDetailDrawer
      v-model="detailDrawerVisible"
      :task="detailTask"
      @edit="openEdit"
      @deleted="onDetailDeleted"
      @updated="onDetailUpdated"
    />

    <!-- 分类管理弹窗 -->
    <CategoryManageDialog
      v-model="categoryDialogVisible"
      :categories="categories"
      @refresh="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Setting } from '@element-plus/icons-vue'
import TaskCard from './components/TaskCard.vue'
import TaskFormDialog from './components/TaskFormDialog.vue'
import TaskDetailDrawer from './components/TaskDetailDrawer.vue'
import CategoryManageDialog from './components/CategoryManageDialog.vue'
import {
  getCategories,
  getKanban,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  type Task,
  type TaskCategory
} from '../../api/task'
import { getUsers } from '../../api/user'

// ===== 基础状态 =====
const loading = ref(false)
const viewMode = ref<'kanban' | 'list'>('kanban')
const categories = ref<TaskCategory[]>([])
const users = ref<Array<{ id: number; username: string; real_name: string }>>([])

const filterCategoryId = ref<number | undefined>(undefined)
const filterAssigneeId = ref<number | undefined>(undefined)
const keyword = ref('')

const isSuperAdmin = ref(false)

// ===== 看板状态 =====
const kanbanData = ref<Array<{ category: TaskCategory; tasks: Task[] }>>([])
const draggingTask = ref<Task | null>(null)
const dragOverCategoryId = ref<number | null>(null)

// ===== 列表状态 =====
const taskList = ref<Task[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// ===== 弹窗状态 =====
const formDialogVisible = ref(false)
const editingTask = ref<Task | null>(null)
const defaultCategoryId = ref<number | undefined>(undefined)
const detailDrawerVisible = ref(false)
const detailTask = ref<Task | null>(null)
const categoryDialogVisible = ref(false)

const statusMap: Record<string, { label: string; tag: any }> = {
  pending: { label: '待开始', tag: 'info' },
  in_progress: { label: '进行中', tag: 'primary' },
  blocked: { label: '已阻塞', tag: 'warning' },
  done: { label: '已完成', tag: 'success' },
  cancelled: { label: '已取消', tag: 'danger' }
}

const priorityMap: Record<string, { label: string }> = {
  low: { label: '低' },
  medium: { label: '中' },
  high: { label: '高' },
  urgent: { label: '紧急' }
}

function isOverdue(d?: string | null) {
  if (!d) return false
  return new Date(d) < new Date(new Date().toISOString().slice(0, 10))
}

// ===== 数据加载 =====
async function fetchCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data?.data || []
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

async function fetchUsers() {
  try {
    const res = await getUsers({ page: 1, pageSize: 1000 })
    users.value = res.data?.data?.list || []
  } catch (e) {
    console.error('加载用户失败', e)
  }
}

async function fetchKanban() {
  loading.value = true
  try {
    const res = await getKanban({
      categoryId: filterCategoryId.value,
      assigneeId: filterAssigneeId.value
    })
    let data = res.data?.data || []
    // 前端再按筛选分类过滤一次（后端 kanban 只支持任务级过滤）
    if (filterCategoryId.value) {
      data = data.filter((col: any) => col.category.id === filterCategoryId.value)
    }
    kanbanData.value = data
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载看板失败')
  } finally {
    loading.value = false
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getTasks({
      page: page.value,
      pageSize: pageSize.value,
      categoryId: filterCategoryId.value,
      assigneeId: filterAssigneeId.value,
      keyword: keyword.value || undefined
    })
    taskList.value = res.data?.data?.list || []
    total.value = res.data?.data?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载任务列表失败')
  } finally {
    loading.value = false
  }
}

function refresh() {
  fetchCategories()
  if (viewMode.value === 'kanban') {
    fetchKanban()
  } else {
    fetchList()
  }
}

// ===== 拖拽换分类 =====
function onDragStart(task: Task) {
  draggingTask.value = task
}

async function handleDrop(targetCategoryId: number) {
  const task = draggingTask.value
  dragOverCategoryId.value = null
  draggingTask.value = null
  if (!task || task.category_id === targetCategoryId) return
  try {
    await updateTask(task.id, { category_id: targetCategoryId })
    ElMessage.success(`已移动到「${categories.value.find(c => c.id === targetCategoryId)?.name || ''}」`)
    fetchKanban()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '移动失败')
  }
}

// ===== 弹窗操作 =====
function openCreate(categoryId?: number) {
  editingTask.value = null
  defaultCategoryId.value = categoryId ?? undefined
  formDialogVisible.value = true
}

function openEdit(task: Task) {
  editingTask.value = task
  formDialogVisible.value = true
}

async function openDetail(task: Task) {
  try {
    const res = await getTaskById(task.id)
    detailTask.value = res.data?.data || task
    detailDrawerVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载任务详情失败')
  }
}

function onDetailDeleted() {
  refresh()
}

function onDetailUpdated(updatedTask?: Task) {
  if (updatedTask) {
    detailTask.value = updatedTask
  }
  refresh()
}

async function confirmDelete(row: Task) {
  try {
    await ElMessageBox.confirm(
      `确定删除任务「${row.title}」吗？子任务也会被删除。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
    )
    await deleteTask(row.id)
    ElMessage.success('任务已删除')
    refresh()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err?.response?.data?.message || '删除失败')
    }
  }
}

// ===== 初始化 =====
onMounted(() => {
  try {
    const raw = localStorage.getItem('userInfo')
    const info = raw ? JSON.parse(raw) : null
    isSuperAdmin.value = info?.role === 'super_admin'
  } catch {
    isSuperAdmin.value = false
  }
  fetchCategories()
  fetchUsers()
  fetchKanban()
})
</script>

<style scoped>
.tasks-page {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

/* ===== 工具栏 ===== */
.tasks-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== 看板 ===== */
.kanban-container {
  flex: 1;
  overflow-x: auto;
  padding-bottom: 8px;
}
.kanban-empty {
  padding: 60px 0;
}
.kanban-board {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-height: 400px;
}
.kanban-column {
  width: 300px;
  min-width: 300px;
  background: #f4f6fa;
  border-radius: 10px;
  border: 1px solid #e8ecf3;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 260px);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.kanban-column.drag-over {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}
.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px 8px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}
.column-color {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.column-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.column-count {
  background: #e2e8f0;
  color: #64748b;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 500;
}
.column-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px;
  min-height: 60px;
}
.column-empty {
  text-align: center;
  color: #b6bdc9;
  font-size: 12px;
  padding: 18px 0;
}
.card-wrapper {
  cursor: grab;
}
.card-wrapper:active {
  cursor: grabbing;
}
.column-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 9px 0;
  color: #8a94a6;
  font-size: 12px;
  cursor: pointer;
  border-top: 1px solid #e8ecf3;
  transition: all 0.15s;
}
.column-footer:hover {
  color: #409eff;
  background: #eef4fb;
  border-radius: 0 0 10px 10px;
}

/* ===== 列表 ===== */
.list-container {
  flex: 1;
}
.table-code {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  color: #64748b;
}
.overdue-text {
  color: #f56c6c;
  font-weight: 600;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
