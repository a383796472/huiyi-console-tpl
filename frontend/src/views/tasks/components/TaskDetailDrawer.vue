<template>
  <el-drawer
    v-model="visible"
    :title="task?.title || '任务详情'"
    size="640px"
    direction="rtl"
    @close="handleClose"
  >
    <template v-if="task">
      <!-- 顶部元信息 -->
      <div class="detail-meta">
        <div class="meta-row">
          <span class="meta-label">编号</span>
          <span class="meta-code">{{ task.code }}</span>
          <el-tag :type="statusTagType" size="small" effect="light">{{ statusLabel }}</el-tag>
          <el-tag :type="priorityTagType" size="small" effect="plain">{{ priorityLabel }}</el-tag>
        </div>
        <div class="meta-row">
          <span class="meta-label">分类</span>
          <span>
            <el-tag :color="task.category_color" effect="dark" size="small">{{ task.category_name }}</el-tag>
          </span>
        </div>
        <div class="meta-row">
          <span class="meta-label">创建人</span>
          <span>{{ task.creator_name || '未知' }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">负责人</span>
          <span>{{ task.assignee_name || '未指派' }}</span>
        </div>
        <div class="meta-row" v-if="task.due_date">
          <span class="meta-label">截止日期</span>
          <span>{{ task.due_date }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">创建时间</span>
          <span>{{ formatDate(task.created_at) }}</span>
        </div>
      </div>

      <el-divider />

      <!-- 操作区 -->
      <div class="action-bar">
        <el-button-group>
          <el-button
            v-for="s in availableStatuses"
            :key="s.value"
            :type="task.status === s.value ? 'primary' : 'default'"
            size="small"
            @click="changeStatus(s.value)"
          >
            {{ s.label }}
          </el-button>
        </el-button-group>
        <el-button size="small" @click="emit('edit', task)">编辑</el-button>
        <el-button size="small" type="danger" plain @click="confirmDelete">删除</el-button>
      </div>

      <el-divider />

      <!-- 描述 -->
      <div v-if="task.description" class="section">
        <h4>任务描述</h4>
        <div class="description">{{ task.description }}</div>
      </div>

      <!-- 协作人 -->
      <div v-if="task.assignees && task.assignees.length" class="section">
        <h4>协作人（{{ task.assignees.length }}）</h4>
        <div class="assignee-list">
          <div v-for="a in task.assignees" :key="a.user_id" class="assignee-item">
            <el-avatar :size="28">{{ (a.real_name || a.username || '?').charAt(0) }}</el-avatar>
            <span>{{ a.real_name || a.username }}</span>
            <el-tag size="small" effect="plain">{{ roleLabel(a.role) }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 子任务 -->
      <div class="section">
        <div class="section-header">
          <h4>子任务（{{ task.subtasks?.length || 0 }}）</h4>
          <el-button type="primary" link size="small" @click="addSubtask">+ 添加子任务</el-button>
        </div>
        <div v-if="task.subtasks && task.subtasks.length" class="subtask-list">
          <div v-for="st in task.subtasks" :key="st.id" class="subtask-item" @click="loadSubtask(st.id)">
            <el-icon :class="['subtask-status', st.status]" v-if="st.status === 'done'"><CircleCheckFilled /></el-icon>
            <el-icon class="subtask-status" v-else-if="st.status === 'in_progress'"><Loading /></el-icon>
            <el-icon class="subtask-status" v-else><CirclePlus /></el-icon>
            <span class="subtask-code">{{ st.code }}</span>
            <span class="subtask-title">{{ st.title }}</span>
            <span class="subtask-assignee">{{ st.assignee_name || '未指派' }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无子任务" :image-size="60" />
      </div>

      <!-- 操作日志 -->
      <div v-if="task.activities && task.activities.length" class="section">
        <h4>活动日志</h4>
        <el-timeline>
          <el-timeline-item
            v-for="act in task.activities"
            :key="act.id"
            :timestamp="formatDate(act.created_at)"
            :type="activityType(act.action)"
          >
            <span>{{ activityLabel(act) }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheckFilled, Loading, CirclePlus } from '@element-plus/icons-vue'
import type { Task } from '../../../api/task'
import { updateTask, deleteTask, getTaskById } from '../../../api/task'

interface Props {
  modelValue: boolean
  task: Task | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'edit', task: Task): void
  (e: 'deleted'): void
  (e: 'updated', task?: Task): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const statusMap: Record<string, { label: string; tag: any }> = {
  pending: { label: '待开始', tag: 'info' },
  in_progress: { label: '进行中', tag: 'primary' },
  blocked: { label: '已阻塞', tag: 'warning' },
  done: { label: '已完成', tag: 'success' },
  cancelled: { label: '已取消', tag: 'danger' }
}

const statusLabel = computed(() => statusMap[props.task!.status]?.label || props.task!.status)
const statusTagType = computed(() => statusMap[props.task!.status]?.tag || '')

const priorityMap: Record<string, { label: string; tag: any }> = {
  low: { label: '低优先级', tag: 'info' },
  medium: { label: '中优先级', tag: '' },
  high: { label: '高优先级', tag: 'warning' },
  urgent: { label: '紧急', tag: 'danger' }
}
const priorityLabel = computed(() => priorityMap[props.task!.priority]?.label || '')
const priorityTagType = computed(() => priorityMap[props.task!.priority]?.tag)

const availableStatuses = [
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'blocked', label: '已阻塞' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

function roleLabel(role: string) {
  return { owner: '负责人', collaborator: '协作人', watcher: '关注人' }[role] || role
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN', { hour12: false })
}

function activityType(action: string) {
  if (action === 'created') return 'success'
  if (action === 'assigned') return 'primary'
  if (action === 'status_changed') return 'warning'
  return 'primary'
}

function activityLabel(act: any) {
  const user = act.user_name || '系统'
  const actionMap: Record<string, string> = {
    created: `${user} 创建了任务`,
    assigned: `${user} 调整了协作人`,
    status_changed: `${user} 更新了状态`,
    updated: `${user} 更新了任务`,
    commented: `${user} 添加了评论`,
    attached: `${user} 上传了附件`,
    subtask_added: `${user} 添加了子任务`
  }
  return actionMap[act.action] || `${user}：${act.action}`
}

async function changeStatus(newStatus: string) {
  if (!props.task || props.task.status === newStatus) return
  try {
    await updateTask(props.task.id, { status: newStatus as any })
    ElMessage.success('状态已更新')
    emit('updated')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '更新失败')
  }
}

async function confirmDelete() {
  if (!props.task) return
  try {
    await ElMessageBox.confirm(`确定删除任务「${props.task.title}」吗？子任务也会被删除。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger'
    })
    await deleteTask(props.task.id)
    ElMessage.success('任务已删除')
    emit('deleted')
    handleClose()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err?.response?.data?.message || '删除失败')
    }
  }
}

function addSubtask() {
  ElMessage.info('子任务功能：编辑父任务时切换到父任务后可创建，或在列表新建时指定 parent_task_id')
}

async function loadSubtask(id: number) {
  try {
    const res = await getTaskById(id)
    emit('updated', res.data)
  } catch (e) {
    console.error(e)
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 8px;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.meta-label {
  color: #909399;
  min-width: 70px;
  text-align: right;
}
.meta-code {
  font-family: ui-monospace, Consolas, monospace;
  color: #409eff;
  font-weight: 600;
}

.action-bar {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: #f9fafc;
  border-radius: 4px;
  align-items: center;
}

.section {
  margin-bottom: 24px;
  padding: 0 8px;
}
.section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #303133;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.section-header h4 {
  margin: 0;
}

.description {
  background: #f9fafc;
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.assignee-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.assignee-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f9fafc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}
.subtask-item:hover {
  background: #eef4fb;
}
.subtask-status {
  color: #909399;
}
.subtask-status.done {
  color: #67c23a;
}
.subtask-code {
  font-family: ui-monospace, Consolas, monospace;
  color: #909399;
  font-size: 11px;
}
.subtask-title {
  flex: 1;
  color: #303133;
}
.subtask-assignee {
  color: #909399;
  font-size: 11px;
}
</style>