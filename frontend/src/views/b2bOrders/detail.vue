<template>
  <div class="container" v-loading="loading">
    <div class="detail-header">
      <el-button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <div class="title-area" v-if="order">
        <span class="title">{{ order.order_no }}</span>
        <el-tag :type="editing ? 'warning' : 'info'" effect="light" size="small">
          {{ editing ? '编辑中' : '查看' }}
        </el-tag>
      </div>
      <div class="header-actions" v-if="order">
        <template v-if="editing">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </template>
        <el-button v-else type="primary" plain @click="startEdit">编辑</el-button>
      </div>
    </div>

    <div class="detail-body" v-if="order">
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">价税合计</span>
          <span class="summary-value is-primary">{{ formatAmount(order.total_amount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">毛利</span>
          <span class="summary-value">{{ formatAmount(order.gross_profit) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">销售数量</span>
          <span class="summary-value">
            {{ formatNumber(order.item_count) }}<em class="summary-unit">件 / {{ order.line_count }} 行</em>
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">业务日期</span>
          <span class="summary-value is-date">{{ order.biz_date || '-' }}</span>
        </div>
      </div>

      <div class="card-grid">
        <!-- 基本信息 -->
        <section class="section-card span-2">
          <header class="card-head"><i class="dot"></i>基本信息</header>
          <div class="card-body">
            <div v-if="!editing" class="field-grid cols-3">
              <div class="field"><span class="field-label">单据编号</span><span class="field-value">{{ order.order_no }}</span></div>
              <div class="field"><span class="field-label">单据类型</span><span class="field-value">{{ order.doc_type || '-' }}</span></div>
              <div class="field"><span class="field-label">单据状态</span><span class="field-value">{{ order.status || '-' }}</span></div>
              <div class="field"><span class="field-label">部门</span><span class="field-value">{{ order.department || '-' }}</span></div>
              <div class="field"><span class="field-label">销售业务员</span><span class="field-value">{{ order.sales_person || '-' }}</span></div>
              <div class="field"><span class="field-label">业务员</span><span class="field-value">{{ order.clerk || '-' }}</span></div>
              <div class="field"><span class="field-label">供应商</span><span class="field-value">{{ order.supplier || '-' }}</span></div>
              <div class="field"><span class="field-label">采购订单号</span><span class="field-value">{{ order.purchase_order_no || '-' }}</span></div>
              <div class="field"><span class="field-label">新老客户</span><span class="field-value">{{ order.customer_type || '-' }}</span></div>
              <div class="field"><span class="field-label">交货方式</span><span class="field-value">{{ order.delivery_method || '-' }}</span></div>
              <div class="field"><span class="field-label">创建时间</span><span class="field-value">{{ order.created_time || '-' }}</span></div>
              <div class="field"><span class="field-label">最后更新</span><span class="field-value">{{ order.updated_at || '-' }}</span></div>
            </div>

            <div v-else class="form-grid cols-3">
              <div class="form-item">
                <label>单据类型</label>
                <el-select v-model="form.doc_type" filterable allow-create clearable placeholder="请选择">
                  <el-option v-for="t in options.docTypes" :key="t" :label="t" :value="t" />
                </el-select>
              </div>
              <div class="form-item">
                <label>单据状态</label>
                <el-select v-model="form.status" filterable allow-create clearable placeholder="请选择">
                  <el-option v-for="s in options.statuses" :key="s" :label="s" :value="s" />
                </el-select>
              </div>
              <div class="form-item">
                <label>部门</label>
                <el-select v-model="form.department" filterable allow-create clearable placeholder="请选择">
                  <el-option v-for="d in options.departments" :key="d" :label="d" :value="d" />
                </el-select>
              </div>
              <div class="form-item">
                <label>销售业务员</label>
                <el-select v-model="form.sales_person" filterable allow-create clearable placeholder="请选择">
                  <el-option v-for="p in options.salesPeople" :key="p" :label="p" :value="p" />
                </el-select>
              </div>
              <div class="form-item">
                <label>业务员</label>
                <el-input v-model="form.clerk" placeholder="业务员" />
              </div>
              <div class="form-item">
                <label>供应商</label>
                <el-input v-model="form.supplier" placeholder="供应商" />
              </div>
              <div class="form-item">
                <label>采购订单号</label>
                <el-input v-model="form.purchase_order_no" placeholder="采购订单号" />
              </div>
              <div class="form-item">
                <label>新老客户</label>
                <el-select v-model="form.customer_type" clearable placeholder="请选择">
                  <el-option label="新客户" value="新客户" />
                  <el-option label="老客户" value="老客户" />
                </el-select>
              </div>
              <div class="form-item">
                <label>交货方式</label>
                <el-input v-model="form.delivery_method" placeholder="交货方式" />
              </div>
            </div>
          </div>
        </section>

        <!-- 客户信息 -->
        <section class="section-card">
          <header class="card-head"><i class="dot"></i>客户信息</header>
          <div class="card-body">
            <div v-if="!editing" class="field-grid cols-1">
              <div class="field"><span class="field-label">客户</span><span class="field-value">{{ order.customer || '-' }}</span></div>
              <div class="field"><span class="field-label">地区</span><span class="field-value">{{ regionText }}</span></div>
              <div class="field"><span class="field-label">客户来源</span><span class="field-value">{{ order.customer_source || '-' }}</span></div>
              <div class="field"><span class="field-label">客户邮箱</span><span class="field-value">{{ order.customer_email || '-' }}</span></div>
              <div class="field"><span class="field-label">发货情况</span><span class="field-value">{{ order.ship_status || '-' }}</span></div>
            </div>
            <div v-else class="form-grid cols-1">
              <div class="form-item">
                <label>客户</label>
                <el-input v-model="form.customer" placeholder="客户名称" />
              </div>
              <div class="form-item">
                <label>国家</label>
                <el-input v-model="form.country" placeholder="国家" />
              </div>
              <div class="form-item">
                <label>省份/地区</label>
                <el-input v-model="form.province" placeholder="省份/地区" />
              </div>
              <div class="form-item">
                <label>城市</label>
                <el-input v-model="form.city" placeholder="城市" />
              </div>
              <div class="form-item">
                <label>客户来源</label>
                <el-input v-model="form.customer_source" placeholder="客户来源" />
              </div>
              <div class="form-item">
                <label>客户邮箱</label>
                <el-input v-model="form.customer_email" placeholder="客户邮箱" />
              </div>
              <div class="form-item">
                <label>发货情况</label>
                <el-input v-model="form.ship_status" placeholder="发货情况" />
              </div>
            </div>
          </div>
        </section>

        <!-- 收货地址 -->
        <section class="section-card">
          <header class="card-head"><i class="dot"></i>收货地址</header>
          <div class="card-body">
            <p v-if="!editing" class="remark-text">{{ order.address || '-' }}</p>
            <el-input v-else v-model="form.address" type="textarea" :rows="5" placeholder="收货人 / 电话 / 地址" />
          </div>
        </section>

        <!-- 备注 -->
        <section class="section-card span-2">
          <header class="card-head"><i class="dot"></i>订单备注</header>
          <div class="card-body">
            <p v-if="!editing" class="remark-text">{{ order.remark || '-' }}</p>
            <el-input v-else v-model="form.remark" type="textarea" :rows="3" placeholder="订单备注" />
          </div>
        </section>

        <!-- 商品明细 -->
        <section class="section-card span-2">
          <header class="card-head">
            <i class="dot"></i>商品明细<em class="count">共 {{ items.length }} 行</em>
          </header>
          <div class="card-body">
            <el-table :data="items" border stripe style="width: 100%" size="small">
              <el-table-column prop="line_no" label="行号" width="66" align="center" />
              <el-table-column prop="material_no" label="物料编号" min-width="140" show-overflow-tooltip />
              <el-table-column prop="material_name" label="物料名称" min-width="220" show-overflow-tooltip />
              <el-table-column prop="spec" label="规格型号" min-width="160" show-overflow-tooltip />
              <el-table-column label="数量" width="120" align="right">
                <template #default="{ row }">
                  <el-input-number
                    v-if="editing"
                    v-model="row.quantity"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    size="small"
                    class="cell-input"
                  />
                  <span v-else>{{ formatNumber(row.quantity) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="销售单价" width="120" align="right">
                <template #default="{ row }">
                  <el-input-number
                    v-if="editing"
                    v-model="row.unit_price"
                    :min="0"
                    :precision="4"
                    :controls="false"
                    size="small"
                    class="cell-input"
                  />
                  <span v-else>{{ formatAmount(row.unit_price) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="价税合计" width="130" align="right">
                <template #default="{ row }">
                  <el-input-number
                    v-if="editing"
                    v-model="row.tax_amount"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    size="small"
                    class="cell-input"
                  />
                  <span v-else class="amount">{{ formatAmount(row.tax_amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="毛利" width="110" align="right">
                <template #default="{ row }">{{ formatAmount(row.gross_profit) }}</template>
              </el-table-column>
              <el-table-column label="毛利率" width="90" align="right">
                <template #default="{ row }">{{ formatRate(row.gross_profit_rate) }}</template>
              </el-table-column>
              <el-table-column label="备注" min-width="200">
                <template #default="{ row }">
                  <el-input v-if="editing" v-model="row.remark" size="small" placeholder="备注" />
                  <span v-else class="ellipsis" :title="row.remark || ''">{{ row.remark || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getB2bOrderDetail,
  getB2bOrderOptions,
  updateB2bOrder,
  type B2bOrderDetail,
  type B2bOrderItem,
  type B2bOrderOptions
} from '@/api/b2bOrder'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const editing = ref(false)
const order = ref<B2bOrderDetail | null>(null)
const items = ref<B2bOrderItem[]>([])
const options = reactive<B2bOrderOptions>({ departments: [], docTypes: [], statuses: [], salesPeople: [] })

const EDITABLE_HEADER = [
  'doc_type', 'supplier', 'status', 'department', 'sales_person', 'clerk',
  'purchase_order_no', 'customer_type', 'customer', 'delivery_method', 'address',
  'country', 'province', 'city', 'customer_source', 'ship_status', 'customer_email', 'remark'
] as const

const form = reactive<Record<string, any>>({})

const regionText = computed(() => {
  const parts = [order.value?.country, order.value?.province, order.value?.city].filter(Boolean)
  return parts.length ? parts.join(' / ') : '-'
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const { data: res } = await getB2bOrderDetail(route.params.id as string)
    if (res.code === 200) {
      order.value = res.data
      items.value = (res.data.items || []).map((it: B2bOrderItem) => ({ ...it }))
    }
  } finally {
    loading.value = false
  }
}

const fetchOptions = async () => {
  const { data: res } = await getB2bOrderOptions()
  if (res.code === 200) Object.assign(options, res.data)
}

const startEdit = () => {
  if (!order.value) return
  EDITABLE_HEADER.forEach((key) => {
    form[key] = order.value?.[key] ?? ''
  })
  items.value = (order.value.items || []).map((it) => ({
    ...it,
    quantity: Number(it.quantity) || 0,
    unit_price: it.unit_price === null || it.unit_price === '' ? null : Number(it.unit_price),
    tax_amount: Number(it.tax_amount) || 0
  }))
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  if (order.value) items.value = (order.value.items || []).map((it) => ({ ...it }))
}

const save = async () => {
  if (!order.value) return
  saving.value = true
  try {
    const payload: Record<string, unknown> = {}
    EDITABLE_HEADER.forEach((key) => {
      payload[key] = form[key] === '' ? null : form[key]
    })
    payload.items = items.value.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_amount: it.tax_amount,
      remark: it.remark
    }))

    const { data: res } = await updateB2bOrder(order.value.id, payload)
    if (res.code === 200) {
      order.value = res.data
      items.value = (res.data.items || []).map((it: B2bOrderItem) => ({ ...it }))
      editing.value = false
      ElMessage.success('保存成功')
    }
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const goBack = () => router.push('/b2b-orders')

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

const formatRate = (v: unknown) => {
  const n = Number(v)
  if (!Number.isFinite(n) || v === null || v === '') return '-'
  return `${(n * 100).toFixed(2)}%`
}

onMounted(() => {
  fetchOptions()
  fetchDetail()
})
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

  .title-area {
    display: flex;
    align-items: center;
    gap: 10px;

    .title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
  }

  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 10px;
  }
}

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

    &.is-date {
      font-size: 17px;
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

.field-grid {
  display: grid;
  column-gap: 28px;

  &.cols-1 {
    grid-template-columns: minmax(0, 1fr);
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
    flex: 0 0 88px;
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
  }
}

.form-grid {
  display: grid;
  column-gap: 20px;
  row-gap: 14px;

  &.cols-1 {
    grid-template-columns: minmax(0, 1fr);
  }

  &.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      font-size: 13px;
      color: #94a3b8;
    }
  }
}

.remark-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-word;
}

.ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount {
  font-weight: 600;
  color: #0f172a;
}

.cell-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    padding: 0 6px;
  }

  :deep(.el-input__inner) {
    text-align: right;
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

  td.el-table__cell {
    color: #334155;
  }
}

@media (max-width: 1200px) {
  .summary-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .field-grid.cols-3,
  .form-grid.cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
