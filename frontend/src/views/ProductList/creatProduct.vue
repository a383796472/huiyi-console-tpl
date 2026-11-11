<template>
  <div class="create-product" v-loading="loading">

    <div class="form-section">
      <div class="section-title">基础资料</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label must">SKU</div>
          <div class="item-input">
            <el-input v-model="formData.sku" placeholder="请输入SKU" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">产品编号</div>
          <div class="item-input">
            <el-input v-model="formData.productCode" placeholder="请输入产品编号" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">系列</div>
          <div class="item-input">
            <el-select v-model="formData.series" placeholder="请选择系列" clearable>
              <el-option v-for="s in seriesOptions" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">系列编号</div>
          <div class="item-input">
            <el-input v-model="formData.seriesCode" placeholder="请输入系列编号" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">产品状态</div>
          <div class="item-input">
            <el-select v-model="formData.productStatus" placeholder="请选择产品状态">
              <el-option label="在线产品" value="在线产品" />
              <el-option label="未在线产品" value="未在线产品" />
              <el-option label="清货待下架" value="清货待下架" />
              <el-option label="强制淘汰" value="强制淘汰" />
              <el-option label="可定制" value="可定制" />
            </el-select>
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">EAN码</div>
          <div class="item-input">
            <el-input v-model="formData.eanCode" placeholder="请输入EAN码" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">美国条形码编号</div>
          <div class="item-input">
            <el-input v-model="formData.usBarcode" placeholder="请输入美国条形码编号" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">海关编码</div>
          <div class="item-input">
            <el-input v-model="formData.hsCode" placeholder="请输入海关编码" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label must">产品名称</div>
          <div class="item-input">
            <el-input v-model="formData.productName" placeholder="请输入产品名称" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">英文产品名称</div>
          <div class="item-input">
            <el-input v-model="formData.englishName" placeholder="请输入英文产品名称" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">产品包装英文名称</div>
          <div class="item-input">
            <el-input v-model="formData.packageEnglishName" placeholder="请输入产品包装英文名称" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">型号</div>
          <div class="item-input">
            <el-input v-model="formData.model" placeholder="请输入型号" />
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">价格信息</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">中国零售价</div>
          <div class="item-input">
            <el-input v-model="formData.chinaRetailPrice" placeholder="请输入中国零售价" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">美国（USD）</div>
          <div class="item-input">
            <el-input v-model="formData.usdPrice" placeholder="请输入美国价格" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">欧洲（€）</div>
          <div class="item-input">
            <el-input v-model="formData.eurPrice" placeholder="请输入欧洲价格" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">成本（1）</div>
          <div class="item-input">
            <el-input v-model="formData.cost1" placeholder="请输入成本（1）" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">建议销售价</div>
          <div class="item-input">
            <el-input v-model="formData.suggestedPrice" placeholder="请输入建议销售价" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美（quadlock）</div>
          <div class="item-input">
            <el-input v-model="formData.competitorPriceQl" placeholder="请输入竞对参考价" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美（sp）</div>
          <div class="item-input">
            <el-input v-model="formData.competitorPriceSp" placeholder="请输入竞对参考价" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">成本</div>
          <div class="item-input">
            <el-input v-model="formData.cost" placeholder="请输入成本" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">建议销售价（1）</div>
          <div class="item-input">
            <el-input v-model="formData.suggestedPrice1" placeholder="请输入建议销售价（1）" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美：ql</div>
          <div class="item-input">
            <el-input v-model="formData.competitorPriceQlNum" placeholder="请输入ql竞对参考价" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美：SP</div>
          <div class="item-input">
            <el-input v-model="formData.competitorPriceSpNum" placeholder="请输入SP竞对参考价" type="number" />
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">规格参数</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">适配车型</div>
          <div class="item-input">
            <el-input v-model="formData.compatibleVehicles" placeholder="请输入适配车型" />
          </div>
        </div>
        <div class="info-item info-item--full">
          <div class="item-label">产品卖点</div>
          <div class="item-input">
            <el-input v-model="formData.sellingPoints" type="textarea" :rows="3" placeholder="请输入产品卖点" />
          </div>
        </div>
        <div class="info-item info-item--full">
          <div class="item-label">规格参数</div>
          <div class="item-input">
            <el-input v-model="formData.specs" type="textarea" :rows="3" placeholder="请输入规格参数" />
          </div>
        </div>
        <div class="info-item info-item--full">
          <div class="item-label">标准配置（改进后需要修改）</div>
          <div class="item-input">
            <el-input v-model="formData.standardConfig" type="textarea" :rows="3" placeholder="请输入标准配置" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">生产工艺</div>
          <div class="item-input">
            <el-input v-model="formData.productionProcess" placeholder="请输入生产工艺" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">材料</div>
          <div class="item-input">
            <el-input v-model="formData.material" placeholder="请输入材料" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">颜色</div>
          <div class="item-input">
            <el-select v-model="formData.color" placeholder="请选择或输入颜色" clearable filterable allow-create>
              <el-option v-for="c in colorOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">产品净重（KG）</div>
          <div class="item-input">
            <el-input v-model="formData.netWeight" placeholder="请输入产品净重" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">毛重（KG）（包含产品，包装）</div>
          <div class="item-input">
            <el-input v-model="formData.grossWeight" placeholder="请输入毛重" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">整箱毛重（KG）</div>
          <div class="item-input">
            <el-input v-model="formData.wholeBoxWeight" placeholder="请输入整箱毛重" type="number" />
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">包装信息</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">包装规格（MM）</div>
          <div class="item-input">
            <el-input v-model="formData.packagingSize" placeholder="请输入包装规格" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">内小箱规格（MM）</div>
          <div class="item-input">
            <el-input v-model="formData.innerBoxSize" placeholder="请输入内小箱规格" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">外大箱规格（MM）</div>
          <div class="item-input">
            <el-input v-model="formData.outerBoxSize" placeholder="请输入外大箱规格" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">内箱装箱数量</div>
          <div class="item-input">
            <el-input v-model="formData.innerBoxQty" placeholder="请输入内箱装箱数量" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">外箱装箱数量</div>
          <div class="item-input">
            <el-input v-model="formData.outerBoxQty" placeholder="请输入外箱装箱数量" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">装箱数量</div>
          <div class="item-input">
            <el-input v-model="formData.packingQty" placeholder="请输入装箱数量" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">MOQ</div>
          <div class="item-input">
            <el-input v-model="formData.moq" placeholder="请输入MOQ" type="number" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">内箱SKU代码（ICS）</div>
          <div class="item-input">
            <el-input v-model="formData.innerBoxSku" placeholder="请输入内箱SKU代码" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">外箱SKU代码(MCS)</div>
          <div class="item-input">
            <el-input v-model="formData.outerBoxSku" placeholder="请输入外箱SKU代码" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">内纸箱条形码（ICB）</div>
          <div class="item-input">
            <el-input v-model="formData.innerBarcode" placeholder="请输入内纸箱条形码" />
          </div>
        </div>
        <div class="info-item">
          <div class="item-label">产品供应中</div>
          <div class="item-input">
            <el-select v-model="formData.productSupplying" placeholder="请选择供应状态" clearable>
              <el-option label="供应中" value="供应中" />
              <el-option label="停产" value="停产" />
              <el-option label="待上市" value="待上市" />
            </el-select>
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">备注</div>

      <div class="product-info">
        <div class="info-item info-item--full">
          <div class="item-label">备注（2）</div>
          <div class="item-input">
            <el-input v-model="formData.remark2" type="textarea" :rows="3" placeholder="请输入备注（2）" />
          </div>
        </div>
        <div class="info-item info-item--full">
          <div class="item-label">备注</div>
          <div class="item-input">
            <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </div>
        </div>
        <div class="info-item info-item--full">
          <div class="item-label">备注（1）</div>
          <div class="item-input">
            <el-input v-model="formData.remark1" type="textarea" :rows="3" placeholder="请输入备注（1）" />
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">产品图片</div>

      <div class="extra-tabs">
        <div class="extra-tabs-nav">
          <div
            v-for="tab in imageTabList"
            :key="tab.key"
            class="extra-tab-item"
            :class="{ active: activeImageTab === tab.key }"
            @click="activeImageTab = tab.key"
          >
            {{ tab.label }}
          </div>
        </div>

        <div v-if="activeImageTab === 'product'" class="extra-tab-content">
          <el-upload
            ref="uploadProductRef"
            :show-file-list="false"
            :http-request="handleProductUpload"
            accept=".jpg,.jpeg,.png,.webp"
            :before-upload="beforeImageUpload"
            multiple
          >
            <el-button type="primary">
              <el-icon style="margin-right: 4px;"><Plus /></el-icon>上传产品图片
            </el-button>
          </el-upload>
          <div v-if="productImages.length > 0" class="extra-image-list">
            <div v-for="(url, idx) in productImages" :key="idx" class="extra-image-item">
              <img :src="resolveImageUrl(url)" alt="" />
              <el-icon class="extra-image-remove" @click="removeProductImage(idx)"><Close /></el-icon>
            </div>
          </div>
          <div v-else class="upload-tip">暂未上传产品图片</div>
        </div>

        <div v-if="activeImageTab === 'brand'" class="extra-tab-content">
          <el-upload
            ref="uploadBrandRef"
            :show-file-list="false"
            :http-request="handleBrandUpload"
            accept=".jpg,.jpeg,.png,.webp"
            :before-upload="beforeImageUpload"
            multiple
          >
            <el-button type="primary">
              <el-icon style="margin-right: 4px;"><Plus /></el-icon>上传品牌包装图片
            </el-button>
          </el-upload>
          <div v-if="brandImages.length > 0" class="extra-image-list">
            <div v-for="(url, idx) in brandImages" :key="idx" class="extra-image-item">
              <img :src="resolveImageUrl(url)" alt="" />
              <el-icon class="extra-image-remove" @click="removeBrandImage(idx)"><Close /></el-icon>
            </div>
          </div>
          <div v-else class="upload-tip">暂未上传品牌包装图片</div>
        </div>
      </div>
    </div>

    <div class="product-actions">
      <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">保存产品</el-button>
      <el-button @click="router.push('/products')">取消</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
