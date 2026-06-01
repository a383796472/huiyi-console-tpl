<template>
  <div class="container">

    <!-- 搜索区域 -->
    <div class="search-area">
      <el-button type="primary" @click="handleAddUser">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon>
        添加用户
      </el-button>
      <el-button v-if="false" @click="handleExport">
        <el-icon style="margin-right: 4px;"><Download /></el-icon>
        导出Excel
      </el-button>
      <el-select v-model="searchType" class="search-type-select">
        <el-option label="按用户名" value="username"></el-option>
        <el-option label="按邮箱" value="email"></el-option>
        <el-option label="按手机号" value="phone"></el-option>
      </el-select>
      <el-input
        v-model="searchKeyword"
        :placeholder="searchPlaceholder"
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 用户列表表格 -->
    <div class="table-container">
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" min-width="60">
          <template #default="{ row }">{{ row.id || '-' }}</template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">{{ row.username || '-' }}</template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180">
          <template #default="{ row }">{{ row.email || '-' }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="120">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="real_name" label="真实姓名" min-width="100">
          <template #default="{ row }">{{ row.real_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="department_name" label="部门" min-width="100">
          <template #default="{ row }">{{ row.department_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="role" label="角色" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" min-width="160">
          <template #default="{ row }">{{ row.last_login ? formatTime(row.last_login) : '-' }}</template>
        </el-table-column>
        <!-- 操作列 -->
        <el-table-column fixed="right" label="操作" min-width="200">
          <template #default="{ row }">
            <span class="op-link" @click="handleEdit(row.id)">编辑</span>
            <span class="op-link" :class="row.status === 1 ? 'op-link--warning' : 'op-link--success'" @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </span>
            <span class="op-link op-link--danger" @click="handleDelete(row.id)">删除</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="table-page">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import { getUsers, updateUserStatus, deleteUser } from '@/api/user'
import { downloadFile } from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const searchType = ref('username')

const searchPlaceholder = computed(() => {
  const map: Record<string, string> = {
    username: '请输入用户名搜索',
    email: '请输入邮箱搜索',
    phone: '请输入手机号搜索'
  }
  return map[searchType.value] || '请输入关键词搜索'
})

// 获取角色文本
const getRoleText = (role: string | number) => {
  const roleMap: Record<string | number, string> = {
    'super_admin': '超级管理员',
    'admin': '管理员',
    'user': '普通用户'
  }
  return roleMap[role] || '未知'
}

// 获取角色标签类型
const getRoleType = (role: string | number) => {
  const roleMap: Record<string | number, string> = {
    'super_admin': 'danger',
    'admin': 'warning',
    'user': 'info'
  }
  return roleMap[role] || 'default'
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 跳转添加用户
const handleAddUser = () => {
  router.push('/users/create')
}

const handleExport = async () => {
  try {
    await downloadFile('/api/export/users', '用户列表.xlsx')
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

// 编辑用户
const handleEdit = (id: number) => {
  router.push(`/users/create?id=${id}`)
}

// 切换用户状态
const handleToggleStatus = (row: any) => {
  const action = row.status === 1 ? '停用' : '启用'
  const message = row.status === 1 ? '确定要停用该用户吗？' : '确定要启用该用户吗？'
  
  ElMessageBox.confirm(
    message,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: row.status === 1 ? 'warning' : 'info',
    }
  ).then(async () => {
    try {
      const res = await updateUserStatus(row.id, {
        status: row.status === 1 ? 0 : 1
      })
      if (res.data.code === 200) {
        row.status = row.status === 1 ? 0 : 1
        ElMessage.success(res.data.message || `${action}成功`)
      } else {
        ElMessage.error(res.data?.message || `${action}失败`)
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || `${action}失败`
      ElMessage.error(msg)
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 删除用户
const handleDelete = (id: number) => {
  ElMessageBox.confirm(
    '确定要删除该用户吗？此操作无法撤销',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await deleteUser(id)
      if (res.data.code === 200) {
        const idx = tableData.value.findIndex(item => item.id === id)
        if (idx !== -1) tableData.value.splice(idx, 1)
        total.value--
        ElMessage.success('删除用户成功')
      }
    } catch (error) {
      ElMessage.error('删除用户失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

// 分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({
      page: currentPage.value,
      pageSize: pageSize.value,
      searchType: searchKeyword.value ? searchType.value : undefined,
      keyword: searchKeyword.value || undefined
    })
    const body = res.data
    if (body && body.code === 200) {
      const data = body.data || body
      const list = Array.isArray(data.list) ? data.list : (Array.isArray(data) ? data : [])
      tableData.value = list
      total.value = data.total || list.length || 0
    } else {
      ElMessage.error(body?.message || '获取用户列表失败')
      tableData.value = []
      total.value = 0
    }
  } catch (error: any) {
    console.error('获取用户列表失败', error)
    ElMessage.error(error?.response?.data?.message || '获取用户列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.container {
  background: #fff;
  padding: 24px;
  border-radius: 18px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.list-header {
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.3px;
  }
}

.search-area {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;

  .search-type-select {
    width: 130px;
  }

  .search-input {
    width: 300px;
  }

  :deep(.el-button--primary) {
    border-radius: 8px;
    height: 34px;
    padding: 0 16px;
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    border: none;
    box-shadow: 0 8px 18px rgba(59, 130, 246, 0.2);
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(59, 130, 246, 0.3);
    }
  }

  :deep(.el-input-group) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 0 0 1px #e2e8f0;
    transition: box-shadow 0.2s;

    &:hover,
    &:focus-within {
      box-shadow: 0 0 0 1px #60a5fa;
    }

    .el-input__wrapper {
      border-radius: 0;
      box-shadow: none !important;
    }

    .el-input-group__append {
      background: #f1f5f9;
      border: none;
      border-radius: 0;
      box-shadow: none;
      padding: 0 18px;

      .el-button {
        border: none;
        background: transparent;
        color: #64748b;
        padding: 0;
        height: 100%;

        svg {
          width: 20px;
          height: 20px;
        }

        &:hover {
          color: #3b82f6;
          background: transparent;
        }
      }
    }
  }

  :deep(.el-select .el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 0 0 1px #60a5fa inset;
    }
  }
}

.table-container {
  flex: 1;
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
      color: #334155;
      font-size: 14px;
    }

    .el-table__row:hover > td {
      background: #f8fafc;
    }

    .el-tag {
      border-radius: 8px;
      padding: 0 10px;
      font-weight: 600;
    }

    .op-link {
      font-weight: 400;
      cursor: pointer;
      color: #3b82f6;
      margin-right: 12px;
      &:hover { color: #2563eb !important; }
      &--success { color: #10b981; &:hover { color: #059669 !important; } }
      &--warning { color: #f59e0b; &:hover { color: #d97706 !important; } }
      &--danger { color: #ef4444; &:hover { color: #dc2626 !important; } }
    }
  }

  :deep(.el-pagination) {
    .el-pager li {
      border-radius: 10px;
      font-weight: 600;
    }

    .btn-prev, .btn-next {
      border-radius: 10px;
    }
  }

  .table-page {
    display: flex;
    justify-content: center;
    margin-top: auto;
    margin-bottom: 0;
    padding-top: 20px;
  }
}
</style>
