import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // 站点部署在域名根路径：固定根相对路径，避免产物写成绝对 http:// 地址在 HTTPS 下触发 Mixed Content
  base: '/',
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.json', '.ts'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) // 将 @ 映射到 src 目录
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
