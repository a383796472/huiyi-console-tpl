<template>
  <div class="create-product" v-loading="loading">

    <div class="form-section">
    <div class="section-title">基础资料</div>

    <div class="product-info">
      <div class="info-item">
        <div class="item-label must">产品名称</div>
        <div class="item-input">
          <el-input v-model="formData.name" placeholder="请输入产品名称" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">英文名称</div>
        <div class="item-input">
          <el-input v-model="formData.english_name" placeholder="请输入英文名称" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">产品编号</div>
        <div class="item-input">
          <el-input v-model="formData.product_code" placeholder="请输入产品编号" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label must">SKU编号</div>
        <div class="item-input">
          <el-input v-model="formData.SKU" placeholder="请输入SKU编号" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">一级品类</div>
        <div class="item-input">
          <el-input v-model="formData.category_l1" placeholder="请输入一级品类" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">二级品类</div>
        <div class="item-input">
          <el-input v-model="formData.category_l2" placeholder="请输入二级品类" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">产品类型</div>
        <div class="item-input">
          <el-select v-model="formData.product_type" placeholder="请选择产品类型" clearable>
            <el-option label="成品" value="成品" />
            <el-option label="单品" value="单品" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">EAN码</div>
        <div class="item-input">
          <el-input v-model="formData.ean_code" placeholder="请输入EAN码" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">美国条形码编号</div>
        <div class="item-input">
          <el-input v-model="formData.us_barcode" placeholder="请输入美国条形码编号" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">适配车型</div>
        <div class="item-input">
          <el-input v-model="formData.compatible_vehicles" placeholder="请输入适配车型" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">销售状态</div>
        <div class="item-input">
          <el-select v-model="formData.sales_status" placeholder="请选择销售状态" clearable>
            <el-option label="在线产品" value="在线产品" />
            <el-option label="未在线产品" value="未在线产品" />
            <el-option label="清货待下架" value="清货待下架" />
            <el-option label="下架产品" value="下架产品" />
            <el-option label="淘汰" value="淘汰" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">成本价RMB</div>
        <div class="item-input">
          <el-input v-model="formData.cost_price_rmb" placeholder="请输入成本价" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">建议零售价USD</div>
        <div class="item-input">
          <el-input v-model="formData.retail_price_usd" placeholder="请输入建议零售价USD" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">建议零售价EUR</div>
        <div class="item-input">
          <el-input v-model="formData.retail_price_eur" placeholder="请输入建议零售价EUR" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">建议零售价RMB</div>
        <div class="item-input">
          <el-input v-model="formData.retail_price_rmb" placeholder="请输入建议零售价RMB" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">产品认证</div>
        <div class="item-input">
          <el-input v-model="formData.certification" type="textarea" :rows="2" placeholder="请输入产品认证" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">产品专利</div>
        <div class="item-input">
          <el-input v-model="formData.patent" type="textarea" :rows="2" placeholder="请输入产品专利" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">取得方式</div>
        <div class="item-input">
          <el-select v-model="formData.acquisition_method" placeholder="请选择取得方式" clearable>
            <el-option label="生产" value="生产" />
            <el-option label="外采" value="外采" />
            <el-option label="组装" value="组装" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">颜色</div>
        <div class="item-input">
          <el-input v-model="formData.color" placeholder="请输入颜色" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">参考链接</div>
        <div class="item-input">
          <el-input v-model="formData.reference_link" placeholder="请输入参考链接" />
        </div>
      </div>
    </div>
    </div>

    <div class="form-section">
    <div class="section-title">产品规格</div>

    <div class="product-info">
      <div class="info-item">
        <div class="item-label">净重KG</div>
        <div class="item-input">
          <el-input v-model="formData.net_weight" placeholder="请输入净重" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">毛重KG</div>
        <div class="item-input">
          <el-input v-model="formData.gross_weight" placeholder="请输入毛重" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">整箱毛重KG</div>
        <div class="item-input">
          <el-input v-model="formData.whole_box_weight" placeholder="请输入整箱毛重" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">产品单位</div>
        <div class="item-input">
          <el-select v-model="formData.unit" placeholder="请选择产品单位" clearable>
            <el-option label="个" value="个" />
            <el-option label="套" value="套" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">产品尺寸</div>
        <div class="item-input">
          <el-input v-model="formData.product_size" placeholder="请输入产品尺寸" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">包装尺寸MM</div>
        <div class="item-input">
          <el-input v-model="formData.packaging_size_mm" placeholder="请输入包装尺寸" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">内小箱MM</div>
        <div class="item-input">
          <el-input v-model="formData.inner_box_size" placeholder="请输入内小箱尺寸" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">外大箱MM</div>
        <div class="item-input">
          <el-input v-model="formData.outer_box_size" placeholder="请输入外大箱尺寸" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">内箱装箱数量</div>
        <div class="item-input">
          <el-input v-model="formData.inner_box_qty" placeholder="请输入内箱装箱数量" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">装箱数量</div>
        <div class="item-input">
          <el-input v-model="formData.packing_qty" placeholder="请输入装箱数量" type="number" />
        </div>
      </div>
    </div>
    </div>

    <div class="form-section">
    <div class="section-title">报关信息</div>

    <div class="product-info">
      <div class="info-item">
        <div class="item-label">申报品类</div>
        <div class="item-input">
          <el-select v-model="formData.declare_category" placeholder="请选择申报品类" clearable />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">海关编码</div>
        <div class="item-input">
          <el-input v-model="formData.hs_code" placeholder="请输入海关编码" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">中文申报品名</div>
        <div class="item-input">
          <el-input v-model="formData.declare_name_cn" placeholder="请输入中文申报品名" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">英文申报品名</div>
        <div class="item-input">
          <el-input v-model="formData.declare_name_en" placeholder="请输入英文申报品名" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">申报价值USD</div>
        <div class="item-input">
          <el-input v-model="formData.declare_value_usd" placeholder="请输入申报价值USD" type="number" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">中文材质</div>
        <div class="item-input">
          <el-input v-model="formData.material_cn" placeholder="请输入中文材质" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">英文材质</div>
        <div class="item-input">
          <el-input v-model="formData.material_en" placeholder="请输入英文材质" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">中文用途</div>
        <div class="item-input">
          <el-input v-model="formData.usage_cn" placeholder="请输入中文用途" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">英文用途</div>
        <div class="item-input">
          <el-input v-model="formData.usage_en" placeholder="请输入英文用途" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">是否包含电池</div>
        <div class="item-input">
          <el-select v-model="formData.has_battery" placeholder="请选择" clearable>
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">是否包含特货</div>
        <div class="item-input">
          <el-select v-model="formData.has_special_goods" placeholder="请选择" clearable>
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">是否带磁</div>
        <div class="item-input">
          <el-select v-model="formData.has_magnetism" placeholder="请选择" clearable>
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">是否含非液体化妆品</div>
        <div class="item-input">
          <el-select v-model="formData.has_non_liquid_cosmetics" placeholder="请选择" clearable>
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">是否为仿制品</div>
        <div class="item-input">
          <el-select v-model="formData.is_counterfeit" placeholder="请选择" clearable>
            <el-option label="是" value="是" />
            <el-option label="否" value="否" />
          </el-select>
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">报关名称</div>
        <div class="item-input">
          <el-input v-model="formData.customs_name" placeholder="请输入报关名称" />
        </div>
      </div>
      <div class="info-item">
        <div class="item-label">报关专用材质</div>
        <div class="item-input">
          <el-input v-model="formData.customs_material" placeholder="请输入报关专用材质" />
        </div>
      </div>
    </div>
    </div>

    <div class="form-section">
    <div class="section-title">附加信息</div>

    <div class="extra-tabs">
      <div class="extra-tabs-nav">
        <div
          v-for="tab in extraTabList"
          :key="tab.key"
          class="extra-tab-item"
          :class="{ active: activeExtraTab === tab.key }"
          @click="activeExtraTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

      <div v-if="activeExtraTab === 'extra'" class="extra-tab-content">
        <el-input
          v-model="formData.extra_info"
          type="textarea"
          :rows="6"
          placeholder="请输入附加信息"
        />
      </div>

      <div v-if="activeExtraTab === 'images'" class="extra-tab-content">
        <el-upload
          ref="uploadExtraRef"
          :show-file-list="false"
          :http-request="handleExtraUpload"
          accept=".jpg,.jpeg,.png,.webp"
          :before-upload="beforeExtraUpload"
        >
          <el-button type="primary">
            <el-icon style="margin-right: 4px;"><Plus /></el-icon>上传图片
          </el-button>
        </el-upload>
        <div v-if="extraImages.length > 0" class="extra-image-list">
          <div v-for="(url, idx) in extraImages" :key="idx" class="extra-image-item">
            <img :src="baseURL + url" alt="" />
            <el-icon class="extra-image-remove" @click="removeExtraImage(idx)"><Close /></el-icon>
          </div>
        </div>
      </div>

      <div v-if="activeExtraTab === 'accessory'" class="extra-tab-content">
        <el-input
          v-model="formData.accessory_info"
          type="textarea"
          :rows="6"
          placeholder="请输入产品规格/配件"
        />
      </div>

      <div v-if="activeExtraTab === 'selling'" class="extra-tab-content">
        <el-table :data="sellingPoints" border style="width: 100%">
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="卖点" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.point" placeholder="请输入卖点" />
            </template>
          </el-table-column>
          <el-table-column label="产品属性F（Feature）" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.feature" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" placeholder="请输入产品属性" />
            </template>
          </el-table-column>
          <el-table-column label="产品优势A（Advantage）" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.advantage" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" placeholder="请输入产品优势" />
            </template>
          </el-table-column>
          <el-table-column label="用户利益B（Benefit）" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.benefit" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" placeholder="请输入用户利益" />
            </template>
          </el-table-column>
          <el-table-column label="总结" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.summary" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" placeholder="请输入总结" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeSellingPoint($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" style="margin-top: 12px" @click="addSellingPoint">
          <el-icon style="margin-right: 4px;"><Plus /></el-icon>新增一行
        </el-button>
      </div>

      <div v-if="activeExtraTab === 'detail'" class="extra-tab-content">
        <Editor v-model="formData.selling_detail" />
      </div>
    </div>
    </div>

    <!-- 操作按钮 -->
    <div class="product-actions">
      <el-button type="primary" @click="handleSubmit">保存产品</el-button>
      <el-button @click="router.push('/products')" :loading="isSubmitting">取消</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
import Editor from '@/components/Editor.vue'
import request, { baseURL } from '@/utils/request'

const router = useRouter()
const route = useRoute()
const isSubmitting = ref(false)
const loading = ref(false)
let isUnmounted = false
const abortController = new AbortController()

const activeExtraTab = ref('extra')
const extraTabList = [
  { label: '产品信息', key: 'extra' },
  { label: '产品图片', key: 'images' },
  { label: '产品规格/配件', key: 'accessory' },
  { label: '产品卖点', key: 'selling' },
  { label: '卖点详情', key: 'detail' }
]

interface SellingPoint {
  point: string
  feature: string
  advantage: string
  benefit: string
  summary: string
}

const sellingPoints = ref<SellingPoint[]>([
  { point: '', feature: '', advantage: '', benefit: '', summary: '' },
  { point: '', feature: '', advantage: '', benefit: '', summary: '' },
  { point: '', feature: '', advantage: '', benefit: '', summary: '' }
])

const addSellingPoint = () => {
  sellingPoints.value.push({ point: '', feature: '', advantage: '', benefit: '', summary: '' })
}

const removeSellingPoint = (index: number) => {
  if (sellingPoints.value.length > 1) {
    sellingPoints.value.splice(index, 1)
  }
}

// @ts-expect-error template ref
const uploadExtraRef = ref()
const extraImages = ref<string[]>([])

const beforeExtraUpload = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('仅支持 jpg/png/webp 格式的图片')
    return false
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

const handleExtraUpload = async (options: any) => {
  const file = options.file
  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await request.post('/api/upload/image', fd)
    if (res.data.code === 200 && res.data.data && res.data.data.url) {
      extraImages.value.push(res.data.data.url)
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.data.message || '图片上传失败')
    }
  } catch (error) {
    ElMessage.error('图片上传失败，请检查后端服务')
  }
}