import request, { baseURL } from '@/utils/request'
import { getProductSeries } from '@/api/productSeries'

const router = useRouter()
const route = useRoute()
const isSubmitting = ref(false)
const loading = ref(false)
let isUnmounted = false
const abortController = new AbortController()

const activeImageTab = ref('product')
const imageTabList = [
  { label: '产品图片', key: 'product' },
  { label: '品牌包装图片', key: 'brand' }
]

const seriesOptions = ref<string[]>([])

const fetchSeriesOptions = async () => {
  try {
    const res = await getProductSeries()
    if (res.data.code === 200) {
      seriesOptions.value = (res.data.data || []).map((s: { name: string }) => s.name)
    }
  } catch (error) {
    console.error('获取产品系列失败', error)
  }
}

const colorOptions = ['黑色', '银色', '黑色/银色可选', '镀铬', '本色+黑色']

const productImages = ref<string[]>([])
const brandImages = ref<string[]>([])

// @ts-expect-error template ref
const uploadProductRef = ref()
// @ts-expect-error template ref
const uploadBrandRef = ref()

const beforeImageUpload = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('仅支持 jpg/png/webp 格式的图片')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const resolveImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return baseURL + (url.startsWith('/') ? url : '/' + url)
}

const handleProductUpload = async (options: any) => {
  const file = options.file
  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await request.post('/api/upload/image', fd)
    if (res.data.code === 200 && res.data.data && res.data.data.url) {
      productImages.value.push(res.data.data.url)
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.data.message || '图片上传失败')
    }
  } catch {
    ElMessage.error('图片上传失败，请检查后端服务')
  }
}

