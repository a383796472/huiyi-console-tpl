import request from '../utils/request'

// ===== 类型定义 =====

export type OrderPlatform = 'shopify' | 'jushuitan' | 'tmall' | 'alibaba1688'
export type OrderStatusCode = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'other'

export const PLATFORM_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  jushuitan: '聚水潭',
  tmall: '天猫',
  alibaba1688: '1688'
}

export const STATUS_LABELS: Record<string, string> = {
  pending: '待付款',
  paid: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
  other: '其他'
}

export interface OrderListItem {
  id: number
  platform: string
  shop_name: string | null
  order_no: string
  online_order_no: string | null
  order_time: string | null
  pay_time: string | null
  fulfill_time: string | null
  buyer_name: string | null
  buyer_account: string | null
  province: string | null
  item_count: number
  item_kind_count: number
  currency: string | null
  total_amount: string | number | null
  paid_amount: string | number | null
  freight_amount: string | number | null
  discount_amount: string | number | null
  refund_amount: string | number | null
  order_status: string | null
  status_code: string | null
  is_counted: number
  logistics_no: string | null
  logistics_company: string | null
  remark: string | null
  sync_date: string | null
}

export interface OrderDetail extends OrderListItem {
  raw_data: {
    source: string
    file: string
    order: Record<string, unknown>
    items: Record<string, unknown>[]
  } | null
}

export interface OrderListParams {
  page?: number
  pageSize?: number
  keyword?: string
  platform?: string
  statusCode?: string
  isCounted?: string
  startDate?: string
  endDate?: string
}

// ===== API =====

export const getOrderList = (params: OrderListParams) => {
  return request.get('/api/orders', { params })
}

export const getOrderDetail = (id: number | string) => {
  return request.get(`/api/orders/${id}`)
}

// 上传订单文件并导入（range: today 当天 / month 当月 / all 全部）
export const importOrders = (formData: FormData) => {
  return request.post('/api/orders/import', formData, { timeout: 120000 })
}
