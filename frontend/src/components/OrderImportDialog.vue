<template>
  <el-dialog
    :model-value="modelValue"
    :title="type === 'cend' ? '导入 C 端订单' : '导入 B 端订单'"
    width="560px"
    @update:model-value="close"
    @closed="reset"
  >
    <div class="import-body">
      <div class="field">
        <span class="field-label">导入范围</span>
        <el-radio-group v-model="range">
          <el-radio-button value="today">当天</el-radio-button>
          <el-radio-button value="month">当月</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>
      </div>
      <p class="hint">{{ hintText }}</p>

      <el-upload
        v-model:file-list="fileList"
        drag
        multiple
        :auto-upload="false"
        :limit="20"
        accept=".csv,.json,.xlsx,.xls"
        :on-exceed="handleExceed"
      >
        <div class="upload-inner">
          <div class="upload-title">点击或拖拽文件到此处</div>
          <div class="upload-sub">支持一次选择多个文件，自动识别平台</div>
        </div>
      </el-upload>

      <div v-if="result" class="result">
        <div class="result-title">
          <span>导入完成</span>
          <span class="result-ref">范围基准日：{{ result.refDate || '-' }}</span>
        </div>
        <div class="result-main">
          <template v-if="type === 'cend'">
            本次导入 <b>{{ result.total }}</b> 笔订单
          </template>
          <template v-else>
            本次导入 <b>{{ result.orders }}</b> 单 / <b>{{ result.items }}</b> 行明细 / 金额
            <b>¥{{ formatAmount(result.amount) }}</b>
          </template>
        </div>
        <div v-if="type === 'cend' && platformList.length" class="platform-list">
          <span v-for="p in platformList" :key="p.key" class="platform-item">
            {{ PLATFORM_LABELS[p.key] || p.key }} {{ p.value }} 笔
          </span>
        </div>
        <div v-if="result.skippedByRange" class="result-sub">范围外跳过 {{ result.skippedByRange }} 笔</div>
        <div v-if="result.skippedNoDate" class="result-sub">缺少订单日期跳过 {{ result.skippedNoDate }} 笔</div>
        <div v-if="type !== 'cend' && result.files?.some((f: any) => f.skipped)" class="result-sub">
          范围外跳过 {{ result.files.reduce((s: number, f: any) => s + (f.skipped || 0), 0) }} 单
        </div>

        <div class="file-list">
          <div v-for="f in result.files" :key="f.name" class="file-row">
            <span class="file-name" :title="f.name">{{ f.name }}</span>
            <span v-if="f.error" class="file-error">{{ f.error }}</span>
            <span v-else class="file-ok">{{ f.count }} 条</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">{{ result ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!result" type="primary" :loading="submitting" @click="handleSubmit">开始导入</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ElMessage, type UploadUserFile } from 'element-plus'
import { importOrders, PLATFORM_LABELS } from '@/api/order'
import { importB2bOrders } from '@/api/b2bOrder'

const props = defineProps<{
  modelValue: boolean
  type: 'cend' | 'b2b'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const range = ref<'today' | 'month' | 'all'>('today')
const fileList = ref<UploadUserFile[]>([])
const submitting = ref(false)
const result = ref<any>(null)

const hintText = computed(() =>
  props.type === 'cend'
    ? '支持 Shopify（orders_*.csv + order_lines_*.csv）、聚水潭 orders_raw.json、1688 orders_export*.csv、天猫 ExportOrderList*.xlsx'
    : '支持金蝶「销售订单」月报 Excel（表头需包含「单据编号行」），可一次选择多个月报文件'
)

const platformList = computed(() => {
  const map = result.value?.byPlatform || {}
  return Object.keys(map).map((key) => ({ key, value: map[key] }))
})

const formatAmount = (v: unknown) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.00'
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const close = () => emit('update:modelValue', false)

const reset = () => {
  range.value = 'today'
  fileList.value = []
  result.value = null
  submitting.value = false
}

const handleExceed = () => {
  ElMessage.warning('一次最多上传 20 个文件')
}

const handleSubmit = async () => {
  if (!fileList.value.length) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  const formData = new FormData()
  formData.append('range', range.value)
  fileList.value.forEach((f) => {
    if (f.raw) formData.append('files', f.raw)
  })

  submitting.value = true
  try {
    const { data: res } = props.type === 'cend' ? await importOrders(formData) : await importB2bOrders(formData)
    if (res.code === 200) {
      result.value = res.data
      ElMessage.success(res.message || '导入完成')
      emit('success')
    } else {
      ElMessage.error(res.message || '导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '导入失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.import-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  align-items: center;
  gap: 14px;
}

.field-label {
  font-size: 13px;
  color: #64748b;
}

.hint {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.upload-inner {
  padding: 10px 0;

  .upload-title {
    font-size: 14px;
    color: #334155;
    font-weight: 600;
  }

  .upload-sub {
    margin-top: 6px;
    font-size: 12px;
    color: #94a3b8;
  }
}

.result {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f0f9ff;
  border: 1px solid #dbeafe;
}

.result-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #1d4ed8;
}

.result-ref {
  font-size: 12px;
  font-weight: 400;
  color: #64748b;
}

.result-main {
  margin-top: 8px;
  font-size: 13px;
  color: #334155;

  b {
    color: #0f172a;
  }
}

.platform-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-item {
  padding: 2px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #dbeafe;
  font-size: 12px;
  color: #1e40af;
}

.result-sub {
  margin-top: 6px;
  font-size: 12px;
  color: #b45309;
}

.file-list {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.file-name {
  flex: 1;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-ok {
  color: #16a34a;
  flex-shrink: 0;
}

.file-error {
  color: #dc2626;
  flex-shrink: 0;
  max-width: 60%;
}
</style>
