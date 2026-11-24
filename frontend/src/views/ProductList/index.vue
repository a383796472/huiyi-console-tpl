<template>
  <div class="container">

    <div class="search-area">
      <el-button v-if="canManage" type="primary" @click="handleClick">
        <el-icon style="margin-right: 4px;"><Plus /></el-icon>
        添加产品
      </el-button>
      <el-button @click="handleExport">
        <el-icon style="margin-right: 4px;"><Download /></el-icon>
        导出Excel
      </el-button>
      <el-select v-model="searchType" class="search-type-select">
        <el-option label="按产品名称或SKU" value="all"></el-option>
      </el-select>
      <el-input
        v-model="searchKeyword"
        placeholder="请输入产品名称或SKU搜索"
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
      <el-select v-model="filterSeries" placeholder="全部系列" clearable class="series-filter" @change="handleSearch">
        <el-option v-for="s in seriesOptions" :key="s" :label="s" :value="s"></el-option>
      </el-select>
      <el-button v-if="canManage" @click="seriesDialogVisible = true">
        <el-icon style="margin-right: 4px;"><Setting /></el-icon>
        管理系列
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" style="width: 100%" height="calc(100vh - 230px)" v-loading="loading" stripe>
        <el-table-column prop="sku" label="SKU" fixed="left" width="130">
          <template #default="{ row }">{{ row.sku || '-' }}</template>
        </el-table-column>
        <el-table-column label="产品图片" fixed="left" width="80" align="center">
          <template #default="{ row }">
            <div class="product-image-cell">
              <img
                v-if="getProductImage(row)"
                :src="getImgSrc(row)"
                @error="onImgError"
                @load="onImgLoad"
                :style="{ display: imgLoadedMap[row.id] !== false ? '' : 'none' }"
                alt=""
              />
              <div v-if="!getProductImage(row) || imgLoadedMap[row.id] === false" class="no-image-placeholder">无图</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="product_code" label="产品编号" fixed="left" width="110">
          <template #default="{ row }">{{ row.product_code || '-' }}</template>
        </el-table-column>
        <el-table-column prop="series" label="系列" min-width="130">
          <template #default="{ row }">
            <el-tag :type="getSeriesTagType(row.series)">{{ row.series || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="series_code" label="系列编号" min-width="110">
          <template #default="{ row }">{{ row.series_code || '-' }}</template>
        </el-table-column>
        <el-table-column prop="product_status" label="产品状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.product_status)">{{ row.product_status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ean_code" label="EAN码" min-width="130">
          <template #default="{ row }">{{ row.ean_code || '-' }}</template>
        </el-table-column>
        <el-table-column prop="us_barcode" label="美国条形码编号" min-width="150">
          <template #default="{ row }">{{ row.us_barcode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="hs_code" label="海关编码" min-width="120">
          <template #default="{ row }">{{ row.hs_code || '-' }}</template>
        </el-table-column>
        <el-table-column prop="product_name" label="产品名称" min-width="160">
          <template #default="{ row }">
            <el-tooltip :content="row.product_name || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.product_name || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="english_name" label="英文产品名称" min-width="140">
          <template #default="{ row }">
            <el-tooltip :content="row.english_name || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.english_name || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="package_english_name" label="产品包装英文名称" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.package_english_name || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.package_english_name || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="model" label="型号" min-width="100">
          <template #default="{ row }">
            <el-tooltip :content="row.model || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.model || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="china_retail_price" label="中国零售价" min-width="110" align="right">
          <template #default="{ row }">{{ row.china_retail_price || '-' }}</template>
        </el-table-column>
        <el-table-column prop="usd_price" label="美国（USD）" min-width="110" align="right">
          <template #default="{ row }">{{ row.usd_price || '-' }}</template>
        </el-table-column>
        <el-table-column prop="eur_price" label="欧洲（€）" min-width="110" align="right">
          <template #default="{ row }">{{ row.eur_price || '-' }}</template>
        </el-table-column>
        <el-table-column prop="compatible_vehicles" label="适配车型" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.compatible_vehicles || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.compatible_vehicles || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="selling_points" label="产品卖点" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.selling_points || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.selling_points || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="specs" label="规格参数" min-width="140">
          <template #default="{ row }">
            <el-tooltip :content="row.specs || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.specs || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="standard_config" label="标准配置（改进后需要修改）" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.standard_config || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.standard_config || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="production_process" label="生产工艺" min-width="110">
          <template #default="{ row }">
            <el-tooltip :content="row.production_process || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.production_process || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="material" label="材料" min-width="100">
          <template #default="{ row }">
            <el-tooltip :content="row.material || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.material || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色" min-width="90">
          <template #default="{ row }">{{ row.color || '-' }}</template>
        </el-table-column>
        <el-table-column prop="net_weight" label="产品净重（KG）" min-width="110" align="right">
          <template #default="{ row }">{{ row.net_weight || '-' }}</template>
        </el-table-column>
        <el-table-column prop="gross_weight" label="毛重（KG）（包含产品，包装）" min-width="180" align="right">
          <template #default="{ row }">{{ row.gross_weight || '-' }}</template>
        </el-table-column>
        <el-table-column prop="whole_box_weight" label="整箱毛重（KG）" min-width="120" align="right">
          <template #default="{ row }">{{ row.whole_box_weight || '-' }}</template>
        </el-table-column>
        <el-table-column prop="packaging_size" label="包装规格（MM）" min-width="130">
          <template #default="{ row }">{{ row.packaging_size || '-' }}</template>
        </el-table-column>
        <el-table-column label="品牌包装图片" width="80" align="center">
          <template #default="{ row }">
            <div class="product-image-cell">
              <img
                v-if="getBrandPackageImage(row)"
                :src="getBrandPackageImgSrc(row)"
                @error="onImgError"
                @load="onImgLoad"
                :style="{ display: imgLoadedMap[row.id] !== false ? '' : 'none' }"
                alt=""
              />
              <div v-if="!getBrandPackageImage(row) || imgLoadedMap[row.id] === false" class="no-image-placeholder">无图</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="inner_box_size" label="内小箱规格（MM）" min-width="150">
          <template #default="{ row }">{{ row.inner_box_size || '-' }}</template>
        </el-table-column>
        <el-table-column prop="outer_box_size" label="外大箱规格（MM）" min-width="150">
          <template #default="{ row }">{{ row.outer_box_size || '-' }}</template>
        </el-table-column>
        <el-table-column prop="inner_box_qty" label="内箱装箱数量" min-width="110">
          <template #default="{ row }">{{ row.inner_box_qty || '-' }}</template>
        </el-table-column>
        <el-table-column prop="outer_box_qty" label="外箱装箱数量" min-width="110" align="right">
          <template #default="{ row }">{{ row.outer_box_qty || '-' }}</template>
        </el-table-column>
        <el-table-column prop="packing_qty" label="装箱数量" min-width="90">
          <template #default="{ row }">{{ row.packing_qty || '-' }}</template>
        </el-table-column>
        <el-table-column prop="moq" label="MOQ" min-width="80">
          <template #default="{ row }">{{ row.moq || '-' }}</template>
        </el-table-column>
        <el-table-column prop="inner_box_sku" label="内箱SKU代码（ICS）" min-width="150">
          <template #default="{ row }">{{ row.inner_box_sku || '-' }}</template>
        </el-table-column>
        <el-table-column prop="outer_box_sku" label="外箱SKU代码(MCS)" min-width="150">
          <template #default="{ row }">{{ row.outer_box_sku || '-' }}</template>
        </el-table-column>
        <el-table-column prop="inner_barcode" label="内纸箱条形码（ICB）" min-width="160">
          <template #default="{ row }">{{ row.inner_barcode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="product_supplying" label="产品供应中" min-width="100">
          <template #default="{ row }">{{ row.product_supplying || '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark_2" label="备注（2）" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.remark_2 || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.remark_2 || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="cost_1" label="成本（1）" min-width="90" align="right">
          <template #default="{ row }">{{ row.cost_1 || '-' }}</template>
        </el-table-column>
        <el-table-column prop="suggested_price" label="建议销售价" min-width="100" align="right">
          <template #default="{ row }">{{ row.suggested_price || '-' }}</template>
        </el-table-column>
        <el-table-column prop="competitor_price_ql" label="海外竞对参考价-美（quadlock）" min-width="200">
          <template #default="{ row }">{{ row.competitor_price_ql || '-' }}</template>
        </el-table-column>
        <el-table-column prop="competitor_price_sp" label="海外竞对参考价-美（sp）" min-width="180">
          <template #default="{ row }">{{ row.competitor_price_sp || '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.remark || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.remark || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="成本" min-width="80" align="right">
          <template #default="{ row }">{{ row.cost || '-' }}</template>
        </el-table-column>
        <el-table-column prop="suggested_price_1" label="建议销售价（1）" min-width="110" align="right">
          <template #default="{ row }">{{ row.suggested_price_1 || '-' }}</template>
        </el-table-column>
        <el-table-column prop="competitor_price_ql_num" label="海外竞对参考价-美：ql" min-width="160" align="right">
          <template #default="{ row }">{{ row.competitor_price_ql_num || '-' }}</template>
        </el-table-column>
        <el-table-column prop="competitor_price_sp_num" label="海外竞对参考价-美：SP" min-width="160" align="right">
          <template #default="{ row }">{{ row.competitor_price_sp_num || '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark_1" label="备注（1）" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.remark_1 || ''" placement="top" effect="dark" popper-class="wrap-tooltip">
              <span class="cell-ellipsis">{{ row.remark_1 || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="150" align="center">
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

    <el-dialog v-model="seriesDialogVisible" title="产品系列管理" width="480px" @closed="newSeriesName = ''">
      <div class="series-add">
        <el-input
          v-model="newSeriesName"
          placeholder="输入新系列名称，如 MM系列"
          maxlength="50"
          @keyup.enter="handleAddSeries"
        />
        <el-button type="primary" :loading="seriesAdding" @click="handleAddSeries">添加</el-button>
      </div>
      <div class="series-list" v-loading="seriesLoading">
        <div v-for="s in seriesList" :key="s.id" class="series-row">
          <div class="series-info">
            <template v-if="editingId === s.id">
              <el-input
                v-model="editingName"
                size="small"
                maxlength="50"
                style="width: 160px"
                @keyup.enter="handleSaveEdit"
                @keyup.escape="editingId = null"
                ref="editInputRef"
              />
              <el-button link type="success" @click="handleSaveEdit">保存</el-button>
              <el-button link @click="editingId = null">取消</el-button>
            </template>
            <template v-else>
              <el-tag :type="getSeriesTagType(s.name)">{{ s.name }}</el-tag>
              <span class="series-count">{{ s.productCount }} 个产品</span>
            </template>
          </div>
          <template v-if="editingId !== s.id">
            <el-button link type="primary" @click="startEditSeries(s)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteSeries(s)">删除</el-button>
          </template>
        </div>
        <el-empty v-if="!seriesLoading && !seriesList.length" description="暂无系列" :image-size="60" />
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Download, Setting } from '@element-plus/icons-vue'
import request, { baseURL, downloadFile } from '@/utils/request'
import {
  getProductSeries,
  addProductSeries,
  editProductSeries,
  deleteProductSeries,
  type ProductSeries
} from '@/api/productSeries'

const router = useRouter()
const loading = ref(false)
const tableData = ref<any[]>([])
const searchKeyword = ref('')
const filterSeries = ref('')
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

const seriesOptions = ref<string[]>([])
const seriesList = ref<ProductSeries[]>([])
const seriesDialogVisible = ref(false)
const seriesLoading = ref(false)
const seriesAdding = ref(false)
const newSeriesName = ref('')
const editingId = ref<number | null>(null)
const editingName = ref('')
const editInputRef = ref()

const fetchSeries = async () => {
  seriesLoading.value = true
  try {
    const res = await getProductSeries()
    if (res.data.code === 200) {
      seriesList.value = res.data.data || []
      seriesOptions.value = seriesList.value.map((s) => s.name)
      if (filterSeries.value && !seriesOptions.value.includes(filterSeries.value)) {
        filterSeries.value = ''
      }
    }
  } catch (error) {
    console.error('获取产品系列失败', error)
  } finally {
    seriesLoading.value = false
  }
}

const handleAddSeries = async () => {
  const name = newSeriesName.value.trim()
  if (!name) {
    ElMessage.warning('请输入系列名称')
    return
  }
  seriesAdding.value = true
  try {
    const res = await addProductSeries(name)
    if (res.data.code === 200) {
      ElMessage.success('添加成功')
      newSeriesName.value = ''
      await fetchSeries()
    } else {
      ElMessage.error(res.data.message || '添加失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '添加失败')
  } finally {
    seriesAdding.value = false
  }
}

const startEditSeries = async (s: ProductSeries) => {
  editingId.value = s.id
  editingName.value = s.name
  await nextTick()
  editInputRef.value?.focus?.()
  // 选中文本方便直接替换
  const inputEl = editInputRef.value?.input as HTMLInputElement | undefined
  if (inputEl) inputEl.select()
}

const handleSaveEdit = async () => {
  const id = editingId.value
  const name = editingName.value.trim()
  if (!id) return
  if (!name) {
    ElMessage.warning('系列名称不能为空')
    return
  }
  try {
    const res = await editProductSeries(id, name)
    if (res.data.code === 200) {
      const cascade = res.data.data?.cascadeProducts ?? 0
      ElMessage.success(cascade > 0 ? `修改成功，已同步更新 ${cascade} 个产品` : '修改成功')
      editingId.value = null
      await fetchSeries()
      fetchProducts()
    } else {
      ElMessage.error(res.data.message || '修改失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '修改失败')
  }
}

const handleDeleteSeries = (series: ProductSeries) => {
  ElMessageBox.confirm(
    `确定删除系列「${series.name}」吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await deleteProductSeries(series.id)
      if (res.data.code === 200) {
        ElMessage.success('删除成功')
        await fetchSeries()
        if (filterSeries.value === series.name) {
          filterSeries.value = ''
          handleSearch()
        }
      }
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || '删除失败')
    }
  }).catch(() => {})
}

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

const isFeishuFileToken = (path: string) => {
  return path && !path.startsWith('http') && !path.startsWith('/') && /^[a-zA-Z0-9]+$/.test(path)
}

const parseFirstImage = (value: any): string | null => {
  if (!value) return null
  let list: string[] = []
  if (Array.isArray(value)) {
    list = value.filter(Boolean)
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) list = parsed.filter(Boolean)
    } catch {
      list = [value]
    }
  }
  const first = list.find((item) => typeof item === 'string' && item && !isFeishuFileToken(item))
  return first || null
}

const getProductImage = (row: any) => {
  return parseFirstImage(row.product_image || row.image)
}

const getImgSrc = (row: any) => {
  const path = getProductImage(row)
  if (!path) return ''
  if (path.startsWith('http')) return path
  return baseURL + (path.startsWith('/') ? path : '/' + path)
}

const getBrandPackageImage = (row: any) => {
  return parseFirstImage(row.brand_package_image)
}

const getBrandPackageImgSrc = (row: any) => {
  const path = getBrandPackageImage(row)
  if (!path) return ''
  if (path.startsWith('http')) return path
  return baseURL + (path.startsWith('/') ? path : '/' + path)
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    '在线产品': 'success',
    '未在线产品': 'info',
    '清货待下架': 'warning',
    '强制淘汰': 'danger',
    '可定制': ''
  }
  return map[status] || 'info'
}

const SERIES_TAG_TYPES = ['', 'warning', 'success', 'info', 'danger']

const getSeriesTagType = (series: string) => {
  const map: Record<string, string> = {
    '单品系列': '',
    'MS系列': 'warning',
    'MT系列': 'success',
    'MW系列': 'warning',
    'M66系列': 'danger',
    'ST06双向充系列': 'info',
    'CZ车载支架系列': 'success',
    'GT运动相机系列': 'info'
  }
  if (map[series] !== undefined) return map[series]
  // 新增系列按顺序循环取色
  const idx = seriesOptions.value.indexOf(series)
  return SERIES_TAG_TYPES[(idx >= 0 ? idx : 0) % SERIES_TAG_TYPES.length]
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
    if (filterSeries.value) {
      params.append('series', filterSeries.value)
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
  fetchSeries()
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

.search-area {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;

  .search-type-select {
    width: 160px;
  }

  .search-input {
    width: 300px;
  }

  .series-filter {
    width: 160px;
  }
}

.series-add {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.series-list {
  max-height: 60vh;
  overflow-y: auto;
}

.series-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 4px;
  border-bottom: 1px dashed #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
}

.series-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.series-count {
  font-size: 12px;
  color: #94a3b8;
}

.search-area {
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

    .el-table__body tr:nth-child(even) > td {
      background: #f8fafc;
    }

    .el-table__body tr:nth-child(even):hover > td {
      background: #f1f5f9;
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

<style lang="scss">
.cell-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.wrap-tooltip {
  max-width: 400px !important;
  .el-tooltip__content {
    white-space: pre-wrap !important;
    word-break: break-all !important;
    line-height: 1.6 !important;
  }
}
</style>