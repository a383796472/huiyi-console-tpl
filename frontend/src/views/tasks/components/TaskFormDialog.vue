<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑任务' : '新建任务'"
    width="640px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <el-form-item label="任务标题" prop="title">
        <el-input v-model="form.title" placeholder="一句话说清楚要做什么" maxlength="200" show-word-limit />
      </el-form-item>

      <el-form-item label="所属分类" prop="category_id">
        <el-select v-model="form.category_id" placeholder="选择分类" style="width: 100%" :disabled="isEdit">
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
            :label="cat.name"
          >
            <span style="float: left">{{ cat.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 12px">{{ cat.code_prefix }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="父任务" v-if="!isEdit">
        <el-select
          v-model="form.parent_task_id"
          placeholder="留空表示独立任务"
          style="width: 100%"
          clearable
          filterable
          remote
          :remote-method="searchParentTasks"
          :loading="parentSearchLoading"
        >
          <el-option
            v-for="t in parentTaskOptions"
            :key="t.id"
            :value="t.id"
            :label="`${t.code} - ${t.title}`"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="任务描述">
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="详细说明（可选）" />
      </el-form-item>

      <el-form-item label="负责人">
        <el-select v-model="form.assignee_id" placeholder="选择负责人" style="width: 100%" clearable filterable>
          <el-option v-for="u in users" :key="u.id" :value="u.id" :label="u.real_name || u.username" />
        </el-select>
      </el-form-item>

      <el-form-item label="协作人">
        <el-select v-model="form.collaborator_ids" multiple placeholder="可选择多个协作者" style="width: 100%" filterable>
          <el-option v-for="u in users" :key="u.id" :value="u.id" :label="u.real_name || u.username" />
        </el-select>
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-radio-group v-model="form.priority" class="priority-group">
          <el-radio-button value="low">低</el-radio-button>
          <el-radio-button value="medium">中</el-radio-button>
          <el-radio-button value="high">高</el-radio-button>
          <el-radio-button value="urgent">紧急</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="截止日期">
        <el-date-picker v-model="form.due_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createTask, updateTask, getTasks, type TaskCategory, type Task, type CreateTaskParams, type UpdateTaskParams } from '../../../api/task'
import { getUsers } from '../../../api/user'

interface Props {
  modelValue: boolean
  categories: TaskCategory[]
  task?: Task | null
  defaultCategoryId?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isEdit = computed(() => !!props.task)

const formRef = ref<FormInstance>()
const submitting = ref(false)
const users = ref<Array<{ id: number; username: string; real_name: string }>>([])
const parentTaskOptions = ref<Task[]>([])
const parentSearchLoading = ref(false)

const form = ref({
  title: '',
  category_id: undefined as number | undefined,
  parent_task_id: undefined as number | undefined,
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  assignee_id: undefined as number | undefined,
  due_date: undefined as string | undefined,
  collaborator_ids: [] as number[]
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

watch(() => props.task, (t) => {
  if (t) {
    form.value = {
      title: t.title,
      category_id: t.category_id,
      parent_task_id: t.parent_task_id ?? undefined,
      description: t.description || '',
      priority: t.priority,
      assignee_id: t.assignee_id ?? undefined,
      due_date: t.due_date || undefined,
      collaborator_ids: []
    }
  } else {
    form.value = {
      title: '',
      category_id: props.defaultCategoryId ?? props.categories[0]?.id,
      parent_task_id: undefined,
      description: '',
      priority: 'medium',
      assignee_id: undefined,
      due_date: undefined,
      collaborator_ids: []
    }
  }
}, { immediate: true })

// 打开弹窗时若传入默认分类则生效（新建场景）
watch(() => props.modelValue, (open) => {
  if (open && !props.task) {
    form.value.category_id = props.defaultCategoryId ?? props.categories[0]?.id
  }
})

onMounted(async () => {
  try {
    const res = await getUsers({ page: 1, pageSize: 1000 })
    users.value = res.data?.data?.list || []
  } catch (e) {
    console.error('加载用户列表失败', e)
  }
})

async function searchParentTasks(q: string) {
  if (!q || q.length < 2) {
    parentTaskOptions.value = []
    return
  }
  parentSearchLoading.value = true
  try {
    const res = await getTasks({ keyword: q, pageSize: 20, parentOnly: true })
    parentTaskOptions.value = res.data?.data?.list || []
  } finally {
    parentSearchLoading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && props.task) {
      const updateData: UpdateTaskParams = {
        title: form.value.title,
        description: form.value.description,
        category_id: form.value.category_id,
        priority: form.value.priority,
        assignee_id: form.value.assignee_id || null,
        due_date: form.value.due_date || null
      }
      await updateTask(props.task.id, updateData)
      ElMessage.success('任务已更新')
    } else {
      const createData: CreateTaskParams = {
        title: form.value.title,
        description: form.value.description,
        category_id: form.value.category_id!,
        parent_task_id: form.value.parent_task_id || null,
        priority: form.value.priority,
        assignee_id: form.value.assignee_id || null,
        due_date: form.value.due_date || null,
        collaborator_ids: form.value.collaborator_ids
      }
      await createTask(createData)
      ElMessage.success('任务已创建')
    }
    emit('success')
    handleClose()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<!-- 非 scoped：el-dialog 渲染到 body，需要全局选择器才能命中 -->
<style>
.el-dialog {
  border: none !important;
  border-radius: 14px !important;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.18) !important;
  overflow: hidden;
}
.el-dialog__header {
  padding: 18px 24px 12px !important;
  margin-right: 0 !important;
  border-bottom: none !important;
}
.el-dialog__title {
  font-weight: 600;
  font-size: 16px;
}
.el-dialog__body {
  padding: 12px 24px 20px !important;
}
.el-dialog__footer {
  padding: 12px 24px 18px !important;
  border-top: none !important;
}

/* 优先级单选组：分段控件风格，去掉生硬边框线 */
.priority-group {
  display: inline-flex;
  background: #f1f4f9;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.priority-group .el-radio-button {
  --el-radio-button-checked-bg-color: #3b82f6;
}
.priority-group .el-radio-button__inner {
  border: none !important;
  box-shadow: none !important;
  border-radius: 8px !important;
  background: transparent;
  color: #64748b;
  padding: 7px 18px;
  font-weight: 500;
  transition: all 0.15s ease;
}
.priority-group .el-radio-button__inner:hover {
  color: #3b82f6;
}
.priority-group .el-radio-button.is-active .el-radio-button__inner,
.priority-group .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: #3b82f6 !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35) !important;
  border: none !important;
}
.priority-group .el-radio-button:first-child .el-radio-button__inner,
.priority-group .el-radio-button:last-child .el-radio-button__inner {
  border-radius: 8px !important;
  border-left: none !important;
}
</style>