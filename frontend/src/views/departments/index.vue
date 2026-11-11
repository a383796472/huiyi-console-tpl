<template>
  <div class="org-page">
    <!-- 左侧：组织架构 -->
    <aside class="dept-panel" v-loading="deptLoading">
      <div class="panel-head">
        <div>
          <h2>组织架构</h2>
          <p>{{ departments.length }} 个部门</p>
        </div>
        <el-button v-if="isSuperAdmin" class="add-btn" @click="openDeptCreate">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>

      <div
        class="all-node"
        :class="{ active: selectedDeptId === null }"
        @click="selectDept(null)"
      >
        <span>全部部门</span>
      </div>

      <el-tree
        class="dept-tree"
        :data="deptTree"
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        :expand-on-click-node="false"
        :default-expanded-keys="expandedKeys"
        :current-node-key="selectedDeptId ?? undefined"
        highlight-current
        @node-click="handleNodeClick"
      >
        <template #default="{ data }">
          <div class="dept-node">
            <span class="node-name" :title="data.name">{{ data.name }}</span>
            <span v-if="data.user_count" class="node-count">{{ data.user_count }}</span>
            <span v-if="isSuperAdmin" class="node-actions">
              <el-icon @click.stop="openDeptEdit(data)"><Edit /></el-icon>
              <el-icon @click.stop="handleDeptDelete(data)"><Delete /></el-icon>
            </span>
          </div>
        </template>
      </el-tree>
    </aside>

    <!-- 右侧：部门用户 -->
    <section class="user-panel">
      <div class="user-head">
        <div class="head-info">
          <h2>{{ selectedDeptName }}</h2>
          <p>{{ userTotal }} 名用户{{ selectedDeptId ? '（含下级部门）' : '' }}</p>
        </div>
        <div class="user-tools">
          <el-input
            v-model="keyword"
            placeholder="用户名 / 邮箱 / 手机号"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
          <el-button type="primary" class="add-user-btn" @click="openUserCreate">
            <el-icon style="margin-right: 4px;"><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </div>

      <div class="table-wrap">
        <el-table :data="users" v-loading="userLoading" style="width: 100%">
          <el-table-column prop="username" label="用户名" min-width="130">
            <template #default="{ row }">
              <div class="user-cell">
                <span class="avatar">{{ (row.real_name || row.username).charAt(0).toUpperCase() }}</span>
                <div>
                  <div class="name">{{ row.username }}</div>
                  <div class="sub">{{ row.real_name || '-' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="department_name" label="部门" min-width="170">
            <template #default="{ row }">{{ row.department_name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="170">
            <template #default="{ row }">{{ row.email || '-' }}</template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" min-width="120">
            <template #default="{ row }">{{ row.phone || '-' }}</template>
          </el-table-column>
          <el-table-column prop="role" label="角色" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.role)" effect="light">{{ getRoleText(row.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'warning'" effect="light">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="last_login" label="最后登录" min-width="110">
            <template #default="{ row }">{{ row.last_login ? formatTime(row.last_login) : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <template v-if="hasRowAction(row)">
                <template v-if="canOperate(row)">
                  <span class="op-link" @click="openUserEdit(row)">编辑</span>
                  <span
                    class="op-link"
                    :class="row.status === 1 ? 'op-link--warning' : 'op-link--success'"
                    @click="handleToggleStatus(row)"
                  >{{ row.status === 1 ? '停用' : '启用' }}</span>
                </template>
                <span
                  v-if="isSuperAdmin && row.username !== 'admin'"
                  class="op-link op-link--danger"
                  @click="handleUserDelete(row)"
                >删除</span>
              </template>
              <span v-else class="op-muted">-</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-page">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="userTotal"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </section>

    <!-- 部门弹窗 -->
    <el-dialog
      v-model="deptDialogVisible"
      :title="editingDeptId ? '编辑部门' : '新增部门'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="deptFormRef" :model="deptForm" :rules="deptRules" label-width="96px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="deptForm.name" placeholder="请输入部门名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="deptForm.parent_id" placeholder="不选则为顶级部门" clearable class="full">
            <el-option
              v-for="dept in parentOptions"
              :key="dept.id"
              :label="dept.label"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门管理员">
          <el-select v-model="deptForm.manager_id" placeholder="可稍后设置" clearable filterable class="full">
            <el-option
              v-for="user in managerOptions"
              :key="user.id"
              :label="`${user.real_name || user.username}（${user.department_name || '无部门'}）`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="deptForm.sort_order" :min="0" :max="9999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="deptForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="deptForm.description"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            placeholder="选填，例如负责的平台或业务线"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deptDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="deptSubmitting" @click="submitDept">保存</el-button>
      </template>
    </el-dialog>

    <!-- 用户弹窗 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="editingUserId ? '编辑用户' : '新增用户'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="96px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="!!editingUserId" />
        </el-form-item>
        <el-form-item label="密码" :prop="editingUserId ? '' : 'password'" :required="!editingUserId">
          <el-input
            v-model="userForm.password"
            type="password"
            show-password
            :placeholder="editingUserId ? '留空则不修改密码' : '请输入密码'"
          />
        </el-form-item>
        <el-form-item label="确认密码" :prop="editingUserId ? '' : 'confirmPassword'" :required="!editingUserId">
          <el-input
            v-model="userForm.confirmPassword"
            type="password"
            show-password
            :placeholder="editingUserId ? '留空则不修改密码' : '请再次输入密码'"
          />
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select v-model="userForm.department_id" placeholder="请选择部门" class="full" :disabled="isDeptAdmin">
            <el-option
              v-for="dept in flatDepartments"
              :key="dept.id"
              :label="dept.label"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" class="full" :disabled="!isSuperAdmin">
            <el-option v-if="isSuperAdmin" label="超级管理员" value="super_admin" />
            <el-option v-if="isSuperAdmin" label="管理员" value="admin" />
            <el-option v-if="isSuperAdmin" label="部门管理员" value="dept_admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="userForm.status" class="full">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="userSubmitting" @click="submitUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
} from '@/api/user'

