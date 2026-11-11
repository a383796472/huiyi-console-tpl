<template>
  <div class="container">
    <div class="search-area">
      <el-input
        v-model="searchKeyword"
        placeholder="订单号 / 客户 / 买家账号 / 物流单号 / 店铺"
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
      <el-select v-model="platformFilter" placeholder="平台" clearable class="status-select" @change="handleSearch">
        <el-option v-for="(label, value) in PLATFORM_LABELS" :key="value" :label="label" :value="value" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="订单状态" clearable class="status-select" @change="handleSearch">
        <el-option v-for="(label, value) in STATUS_LABELS" :key="value" :label="label" :value="value" />
      </el-select>
      <el-select v-model="countedFilter" placeholder="计入业绩" clearable class="status-select" @change="handleSearch">
        <el-option label="计入" value="1" />
        <el-option label="不计入" value="0" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="下单开始日期"
        end-placeholder="下单结束日期"
        value-format="YYYY-MM-DD"
        class="date-picker"
        @change="handleSearch"
      />
      <el-button type="primary" class="import-btn" @click="importVisible = true">导入</el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" @row-click="goDetail">
        <el-table-column label="平台" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="platformTagType(row.platform)" effect="light">{{ PLATFORM_LABELS[row.platform] || row.platform }}</el-tag>
            <div v-if="row.shop_name" class="shop-name" :title="row.shop_name">{{ row.shop_name }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="订单号" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order_no || '-' }}</template>
        </el-table-column>
        <el-table-column prop="buyer_name" label="客户 / 收件人" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.buyer_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="item_count" label="件数" width="80" align="right">
          <template #default="{ row }">{{ row.item_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="订单金额" min-width="110" align="right">
          <template #default="{ row }">{{ formatAmount(row.total_amount, row.currency) }}</template>
        </el-table-column>
        <el-table-column label="实付金额" min-width="110" align="right">
          <template #default="{ row }">{{ formatAmount(row.paid_amount, row.currency) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status_code)" :effect="row.status_code === 'shipped' ? 'plain' : 'light'">
              {{ STATUS_LABELS[row.status_code] || row.order_status || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计入业绩" width="95" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_counted ? 'success' : 'info'" effect="plain">{{ row.is_counted ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.order_time) }}</template>
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

    <OrderImportDialog v-model="importVisible" type="cend" @success="handleImportSuccess" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList, PLATFORM_LABELS, STATUS_LABELS } from '@/api/order'
import OrderImportDialog from '@/components/OrderImportDialog.vue'

const router = useRouter()

const loading = ref(false)
const importVisible = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const platformFilter = ref('')
const statusFilter = ref('')
const countedFilter = ref('')
const dateRange = ref<[string, string] | ''>('')

const fetchList = async () => {
  loading.value = true
  try {
    const { data: res } = await getOrderList({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      platform: platformFilter.value || undefined,
      statusCode: statusFilter.value || undefined,
      isCounted: countedFilter.value || undefined,
      startDate: (dateRange.value && dateRange.value[0]) || undefined,
      endDate: (dateRange.value && dateRange.value[1]) || undefined
    })
    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const handleImportSuccess = () => {
  currentPage.value = 1
  fetchList()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchList()
}

const goDetail = (row: any) => {
  router.push(`/orders/${row.id}`)
}

const platformTagType = (platform: string) => {
  const map: Record<string, string> = {
    shopify: 'success',
    jushuitan: 'warning',
    tmall: 'danger',
    alibaba1688: 'primary'
  }
  return (map[platform] || 'info') as any
}

const statusTagType = (code: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    paid: 'primary',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'danger',
    other: 'info'
  }
  return (map[code] || 'info') as any
}

const currencySymbol = (currency: string | null) =>
  currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '¥'

const formatAmount = (amount: any, currency: string | null) => {
  if (amount === null || amount === undefined || amount === '') return '-'
  return `${currencySymbol(currency)}${Number(amount).toFixed(2)}`
}

const formatTime = (time: string | null) => {
  if (!time) return '-'
  const d = new Date(time)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

onMounted(fetchList)
</script>

<style lang="scss" scoped>

.shop-name {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.3;
  color: #94a3b8;
  max-width: 120px;
  margin-left: auto;
  margin-right: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

.search-area {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .search-input {
    width: 300px;
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

    .el-range-input {
      font-size: 13px;
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
    margin-bottom: 0;
    padding-top: 20px;
  }
}
</style>
