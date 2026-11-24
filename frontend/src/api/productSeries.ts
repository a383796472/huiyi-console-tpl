import request from '@/utils/request'

export interface ProductSeries {
  id: number
  name: string
  productCount: number
}

// 系列列表（含各系列产品数）
export const getProductSeries = () => {
  return request.get('/api/product-series')
}

// 新增系列
export const addProductSeries = (name: string) => {
  return request.post('/api/product-series', { name })
}

// 编辑系列
export const editProductSeries = (id: number, name: string) => {
  return request.put(`/api/product-series/${id}`, { name })
}

// 删除系列
export const deleteProductSeries = (id: number) => {
  return request.delete(`/api/product-series/${id}`)
}
