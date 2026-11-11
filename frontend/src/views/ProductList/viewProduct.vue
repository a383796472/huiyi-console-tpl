<template>
  <div class="view-product" v-loading="loading">

    <div class="form-section">
      <div class="section-title">基础资料</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label must">产品名称</div>
          <div class="item-value" :title="productData.product_name || '-'"><span>{{ productData.product_name || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label must">SKU</div>
          <div class="item-value" :title="productData.sku || '-'"><span>{{ productData.sku || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品编号</div>
          <div class="item-value" :title="productData.product_code || '-'"><span>{{ productData.product_code || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">系列</div>
          <div class="item-value" :title="productData.series || '-'"><span>{{ productData.series || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">系列编号</div>
          <div class="item-value" :title="productData.series_code || '-'"><span>{{ productData.series_code || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品状态</div>
          <div class="item-value" :title="productData.product_status || '-'"><span>{{ productData.product_status || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">英文产品名称</div>
          <div class="item-value" :title="productData.english_name || '-'"><span>{{ productData.english_name || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">型号</div>
          <div class="item-value" :title="productData.model || '-'"><span>{{ productData.model || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">颜色</div>
          <div class="item-value" :title="productData.color || '-'"><span>{{ productData.color || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">生产工艺</div>
          <div class="item-value" :title="productData.production_process || '-'"><span>{{ productData.production_process || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">材料</div>
          <div class="item-value" :title="productData.material || '-'"><span>{{ productData.material || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">适配车型</div>
          <div class="item-value" :title="productData.compatible_vehicles || '-'"><span>{{ productData.compatible_vehicles || '-' }}</span></div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">价格信息</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">中国零售价</div>
          <div class="item-value" :title="productData.china_retail_price || '-'"><span>{{ productData.china_retail_price || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">美国（USD）</div>
          <div class="item-value" :title="productData.usd_price || '-'"><span>{{ productData.usd_price || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">欧洲（€）</div>
          <div class="item-value" :title="productData.eur_price || '-'"><span>{{ productData.eur_price || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">建议销售价</div>
          <div class="item-value" :title="productData.suggested_price || '-'"><span>{{ productData.suggested_price || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">建议销售价（1）</div>
          <div class="item-value" :title="productData.suggested_price_1 || '-'"><span>{{ productData.suggested_price_1 || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">成本</div>
          <div class="item-value" :title="productData.cost || '-'"><span>{{ productData.cost || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">成本（1）</div>
          <div class="item-value" :title="productData.cost_1 || '-'"><span>{{ productData.cost_1 || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">MOQ</div>
          <div class="item-value" :title="productData.moq || '-'"><span>{{ productData.moq || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美（sp）</div>
          <div class="item-value" :title="productData.competitor_price_sp || '-'"><span>{{ productData.competitor_price_sp || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美（quadlock）</div>
          <div class="item-value" :title="productData.competitor_price_ql || '-'"><span>{{ productData.competitor_price_ql || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美：SP</div>
          <div class="item-value" :title="productData.competitor_price_sp_num || '-'"><span>{{ productData.competitor_price_sp_num || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">海外竞对参考价-美：ql</div>
          <div class="item-value" :title="productData.competitor_price_ql_num || '-'"><span>{{ productData.competitor_price_ql_num || '-' }}</span></div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">规格参数</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">产品卖点</div>
          <div class="item-value" :title="productData.selling_points || '-'"><span>{{ productData.selling_points || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">规格参数</div>
          <div class="item-value" :title="productData.specs || '-'"><span>{{ productData.specs || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">标准配置（改进后需要修改）</div>
          <div class="item-value" :title="productData.standard_config || '-'"><span>{{ productData.standard_config || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品包装英文名称</div>
          <div class="item-value" :title="productData.package_english_name || '-'"><span>{{ productData.package_english_name || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品净重（KG）</div>
          <div class="item-value" :title="productData.net_weight || '-'"><span>{{ productData.net_weight || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">毛重（KG）（包含产品，包装）</div>
          <div class="item-value" :title="productData.gross_weight || '-'"><span>{{ productData.gross_weight || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">整箱毛重（KG）</div>
          <div class="item-value" :title="productData.whole_box_weight || '-'"><span>{{ productData.whole_box_weight || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">包装规格（MM）</div>
          <div class="item-value" :title="productData.packaging_size || '-'"><span>{{ productData.packaging_size || '-' }}</span></div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">包装信息</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">内小箱规格（MM）</div>
          <div class="item-value" :title="productData.inner_box_size || '-'"><span>{{ productData.inner_box_size || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">外大箱规格（MM）</div>
          <div class="item-value" :title="productData.outer_box_size || '-'"><span>{{ productData.outer_box_size || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">内箱装箱数量</div>
          <div class="item-value" :title="productData.inner_box_qty || '-'"><span>{{ productData.inner_box_qty || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">外箱装箱数量</div>
          <div class="item-value" :title="productData.outer_box_qty || '-'"><span>{{ productData.outer_box_qty || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">装箱数量</div>
          <div class="item-value" :title="productData.packing_qty || '-'"><span>{{ productData.packing_qty || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">MOQ</div>
          <div class="item-value" :title="productData.moq || '-'"><span>{{ productData.moq || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">内箱SKU代码（ICS）</div>
          <div class="item-value" :title="productData.inner_box_sku || '-'"><span>{{ productData.inner_box_sku || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">外箱SKU代码(MCS)</div>
          <div class="item-value" :title="productData.outer_box_sku || '-'"><span>{{ productData.outer_box_sku || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">内纸箱条形码（ICB）</div>
          <div class="item-value" :title="productData.inner_barcode || '-'"><span>{{ productData.inner_barcode || '-' }}</span></div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">报关信息</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">EAN码</div>
          <div class="item-value" :title="productData.ean_code || '-'"><span>{{ productData.ean_code || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">海关编码</div>
          <div class="item-value" :title="productData.hs_code || '-'"><span>{{ productData.hs_code || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">美国条形码编号</div>
          <div class="item-value" :title="productData.us_barcode || '-'"><span>{{ productData.us_barcode || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品供应中</div>
          <div class="item-value" :title="productData.product_supplying || '-'"><span>{{ productData.product_supplying || '-' }}</span></div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">备注</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">备注</div>
          <div class="item-value" :title="productData.remark || '-'"><span>{{ productData.remark || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">备注（1）</div>
          <div class="item-value" :title="productData.remark_1 || '-'"><span>{{ productData.remark_1 || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">备注（2）</div>
          <div class="item-value" :title="productData.remark_2 || '-'"><span>{{ productData.remark_2 || '-' }}</span></div>
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
          <div v-if="productImages.length > 0" class="extra-image-list">
            <div v-for="(url, idx) in productImages" :key="idx" class="extra-image-item">
              <img :src="resolveImageUrl(url)" alt="" />
            </div>
          </div>
          <div v-else class="plain-text">暂无产品图片</div>
        </div>

        <div v-if="activeImageTab === 'brand'" class="extra-tab-content">
          <div v-if="brandImages.length > 0" class="extra-image-list">
            <div v-for="(url, idx) in brandImages" :key="idx" class="extra-image-item">
              <img :src="resolveImageUrl(url)" alt="" />
            </div>
          </div>
          <div v-else class="plain-text">暂无品牌包装图片</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request, { baseURL } from '@/utils/request'

const route = useRoute()
const loading = ref(false)

const activeImageTab = ref('product')
const imageTabList = [
  { label: '产品图片', key: 'product' },
  { label: '品牌包装图片', key: 'brand' }
]

const productData = reactive({
  product_name: '',
  sku: '',
  product_code: '',
  series: '',
  series_code: '',
  product_status: '',
  english_name: '',
  model: '',
  color: '',
  production_process: '',
  material: '',
  compatible_vehicles: '',
  china_retail_price: '',
  usd_price: '',
  eur_price: '',
  suggested_price: '',
  suggested_price_1: '',
  cost: '',
  cost_1: '',
  moq: '',
  competitor_price_sp: '',
  competitor_price_ql: '',
  competitor_price_sp_num: '',
  competitor_price_ql_num: '',
  selling_points: '',
  specs: '',
  standard_config: '',
  package_english_name: '',
  net_weight: '',
  gross_weight: '',
  whole_box_weight: '',
  packaging_size: '',
  inner_box_size: '',
  outer_box_size: '',
  inner_box_qty: '',
  outer_box_qty: '',
  packing_qty: '',
  inner_box_sku: '',
  outer_box_sku: '',
  inner_barcode: '',
  ean_code: '',
  hs_code: '',
  us_barcode: '',
  product_supplying: '',
  remark: '',
  remark_1: '',
  remark_2: '',
  product_image: '',
  brand_package_image: ''
})

const productImages = ref<string[]>([])
const brandImages = ref<string[]>([])

const resolveImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return baseURL + url
}

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
    const res = await request.get(`/api/products/${id}`)
    if (res.data.code === 200 && res.data.data) {
      const data = res.data.data
      Object.assign(productData, data)
      productImages.value = parseImageField(data.product_image)
      brandImages.value = parseImageField(data.brand_package_image)
    }
  } catch (error) {
    console.error('获取产品详情失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProductDetail()
})
</script>

<style lang="scss" scoped>
.view-product {
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
  margin-bottom: 24px;
}

.product-info {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .info-item {
    display: flex;
    border: 1px solid #d9dde3;
    border-radius: 6px;
    overflow: hidden;

    .item-label {
      width: 50%;
      text-align: center;
      padding: 10px 8px;
      font-weight: 600;
      color: #8A92A0;
      background: #F5F7FA;
      line-height: 1.5;
      display: flex;
      align-items: center;
      justify-content: center;

      &::after {
        content: ':';
        margin-left: 2px;
      }

      &.must::before {
        content: '*';
        color: #e74c3c;
        margin-right: 3px;
      }
    }

    .item-value {
      width: 50%;
      text-align: center;
      padding: 8px;
      background: #fff;
      color: #151515;
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-all;
        line-height: 1.5;
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

.plain-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
}

.extra-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.extra-image-item {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e2e8f0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
