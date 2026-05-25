import axios from 'axios'

export const baseURL = 'http://8.166.118.182'

const request = axios.create({
  baseURL,
  timeout: 5000
})

const whiteList = ['/api/users/login']

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
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