const removeExtraImage = (index: number) => {
  extraImages.value.splice(index, 1)
}

const formData = reactive({
  name: '',
  english_name: '',
  product_code: '',
  SKU: '',
  category_l1: '',
  category_l2: '',
  product_type: '',
  ean_code: '',
  us_barcode: '',
  compatible_vehicles: '',
  sales_status: '',
  cost_price_rmb: '',
  retail_price_usd: '',
  retail_price_eur: '',
  retail_price_rmb: '',
  certification: '',
  patent: '',
  acquisition_method: '',
  color: '',
  reference_link: '',
  net_weight: '',
  gross_weight: '',
  whole_box_weight: '',
  unit: '',
  product_size: '',
  packaging_size_mm: '',
  inner_box_size: '',
  outer_box_size: '',
  inner_box_qty: '',
  packing_qty: '',
  declare_category: '',
  hs_code: '',
  declare_name_cn: '',
  declare_name_en: '',
  declare_value_usd: '',
  material_cn: '',
  material_en: '',
  usage_cn: '',
  usage_en: '',
  has_battery: '',
  has_special_goods: '',
  has_magnetism: '',
  has_non_liquid_cosmetics: '',
  is_counterfeit: '',
  customs_name: '',
  customs_material: '',
  extra_info: '',
  accessory_info: '',
  description: '',
  selling_detail: '',
  image: ''
})

