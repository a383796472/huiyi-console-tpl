import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

export const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const request = axios.create({
  baseURL,
  timeout: 15000
})

const whiteList = ['/api/users/login']

const MAX_RETRIES = 2
const RETRY_DELAY = 1000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const shouldRetry = (error: AxiosError): boolean => {
  if (!error.config) return false
  if (error.config.url && whiteList.some(path => error.config!.url!.includes(path))) {
    return false
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true
  if (error.code === 'ERR_NETWORK') return true
  if (error.response && error.response.status >= 500) return true
  return false
}

request.interceptors.request.use(
  (config) => {
    const isWhiteListed = whiteList.some(path => config.url?.includes(path))
    if (!isWhiteListed) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number }

    if (!config) {
      return Promise.reject(error)
    }

    config._retryCount = config._retryCount ?? 0

    if (shouldRetry(error) && config._retryCount < MAX_RETRIES) {
      config._retryCount++
      console.warn(`[请求重试] ${config.url} 第 ${config._retryCount} 次重试...`)
      await sleep(RETRY_DELAY * config._retryCount)
      return request(config)
    }

    if (error.response && error.response.status === 401) {
      const isLoginRequest = config.url?.includes('/api/login') || config.url?.includes('/api/users/login')
      if (!isLoginRequest) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default request

export const downloadFile = async (url: string, filename: string) => {
  const token = localStorage.getItem('token')
  const response = await axios.get(baseURL + url, {
    responseType: 'blob',
    timeout: 30000,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
