<template>
  <div class="container" v-loading="loading">
    <!-- 头部：返回 + 订单号 + 平台/状态标签 -->
    <div class="detail-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <template v-if="order">
        <span class="order-no">{{ order.order_no }}</span>
        <el-tag :type="platformTagType(order.platform)" effect="light">
          {{ PLATFORM_LABELS[order.platform] || order.platform }}
        </el-tag>
        <el-tag :type="statusTagType(order.status_code || '')" :effect="order.status_code === 'shipped' ? 'plain' : 'light'">
          {{ STATUS_LABELS[order.status_code || ''] || order.order_status || '未知' }}
        </el-tag>
        <el-tag :type="order.is_counted ? 'success' : 'info'" effect="plain">
          {{ order.is_counted ? '计入业绩' : '不计入业绩' }}
        </el-tag>
      </template>
    </div>

    <div class="detail-body" v-if="order">
      <!-- 1. 基本信息 -->
      <h3 class="section-title">基本信息</h3>
      <el-descriptions :column="3" border size="default">
        <el-descriptions-item label="平台">{{ PLATFORM_LABELS[order.platform] || order.platform }}</el-descriptions-item>
        <el-descriptions-item label="店铺名称">{{ order.shop_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="线上订单号">{{ order.online_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="平台原始状态">{{ order.order_status || '-' }}</el-descriptions-item>
        <el-descriptions-item label="归一化状态">{{ STATUS_LABELS[order.status_code || ''] || order.status_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="是否计入业绩">
          <el-tag :type="order.is_counted ? 'success' : 'info'" effect="plain" size="small">{{ order.is_counted ? '是' : '否' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数据同步日期">{{ order.sync_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数据来源文件">{{ order.raw_data?.file || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 2. 时间信息 -->
      <h3 class="section-title">时间信息</h3>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="下单时间">{{ formatTime(order.order_time) }}</el-descriptions-item>
        <el-descriptions-item label="付款时间">{{ formatTime(order.pay_time) }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ formatTime(order.fulfill_time) }}</el-descriptions-item>
      </el-descriptions>

      <!-- 3. 买家信息 -->
      <h3 class="section-title">买家信息</h3>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="客户 / 收件人">{{ order.buyer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="买家账号">{{ order.buyer_account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="省份">{{ order.province || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 4. 金额信息 -->
      <h3 class="section-title">金额信息</h3>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="币种">{{ order.currency || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单总额">
          <span class="amount">{{ formatAmount(order.total_amount, order.currency) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="实付金额">
          <span class="amount">{{ formatAmount(order.paid_amount, order.currency) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="运费">{{ formatAmount(order.freight_amount, order.currency) }}</el-descriptions-item>
        <el-descriptions-item label="折扣">{{ formatAmount(order.discount_amount, order.currency) }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">
          <span :class="{ 'amount refund': Number(order.refund_amount) > 0 }">{{ formatAmount(order.refund_amount, order.currency) }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 5. 物流信息 -->
      <h3 class="section-title">物流信息</h3>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="物流单号">{{ order.logistics_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流公司">{{ order.logistics_company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品件数">{{ order.item_count ?? '-' }} 件（{{ order.item_kind_count ?? '-' }} 种）</el-descriptions-item>
      </el-descriptions>

      <!-- 6. 备注 -->
      <template v-if="order.remark">
        <h3 class="section-title">备注</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="备注内容">{{ order.remark }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 7. 商品明细 -->
      <template v-if="items.length">
        <h3 class="section-title">商品明细（{{ items.length }} 条）</h3>
        <el-table :data="items" border style="width: 100%">
          <el-table-column
            v-for="col in itemColumns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="120"
            show-overflow-tooltip
          >
            <template #default="{ row }">{{ displayValue(row[col]) }}</template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 8. 原始数据 -->
      <h3 class="section-title">平台原始数据</h3>
      <el-collapse>
        <el-collapse-item :title="`展开查看 ${platformOrderEntries.length} 个原始字段（来自 ${order.raw_data?.source || order.platform}）`">
          <el-table :data="platformOrderEntries" border style="width: 100%">
            <el-table-column prop="key" label="字段" width="240" show-overflow-tooltip />
            <el-table-column prop="value" label="值" min-width="300" show-overflow-tooltip>
              <template #default="{ row }">{{ displayValue(row.value) }}</template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-empty v-else-if="!loading" description="订单不存在或已被删除">
      <el-button type="primary" @click="goBack">返回列表</el-button>
    </el-empty>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getOrderDetail, PLATFORM_LABELS, STATUS_LABELS, type OrderDetail } from '@/api/order'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const order = ref<OrderDetail | null>(null)

const items = computed(() => order.value?.raw_data?.items || [])

// 商品明细动态列：取所有明细行键的并集，保持首次出现顺序
const itemColumns = computed(() => {
  const cols: string[] = []
  for (const item of items.value) {
    for (const key of Object.keys(item)) {
      if (!cols.includes(key)) cols.push(key)
    }
  }
  return cols
})

// 原始订单字段（过滤空值）
const platformOrderEntries = computed(() => {
  const raw = order.value?.raw_data?.order
  if (!raw) return []
  return Object.entries(raw)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([key, value]) => ({ key, value: String(value) }))
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const { data: res } = await getOrderDetail(route.params.id as string)
    if (res.code === 200) {
      order.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push('/orders')

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

const displayValue = (v: unknown) => {
  if (v === null || v === undefined) return '-'
  const s = String(v).trim()
  return s === '' ? '-' : s
}

onMounted(fetchDetail)
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

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-shrink: 0;

  .back-btn {
    border-radius: 12px;

    .el-icon {
      margin-right: 4px;
    }
  }

  .order-no {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
  }
}

.detail-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 20px 0 12px;
  padding-left: 10px;
  border-left: 3px solid #3b82f6;

  &:first-child {
    margin-top: 0;
  }
}

.amount {
  font-weight: 600;
  color: #0f172a;

  &.refund {
    color: #ef4444;
  }
}

:deep(.el-descriptions) {
  .el-descriptions__label {
    width: 120px;
    background: #f8fafc;
    color: #64748b;
    font-weight: 600;
  }

  .el-descriptions__content {
    color: #334155;
  }
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;

  th.el-table__cell {
    background: #f8fafc;
    color: #64748b;
    font-weight: 600;
    font-size: 13px;
  }
}

:deep(.el-collapse) {
  border: none;

  .el-collapse-item__header {
    font-size: 14px;
    color: #64748b;
    background: #f8fafc;
    border-radius: 12px;
    padding: 0 16px;
    border: 1px solid #f1f5f9;
  }

  .el-collapse-item__wrap {
    border: none;
  }
}
</style>
