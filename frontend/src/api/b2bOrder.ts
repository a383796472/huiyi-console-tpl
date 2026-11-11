import request from '../utils/request'

// ===== 类型定义 =====

export interface B2bOrderListItem {
  id: number
  order_no: string
  biz_date: string | null
  doc_type: string | null
  supplier: string | null
  status: string | null
  department: string | null
  sales_person: string | null
  clerk: string | null
  purchase_order_no: string | null
  customer_type: string | null
  created_time: string | null
  customer: string | null
  delivery_method: string | null
  country: string | null
  province: string | null
  city: string | null
  customer_source: string | null
  ship_status: string | null
  customer_email: string | null
  line_count: number
  item_count: string | number
  total_amount: string | number
  untaxed_amount: string | number
  purchase_amount: string | number
  refund_amount: string | number
  gross_profit: string | number
  currency: string | null
  remark: string | null
  created_at: string | null
  updated_at: string | null
}

export interface B2bOrderItem {
  id: number
  order_id: number
  order_no: string
  line_no: string
  material_no: string | null
  material_name: string | null
  spec: string | null
  unit_price: string | number | null
  quantity: string | number
  pre_amount: string | number
  local_amount: string | number
  untaxed_total: string | number
  untaxed_line_amount: string | number
  sales_fx_amount: string | number
  sales_local_amount: string | number
  tax_amount: string | number
  purchase_price: string | number | null
  purchase_total: string | number
  purchase_order_total: string | number
  return_amount: string | number
  gross_profit: string | number
  gross_profit_rate: string | number | null
  remark: string | null
}

export interface B2bOrderDetail extends B2bOrderListItem {
  address: string | null
  items: B2bOrderItem[]
}

export interface B2bOrderListParams {
  page?: number
  pageSize?: number
  keyword?: string
  department?: string
  docType?: string
  status?: string
  salesPerson?: string
  startDate?: string
  endDate?: string
}

export interface B2bOrderOptions {
  departments: string[]
  docTypes: string[]
  statuses: string[]
  salesPeople: string[]
}

// ===== API =====

export const getB2bOrderList = (params: B2bOrderListParams) => {
  return request.get('/api/b2b-orders', { params })
}

export const getB2bOrderOptions = () => {
  return request.get('/api/b2b-orders/options')
}

export const getB2bOrderDetail = (id: number | string) => {
  return request.get(`/api/b2b-orders/${id}`)
}

export const updateB2bOrder = (id: number | string, payload: Record<string, unknown>) => {
  return request.put(`/api/b2b-orders/${id}`, payload)
}

// 上传 B 端月报 Excel 并导入（range: today 当天 / month 当月 / all 全部）
export const importB2bOrders = (formData: FormData) => {
  return request.post('/api/b2b-orders/import', formData, { timeout: 120000 })
}