interface Department {
  id: number
  name: string
  parent_id: number | null
  sort_order: number
  manager_id: number | null
  description: string | null
  status: number
  manager_name?: string | null
  manager_username?: string | null
  user_count?: number
  children?: Department[]
}

interface UserRow {
  id: number
  username: string
  real_name?: string | null
  email?: string | null
  phone?: string | null
  role: string
  status: number
  department_id?: number | null
  department_name?: string | null
  last_login?: string | null
}

const currentUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}')
  } catch {
    return {}
  }
})()

const isSuperAdmin = computed(() => currentUser.role === 'super_admin')
const isDeptAdmin = computed(() => currentUser.role === 'dept_admin')

// ===== 部门 =====
const departments = ref<Department[]>([])
const deptLoading = ref(false)
const selectedDeptId = ref<number | null>(null)
const expandedKeys = ref<number[]>([])

const deptTree = computed<Department[]>(() => {
  const map = new Map<number, Department>()
  const roots: Department[] = []
  const source = isDeptAdmin.value
    ? departments.value.filter(
        (d) => d.id === currentUser.department_id || isDescendantOf(d, currentUser.department_id)
      )
    : departments.value

  for (const dept of source) map.set(dept.id, { ...dept, children: [] })
  for (const dept of source) {
    const node = map.get(dept.id)!
    if (dept.parent_id && map.has(dept.parent_id)) {
      map.get(dept.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortNodes = (list: Department[]) => {
    list.sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id))
    list.forEach((n) => n.children && sortNodes(n.children))
  }
  sortNodes(roots)
  return roots
})

function isDescendantOf(dept: Department, ancestorId: number): boolean {
  let cur = dept
  const guard = new Set<number>()
  while (cur.parent_id && !guard.has(cur.parent_id)) {
    guard.add(cur.parent_id)
    const parent = departments.value.find((d) => d.id === cur.parent_id)
    if (!parent) return false
    if (parent.id === ancestorId) return true
    cur = parent
  }
  return false
}

const flatDepartments = computed(() => {
  const out: Array<{ id: number; name: string; label: string }> = []
  const walk = (nodes: Department[], depth: number) => {
    for (const node of nodes) {
      out.push({
        id: node.id,
        name: node.name,
        label: `${'　'.repeat(depth)}${depth ? '└ ' : ''}${node.name}`
      })
      if (node.children) walk(node.children, depth + 1)
    }
  }
  walk(deptTree.value, 0)
  return out
})

const selectedDeptName = computed(() => {
  if (selectedDeptId.value === null) return '全部用户'
  const dept = departments.value.find((d) => d.id === selectedDeptId.value)
  return dept ? dept.name : '全部用户'
})

const fetchDepartments = async () => {
  deptLoading.value = true
  try {
    const res = await getDepartments()
    if (res.data?.code === 200) {
      departments.value = Array.isArray(res.data.data) ? res.data.data : []
      expandedKeys.value = departments.value.filter((d) => !d.parent_id).map((d) => d.id)
    } else {
      ElMessage.error(res.data?.message || '获取部门列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '获取部门列表失败')
  } finally {
    deptLoading.value = false
  }
}

const selectDept = (deptId: number | null) => {
  selectedDeptId.value = deptId
  currentPage.value = 1
  fetchUsers()
}

const handleNodeClick = (data: Department) => {
  selectDept(data.id)
}

// ===== 部门弹窗 =====
const deptDialogVisible = ref(false)
const editingDeptId = ref<number | null>(null)
const deptSubmitting = ref(false)
const deptFormRef = ref()
const deptForm = ref({
  name: '',
  parent_id: null as number | null,
  manager_id: null as number | null,
  sort_order: 0,
  description: '',
  status: 1
})
const deptRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
}

const parentOptions = computed(() =>
  flatDepartments.value.filter((d) => d.id !== editingDeptId.value)
)

const openDeptCreate = () => {
  editingDeptId.value = null
  deptForm.value = {
    name: '',
    parent_id: selectedDeptId.value,
    manager_id: null,
    sort_order: 0,
    description: '',
    status: 1
  }
  deptDialogVisible.value = true
}

const openDeptEdit = (row: Department) => {
  editingDeptId.value = row.id
  deptForm.value = {
    name: row.name,
    parent_id: row.parent_id,
    manager_id: row.manager_id,
    sort_order: row.sort_order ?? 0,
    description: row.description || '',
    status: row.status ?? 1
  }
  deptDialogVisible.value = true
}

const submitDept = async () => {
  if (!deptFormRef.value) return
  try {
    await deptFormRef.value.validate()
  } catch {
    return
  }

  deptSubmitting.value = true
  try {
    const payload = {
      name: deptForm.value.name.trim(),
      parent_id: deptForm.value.parent_id || null,
      manager_id: deptForm.value.manager_id || null,
      sort_order: deptForm.value.sort_order || 0,
      description: deptForm.value.description || null,
      status: deptForm.value.status
    }
    const res = editingDeptId.value
      ? await updateDepartment(editingDeptId.value, payload)
      : await createDepartment(payload)

    if (res.data?.code === 200) {
      ElMessage.success(editingDeptId.value ? '部门更新成功' : '部门创建成功')
      deptDialogVisible.value = false
      await fetchDepartments()
      if (!editingDeptId.value && res.data.data?.id) {
        selectDept(res.data.data.id)
      }
    } else {
      ElMessage.error(res.data?.message || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '保存失败')
  } finally {
    deptSubmitting.value = false
  }
}

const handleDeptDelete = (row: Department) => {
  ElMessageBox.confirm(
    `确定删除部门「${row.name}」吗？部门下存在用户或子部门时无法删除。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  )
    .then(async () => {
      try {
        const res = await deleteDepartment(row.id)
        if (res.data?.code === 200) {
          ElMessage.success('部门删除成功')
          if (selectedDeptId.value === row.id) selectedDeptId.value = null
          await fetchDepartments()
          await fetchUsers()
        } else {
          ElMessage.error(res.data?.message || '删除失败')
        }
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.message || '删除失败')
      }
    })
    .catch(() => {})
}

// ===== 用户 =====
const users = ref<UserRow[]>([])
const userLoading = ref(false)
const userTotal = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const keyword = ref('')
const managerOptions = ref<UserRow[]>([])

const fetchUsers = async () => {
  userLoading.value = true
  try {
    const res = await getUsers({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      searchType: keyword.value ? 'all' : undefined,
      departmentId: selectedDeptId.value || undefined,
      withChildren: selectedDeptId.value ? '1' : undefined
    })
    const body = res.data
    if (body?.code === 200) {
      users.value = Array.isArray(body.data?.list) ? body.data.list : []
      userTotal.value = body.data?.total || 0
    } else {
      ElMessage.error(body?.message || '获取用户列表失败')
      users.value = []
      userTotal.value = 0
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '获取用户列表失败')
    users.value = []
    userTotal.value = 0
  } finally {
    userLoading.value = false
  }
}

// 部门管理员候选与全量用户（用于部门负责人下拉）
const fetchManagerOptions = async () => {
  try {
    const res = await getUsers({ page: 1, pageSize: 200 })
    if (res.data?.code === 200) {
      managerOptions.value = (res.data.data?.list || []).filter((u: UserRow) => u.status === 1)
    }
  } catch {
    managerOptions.value = []
  }
}

const canOperate = (row: UserRow) => {
  if (isSuperAdmin.value) return row.username !== 'admin'
  if (isDeptAdmin.value) return row.role === 'user'
  return false
}

// 是否存在任一可用操作（用于决定是否显示占位符）
const hasRowAction = (row: UserRow) =>
  canOperate(row) || (isSuperAdmin.value && row.username !== 'admin')

const getRoleText = (role: string) => {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    dept_admin: '部门管理员',
    user: '普通用户'
  }
  return map[role] || '未知'
}

const getRoleType = (role: string) => {
  const map: Record<string, string> = {
    super_admin: 'danger',
    admin: 'warning',
    dept_admin: 'primary',
    user: 'info'
  }
  return map[role] || 'default'
}

const formatTime = (time: string) => {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

// ===== 用户弹窗 =====
const userDialogVisible = ref(false)
const editingUserId = ref<number | null>(null)
const userSubmitting = ref(false)
const userFormRef = ref()
const userForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  real_name: '',
  email: '',
  phone: '',
  department_id: null as number | null,
  role: 'user',
  status: 1
})

const userRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

const openUserCreate = () => {
  editingUserId.value = null
  userForm.value = {
    username: '',
    password: '',
    confirmPassword: '',
    real_name: '',
    email: '',
    phone: '',
    department_id: isDeptAdmin.value
      ? currentUser.department_id
      : selectedDeptId.value || null,
    role: 'user',
    status: 1
  }
  userDialogVisible.value = true
}

const openUserEdit = (row: UserRow) => {
  editingUserId.value = row.id
  userForm.value = {
    username: row.username,
    password: '',
    confirmPassword: '',
    real_name: row.real_name || '',
    email: row.email || '',
    phone: row.phone || '',
    department_id: row.department_id ?? null,
    role: row.role,
    status: row.status
  }
  userDialogVisible.value = true
}

const submitUser = async () => {
  if (!userFormRef.value) return
  try {
    await userFormRef.value.validate()
  } catch {
    return
  }

  const form = userForm.value
  if (!editingUserId.value && !form.password) {
    ElMessage.error('请输入密码')
    return
  }
  if (!editingUserId.value && form.password !== form.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  if (!form.department_id) {
    ElMessage.error('请选择所属部门')
    return
  }

  userSubmitting.value = true
  try {
    const payload: any = {
      username: form.username,
      real_name: form.real_name || null,
      email: form.email || null,
      phone: form.phone || null,
      department_id: form.department_id,
      status: form.status
    }
    if (isSuperAdmin.value) payload.role = form.role
    if (form.password) payload.password = form.password

    const res = editingUserId.value
      ? await updateUser(editingUserId.value, payload)
      : await createUser(payload)

    if (res.data?.code === 200) {
      ElMessage.success(editingUserId.value ? '用户更新成功' : '用户创建成功')
      userDialogVisible.value = false
      await Promise.all([fetchUsers(), fetchDepartments(), fetchManagerOptions()])
    } else {
      ElMessage.error(res.data?.message || '保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '保存失败')
  } finally {
    userSubmitting.value = false
  }
}

const handleToggleStatus = (row: UserRow) => {
  const nextStatus = row.status === 1 ? 0 : 1
  ElMessageBox.confirm(
    nextStatus === 0 ? '确定要停用该用户吗？' : '确定要启用该用户吗？',
    '确认操作',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: nextStatus === 0 ? 'warning' : 'info' }
  )
    .then(async () => {
      try {
        const res = await updateUserStatus(row.id, { status: nextStatus })
        if (res.data?.code === 200) {
          row.status = nextStatus
          ElMessage.success(res.data.message || '操作成功')
        } else {
          ElMessage.error(res.data?.message || '操作失败')
        }
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.message || '操作失败')
      }
    })
    .catch(() => {})
}

const handleUserDelete = (row: UserRow) => {
  ElMessageBox.confirm(
    `确定删除用户「${row.username}」吗？此操作无法撤销。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  )
    .then(async () => {
      try {
        const res = await deleteUser(row.id)
        if (res.data?.code === 200) {
          ElMessage.success('用户删除成功')
          await Promise.all([fetchUsers(), fetchDepartments()])
        } else {
          ElMessage.error(res.data?.message || '删除失败')
        }
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.message || '删除失败')
      }
    })
    .catch(() => {})
}

onMounted(async () => {
  await fetchDepartments()
  await Promise.all([fetchUsers(), fetchManagerOptions()])
})
</script>

<style lang="scss" scoped>
.org-page {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  height: 100%;
  min-height: 0;
}

.dept-panel,
.user-panel {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 18px 36px -24px rgba(15, 23, 42, 0.28);
  min-height: 0;
}

.dept-panel {
  display: flex;
  flex-direction: column;
  padding: 20px 14px 16px;
  overflow: hidden;

  .panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0 6px;
    margin-bottom: 12px;

    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
    }

    p {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
  }

  .add-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 9px;
    border: none;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    box-shadow: 0 8px 18px -10px rgba(59, 130, 246, 1);
  }

  .all-node {
    margin: 0 4px 8px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f8fafc;
    }

    &.active {
      color: #3b82f6;
      background: #eff6ff;
    }
  }
}

