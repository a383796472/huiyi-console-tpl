<template>
  <div class="container">

    <div class="search-area">
      <el-button v-if="canManage" type="primary" @click="handleClick">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon>
        添加产品
      </el-button>
      <el-button v-if="false" @click="handleExport">
        <el-icon style="margin-right: 4px;"><Download /></el-icon>
        导出Excel
      </el-button>
      <el-select v-model="searchType" class="search-type-select">
        <el-option label="按品名或SKU" value="all"></el-option>
      </el-select>
      <el-input
        v-model="searchKeyword"
        placeholder="请输入品名或SKU搜索"
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

    <div class="table-container">
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <div class="product-image-cell">
              <img
                v-if="getThumbnail(row)"
                :src="getImgSrc(row)"
                @error="onImgError"
                @load="onImgLoad"
                :style="{ display: imgLoadedMap[row.id] !== false ? '' : 'none' }"
                alt=""
              />
              <div v-if="!getThumbnail(row) || imgLoadedMap[row.id] === false" class="no-image-placeholder">无图</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="品名" min-width="120">
          <template #default="{ row }">{{ row.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="SKU" label="SKU" min-width="120">
          <template #default="{ row }">{{ row.SKU || '-' }}</template>
        </el-table-column>
        <el-table-column prop="product_type" label="产品类型" min-width="100">
          <template #default="{ row }">{{ row.product_type || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="isSuperAdmin" prop="department_name" label="所属部门" min-width="100">
          <template #default="{ row }">{{ row.department_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="spu" label="关联SPU" min-width="120">
          <template #default="{ row }">{{ row.spu || '-' }}</template>
        </el-table-column>
        <el-table-column prop="chinese_name" label="中文名称" min-width="120">
          <template #default="{ row }">{{ row.chinese_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="dev_owner" label="开发负责人" min-width="100">
          <template #default="{ row }">{{ row.dev_owner || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sales_owner" label="销售负责人" min-width="100">
          <template #default="{ row }">{{ row.sales_owner || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sales_status" label="销售状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.sales_status)">{{ row.sales_status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vehicle_category" label="车型类别" min-width="100">
          <template #default="{ row }">{{ row.vehicle_category || '-' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="140">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" min-width="180">
          <template #default="{ row }">
            <span class="op-link" @click="handleView(row.id)">查看</span>
            <span v-if="canManage" class="op-link" @click="handleEdit(row.id)">编辑</span>
            <span v-if="canManage" class="op-link op-link--danger" @click="handleDelete(row.id)">删除</span>
          </template>
        </el-table-column>
      </el-table>

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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import request, { baseURL, downloadFile } from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const tableData = ref<any[]>([])
const searchKeyword = ref('')
const searchType = ref('all')
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

const isSuperAdmin = ref(false)
const canManage = ref(false)
try {
  const stored = localStorage.getItem('userInfo')
  if (stored) {
    const info = JSON.parse(stored)
    isSuperAdmin.value = info.role === 'super_admin'
    canManage.value = info.role === 'super_admin' || info.role === 'admin'
  }
} catch {}
const imgLoadedMap = reactive<Record<number, boolean>>({})

const onImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  const rowId = img.closest('tr')?.rowIndex
  if (rowId) {
    const row = tableData.value[rowId - 1]
    if (row) imgLoadedMap[row.id] = false
  }
}

const onImgLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  const rowId = img.closest('tr')?.rowIndex
  if (rowId) {
    const row = tableData.value[rowId - 1]
    if (row) imgLoadedMap[row.id] = true
  }
}

const formatTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getThumbnail = (row: any) => {
  if (row.extra_images) {
    try {
      const list = JSON.parse(row.extra_images)
      if (Array.isArray(list) && list.length > 0) {
        return list[0]
      }
    } catch {}
  }
  return row.image || null
}

const getImgSrc = (row: any) => {
  const path = getThumbnail(row)
  if (!path) return ''
  if (path.startsWith('http')) return path
  return baseURL + (path.startsWith('/') ? path : '/' + path)
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    '在售': 'success',
    '停售': 'danger',
    '预售': 'warning',
    '待定': 'info'
  }
  return map[status] || 'default'
}

const handleView = (id: number) => {
  router.push(`/viewProduct?id=${id}`)
}

const handleEdit = (id: number) => {
  router.push(`/creatProduct?id=${id}`)
}

const handleClick = () => {
  router.push('/creatProduct')
}

const handleExport = async () => {
  try {
    await downloadFile('/api/export/products', '产品列表.xlsx')
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchProducts()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchProducts()
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('pageSize', pageSize.value.toString())
    if (searchKeyword.value) {
      params.append('keyword', searchKeyword.value)
    }
    
    const res = await request.get(`/api/products?${params.toString()}`)
    if (res.data.code === 200 && res.data.data) {
      tableData.value = res.data.data.list || []
      const keys = Object.keys(imgLoadedMap)
      keys.forEach(k => delete imgLoadedMap[Number(k)])
      total.value = res.data.data.total || 0
    }
  } catch (error) {
    console.error('获取数据失败', error)
    ElMessage.error('获取产品列表失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm(
    '确定要删除该产品吗？此操作无法撤销',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await request.delete(`/api/products/${id}`)
      if (res.data.code === 200) {
        ElMessage.success('删除产品成功')
        fetchProducts()
      }
    } catch (error) {
      ElMessage.error('删除产品失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

onMounted(() => {
  fetchProducts()
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
    width: 140px;
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

.product-image-cell {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.no-image-placeholder {
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}
</style>