const fetchProductDetail = async () => {
  const id = route.query.id
  if (!id) return

  loading.value = true
  try {
    const res = await request.get(`/api/products/${id}`, {
      signal: abortController.signal
    })
    if (isUnmounted) return
    if (res.data.code === 200 && res.data.data) {
      const data = res.data.data
      Object.assign(formData, data)
      if (data.selling_points) {
        try {
          const parsed = JSON.parse(data.selling_points)
          if (Array.isArray(parsed) && parsed.length > 0) {
            sellingPoints.value = parsed
          }
        } catch { }
      }
      if (data.extra_images) {
        try {
          const parsed = JSON.parse(data.extra_images)
          if (Array.isArray(parsed)) {
            extraImages.value = parsed
          }
        } catch { }
      }
    }
  } catch (error) {
    if ((error as any).code !== 'ERR_CANCELED') {
      ElMessage.error('获取产品详情失败')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.id) {
    fetchProductDetail()
  }
})

onUnmounted(() => {
  isUnmounted = true
  abortController.abort()
})

const handleSubmit = async () => {
  if (isSubmitting.value) return

  if (!formData.name) {
    ElMessage.error('请输入产品名称')
    return
  }
  if (!formData.SKU) {
    ElMessage.error('请输入SKU编号')
    return
  }

  const id = route.query.id
  try {
    isSubmitting.value = true
    let response
    const submitData = {
      name: formData.name,
      englishName: formData.english_name,
      productCode: formData.product_code,
      SKU: formData.SKU,
      categoryL1: formData.category_l1,
      categoryL2: formData.category_l2,
      productType: formData.product_type,
      eanCode: formData.ean_code,
      usBarcode: formData.us_barcode,
      compatibleVehicles: formData.compatible_vehicles,
      salesStatus: formData.sales_status,
      costPriceRmb: formData.cost_price_rmb,
      retailPriceUsd: formData.retail_price_usd,
      retailPriceEur: formData.retail_price_eur,
      retailPriceRmb: formData.retail_price_rmb,
      certification: formData.certification,
      patent: formData.patent,
      acquisitionMethod: formData.acquisition_method,
      color: formData.color,
      referenceLink: formData.reference_link,
      netWeight: formData.net_weight,
      grossWeight: formData.gross_weight,
      wholeBoxWeight: formData.whole_box_weight,
      unit: formData.unit,
      productSize: formData.product_size,
      packagingSizeMm: formData.packaging_size_mm,
      innerBoxSize: formData.inner_box_size,
      outerBoxSize: formData.outer_box_size,
      innerBoxQty: formData.inner_box_qty,
      packingQty: formData.packing_qty,
      declareCategory: formData.declare_category,
      hsCode: formData.hs_code,
      declareNameCn: formData.declare_name_cn,
      declareNameEn: formData.declare_name_en,
      declareValueUsd: formData.declare_value_usd,
      materialCn: formData.material_cn,
      materialEn: formData.material_en,
      usageCn: formData.usage_cn,
      usageEn: formData.usage_en,
      hasBattery: formData.has_battery,
      hasSpecialGoods: formData.has_special_goods,
      hasMagnetism: formData.has_magnetism,
      hasNonLiquidCosmetics: formData.has_non_liquid_cosmetics,
      isCounterfeit: formData.is_counterfeit,
      customsName: formData.customs_name,
      customsMaterial: formData.customs_material,
      extraInfo: formData.extra_info,
      accessoryInfo: formData.accessory_info,
      extraImages: JSON.stringify(extraImages.value),
      sellingPoints: JSON.stringify(sellingPoints.value),
      sellingDetail: formData.selling_detail,
      image: formData.image,
      desc: formData.description
    }

    if (id) {
      response = await request.put(`/api/products/${id}`, submitData, {
        timeout: 10000
      })
    } else {
      response = await request.post('/api/products', submitData, {
        timeout: 10000
      })
    }

    if (response && response.data && response.data.code === 200) {
      ElMessage.success('保存成功！')
      router.push('/products')
    } else {
      ElMessage.error('保存失败，响应异常')
    }
  } catch (error) {
    console.error(error)
    if ((error as any).code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error('保存失败，请检查后端服务')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.create-product {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  color: #55585f;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 0 0 12px;
  border-left: 3px solid #409EFF;
  margin-bottom: 16px;
}

.extra-section-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.extra-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.extra-image-item {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  border: 1px solid #dcdfe6;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .extra-image-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 14px;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    padding: 2px;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  }
}

.form-section {
  margin-bottom: 32px;
}

.product-info {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  column-gap: 24px;

  .info-item {
    width: calc((100% - 48px) / 3);
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;

    .item-label {
      width: 120px;
      font-weight: 500;
      text-align: right;
      padding-right: 12px;
      flex-shrink: 0;
      position: relative;
      line-height: 32px;

      &::after {
        content: ':';
      }

      &.must::before {
        content: '*';
        color: red;
        margin-right: 3px;
      }
    }

    .item-input {
      flex: 1;
      min-width: 0;

      :deep(.el-select) {
        width: 100%;
      }

      :deep(.el-input) {
        width: 100%;
      }

      :deep(.el-textarea) {
        width: 100%;
      }
    }
  }
}

.extra-tabs {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;

  .extra-tabs-nav {
    display: flex;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;

    .extra-tab-item {
      padding: 0 20px;
      height: 36px;
      line-height: 36px;
      font-size: 14px;
      color: #606266;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;

      &:hover {
        color: #409EFF;
      }

      &.active {
        color: #409EFF;
        font-weight: 600;
        background: #fff;

        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #409EFF;
        }
      }
    }
  }

  .extra-tab-content {
    padding: 20px;
    background: #fff;
    min-height: 400px;
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.product-actions {
  margin-top: 24px;
}
</style>
