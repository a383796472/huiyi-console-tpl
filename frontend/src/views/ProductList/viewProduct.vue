<template>
  <div class="view-product" v-loading="loading">

    <div class="form-section">
      <div class="section-title">基础资料</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label must">产品名称</div>
          <div class="item-value" :title="productData.name || '-'"><span>{{ productData.name || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">英文名称</div>
          <div class="item-value" :title="productData.english_name || '-'"><span>{{ productData.english_name || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品编号</div>
          <div class="item-value" :title="productData.product_code || '-'"><span>{{ productData.product_code || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label must">SKU编号</div>
          <div class="item-value" :title="productData.SKU || '-'"><span>{{ productData.SKU || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">一级品类</div>
          <div class="item-value" :title="productData.category_l1 || '-'"><span>{{ productData.category_l1 || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">二级品类</div>
          <div class="item-value" :title="productData.category_l2 || '-'"><span>{{ productData.category_l2 || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品类型</div>
          <div class="item-value" :title="productData.product_type || '-'"><span>{{ productData.product_type || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">EAN码</div>
          <div class="item-value" :title="productData.ean_code || '-'"><span>{{ productData.ean_code || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">美国条形码编号</div>
          <div class="item-value" :title="productData.us_barcode || '-'"><span>{{ productData.us_barcode || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">适配车型</div>
          <div class="item-value" :title="productData.compatible_vehicles || '-'"><span>{{ productData.compatible_vehicles || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">销售状态</div>
          <div class="item-value" :title="productData.sales_status || '-'"><span>{{ productData.sales_status || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">成本价RMB</div>
          <div class="item-value" :title="productData.cost_price_rmb || '-'"><span>{{ productData.cost_price_rmb || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">建议零售价USD</div>
          <div class="item-value" :title="productData.retail_price_usd || '-'"><span>{{ productData.retail_price_usd || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">建议零售价EUR</div>
          <div class="item-value" :title="productData.retail_price_eur || '-'"><span>{{ productData.retail_price_eur || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">建议零售价RMB</div>
          <div class="item-value" :title="productData.retail_price_rmb || '-'"><span>{{ productData.retail_price_rmb || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品认证</div>
          <div class="item-value" :title="productData.certification || '-'"><span>{{ productData.certification || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品专利</div>
          <div class="item-value" :title="productData.patent || '-'"><span>{{ productData.patent || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">取得方式</div>
          <div class="item-value" :title="productData.acquisition_method || '-'"><span>{{ productData.acquisition_method || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">颜色</div>
          <div class="item-value" :title="productData.color || '-'"><span>{{ productData.color || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">参考链接</div>
          <div class="item-value" :title="productData.reference_link || '-'"><span>{{ productData.reference_link || '-' }}</span></div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">产品规格</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">净重KG</div>
          <div class="item-value" :title="productData.net_weight || '-'"><span>{{ productData.net_weight || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">毛重KG</div>
          <div class="item-value" :title="productData.gross_weight || '-'"><span>{{ productData.gross_weight || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">整箱毛重KG</div>
          <div class="item-value" :title="productData.whole_box_weight || '-'"><span>{{ productData.whole_box_weight || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品单位</div>
          <div class="item-value" :title="productData.unit || '-'"><span>{{ productData.unit || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">产品尺寸</div>
          <div class="item-value" :title="productData.product_size || '-'"><span>{{ productData.product_size || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">包装尺寸MM</div>
          <div class="item-value" :title="productData.packaging_size_mm || '-'"><span>{{ productData.packaging_size_mm || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">内小箱MM</div>
          <div class="item-value" :title="productData.inner_box_size || '-'"><span>{{ productData.inner_box_size || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">外大箱MM</div>
          <div class="item-value" :title="productData.outer_box_size || '-'"><span>{{ productData.outer_box_size || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">内箱装箱数量</div>
          <div class="item-value" :title="productData.inner_box_qty || '-'"><span>{{ productData.inner_box_qty || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">装箱数量</div>
          <div class="item-value" :title="productData.packing_qty || '-'"><span>{{ productData.packing_qty || '-' }}</span></div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">报关信息</div>

      <div class="product-info">
        <div class="info-item">
          <div class="item-label">申报品类</div>
          <div class="item-value" :title="productData.declare_category || '-'"><span>{{ productData.declare_category || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">海关编码</div>
          <div class="item-value" :title="productData.hs_code || '-'"><span>{{ productData.hs_code || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">中文申报品名</div>
          <div class="item-value" :title="productData.declare_name_cn || '-'"><span>{{ productData.declare_name_cn || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">英文申报品名</div>
          <div class="item-value" :title="productData.declare_name_en || '-'"><span>{{ productData.declare_name_en || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">申报价值USD</div>
          <div class="item-value" :title="productData.declare_value_usd || '-'"><span>{{ productData.declare_value_usd || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">中文材质</div>
          <div class="item-value" :title="productData.material_cn || '-'"><span>{{ productData.material_cn || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">英文材质</div>
          <div class="item-value" :title="productData.material_en || '-'"><span>{{ productData.material_en || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">中文用途</div>
          <div class="item-value" :title="productData.usage_cn || '-'"><span>{{ productData.usage_cn || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">英文用途</div>
          <div class="item-value" :title="productData.usage_en || '-'"><span>{{ productData.usage_en || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">是否包含电池</div>
          <div class="item-value" :title="productData.has_battery || '-'"><span>{{ productData.has_battery || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">是否包含特货</div>
          <div class="item-value" :title="productData.has_special_goods || '-'"><span>{{ productData.has_special_goods || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">是否带磁</div>
          <div class="item-value" :title="productData.has_magnetism || '-'"><span>{{ productData.has_magnetism || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">是否含非液体化妆品</div>
          <div class="item-value" :title="productData.has_non_liquid_cosmetics || '-'"><span>{{ productData.has_non_liquid_cosmetics || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">是否为仿制品</div>
          <div class="item-value" :title="productData.is_counterfeit || '-'"><span>{{ productData.is_counterfeit || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">报关名称</div>
          <div class="item-value" :title="productData.customs_name || '-'"><span>{{ productData.customs_name || '-' }}</span></div>
        </div>
        <div class="info-item">
          <div class="item-label">报关专用材质</div>
          <div class="item-value" :title="productData.customs_material || '-'"><span>{{ productData.customs_material || '-' }}</span></div>
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
          <div class="plain-text">{{ productData.extra_info || '暂无附加信息' }}</div>
        </div>

        <div v-if="activeExtraTab === 'images'" class="extra-tab-content">
          <div v-if="extraImages.length > 0" class="extra-image-list">
            <div v-for="(url, idx) in extraImages" :key="idx" class="extra-image-item">
              <img :src="baseURL + url" alt="" />
            </div>
          </div>
          <div v-else class="plain-text">暂无图片</div>
        </div>

        <div v-if="activeExtraTab === 'accessory'" class="extra-tab-content">
          <div class="plain-text">{{ productData.accessory_info || '暂无配件信息' }}</div>
        </div>

        <div v-if="activeExtraTab === 'selling'" class="extra-tab-content">
          <el-table :data="sellingPoints" border style="width: 100%">
            <el-table-column label="序号" width="60" align="center">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="卖点" min-width="120">
              <template #default="{ row }">{{ row.point || '-' }}</template>
            </el-table-column>
            <el-table-column label="产品属性F（Feature）" min-width="200">
              <template #default="{ row }">{{ row.feature || '-' }}</template>
            </el-table-column>
            <el-table-column label="产品优势A（Advantage）" min-width="200">
              <template #default="{ row }">{{ row.advantage || '-' }}</template>
            </el-table-column>
            <el-table-column label="用户利益B（Benefit）" min-width="200">
              <template #default="{ row }">{{ row.benefit || '-' }}</template>
            </el-table-column>
            <el-table-column label="总结" min-width="200">
              <template #default="{ row }">{{ row.summary || '-' }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="activeExtraTab === 'detail'" class="extra-tab-content">
          <div v-if="productData.selling_detail" class="plain-text" v-html="productData.selling_detail"></div>
          <div v-else class="plain-text">暂无卖点详情</div>
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

const activeExtraTab = ref('extra')
const extraTabList = [
  { label: '产品信息', key: 'extra' },
  { label: '产品图片', key: 'images' },
  { label: '产品规格/配件', key: 'accessory' },
  { label: '产品卖点', key: 'selling' },
  { label: '卖点详情', key: 'detail' }
]

const productData = reactive({
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
  selling_detail: '',
  image: ''
})

const sellingPoints = ref<any[]>([])
const extraImages = ref<string[]>([])

const fetchProductDetail = async () => {
  const id = route.query.id
  if (!id) return

  loading.value = true
  try {
    const res = await request.get(`/api/products/${id}`)
    if (res.data.code === 200 && res.data.data) {
      const data = res.data.data
      Object.assign(productData, data)
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
  color: #303133;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 0 0 12px;
  border-left: 3px solid #409EFF;
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
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #dcdfe6;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
