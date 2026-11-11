<template>
  <div class="shop-stats">
    <!-- 页头 -->
    <div class="page-head">
      <div class="head-left">
        <h1>店铺数据概览</h1>
        <p>各店铺订单与销售表现概览</p>
      </div>
      <div class="head-right">
        <el-select v-model="platformFilter" class="platform-select">
          <el-option label="全部平台" value="all" />
          <el-option
            v-for="(label, value) in PLATFORM_LABELS"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
        <el-radio-group v-model="rangeDays" class="range-switch">
          <el-radio-button :value="7">近 7 天</el-radio-button>
          <el-radio-button :value="30">近 30 天</el-radio-button>
          <el-radio-button :value="90">近 90 天</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- KPI -->
    <div class="kpi-grid">
      <div v-for="k in kpis" :key="k.key" class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">{{ k.label }}</span>
          <span class="kpi-dot" :style="{ background: k.color }"></span>
        </div>
        <div class="kpi-value">
          <span v-if="k.prefix" class="kpi-affix">{{ k.prefix }}</span>{{ k.value }}<span v-if="k.suffix" class="kpi-affix">{{ k.suffix }}</span>
        </div>
        <div class="kpi-delta" :class="deltaClass(k)">
          <template v-if="isFinite(k.delta)">
            <span class="delta-arrow">{{ k.delta >= 0 ? '▲' : '▼' }}</span>
            <span>{{ Math.abs(k.delta).toFixed(1) }}%</span>
          </template>
          <span v-else class="delta-none">—</span>
          <span class="delta-hint">较上一周期</span>
        </div>
      </div>
    </div>

    <!-- 第一行：店铺表现 + 状态环形 -->
    <div class="chart-row">
      <section class="panel span-8">
        <header class="panel-head">
          <h3>店铺表现</h3>
          <span class="panel-hint">按销售额排序</span>
        </header>
        <div class="shop-list">
          <div v-for="(s, i) in shopStats" :key="s.id" class="shop-row">
            <span class="rank" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
            <div class="shop-meta">
              <div class="shop-name" :title="s.shopName">{{ s.shopName }}</div>
              <div class="shop-sub">
                <span class="platform-chip" :style="{ color: s.color, background: s.colorSoft }">{{ s.platformLabel }}</span>
                <span>{{ s.orders }} 单</span>
                <span class="sep">·</span>
                <span>客单 ¥{{ s.avgValue.toFixed(0) }}</span>
              </div>
            </div>
            <div class="shop-bar">
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: s.barWidth + '%', background: s.color }"></div>
              </div>
            </div>
            <div class="shop-sales">
              <div class="value">¥{{ formatWan(s.sales) }}</div>
              <div class="delta" :class="s.salesDelta >= 0 ? 'up' : 'down'">
                {{ s.salesDelta >= 0 ? '▲' : '▼' }} {{ Math.abs(s.salesDelta).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel span-4">
        <header class="panel-head">
          <h3>订单状态分布</h3>
        </header>
        <div class="donut-wrap">
          <svg class="donut" viewBox="0 0 160 160">
            <g transform="rotate(-90 80 80)">
              <circle cx="80" cy="80" r="58" fill="none" stroke="#f1f5f9" stroke-width="20" />
              <circle
                v-for="seg in statusSegments" :key="seg.key"
                cx="80" cy="80" r="58" fill="none"
                :stroke="seg.color" stroke-width="20"
                :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset"
              />
            </g>
            <text x="80" y="76" text-anchor="middle" class="donut-num">{{ totalOrders }}</text>
            <text x="80" y="97" text-anchor="middle" class="donut-cap">总订单</text>
          </svg>
          <ul class="donut-legend">
            <li v-for="seg in statusSegments" :key="seg.key">
              <span class="dot" :style="{ background: seg.color }"></span>
              <span class="lg-label">{{ seg.label }}</span>
              <span class="lg-val">{{ seg.count }}</span>
              <span class="lg-pct">{{ seg.percent }}%</span>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <!-- 第二行：订单趋势 + 地区 -->
    <div class="chart-row">
      <section class="panel span-7">
        <header class="panel-head">
          <div>
            <h3>订单趋势</h3>
            <p class="panel-desc">{{ rangeDays }} 天内{{ platformScopeText }}合计</p>
          </div>
          <div class="metric-switch">
            <button
              type="button"
              class="metric-orders"
              :class="{ active: metric === 'orders' }"
              @click="metric = 'orders'"
            ><span class="metric-dot"></span>订单量</button>
            <button
              type="button"
              class="metric-sales"
              :class="{ active: metric === 'sales' }"
              @click="metric = 'sales'"
            ><span class="metric-dot"></span>销售额</button>
          </div>
        </header>
        <div class="chart-body">
          <svg class="chart-svg" viewBox="0 0 760 260" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="metricColor" stop-opacity="0.28" />
                <stop offset="100%" :stop-color="metricColor" stop-opacity="0" />
              </linearGradient>
            </defs>
            <!-- 网格与 Y 轴 -->
            <g v-for="(t, i) in trendYLabels" :key="`gy-${i}`">
              <line
                :x1="CH.l" :y1="t.y" :x2="CH.w - CH.r" :y2="t.y"
                stroke="#eef2f7" stroke-width="1"
              />
              <text :x="CH.l - 10" :y="t.y + 4" text-anchor="end" class="axis-text">{{ t.label }}</text>
            </g>
            <!-- X 轴刻度 -->
            <text
              v-for="(t, i) in trendXLabels" :key="`gx-${i}`"
              :x="t.x" :y="CH.h - 8" text-anchor="middle" class="axis-text"
            >{{ t.label }}</text>
            <!-- 面积 + 折线 -->
            <path :d="trendAreaPath" fill="url(#trendFill)" />
            <path :d="trendLinePath" fill="none" :stroke="metricColor" stroke-width="2.5" stroke-linejoin="round" />
            <circle
              v-for="(p, i) in trendPoints" :key="`pt-${i}`"
              :cx="p.x" :cy="p.y" :r="rangeDays === 7 ? 3.5 : 0"
              fill="#fff" :stroke="metricColor" stroke-width="2"
            />
          </svg>
        </div>
      </section>

      <section class="panel span-5">
        <header class="panel-head">
          <h3>收货地区 TOP 6</h3>
          <span class="panel-hint">按订单数</span>
        </header>
        <ul class="region-list">
          <li v-for="r in topRegions" :key="r.name">
            <span class="rg-name">{{ r.name }}</span>
            <div class="rg-track">
              <div class="rg-fill" :style="{ width: r.pct + '%' }"></div>
            </div>
            <span class="rg-val">{{ r.count }}</span>
            <span class="rg-pct">{{ r.share }}%</span>
          </li>
        </ul>
      </section>
    </div>

    <!-- 第三行：多店铺趋势 + 热力图 -->
    <div class="chart-row">
      <section class="panel span-7">
        <header class="panel-head">
          <h3>各店铺订单趋势</h3>
          <span class="panel-hint">{{ rangeDays }} 天</span>
        </header>
        <div class="chart-body">
          <svg class="chart-svg" viewBox="0 0 760 260" preserveAspectRatio="xMidYMid meet">
            <g v-for="(t, i) in multiYLabels" :key="`my-${i}`">
              <line
                :x1="CH.l" :y1="t.y" :x2="CH.w - CH.r" :y2="t.y"
                stroke="#eef2f7" stroke-width="1"
              />
              <text :x="CH.l - 10" :y="t.y + 4" text-anchor="end" class="axis-text">{{ t.label }}</text>
            </g>
            <text
              v-for="(t, i) in multiXLabels" :key="`mx-${i}`"
              :x="t.x" :y="CH.h - 8" text-anchor="middle" class="axis-text"
            >{{ t.label }}</text>
            <path
              v-for="s in multiSeries" :key="s.id"
              :d="s.path" fill="none" :stroke="s.color"
              stroke-width="2" stroke-linejoin="round" opacity="0.92"
            />
          </svg>
          <ul class="line-legend">
            <li v-for="s in multiSeries" :key="s.id">
              <span class="line-dash" :style="{ background: s.color }"></span>
              <span class="lg-label">{{ s.shortName }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="panel span-5">
        <header class="panel-head">
          <h3>客单价分布</h3>
          <span class="panel-hint">按订单实付金额分档</span>
        </header>
        <div class="price-chart">
          <div class="price-bars">
            <div v-for="b in priceBands" :key="b.label" class="price-item">
              <span class="price-count">{{ b.count }}</span>
              <div class="price-track">
                <div class="price-bar" :style="{ height: b.height + '%' }"></div>
              </div>
              <span class="price-label">{{ b.label }}</span>
            </div>
          </div>
          <p class="price-note">
            主价格带 <strong>{{ topPriceBand.label }}</strong>，占 {{ topPriceBand.share }}%
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PLATFORM_LABELS, STATUS_LABELS } from '@/api/order'

// ===== 演示数据（后续接入真实接口时，替换 buildDemoRows 即可） =====

type PlatformKey = 'shopify' | 'jushuitan' | 'tmall' | 'alibaba1688'
type StatusKey = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'other'

interface ShopSeed {
  id: string
  platform: PlatformKey
  shopName: string
  shortName: string
  baseOrders: number
  avgValue: number
  refundRate: number
  growth: number
  color: string
  statusWeights: number[]
  priceWeights: number[]
  regions: Array<{ name: string; weight: number }>
}

interface DemoRow {
  date: string
  shopId: string
  orders: number
  sales: number
  refunds: number
}

const SHOPS: ShopSeed[] = [
  {
    id: 'dy-jike',
    platform: 'jushuitan',
    shopName: '集客电子抖音旗舰店',
    shortName: '抖音店',
    baseOrders: 68,
    avgValue: 129,
    refundRate: 0.058,
    growth: 1.28,
    color: '#3b82f6',
    statusWeights: [0.05, 0.19, 0.24, 0.48, 0.03, 0.01],
    priceWeights: [0.06, 0.22, 0.38, 0.2, 0.1, 0.03, 0.01, 0],
    regions: [
      { name: '广东', weight: 0.21 }, { name: '浙江', weight: 0.16 },
      { name: '江苏', weight: 0.13 }, { name: '上海', weight: 0.1 },
      { name: '山东', weight: 0.08 }, { name: '四川', weight: 0.07 },
      { name: '福建', weight: 0.06 }, { name: '北京', weight: 0.05 }
    ]
  },
  {
    id: 'tmall-jike',
    platform: 'tmall',
    shopName: '集客电子天猫旗舰店',
    shortName: '天猫店',
    baseOrders: 55,
    avgValue: 168,
    refundRate: 0.042,
    growth: 0.94,
    color: '#8b5cf6',
    statusWeights: [0.04, 0.2, 0.21, 0.52, 0.02, 0.01],
    priceWeights: [0.03, 0.12, 0.34, 0.27, 0.16, 0.06, 0.02, 0],
    regions: [
      { name: '浙江', weight: 0.19 }, { name: '广东', weight: 0.18 },
      { name: '江苏', weight: 0.15 }, { name: '上海', weight: 0.12 },
      { name: '北京', weight: 0.09 }, { name: '山东', weight: 0.07 },
      { name: '湖北', weight: 0.05 }, { name: '四川', weight: 0.04 }
    ]
  },
  {
    id: 'shopify-aurora',
    platform: 'shopify',
    shopName: 'AuroraGear 独立站',
    shortName: '独立站',
    baseOrders: 38,
    avgValue: 86,
    refundRate: 0.031,
    growth: 1.16,
    color: '#10b981',
    statusWeights: [0.06, 0.16, 0.25, 0.5, 0.02, 0.01],
    priceWeights: [0.12, 0.34, 0.32, 0.14, 0.06, 0.02, 0, 0],
    regions: [
      { name: '广东', weight: 0.24 }, { name: '福建', weight: 0.14 },
      { name: '浙江', weight: 0.12 }, { name: '江苏', weight: 0.1 },
      { name: '上海', weight: 0.08 }, { name: '北京', weight: 0.07 },
      { name: '山东', weight: 0.06 }, { name: '湖南', weight: 0.05 }
    ]
  },
  {
    id: '1688-jike',
    platform: 'alibaba1688',
    shopName: '广州集客电子（1688）',
    shortName: '1688',
    baseOrders: 26,
    avgValue: 420,
    refundRate: 0.017,
    growth: 1.05,
    color: '#f59e0b',
    statusWeights: [0.03, 0.22, 0.26, 0.46, 0.02, 0.01],
    priceWeights: [0, 0.03, 0.1, 0.16, 0.3, 0.26, 0.12, 0.03],
    regions: [
      { name: '广东', weight: 0.32 }, { name: '浙江', weight: 0.14 },
      { name: '江苏', weight: 0.11 }, { name: '福建', weight: 0.09 },
      { name: '山东', weight: 0.08 }, { name: '河南', weight: 0.06 },
      { name: '上海', weight: 0.05 }, { name: '河北', weight: 0.04 }
    ]
  }
]

const STATUS_COLORS: Record<StatusKey, string> = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  shipped: '#06b6d4',
  completed: '#10b981',
  cancelled: '#ef4444',
  other: '#94a3b8'
}

const STATUS_ORDER: StatusKey[] = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'other']