.dept-tree {
  flex: 1;
  overflow-y: auto;
  background: transparent;

  :deep(.el-tree-node__content) {
    height: 38px;
    border-radius: 10px;
    margin: 1px 4px;
    transition: background 0.2s ease;
  }

  :deep(.el-tree-node__content:hover) {
    background: #f8fafc;
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: #eff6ff;

    .node-name {
      color: #2563eb;
      font-weight: 600;
    }
  }

  :deep(.el-tree-node__expand-icon) {
    color: #cbd5e1;
  }
}

.dept-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding-right: 6px;
  min-width: 0;

  .node-name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: #334155;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-count {
    font-size: 11px;
    color: #94a3b8;
    background: #f1f5f9;
    border-radius: 999px;
    padding: 1px 7px;
    font-variant-numeric: tabular-nums;
  }

  .node-actions {
    display: none;
    align-items: center;
    gap: 2px;

    :deep(.el-icon) {
      font-size: 14px;
      color: #94a3b8;
      padding: 2px;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        color: #3b82f6;
        background: #eef2f7;
      }
    }
  }

  &:hover .node-actions {
    display: inline-flex;
  }
}

.user-panel {
  display: flex;
  flex-direction: column;
  padding: 20px 22px 16px;
  overflow: hidden;
}