const handleBrandUpload = async (options: any) => {
  const file = options.file
  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await request.post('/api/upload/image', fd)
    if (res.data.code === 200 && res.data.data && res.data.data.url) {
      brandImages.value.push(res.data.data.url)
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.data.message || '图片上传失败')
    }
  } catch {
    ElMessage.error('图片上传失败，请检查后端服务')
  }
}

const removeProductImage = (index: number) => {
  productImages.value.splice(index, 1)
}

const removeBrandImage = (index: number) => {
  brandImages.value.splice(index, 1)
}

const formData = reactive({
  productName: '',
  sku: '',
  productCode: '',
  series: '',
  seriesCode: '',
  productStatus: '',
  englishName: '',
  model: '',
  color: '',
  productionProcess: '',
  material: '',
  compatibleVehicles: '',
  chinaRetailPrice: '',
  usdPrice: '',
  eurPrice: '',
  suggestedPrice: '',
  suggestedPrice1: '',
  cost: '',
  cost1: '',
  moq: '',
  competitorPriceSp: '',
  competitorPriceQl: '',
  competitorPriceSpNum: '',
  competitorPriceQlNum: '',
  sellingPoints: '',
  specs: '',
  standardConfig: '',
  packageEnglishName: '',
  netWeight: '',
  grossWeight: '',
  wholeBoxWeight: '',
  packagingSize: '',
  innerBoxSize: '',
  outerBoxSize: '',
  innerBoxQty: '',
  outerBoxQty: '',
  packingQty: '',
  innerBoxSku: '',
  outerBoxSku: '',
  innerBarcode: '',
  eanCode: '',
  hsCode: '',
  usBarcode: '',
  productSupplying: '',
  remark: '',
  remark1: '',
  remark2: ''
})

