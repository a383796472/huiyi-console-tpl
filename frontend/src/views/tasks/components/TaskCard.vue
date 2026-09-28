<template>
  <div class="task-card" @click="$emit('click', task)">
    <div class="task-card-header">
      <span class="task-code">{{ task.code }}</span>
      <el-tag
        v-if="task.priority !== 'medium'"
        :type="priorityTagType"
        size="small"
        effect="plain"
        class="priority-tag"
      >
        {{ priorityLabel }}
      </el-tag>
    </div>

    <div class="task-title">{{ task.title }}</div>

    <div v-if="task.subtask_count && task.subtask_count > 0" class="task-subtask-info">
      <el-icon><List /></el-icon>
      <span>{{ task.subtask_done || 0 }}/{{ task.subtask_count }} 子任务</span>
    </div>

    <div v-if="task.description" class="task-desc">{{ stripHtml(task.description).slice(0, 80) }}</div>

    <div class="task-card-footer">
      <div class="task-meta">
        <span v-if="task.assignee_name" class="assignee">
          <el-avatar :size="20" class="assignee-avatar">{{ task.assignee_name.charAt(0) }}</el-avatar>
          <span class="assignee-name">{{ task.assignee_name }}</span>
        </span>
        <span v-else class="assignee empty">未指派</span>

        <span v-if="task.due_date" class="due-date" :class="{ overdue: isOverdue(task.due_date) }">
          <el-icon><Calendar /></el-icon>
          {{ formatDate(task.due_date) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { List, Calendar } from '@element-plus/icons-vue'
import type { Task } from '../../../api/task'

const props = defineProps<{ task: Task }>()
defineEmits<{ (e: 'click', task: Task): void }>()

const priorityTagType = computed(() => {
  const map: Record<string, any> = {
    low: 'info',
    high: 'warning',
    urgent: 'danger'
  }
  return map[props.task.priority] || ''
})

const priorityLabel = computed(() => {
  const map: Record<string, string> = {
    low: '低',
    high: '高',
    urgent: '紧急'
  }
  return map[props.task.priority] || ''
})

function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function formatDate(d: string) {
  return d.slice(5) // MM-DD
}

function isOverdue(d: string) {
  return new Date(d) < new Date(new Date().toISOString().slice(0, 10))
}
</script>

<style scoped>
.task-card {
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
  transition: all 0.15s ease;
}
.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #c6d3eb;
  transform: translateY(-1px);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.task-code {
  font-size: 11px;
  color: #909399;
  font-family: ui-monospace, Consolas, monospace;
  background: #f4f4f5;
  padding: 1px 5px;
  border-radius: 3px;
}
.priority-tag {
  font-size: 10px;
}

.task-title {
  font-size: 13px;
  color: #303133;
  line-height: 1.4;
  font-weight: 500;
  margin-bottom: 4px;
  word-break: break-word;
}

.task-subtask-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #67c23a;
  margin-bottom: 4px;
}

.task-desc {
  font-size: 11px;
  color: #909399;
  line-height: 1.3;
  margin-bottom: 6px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.task-card-footer {
  border-top: 1px dashed #ebeef5;
  padding-top: 6px;
  margin-top: 6px;
}
.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.assignee {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}
.assignee.empty {
  color: #c0c4cc;
}
.assignee-avatar {
  background: #409eff;
  color: #fff;
  font-size: 10px;
}
.assignee-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #909399;
}
.due-date.overdue {
  color: #f56c6c;
  font-weight: 600;
}
</style>