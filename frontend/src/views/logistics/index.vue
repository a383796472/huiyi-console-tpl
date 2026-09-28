<template>
  <div class="container">
    <div class="search-area">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入运单号或订单号搜索"
        class="search-input"
        clearable
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
      <el-select v-model="shipStatus" placeholder="物流状态" clearable class="status-select" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="待揽收" value="pending" />
        <el-option label="运输中" value="in_transit" />
        <el-option label="已签收" value="delivered" />
        <el-option label="异常" value="exception" />
      </el-select>
    </div>

    <div class="table-container">
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="trackingNo" label="运单号" min-width="160">
          <template #default="{ row }">{{ row.trackingNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="orderNo" label="关联订单号" min-width="160">
          <template #default="{ row }">{{ row.orderNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="carrier" label="承运商" min-width="120">
          <template #default="{ row }">{{ row.carrier || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="物流状态" min-width="110" align="center">
          <template #default="{ row }">{{ row.status || '-' }}</template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="160">
          <template #default="{ row }">{{ row.updated_at || '-' }}</template>
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
import { ref } from 'vue'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const searchKeyword = ref('')
const shipStatus = ref('')

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}
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

  .search-input {
    width: 300px;
  }

  .status-select {
    width: 130px;
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