const TOTAL_DAYS = 180
const DAY_MS = 86400000

const pad2 = (n: number) => String(n).padStart(2, '0')

// 固定种子的伪随机，保证每次渲染数据一致
let seed = 20261021
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

const todayTs = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
})()

const demoDays = Array.from({ length: TOTAL_DAYS }, (_, i) => {
  const ts = todayTs - (TOTAL_DAYS - 1 - i) * DAY_MS
  const d = new Date(ts)
  return {
    key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    dow: d.getDay(),
    ratio: i / (TOTAL_DAYS - 1)
  }
})

const buildDemoRows = (): DemoRow[] => {
  const rows: DemoRow[] = []
  for (const day of demoDays) {
    for (const shop of SHOPS) {
      const growthFactor = 1 + (shop.growth - 1) * day.ratio
      const weekendFactor = day.dow === 0 || day.dow === 6 ? 1.18 : 1
      const noise = 0.82 + rand() * 0.36
      const spike = rand() > 0.96 ? 1.35 + rand() * 0.35 : 1
      const orders = Math.max(1, Math.round(shop.baseOrders * growthFactor * weekendFactor * noise * spike))
      const sales = orders * shop.avgValue * (0.9 + rand() * 0.2)
      const refunds = Math.round(orders * shop.refundRate * (0.6 + rand() * 0.8))
      rows.push({ date: day.key, shopId: shop.id, orders, sales, refunds })
    }
  }
  return rows
}

