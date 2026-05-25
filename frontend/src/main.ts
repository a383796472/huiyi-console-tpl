import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus' // 引入 Element Plus
import 'element-plus/dist/index.css' // 引入 Element Plus 的样式

const app = createApp(App)

// 设置 Element Plus 弹层基础 zIndex
app.use(ElementPlus, {
  zIndex: 3000 // 默认 2000，这里提高更安全
})

app.use(router)       // 注册路由
app.use(ElementPlus)  // 注册 Element Plus
app.mount('#app')