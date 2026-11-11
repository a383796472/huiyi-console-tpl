<template>
  <div class="container">
    <div class="summary-strip">
      <div class="summary-cell">
        <span class="label">订单数</span>
        <span class="value">{{ summary.total }}<em>单</em></span>
      </div>
      <div class="summary-cell">
        <span class="label">价税合计</span>
        <span class="value is-primary">{{ formatAmount(summary.amount) }}</span>
      </div>
      <div class="summary-cell">
        <span class="label">销售数量</span>
        <span class="value">{{ formatNumber(summary.quantity) }}<em>件</em></span>
      </div>
      <div class="summary-cell">
        <span class="label">统计口径</span>
        <span class="value is-text">B 端月报销售订单</span>
      </div>
    </div>

    <div class="search-area">
      <el-input
        v-model="searchKeyword"
        placeholder="单据编号 / 采购单号 / 客户 / 收货地址 / 业务员"
        class="search-input"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleSearch"
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
      <el-select v-model="departmentFilter" placeholder="部门" clearable class="status-select" @change="handleSearch">
        <el-option v-for="d in options.departments" :key="d" :label="d" :value="d" />
      </el-select>
      <el-select v-model="docTypeFilter" placeholder="单据类型" clearable class="status-select" @change="handleSearch">
        <el-option v-for="t in options.docTypes" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="单据状态" clearable class="status-select" @change="handleSearch">
        <el-option v-for="s in options.statuses" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select v-model="salesFilter" placeholder="业务员" clearable class="status-select" @change="handleSearch">
        <el-option v-for="p in options.salesPeople" :key="p" :label="p" :value="p" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="业务开始日期"
        end-placeholder="业务结束日期"
        value-format="YYYY-MM-DD"
        class="date-picker"
        @change="handleSearch"
      />
      <el-button type="primary" class="import-btn" @click="importVisible = true">导入</el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" @row-click="goDetail">
        <el-table-column prop="order_no" label="单据编号" min-width="155" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="order-no">{{ row.order_no }}</span>
            <div v-if="row.purchase_order_no" class="sub-text" :title="row.purchase_order_no">
              采购单 {{ row.purchase_order_no }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务日期" width="110">
          <template #default="{ row }">{{ row.biz_date || '-' }}</template>
        </el-table-column>
        <el-table-column prop="customer" label="客户" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.customer || '-' }}
            <div v-if="row.customer_type" class="sub-text">{{ row.customer_type }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="部门" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.department || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sales_person" label="业务员" width="90">
          <template #default="{ row }">{{ row.sales_person || '-' }}</template>
        </el-table-column>
        <el-table-column label="单据类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="docTypeTagType(row.doc_type)" effect="light" size="small">{{ row.doc_type || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="明细" width="110" align="right">
          <template #default="{ row }">
            {{ row.line_count }} 行
            <div class="sub-text">{{ formatNumber(row.item_count) }} 件</div>
          </template>
        </el-table-column>
        <el-table-column label="订单金额" min-width="115" align="right">
          <template #default="{ row }">
            <span class="amount">{{ formatAmount(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利" min-width="105" align="right">
          <template #default="{ row }">{{ formatAmount(row.gross_profit) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已核准' ? 'success' : 'info'" effect="light" size="small">{{ row.status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="goDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-page">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <OrderImportDialog v-model="importVisible" type="b2b" @success="handleImportSuccess" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getB2bOrderList, getB2bOrderOptions, type B2bOrderListItem, type B2bOrderOptions } from '@/api/b2bOrder'
import OrderImportDialog from '@/components/OrderImportDialog.vue'

const router = useRouter()

const loading = ref(false)
const importVisible = ref(false)
const tableData = ref<B2bOrderListItem[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const departmentFilter = ref('')
const docTypeFilter = ref('')
const statusFilter = ref('')
const salesFilter = ref('')
const dateRange = ref<[string, string] | ''>('')

const summary = reactive({ total: 0, amount: 0, quantity: 0 })
const options = reactive<B2bOrderOptions>({ departments: [], docTypes: [], statuses: [], salesPeople: [] })

const fetchList = async () => {
  loading.value = true
  try {
    const { data: res } = await getB2bOrderList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      department: departmentFilter.value || undefined,
      docType: docTypeFilter.value || undefined,
      status: statusFilter.value || undefined,
      salesPerson: salesFilter.value || undefined,
      startDate: (dateRange.value && dateRange.value[0]) || undefined,
      endDate: (dateRange.value && dateRange.value[1]) || undefined
    })
    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
      Object.assign(summary, res.data.summary)
    }
  } finally {
    loading.value = false
  }
}

const fetchOptions = async () => {
  const { data: res } = await getB2bOrderOptions()
  if (res.code === 200) Object.assign(options, res.data)
}

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const handleImportSuccess = () => {
  currentPage.value = 1
  fetchList()
  fetchOptions()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchList()
}

const goDetail = (row: B2bOrderListItem) => {
  router.push(`/b2b-orders/${row.id}`)
}

const docTypeTagType = (type: string | null) => {
  const map: Record<string, string> = {
    '标准订单': 'success',
    '非标订单': 'warning',
    '样板订单': 'info',
    '外采订单': 'primary',
    '模具订单': 'danger',
    'GR订单': 'success'
  }
  return (map[type || ''] || 'info') as any
}

const formatNumber = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toLocaleString('zh-CN') : '-'
}

const formatAmount = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return '-'
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

onMounted(() => {
  fetchOptions()
  fetchList()
})
</script>

<style lang="scss" scoped>
.container {
  background: #fff;
  padding: 24px;
  border-radius: 18px;
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 18px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #eef2f7;

  .label {
    font-size: 13px;
    color: #94a3b8;
  }

  .value {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;

    em {
      margin-left: 4px;
      font-size: 12px;
      font-weight: 400;
      font-style: normal;
      color: #94a3b8;
    }

    &.is-primary {
      color: #2563eb;
    }

    &.is-text {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
    }
  }
}

.search-area {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .search-input {
    width: 320px;
  }

  .status-select {
    width: 130px;
  }

  .date-picker {
    width: 260px;
  }

  .import-btn {
    margin-left: auto;
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

  :deep(.el-date-editor) {
    border-radius: 12px;
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

    .el-table__row {
      cursor: pointer;
    }

    .el-table__row:hover > td {
      background: #f8fafc;
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
    padding-top: 20px;
  }
}

.order-no {
  font-weight: 600;
  color: #1e293b;
}

.sub-text {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.3;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.amount {
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 1200px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
