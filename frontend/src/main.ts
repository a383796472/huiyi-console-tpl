import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './style/element-theme.css'

const app = createApp(App)

// 设置 Element Plus 弹层基础 zIndex
app.use(ElementPlus, {
  zIndex: 3000, // 默认 2000，这里提高更安全
  locale: zhCn // 组件文案中文化：日期选择器月份/星期、分页、空数据等
})

app.use(router)       // 注册路由
app.use(ElementPlus)  // 注册 Element Plus
app.mount('#app')