.user-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;

  .head-info {
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
      letter-spacing: -0.2px;
    }

    p {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
  }

  .user-tools {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .search-input {
    width: 250px;

    :deep(.el-input-group) {
      border-radius: 10px;
      overflow: hidden;
    }

    :deep(.el-input__wrapper) {
      background: #fff;
      box-shadow: 0 0 0 1px #cbd5e1 inset !important;

      &:hover {
        box-shadow: 0 0 0 1px #94a3b8 inset !important;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px #3b82f6 inset !important;
      }
    }

    :deep(.el-input-group__append) {
      background: #f1f5f9;
      border: none;
      box-shadow: -1px 0 0 0 #cbd5e1 inset;
    }
  }

  .add-user-btn {
    height: 36px;
    padding: 0 16px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    box-shadow: 0 8px 18px -10px rgba(59, 130, 246, 1);
  }
}

.table-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: auto;

  :deep(.el-table) {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #f1f5f9;

    th.el-table__cell {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
    }

    td.el-table__cell {
      font-size: 13px;
      color: #334155;
    }

    .el-tag {
      border-radius: 8px;
      padding: 0 10px;
      font-weight: 600;
    }
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      flex-shrink: 0;
    }

    .name {
      font-weight: 600;
      color: #1e293b;
    }

    .sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 1px;
    }
  }

  .table-page {
    display: flex;
    justify-content: center;
    padding-top: 14px;
  }
}

.op-link {
  cursor: pointer;
  color: #3b82f6;
  margin-right: 10px;
  font-weight: 400;

  &:hover {
    color: #2563eb !important;
  }

  &--warning {
    color: #f59e0b;
  }

  &--success {
    color: #10b981;
  }

  &--danger {
    color: #ef4444;

    &:hover {
      color: #dc2626 !important;
    }
  }
}

.op-muted {
  color: #cbd5e1;
}

.full {
  width: 100%;
}

@media (max-width: 1200px) {
  .org-page {
    grid-template-columns: 240px minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .org-page {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
  }

  .dept-panel {
    max-height: 320px;
  }
}
</style>