const allRows = buildDemoRows()

// ===== 时间范围与聚合 =====

const rangeDays = ref(30)
const metric = ref<'orders' | 'sales'>('orders')
const platformFilter = ref<string>('all')

// 两种指标各用一个颜色，与上方 KPI 卡保持一致
const metricColor = computed(() => (metric.value === 'orders' ? '#3b82f6' : '#10b981'))

// 按平台筛选后参与统计的店铺
const activeShops = computed(() =>
  platformFilter.value === 'all'
    ? SHOPS
    : SHOPS.filter((s) => s.platform === platformFilter.value)
)

const activeShopIds = computed(() => new Set(activeShops.value.map((s) => s.id)))

const platformScopeText = computed(() =>
  platformFilter.value === 'all'
    ? '全部店铺'
    : PLATFORM_LABELS[platformFilter.value] || platformFilter.value
)

// 按日期取窗口，避免按条数切片在平台筛选后错位
const rangeDates = computed(() => demoDays.slice(-rangeDays.value).map((d) => d.key))
const prevDates = computed(() => demoDays.slice(-rangeDays.value * 2, -rangeDays.value).map((d) => d.key))

const rowsIn = (dates: string[]) => {
  const dateSet = new Set(dates)
  const shopIds = activeShopIds.value
  return allRows.filter((r) => dateSet.has(r.date) && shopIds.has(r.shopId))
}

