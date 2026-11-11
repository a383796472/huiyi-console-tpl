<template>
  <div class="container" v-loading="loading">
    <!-- 顶部：返回 -->
    <div class="detail-header">
      <el-button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
    </div>

    <div class="detail-body" v-if="order">
      <!-- 关键指标概览 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">订单总额</span>
          <span class="summary-value">{{ formatAmount(order.total_amount, order.currency) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">实付金额</span>
          <span class="summary-value is-primary">{{ formatAmount(order.paid_amount, order.currency) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">退款金额</span>
          <span class="summary-value" :class="{ 'is-danger': Number(order.refund_amount) > 0 }">
            {{ formatAmount(order.refund_amount, order.currency) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">商品件数</span>
          <span class="summary-value">
            {{ order.item_count ?? '-' }}<em class="summary-unit">件 / {{ order.item_kind_count ?? '-' }} 种</em>
          </span>
        </div>
      </div>

      <div class="card-grid">
        <!-- 基本信息 -->
        <section class="section-card span-2">
          <header class="card-head"><i class="dot"></i>基本信息</header>
          <div class="card-body">
            <div class="field-grid cols-3">
              <div class="field">
                <span class="field-label">平台</span>
                <span class="field-value">{{ PLATFORM_LABELS[order.platform] || order.platform || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">店铺名称</span>
                <span class="field-value">{{ order.shop_name || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">数据同步日期</span>
                <span class="field-value">{{ order.sync_date || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">订单号</span>
                <span class="field-value">{{ order.order_no || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">线上订单号</span>
                <span class="field-value">{{ order.online_order_no || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">归一化状态</span>
                <span class="field-value">{{ STATUS_LABELS[order.status_code || ''] || order.status_code || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">是否计入业绩</span>
                <span class="field-value">
                  <el-tag :type="order.is_counted ? 'success' : 'info'" effect="plain" size="small">
                    {{ order.is_counted ? '是' : '否' }}
                  </el-tag>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 时间进度 -->
        <section class="section-card">
          <header class="card-head"><i class="dot"></i>时间进度</header>
          <div class="card-body">
            <div class="timeline">
              <div class="timeline-item" :class="{ 'is-done': !!order.order_time }">
                <span class="timeline-dot"></span>
                <div class="timeline-body">
                  <span class="timeline-label">下单</span>
                  <span class="timeline-time">{{ formatTime(order.order_time) }}</span>
                </div>
              </div>
              <div class="timeline-item" :class="{ 'is-done': !!order.pay_time }">
                <span class="timeline-dot"></span>
                <div class="timeline-body">
                  <span class="timeline-label">付款</span>
                  <span class="timeline-time">{{ formatTime(order.pay_time) }}</span>
                </div>
              </div>
              <div class="timeline-item" :class="{ 'is-done': !!order.fulfill_time }">
                <span class="timeline-dot"></span>
                <div class="timeline-body">
                  <span class="timeline-label">发货</span>
                  <span class="timeline-time">{{ formatTime(order.fulfill_time) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 买家信息 -->
        <section class="section-card">
          <header class="card-head"><i class="dot"></i>买家信息</header>
          <div class="card-body">
            <div class="field-grid cols-1">
              <div class="field">
                <span class="field-label">客户 / 收件人</span>
                <span class="field-value">{{ order.buyer_name || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">买家账号</span>
                <span class="field-value">{{ order.buyer_account || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">省份</span>
                <span class="field-value">{{ order.province || '-' }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 金额明细 -->
        <section class="section-card">
          <header class="card-head"><i class="dot"></i>金额明细</header>
          <div class="card-body">
            <div class="field-grid cols-2">
              <div class="field">
                <span class="field-label">币种</span>
                <span class="field-value">{{ order.currency || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">订单总额</span>
                <span class="field-value amount">{{ formatAmount(order.total_amount, order.currency) }}</span>
              </div>
              <div class="field">
                <span class="field-label">实付金额</span>
                <span class="field-value amount">{{ formatAmount(order.paid_amount, order.currency) }}</span>
              </div>
              <div class="field">
                <span class="field-label">运费</span>
                <span class="field-value">{{ formatAmount(order.freight_amount, order.currency) }}</span>
              </div>
              <div class="field">
                <span class="field-label">折扣</span>
                <span class="field-value">{{ formatAmount(order.discount_amount, order.currency) }}</span>
              </div>
              <div class="field">
                <span class="field-label">退款金额</span>
                <span class="field-value amount" :class="{ refund: Number(order.refund_amount) > 0 }">
                  {{ formatAmount(order.refund_amount, order.currency) }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 物流信息 -->
        <section class="section-card">
          <header class="card-head"><i class="dot"></i>物流信息</header>
          <div class="card-body">
            <div class="field-grid cols-1">
              <div class="field">
                <span class="field-label">物流单号</span>
                <span class="field-value">{{ order.logistics_no || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">物流公司</span>
                <span class="field-value">{{ order.logistics_company || '-' }}</span>
              </div>
              <div class="field">
                <span class="field-label">商品件数</span>
                <span class="field-value">
                  {{ order.item_count ?? '-' }} 件（{{ order.item_kind_count ?? '-' }} 种）
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 备注 -->
        <section class="section-card span-2" v-if="order.remark">
          <header class="card-head"><i class="dot"></i>备注</header>
          <div class="card-body">
            <p class="remark-text">{{ order.remark }}</p>
          </div>
        </section>

        <!-- 商品明细 -->
        <section class="section-card span-2" v-if="items.length">
          <header class="card-head">
            <i class="dot"></i>商品明细<em class="count">共 {{ items.length }} 条</em>
          </header>
          <div class="card-body">
            <el-table :data="items" border stripe style="width: 100%">
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
          </div>
        </section>

        <!-- 平台原始数据 -->
        <section class="section-card span-2">
          <header class="card-head"><i class="dot"></i>平台原始数据<em class="count">共 {{ platformOrderEntries.length }} 个字段</em></header>
          <div class="card-body">
            <el-collapse>
              <el-collapse-item :title="`展开查看原始字段（来自 ${order.raw_data?.source || order.platform}）`">
                <el-table :data="platformOrderEntries" border stripe style="width: 100%">
                  <el-table-column prop="key" label="字段" width="240" show-overflow-tooltip />
                  <el-table-column prop="value" label="值" min-width="300" show-overflow-tooltip>
                    <template #default="{ row }">{{ displayValue(row.value) }}</template>
                  </el-table-column>
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </div>
        </section>
      </div>
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
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
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

/* ---------- 顶部标题 ---------- */
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;

  .back-btn {
    border-radius: 12px;

    .el-icon {
      margin-right: 4px;
    }
  }
}

/* ---------- 关键指标 ---------- */
.summary-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 18px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #eef2f7;

  .summary-label {
    font-size: 13px;
    color: #94a3b8;
  }

  .summary-value {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;

    &.is-primary {
      color: #2563eb;
    }

    &.is-danger {
      color: #ef4444;
    }

    .summary-unit {
      margin-left: 6px;
      font-size: 12px;
      font-weight: 400;
      font-style: normal;
      color: #94a3b8;
    }
  }
}

/* ---------- 卡片分区 ---------- */
.detail-body {
  flex: 1;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.section-card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  overflow: hidden;

  &.span-2 {
    grid-column: 1 / -1;
  }
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f7;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;

  .dot {
    width: 4px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
  }

  .count {
    font-size: 12px;
    font-weight: 400;
    font-style: normal;
    color: #94a3b8;
  }
}

.card-body {
  padding: 12px 18px 14px;
}

/* ---------- 字段列表 ---------- */
.field-grid {
  display: grid;
  column-gap: 28px;

  &.cols-1 {
    grid-template-columns: minmax(0, 1fr);
  }

  &.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.field {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  padding: 8px 0;
  border-bottom: 1px dashed #f1f5f9;

  .field-label {
    flex: 0 0 96px;
    font-size: 13px;
    color: #94a3b8;
    white-space: nowrap;
  }

  .field-value {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    color: #1e293b;
    line-height: 1.5;
    word-break: break-word;

    &.amount {
      font-weight: 600;
      color: #0f172a;

      &.refund {
        color: #ef4444;
      }
    }
  }
}

.field-grid.cols-1 .field:last-child,
.field-grid.cols-2 .field:nth-last-child(-n + 2) {
  border-bottom: none;
}

/* 基本信息去掉两个字段后余 7 个，末行仅一个：占满整行，避免分隔线断裂 */
.field-grid.cols-3 .field:last-child {
  grid-column: 1 / -1;
  border-bottom: none;
}

/* ---------- 时间进度 ---------- */
.timeline {
  display: flex;
  flex-direction: column;
  padding: 4px 0 2px;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;

  &::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 17px;
    bottom: 0;
    width: 1px;
    background: #e2e8f0;
  }

  &:last-child {
    padding-bottom: 0;

    &::before {
      display: none;
    }
  }

  .timeline-dot {
    flex-shrink: 0;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #cbd5e1;
    box-shadow: 0 0 0 3px #f1f5f9;
  }

  .timeline-body {
    display: flex;
    flex: 1;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .timeline-label {
    font-size: 13px;
    color: #94a3b8;
  }

  .timeline-time {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  &.is-done {
    .timeline-dot {
      background: #3b82f6;
      box-shadow: 0 0 0 3px #dbeafe;
    }

    .timeline-label {
      color: #64748b;
    }
  }
}

/* ---------- 备注 ---------- */
.remark-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ---------- 表格 / 折叠面板 ---------- */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;

  th.el-table__cell {
    background: #f8fafc;
    color: #64748b;
    font-weight: 600;
    font-size: 13px;
  }

  td.el-table__cell {
    color: #334155;
  }
}

:deep(.el-collapse) {
  border: none;

  .el-collapse-item__header {
    padding: 0 16px;
    height: 44px;
    font-size: 14px;
    color: #64748b;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
  }

  .el-collapse-item__wrap {
    border: none;
  }
}

@media (max-width: 1200px) {
  .summary-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .card-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .field-grid.cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
