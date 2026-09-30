// 临时联调用配置：与 vite.config.ts 等价的 ESM 版（沙箱内 vite 无法写 .vite-temp 转译 TS 配置时使用）
// 正常开发仍用 npm run dev；此文件仅在 TRAE 沙箱联调时通过 --config 指定
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.js', '.json', '.ts'],
    alias: {
      '@': path.resolve(dirname, './src')
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