const parseImageField = (value: any): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {
      return value.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  }
  return []
}

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
      Object.keys(formData).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())
        if (data[snakeKey] !== undefined) {
          ;(formData as any)[key] = data[snakeKey]
        }
      })
      productImages.value = parseImageField(data.product_image)
      brandImages.value = parseImageField(data.brand_package_image)
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
  fetchSeriesOptions()
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

  if (!formData.productName) {
    ElMessage.error('请输入产品名称')
    return
  }
  if (!formData.sku) {
    ElMessage.error('请输入SKU')
    return
  }

  const id = route.query.id
  try {
    isSubmitting.value = true

    const submitData = {
      productName: formData.productName,
      sku: formData.sku,
      productCode: formData.productCode,
      series: formData.series,
      seriesCode: formData.seriesCode,
      productStatus: Array.isArray(formData.productStatus) ? formData.productStatus.join(',') : formData.productStatus,
      englishName: formData.englishName,
      model: formData.model,
      color: formData.color,
      productionProcess: formData.productionProcess,
      material: formData.material,
      compatibleVehicles: formData.compatibleVehicles,
      chinaRetailPrice: formData.chinaRetailPrice,
      usdPrice: formData.usdPrice,
      eurPrice: formData.eurPrice,
      suggestedPrice: formData.suggestedPrice,
      suggestedPrice1: formData.suggestedPrice1,
      cost: formData.cost,
      cost1: formData.cost1,
      moq: formData.moq,
      competitorPriceSp: formData.competitorPriceSp,
      competitorPriceQl: formData.competitorPriceQl,
      competitorPriceSpNum: formData.competitorPriceSpNum,
      competitorPriceQlNum: formData.competitorPriceQlNum,
      sellingPoints: formData.sellingPoints,
      specs: formData.specs,
      standardConfig: formData.standardConfig,
      packageEnglishName: formData.packageEnglishName,
      netWeight: formData.netWeight,
      grossWeight: formData.grossWeight,
      wholeBoxWeight: formData.wholeBoxWeight,
      packagingSize: formData.packagingSize,
      innerBoxSize: formData.innerBoxSize,
      outerBoxSize: formData.outerBoxSize,
      innerBoxQty: formData.innerBoxQty,
      outerBoxQty: formData.outerBoxQty,
      packingQty: formData.packingQty,
      innerBoxSku: formData.innerBoxSku,
      outerBoxSku: formData.outerBoxSku,
      innerBarcode: formData.innerBarcode,
      eanCode: formData.eanCode,
      hsCode: formData.hsCode,
      usBarcode: formData.usBarcode,
      productSupplying: formData.productSupplying,
      remark: formData.remark,
      remark1: formData.remark1,
      remark2: formData.remark2,
      productImage: JSON.stringify(productImages.value),
      brandPackageImage: JSON.stringify(brandImages.value)
    }

    let response
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
  color: #0f172a;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 0 0 12px;
  border-left: 3px solid #3b82f6;
  margin-bottom: 16px;
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

    &.info-item--full {
      width: 100%;
    }

    .item-label {
      width: 140px;
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
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;

  .extra-tabs-nav {
    display: flex;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    .extra-tab-item {
      padding: 0 20px;
      height: 36px;
      line-height: 36px;
      font-size: 14px;
      color: #64748b;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;

      &:hover {
        color: #3b82f6;
      }

      &.active {
        color: #3b82f6;
        font-weight: 600;
        background: #fff;

        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #3b82f6;
        }
      }
    }
  }

  .extra-tab-content {
    padding: 20px;
    background: #fff;
    min-height: 200px;
  }
}

.extra-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.extra-image-item {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e2e8f0;

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

.upload-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #94a3b8;
}

.product-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
