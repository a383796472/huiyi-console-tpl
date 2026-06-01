<template>
  <div class="home-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>控制台概览</h1>
      <p>欢迎回来！这是您的产品管理控制面板</p>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon products-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ productCount }}</div>
          <div class="stat-label">产品总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon category-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ categoryCount }}</div>
          <div class="stat-label">分类数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stock-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ inStockCount }}</div>
          <div class="stat-label">有库存</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon update-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ todayUpdateCount }}</div>
          <div class="stat-label">今日更新</div>
        </div>
      </div>
    </div>

    <!-- 快速操作区域 -->
    <div class="quick-actions">
      <h3 class="section-title">快速操作</h3>
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="goToAddProduct">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加产品
        </el-button>
        <el-button size="large" @click="goToProductList">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          产品列表
        </el-button>
      </div>
    </div>

    <!-- 最近更新的产品 -->
    <div class="recent-products">
      <div class="section-header">
        <h3 class="section-title">最近更新的产品</h3>
        <el-button type="text" @click="goToProductList">查看全部</el-button>
      </div>
      <el-table :data="recentProducts" border style="width: 100%">
        <el-table-column prop="name" label="品名" min-width="120">
          <template #default="{ row }">{{ row.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="SKU" label="SKU" min-width="120">
          <template #default="{ row }">{{ row.SKU || '-' }}</template>
        </el-table-column>
        <el-table-column prop="product_type" label="产品类型" min-width="100">
          <template #default="{ row }">{{ row.product_type || '-' }}</template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="140">
          <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column prop="sales_status" label="销售状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getSalesStatusType(row.sales_status)">{{ row.sales_status || '未设置' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <h3 class="section-title">产品分类分布</h3>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div class="bar-item">
              <div class="bar-label">配件</div>
              <div class="bar-container">
                <div class="bar" style="height: 80%; background-color: #3b82f6;"></div>
              </div>
              <div class="bar-value">42</div>
            </div>
            <div class="bar-item">
              <div class="bar-label">工具</div>
              <div class="bar-container">
                <div class="bar" style="height: 65%; background-color: #10b981;"></div>
              </div>
              <div class="bar-value">33</div>
            </div>
            <div class="bar-item">
              <div class="bar-label">原料</div>
              <div class="bar-container">
                <div class="bar" style="height: 45%; background-color: #f59e0b;"></div>
              </div>
              <div class="bar-value">23</div>
            </div>
            <div class="bar-item">
              <div class="bar-label">设备</div>
              <div class="bar-container">
                <div class="bar" style="height: 30%; background-color: #ef4444;"></div>
              </div>
              <div class="bar-value">15</div>
            </div>
            <div class="bar-item">
              <div class="bar-label">其他</div>
              <div class="bar-container">
                <div class="bar" style="height: 20%; background-color: #64748b;"></div>
              </div>
              <div class="bar-value">10</div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="section-title">库存状态统计</h3>
        <div class="chart-placeholder">
          <div class="pie-chart">
            <div class="pie-slice slice1"></div>
            <div class="pie-slice slice2"></div>
            <div class="pie-slice slice3"></div>
            <div class="pie-center">
              <div class="pie-value">{{ inStockPercent }}%</div>
              <div class="pie-label">有库存</div>
            </div>
          </div>
          <div class="pie-legend">
            <div class="legend-item">
              <span class="legend-color" style="background-color: #10b981;"></span>
              <span>有库存</span>
              <span class="legend-value">{{ inStockPercent }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #f59e0b;"></span>
              <span>库存不足</span>
              <span class="legend-value">{{ lowStockPercent }}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #ef4444;"></span>
              <span>无库存</span>
              <span class="legend-value">{{ noStockPercent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

// 统计数据
const productCount = ref(0)
const categoryCount = ref(0)
const inStockCount = ref(0)
const todayUpdateCount = ref(0)

// 最近更新的产品
const recentProducts = ref<any[]>([])

// 库存百分比
const inStockPercent = ref(65)
const lowStockPercent = ref(25)
const noStockPercent = ref(10)

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 获取状态标签类型
const getSalesStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '在售': 'success',
    '停售': 'danger',
    '预售': 'warning',
    '待定': 'info'
  }
  return statusMap[status] || 'default'
}

// 跳转添加产品
const goToAddProduct = () => {
  router.push('/creatProduct')
}

// 跳转产品列表
const goToProductList = () => {
  router.push('/products')
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await request.get('/api/products')
    if (res.data.code === 200) {
      const rawList = res.data.data.list || res.data.data || []
      const data = Array.isArray(rawList) ? rawList : []
      productCount.value = data.length
      
      const productTypes = new Set(data.map((item: any) => item.product_type).filter(Boolean))
      categoryCount.value = productTypes.size
      
      inStockCount.value = data.filter((item: any) => item.sales_status === '在售').length
      
      const today = new Date().toDateString()
      todayUpdateCount.value = data.filter((item: any) => {
        const updateDate = new Date(item.updated_at || item.created_at).toDateString()
        return updateDate === today
      }).length
      
      recentProducts.value = [...data]
        .sort((a: any, b: any) => {
          const aDate = new Date(a.updated_at || a.created_at).getTime()
          const bDate = new Date(b.updated_at || b.created_at).getTime()
          return bDate - aDate
        })
        .slice(0, 5)
      
      if (data.length > 0) {
        inStockPercent.value = Math.round((inStockCount.value / data.length) * 100)
        lowStockPercent.value = Math.round((Math.floor(data.length * 0.25)))
        noStockPercent.value = 100 - inStockPercent.value - lowStockPercent.value
      }
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
    productCount.value = 123
    categoryCount.value = 8
    inStockCount.value = 80
    todayUpdateCount.value = 5
    recentProducts.value = [
      { id: 1, name: '品牌名字', SKU: 'SKU001', product_type: '配件', sales_status: '在售', updated_at: new Date().toISOString() },
      { id: 2, name: '汽车零件A', SKU: 'SKU002', product_type: '配件', sales_status: '在售', updated_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 3, name: '工具套装', SKU: 'SKU003', product_type: '工具', sales_status: '待定', updated_at: new Date(Date.now() - 7200000).toISOString() },
      { id: 4, name: '原材料B', SKU: 'SKU004', product_type: '原料', sales_status: '在售', updated_at: new Date(Date.now() - 10800000).toISOString() },
      { id: 5, name: '设备组件', SKU: 'SKU005', product_type: '设备', sales_status: '停售', updated_at: new Date(Date.now() - 14400000).toISOString() }
    ]
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style lang="scss" scoped>
.home-container {
  padding: 24px 0 0;
  min-height: 100%;
}

.page-header {
  margin-bottom: 28px;
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }
  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: #fff;
  border-radius: 18px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
  transition: all 0.25s ease;
  cursor: default;

  &:hover {
    transform: translateY(-3px);
    box-shadow:
      0 4px 8px rgba(15, 23, 42, 0.06),
      0 24px 48px rgba(15, 23, 42, 0.08);
  }
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18px;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);

  &.products-icon {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    color: #fff;
  }
  &.category-icon {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    color: #fff;
  }
  &.stock-icon {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    color: #fff;
  }
  &.update-icon {
    background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
    color: #fff;
  }
}

.stat-info {
  .stat-value {
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
    letter-spacing: -0.5px;
  }
  .stat-label {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
  }
}

.quick-actions {
  background: #fff;
  border-radius: 18px;
  padding: 22px 24px;
  margin-bottom: 28px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 18px 0;
  letter-spacing: -0.3px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.recent-products {
  background: #fff;
  border-radius: 18px;
  padding: 22px 24px;
  margin-bottom: 28px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 18px;
  padding: 22px 24px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-bars {
  display: flex;
  gap: 28px;
  align-items: flex-end;
  height: 160px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
  font-weight: 500;
}

.bar-container {
  width: 36px;
  height: 120px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar {
  width: 100%;
  border-radius: 8px;
  transition: height 0.4s ease;
}

.bar-value {
  font-size: 12px;
  color: #334155;
  font-weight: 600;
  margin-top: 8px;
}

.pie-chart {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    #10b981 0deg 234deg,
    #f59e0b 234deg 324deg,
    #ef4444 324deg 360deg
  );
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pie-value {
  font-size: 20px;
  font-weight: 700;
  color: #10b981;
}

.pie-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.pie-legend {
  margin-left: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #475569;

  .legend-color {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .legend-value {
    margin-left: auto;
    font-weight: 600;
    color: #0f172a;
  }
}
</style>