const currentRows = computed(() => rowsIn(rangeDates.value))
const previousRows = computed(() => rowsIn(prevDates.value))

interface Totals {
  orders: number
  sales: number
  refunds: number
}

const sumRows = (rows: DemoRow[]): Totals =>
  rows.reduce(
    (acc, r) => {
      acc.orders += r.orders
      acc.sales += r.sales
      acc.refunds += r.refunds
      return acc
    },
    { orders: 0, sales: 0, refunds: 0 }
  )

const totals = computed<Totals>(() => sumRows(currentRows.value))
const prevTotals = computed<Totals>(() => sumRows(previousRows.value))

const totalOrders = computed(() => totals.value.orders)

const pctChange = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : NaN)

const formatWan = (v: number) => {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万`
  return Math.round(v).toLocaleString('zh-CN')
}

const kpis = computed(() => {
  const cur = totals.value
  const prev = prevTotals.value
  const aov = cur.orders ? cur.sales / cur.orders : 0
  const prevAov = prev.orders ? prev.sales / prev.orders : 0
  const refundRate = cur.orders ? (cur.refunds / cur.orders) * 100 : 0
  const prevRefundRate = prev.orders ? (prev.refunds / prev.orders) * 100 : 0

  return [
    {
      key: 'orders',
      label: '订单总数',
      value: cur.orders.toLocaleString('zh-CN'),
      prefix: '',
      suffix: ' 单',
      color: '#3b82f6',
      delta: pctChange(cur.orders, prev.orders),
      inverse: false
    },
    {
      key: 'sales',
      label: '销售额',
      value: formatWan(cur.sales),
      prefix: '¥',
      suffix: '',
      color: '#10b981',
      delta: pctChange(cur.sales, prev.sales),
      inverse: false
    },
    {
      key: 'aov',
      label: '平均客单价',
      value: aov.toFixed(0),
      prefix: '¥',
      suffix: '',
      color: '#8b5cf6',
      delta: pctChange(aov, prevAov),
      inverse: false
    },
    {
      key: 'refund',
      label: '退款率',
      value: refundRate.toFixed(1),
      prefix: '',
      suffix: '%',
      color: '#f59e0b',
      delta: pctChange(refundRate, prevRefundRate),
      inverse: true
    }
  ]
})

const deltaClass = (k: { delta: number; inverse: boolean }) => {
  if (!isFinite(k.delta)) return 'flat'
  const isGood = k.inverse ? k.delta <= 0 : k.delta >= 0
  return isGood ? 'up' : 'down'
}

// ===== 图表通用几何 =====

const CH = { w: 760, h: 260, l: 48, r: 20, t: 18, b: 30 }
const innerW = CH.w - CH.l - CH.r
const innerH = CH.h - CH.t - CH.b

const toPoints = (values: number[], max: number) => {
  const n = values.length
  return values.map((v, i) => {
    const rawY = CH.t + (1 - v / (max || 1)) * innerH
    return {
      x: n > 1 ? CH.l + (i / (n - 1)) * innerW : CH.l + innerW / 2,
      y: Math.min(CH.h - CH.b, Math.max(CH.t, rawY))
    }
  })
}

const smoothPath = (pts: Array<{ x: number; y: number }>) => {
  if (!pts.length) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = Math.min(CH.h - CH.b, Math.max(CH.t, p1.y + (p2.y - p0.y) / 6))
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = Math.min(CH.h - CH.b, Math.max(CH.t, p2.y - (p3.y - p1.y) / 6))
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

const niceMax = (v: number) => {
  if (v <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const base = v / exp
  // 细阶梯避免 593 被抬到 1000、曲线被压扁
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  const step = steps.find((s) => s >= base) ?? 10
  return step * exp
}

// ===== 单指标趋势图 =====

const trendValues = computed(() => {
  const byDate = new Map<string, number>()
  for (const r of currentRows.value) {
    const v = metric.value === 'orders' ? r.orders : r.sales
    byDate.set(r.date, (byDate.get(r.date) || 0) + v)
  }
  return Array.from(byDate.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
})

const trendMax = computed(() => {
  const max = Math.max(...trendValues.value.map(([, v]) => v), 1)
  return niceMax(max * 1.08)
})

const trendPoints = computed(() =>
  toPoints(trendValues.value.map(([, v]) => v), trendMax.value)
)

const trendLinePath = computed(() => smoothPath(trendPoints.value))

const trendAreaPath = computed(() => {
  if (!trendPoints.value.length) return ''
  const line = smoothPath(trendPoints.value)
  const last = trendPoints.value[trendPoints.value.length - 1]
  return `${line} L ${last.x.toFixed(2)} ${CH.h - CH.b} L ${CH.l} ${CH.h - CH.b} Z`
})

const trendYLabels = computed(() => {
  const max = trendMax.value
  return [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: CH.t + (1 - t) * innerH,
    label: metric.value === 'orders' ? Math.round(max * t).toString() : `¥${formatWan(max * t)}`
  }))
})

const trendXLabels = computed(() => {
  const list = trendValues.value
  if (!list.length) return []
  const count = Math.min(6, list.length)
  const step = Math.max(1, Math.round((list.length - 1) / (count - 1)))
  const indexes = new Set<number>()
  for (let i = 0; i < list.length; i += step) indexes.add(i)
  indexes.add(list.length - 1)
  return Array.from(indexes)
    .sort((a, b) => a - b)
    .map((i) => ({
      x: trendPoints.value[i]?.x ?? CH.l,
      label: list[i][0].slice(5)
    }))
})

// ===== 状态环形图 =====

const statusCounts = computed(() => {
  const counts: Record<StatusKey, number> = {
    pending: 0, paid: 0, shipped: 0, completed: 0, cancelled: 0, other: 0
  }
  for (const shop of activeShops.value) {
    const orders = currentRows.value
      .filter((r) => r.shopId === shop.id)
      .reduce((sum, r) => sum + r.orders, 0)
    shop.statusWeights.forEach((w, i) => {
      const key = STATUS_ORDER[i]
      counts[key] += orders * w
    })
  }
  return counts
})

const CIRC = 2 * Math.PI * 58

const statusSegments = computed(() => {
  const total = totalOrders.value || 1
  let acc = 0
  return STATUS_ORDER.map((key) => {
    const count = Math.round(statusCounts.value[key])
    const len = (count / total) * CIRC
    const seg = {
      key,
      label: STATUS_LABELS[key] || key,
      count,
      color: STATUS_COLORS[key],
      percent: Math.round((count / total) * 1000) / 10,
      dash: `${len.toFixed(2)} ${(CIRC - len).toFixed(2)}`,
      offset: -acc
    }
    acc += len
    return seg
  })
})

// ===== 店铺表现 =====

interface ShopStat {
  id: string
  shopName: string
  shortName: string
  platformLabel: string
  color: string
  colorSoft: string
  orders: number
  sales: number
  avgValue: number
  refundRate: number
  salesDelta: number
  barWidth: number
  dailyValues: number[]
}

const shopStats = computed<ShopStat[]>(() => {
  const list = activeShops.value.map((shop) => {
    const rows = currentRows.value.filter((r) => r.shopId === shop.id)
    const prevRows = previousRows.value.filter((r) => r.shopId === shop.id)
    const cur = sumRows(rows)
    const prev = sumRows(prevRows)

    const orders = cur.orders
    const sales = cur.sales
    const avgValue = orders ? sales / orders : 0
    const refundRate = orders ? (cur.refunds / orders) * 100 : 0
    const salesDelta = pctChange(sales, prev.sales)

    return {
      id: shop.id,
      shopName: shop.shopName,
      shortName: shop.shortName,
      platformLabel: PLATFORM_LABELS[shop.platform] || shop.platform,
      color: shop.color,
      colorSoft: `${shop.color}1f`,
      orders,
      sales,
      avgValue,
      refundRate,
      salesDelta: isFinite(salesDelta) ? salesDelta : 0,
      barWidth: 0,
      dailyValues: rows.map((r) => r.orders)
    }
  })

  const maxSales = Math.max(...list.map((s) => s.sales), 1)
  return list
    .sort((a, b) => b.sales - a.sales)
    .map((s) => ({ ...s, barWidth: Math.max(4, (s.sales / maxSales) * 100) }))
})

// ===== 多店铺趋势 =====

const multiMax = computed(() => {
  const max = Math.max(
    ...shopStats.value.flatMap((s) => s.dailyValues),
    1
  )
  return niceMax(max * 1.1)
})

const multiSeries = computed(() =>
  shopStats.value.map((s) => ({
    id: s.id,
    shortName: s.shortName,
    color: s.color,
    path: smoothPath(toPoints(s.dailyValues, multiMax.value))
  }))
)

const multiYLabels = computed(() => {
  const max = multiMax.value
  return [0, 0.5, 1].map((t) => ({
    y: CH.t + (1 - t) * innerH,
    label: Math.round(max * t).toString()
  }))
})

const multiXLabels = computed(() => {
  const dates = Array.from(new Set(currentRows.value.map((r) => r.date))).sort()
  if (!dates.length) return []
  const count = Math.min(5, dates.length)
  const step = Math.max(1, Math.round((dates.length - 1) / (count - 1)))
  const out: Array<{ x: number; label: string }> = []
  for (let i = 0; i < dates.length; i += step) {
    out.push({
      x: dates.length > 1 ? CH.l + (i / (dates.length - 1)) * innerW : CH.l + innerW / 2,
      label: dates[i].slice(5)
    })
  }
  return out
})

// ===== 地区分布 =====

const topRegions = computed(() => {
  const map = new Map<string, number>()
  for (const shop of activeShops.value) {
    const orders = currentRows.value
      .filter((r) => r.shopId === shop.id)
      .reduce((sum, r) => sum + r.orders, 0)
    for (const region of shop.regions) {
      map.set(region.name, (map.get(region.name) || 0) + orders * region.weight)
    }
  }
  const list = Array.from(map.entries())
    .map(([name, count]) => ({ name, count: Math.round(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const total = totalOrders.value || 1
  const max = Math.max(...list.map((r) => r.count), 1)
  return list.map((r) => ({
    ...r,
    pct: Math.max(6, (r.count / max) * 100),
    share: Math.round((r.count / total) * 1000) / 10
  }))
})

// ===== 客单价分布 =====

const PRICE_BANDS = ['¥0-50', '¥50-100', '¥100-200', '¥200-300', '¥300-500', '¥500-1k', '¥1k-2k', '¥2k+']

interface PriceBand {
  label: string
  count: number
  share: number
  height: number
}

const priceBands = computed<PriceBand[]>(() => {
  const counts = PRICE_BANDS.map(() => 0)

  for (const shop of activeShops.value) {
    const orders = currentRows.value
      .filter((r) => r.shopId === shop.id)
      .reduce((sum, r) => sum + r.orders, 0)
    shop.priceWeights.forEach((w, i) => {
      counts[i] += orders * w
    })
  }

  const total = counts.reduce((a, b) => a + b, 0) || 1
  const max = Math.max(...counts, 1)

  return PRICE_BANDS.map((label, i) => ({
    label,
    count: Math.round(counts[i]),
    share: Math.round((counts[i] / total) * 1000) / 10,
    height: Math.max(3, (counts[i] / max) * 100)
  }))
})

const topPriceBand = computed(
  () => priceBands.value.reduce((best, cur) => (cur.count > best.count ? cur : best), priceBands.value[0])
)
</script>

<style lang="scss" scoped>
@mixin panel {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 18px 36px -24px rgba(15, 23, 42, 0.28);
}

.shop-stats {
  padding: 20px 0 28px;
  min-height: 100%;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    letter-spacing: -0.4px;
  }

  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
  }

  .head-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .platform-select {
    width: 132px;

    :deep(.el-select__wrapper) {
      min-height: 36px;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.22) inset;

      &.is-focused {
        box-shadow: 0 0 0 1px #3b82f6 inset, 0 0 0 4px rgba(59, 130, 246, 0.12);
      }
    }
  }

  :deep(.el-radio-button__inner) {
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: #fff;
    color: #64748b;
    padding: 8px 16px;
    font-weight: 500;
    box-shadow: none;
  }

  :deep(.el-radio-button) {
    margin-right: 8px;

    &:last-child {
      margin-right: 0;
    }
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 10px 22px -14px rgba(59, 130, 246, 1);
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.kpi-card {
  @include panel;
  padding: 20px 22px;
  position: relative;
  overflow: hidden;

  .kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .kpi-label {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
  }

  .kpi-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    opacity: 0.85;
  }

  .kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.6px;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .kpi-affix {
    font-size: 15px;
    font-weight: 600;
    color: #64748b;
    margin: 0 1px;
  }

  .kpi-delta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 600;

    &.up {
      color: #059669;
    }

    &.down {
      color: #dc2626;
    }

    &.flat {
      color: #94a3b8;
    }

    .delta-arrow {
      font-size: 10px;
    }

    .delta-hint {
      margin-left: 4px;
      font-weight: 400;
      color: #cbd5e1;
    }
  }
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.span-4 {
  grid-column: span 4;
}
.span-5 {
  grid-column: span 5;
}
.span-7 {
  grid-column: span 7;
}
.span-8 {
  grid-column: span 8;
}

.panel {
  @include panel;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  min-width: 0;

  .panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;

    h3 {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.2px;
    }
  }

  .panel-desc {
    font-size: 12px;
    color: #94a3b8;
    margin: 4px 0 0;
  }

  .panel-hint {
    font-size: 12px;
    color: #94a3b8;
    white-space: nowrap;
  }
}

.metric-switch {
  display: flex;
  padding: 3px;
  border-radius: 10px;
  background: #f1f5f9;
  flex-shrink: 0;

  button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: none;
    background: transparent;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;

    .metric-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      opacity: 0.4;
      transition: opacity 0.2s ease;
    }

    &.metric-orders .metric-dot {
      background: #3b82f6;
    }

    &.metric-sales .metric-dot {
      background: #10b981;
    }

    &.active {
      background: #fff;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);

      .metric-dot {
        opacity: 1;
      }
    }

    &.metric-orders.active {
      color: #3b82f6;
    }

    &.metric-sales.active {
      color: #059669;
    }
  }
}

.chart-body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.chart-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.axis-text {
  font-size: 10px;
  fill: #94a3b8;
}

/* ---------- 环形图 ---------- */

.donut-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  padding-top: 4px;
}

.donut {
  width: 148px;
  height: 148px;
  flex-shrink: 0;
}

.donut-num {
  font-size: 20px;
  font-weight: 700;
  fill: #0f172a;
}

.donut-cap {
  font-size: 10px;
  fill: #94a3b8;
}

.donut-legend {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #475569;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .lg-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .lg-val {
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    .lg-pct {
      width: 44px;
      text-align: right;
      color: #94a3b8;
      font-variant-numeric: tabular-nums;
    }
  }
}

/* ---------- 店铺表现 ---------- */

.shop-list {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
}

.shop-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid #f4f7fb;

  &:last-child {
    border-bottom: none;
    padding-bottom: 2px;
  }

  .rank {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    background: #f1f5f9;
    flex-shrink: 0;

    &.is-top {
      color: #fff;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    }
  }

  .shop-meta {
    width: 232px;
    flex-shrink: 0;
    min-width: 0;
  }

  .shop-name {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .shop-sub {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 5px;
    font-size: 12px;
    color: #94a3b8;

    .sep {
      color: #e2e8f0;
    }
  }

  .platform-chip {
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
  }

  .shop-bar {
    flex: 1;
    min-width: 0;
  }

  .bar-track {
    height: 7px;
    border-radius: 999px;
    background: #f1f5f9;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.35s ease;
  }

  .shop-sales {
    width: 92px;
    text-align: right;
    flex-shrink: 0;

    .value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    .delta {
      margin-top: 3px;
      font-size: 11px;
      font-weight: 600;

      &.up {
        color: #059669;
      }
      &.down {
        color: #dc2626;
      }
    }
  }
}

/* ---------- 地区 ---------- */

.region-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 12px;

  li {
    display: grid;
    grid-template-columns: 42px 1fr 46px 44px;
    align-items: center;
    gap: 10px;
    font-size: 12px;
  }

  .rg-name {
    color: #475569;
    font-weight: 500;
  }

  .rg-track {
    height: 7px;
    border-radius: 999px;
    background: #f1f5f9;
    overflow: hidden;
  }

  .rg-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%);
    transition: width 0.35s ease;
  }

  .rg-val {
    text-align: right;
    font-weight: 600;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .rg-pct {
    text-align: right;
    color: #94a3b8;
    font-variant-numeric: tabular-nums;
  }
}

/* ---------- 多店铺图例 ---------- */

.line-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 2px 0 0 4px;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #64748b;
  }

  .line-dash {
    width: 12px;
    height: 3px;
    border-radius: 2px;
    flex-shrink: 0;
  }
}

/* ---------- 客单价分布 ---------- */

.price-chart {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-top: 10px;
}

.price-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex: 1;
  min-height: 210px;
}

.price-item {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.price-count {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.price-track {
  width: 100%;
  max-width: 42px;
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: #f6f8fc;
  border-radius: 8px;
  overflow: hidden;
}

.price-bar {
  width: 100%;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  transition: height 0.35s ease;
}

.price-label {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
  transform: scale(0.94);
}

.price-note {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid #f4f7fb;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;

  strong {
    color: #1e293b;
    font-weight: 600;
  }
}

@media (max-width: 1400px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .span-4,
  .span-5,
  .span-7,
  .span-8 {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .shop-row .shop-meta {
    width: 140px;
  }

  .shop-row .shop-bar {
    display: none;
  }
}
</style>
