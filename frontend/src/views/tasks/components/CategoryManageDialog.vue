<template>
  <el-dialog v-model="visible" title="分类管理" width="800px" @close="handleClose">
    <div class="category-toolbar">
      <el-button type="primary" @click="openCreate">+ 新建分类</el-button>
    </div>

    <el-table :data="categories" v-loading="loading" stripe>
      <el-table-column label="排序" prop="sort_order" width="70" />
      <el-table-column label="分类名称" prop="name">
        <template #default="{ row }">
          <el-tag :color="row.color" effect="dark" size="small">{{ row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="编号前缀" prop="code_prefix" width="100" />
      <el-table-column label="任务数" prop="task_count" width="80" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑/新建 子弹窗 -->
    <el-dialog
      v-model="editVisible"
      :title="editing ? '编辑分类' : '新建分类'"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="editForm" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="editForm.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="编号前缀" prop="code_prefix">
          <el-input v-model="editForm.code_prefix" maxlength="20" placeholder="如 BCSJ" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="editForm.color" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editForm.sort_order" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { TaskCategory } from '../../../api/task'
import { createCategory, updateCategory, deleteCategory } from '../../../api/task'

interface Props {
  modelValue: boolean
  categories: TaskCategory[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'refresh'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const loading = ref(false)
const editVisible = ref(false)
const submitting = ref(false)
const editing = ref<TaskCategory | null>(null)
const formRef = ref<FormInstance>()

const editForm = ref({
  name: '',
  code_prefix: '',
  color: '#1989fa',
  sort_order: 0,
  description: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code_prefix: [{ required: true, message: '请输入编号前缀', trigger: 'blur' }]
}

function openCreate() {
  editing.value = null
  editForm.value = {
    name: '',
    code_prefix: '',
    color: '#1989fa',
    sort_order: props.categories.length * 10 + 10,
    description: ''
  }
  editVisible.value = true
}

function openEdit(row: TaskCategory) {
  editing.value = row
  editForm.value = {
    name: row.name,
    code_prefix: row.code_prefix,
    color: row.color,
    sort_order: row.sort_order,
    description: row.description || ''
  }
  editVisible.value = true
}

async function handleSave() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      name: editForm.value.name,
      code_prefix: editForm.value.code_prefix,
      color: editForm.value.color,
      sort_order: editForm.value.sort_order,
      description: editForm.value.description || null
    }
    if (editing.value) {
      await updateCategory(editing.value.id, payload)
      ElMessage.success('分类已更新')
    } else {
      await createCategory(payload)
      ElMessage.success('分类已创建')
    }
    editVisible.value = false
    emit('refresh')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function confirmDelete(row: TaskCategory) {
  try {
    await ElMessageBox.confirm(
      `确定删除分类「${row.name}」吗？${row.task_count ? `该分类下还有 ${row.task_count} 个任务，需先迁移或删除。` : ''}`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
    )
    await deleteCategory(row.id)
    ElMessage.success('分类已删除')
    emit('refresh')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err?.response?.data?.message || '删除失败')
    }
  }
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.category-toolbar {
  margin-bottom: 12px;
}
.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>