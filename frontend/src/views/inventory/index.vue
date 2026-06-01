<template>
  <div class="container">
    <div class="search-area">
      <el-button v-if="canManage" type="primary" @click="handleAdd">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon>
        入库登记
      </el-button>
      <el-select v-model="searchType" class="search-type-select">
        <el-option label="按品名或SKU" value="all" />
        <el-option label="按仓库" value="warehouse" />
      </el-select>
      <el-input
        v-model="searchKeyword"
        placeholder="请输入关键词搜索"
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </el-button>
        </template>
      </el-input>
      <el-select v-model="stockStatus" placeholder="库存状态" clearable class="status-select" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="库存充足" value="sufficient" />
        <el-option label="库存不足" value="low" />
        <el-option label="缺货" value="out" />
      </el-select>
    </div>

    <div class="table-container">
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="SKU" label="SKU" min-width="120">
          <template #default="{ row }">{{ row.SKU || '-' }}</template>
        </el-table-column>
        <el-table-column prop="name" label="品名" min-width="120">
          <template #default="{ row }">{{ row.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="warehouse" label="所属仓库" min-width="110">
          <template #default="{ row }">{{ row.warehouse || '-' }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="当前库存" min-width="100" align="center">
          <template #default="{ row }">
            <span :class="getQuantityClass(row)">{{ row.quantity ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="safety_stock" label="安全库存" min-width="100" align="center">
          <template #default="{ row }">{{ row.safety_stock ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="locked_quantity" label="锁定库存" min-width="100" align="center">
          <template #default="{ row }">{{ row.locked_quantity ?? 0 }}</template>
        </el-table-column>
        <el-table-column prop="available_quantity" label="可用库存" min-width="100" align="center">
          <template #default="{ row }">
            <span :class="getAvailableClass(row)">{{ getAvailable(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="库存状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStockStatusType(row)">{{ getStockStatusLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="最后更新" min-width="140">
          <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" min-width="200">
          <template #default="{ row }">
            <span class="op-link" @click="handleView(row.id)">查看</span>
            <span v-if="canManage" class="op-link op-link--success" @click="handleStockIn(row.id)">入库</span>
            <span v-if="canManage" class="op-link op-link--warning" @click="handleStockOut(row.id)">出库</span>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="SKU" prop="SKU">
          <el-input v-model="form.SKU" placeholder="请输入SKU" />
        </el-form-item>
        <el-form-item label="品名" prop="name">
          <el-input v-model="form.name" placeholder="请输入品名" />
        </el-form-item>
        <el-form-item label="所属仓库" prop="warehouse">
          <el-select v-model="form.warehouse" placeholder="请选择仓库" style="width: 100%">
            <el-option label="主仓库" value="主仓库" />
            <el-option label="备用仓库" value="备用仓库" />
            <el-option label="海外仓" value="海外仓" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作数量" prop="changeQuantity">
          <el-input-number v-model="form.changeQuantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="库存详情" width="600px">
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="SKU">{{ currentDetail.SKU || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品名">{{ currentDetail.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ currentDetail.warehouse || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ currentDetail.quantity ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ currentDetail.safety_stock ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="锁定库存">{{ currentDetail.locked_quantity ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="可用库存">{{ getAvailable(currentDetail) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ formatTime(currentDetail.updated_at) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const searchType = ref('all')
const stockStatus = ref('')

const canManage = ref(false)
try {
  const stored = localStorage.getItem('userInfo')
  if (stored) {
    const info = JSON.parse(stored)
    canManage.value = info.role === 'super_admin' || info.role === 'admin'
  }
} catch {}

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref<'in' | 'out'>('in')
const formRef = ref()
const form = reactive({
  id: null as number | null,
  SKU: '',
  name: '',
  warehouse: '',
  changeQuantity: 1,
  remark: ''
})
const formRules = {
  SKU: [{ required: true, message: '请输入SKU', trigger: 'blur' }],
  name: [{ required: true, message: '请输入品名', trigger: 'blur' }],
  warehouse: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  changeQuantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

const detailVisible = ref(false)
const currentDetail = ref<any>(null)

const formatTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getAvailable = (row: any) => {
  const quantity = row.quantity ?? 0
  const locked = row.locked_quantity ?? 0
  return quantity - locked
}

const getQuantityClass = (row: any) => {
  const available = getAvailable(row)
  const safetyStock = row.safety_stock ?? 0
  if (available <= 0) return 'quantity-out'
  if (safetyStock > 0 && available < safetyStock) return 'quantity-low'
  return 'quantity-sufficient'
}

const getAvailableClass = (row: any) => {
  return getQuantityClass(row)
}

const getStockStatusType = (row: any): 'success' | 'warning' | 'danger' | 'info' => {
  const available = getAvailable(row)
  const safetyStock = row.safety_stock ?? 0
  if (available <= 0) return 'danger'
  if (safetyStock > 0 && available < safetyStock) return 'warning'
  return 'success'
}

const getStockStatusLabel = (row: any) => {
  const available = getAvailable(row)
  const safetyStock = row.safety_stock ?? 0
  if (available <= 0) return '缺货'
  if (safetyStock > 0 && available < safetyStock) return '库存不足'
  return '库存充足'
}

const fetchInventory = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('pageSize', pageSize.value.toString())
    if (searchKeyword.value) {
      params.append('keyword', searchKeyword.value)
    }
    if (searchType.value) {
      params.append('searchType', searchType.value)
    }
    if (stockStatus.value) {
      params.append('stockStatus', stockStatus.value)
    }

    const res = await request.get(`/api/inventory?${params.toString()}`)
    if (res.data.code === 200 && res.data.data) {
      tableData.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    }
  } catch (error) {
    console.error('获取库存数据失败', error)
    ElMessage.error('获取库存列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchInventory()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchInventory()
}

const handleAdd = () => {
  dialogType.value = 'in'
  dialogTitle.value = '入库登记'
  resetForm()
  dialogVisible.value = true
}

const handleView = (id: number) => {
  const row = tableData.value.find(item => item.id === id)
  if (row) {
    currentDetail.value = { ...row }
    detailVisible.value = true
  }
}

const handleStockIn = (id: number) => {
  const row = tableData.value.find(item => item.id === id)
  if (!row) return
  dialogType.value = 'in'
  dialogTitle.value = '入库操作'
  form.id = id
  form.SKU = row.SKU
  form.name = row.name
  form.warehouse = row.warehouse
  form.changeQuantity = 1
  form.remark = ''
  dialogVisible.value = true
}

const handleStockOut = (id: number) => {
  const row = tableData.value.find(item => item.id === id)
  if (!row) return
  dialogType.value = 'out'
  dialogTitle.value = '出库操作'
  form.id = id
  form.SKU = row.SKU
  form.name = row.name
  form.warehouse = row.warehouse
  form.changeQuantity = 1
  form.remark = ''
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.SKU = ''
  form.name = ''
  form.warehouse = ''
  form.changeQuantity = 1
  form.remark = ''
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const url = dialogType.value === 'in' ? '/api/inventory/stock-in' : '/api/inventory/stock-out'
    const payload = {
      ...(form.id ? { id: form.id } : {}),
      SKU: form.SKU,
      name: form.name,
      warehouse: form.warehouse,
      quantity: form.changeQuantity,
      remark: form.remark
    }
    const res = await request.post(url, payload)
    if (res.data.code === 200) {
      ElMessage.success(dialogType.value === 'in' ? '入库成功' : '出库成功')
      dialogVisible.value = false
      fetchInventory()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchInventory()
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

.search-area {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .search-type-select {
    width: 140px;
  }

  .search-input {
    width: 300px;
  }

  .status-select {
    width: 130px;
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

.quantity-sufficient {
  color: #10b981;
  font-weight: 600;
}

.quantity-low {
  color: #f59e0b;
  font-weight: 600;
}

.quantity-out {
  color: #ef4444;
  font-weight: 600;
}
</style>
