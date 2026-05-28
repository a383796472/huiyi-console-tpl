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
            <el-button link type="primary" size="small" @click="handleEdit(row.id)">
              编辑
            </el-button>
            <el-button 
              link 
              :type="row.status === 1 ? 'warning' : 'success'" 
              size="small" 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.id)">
              删除
            </el-button>
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
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.list-header {
  margin-bottom: 16px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
}

.search-area {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;

  .search-type-select {
    width: 130px;

    :deep(.el-input__wrapper) {
      border-radius: 4px;
    }
  }

  .search-input {
    width: 300px;
  }
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: auto;

  :deep(.el-table) {
    width: 100%;
    .el-table__header {
      th {
        font-weight: bold;
      }
    }
  }

  .table-page {
    display: flex;
    justify-content: center;
    margin-top: auto;
    margin-bottom: 0;
    padding-top: 16px;
  }
}
</style>
