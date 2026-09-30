// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      // 访问 / 时，重定向到 /homeView
      {
        path: '',
        redirect: 'homeView'
      },
      {
        path: 'homeView',
        name: 'HomeView',
        component: () => import('../views/HomeView.vue'),
        meta: { title: '首页', requiresAuth: true }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/ProductList/index.vue'),
        meta: { title: '产品管理', requiresAuth: true }
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('../views/tasks/index.vue'),
        meta: { title: '任务管理', requiresAuth: true }
      },
      {
        path: 'creatProduct',
        name: 'CreatProduct',
        component: () => import('../views/ProductList/creatProduct.vue'),
        meta: { title: '新增产品', requiresAuth: true }
      },
      {
        path: 'viewProduct',
        name: 'ViewProduct',
        component: () => import('../views/ProductList/viewProduct.vue'),
        meta: { title: '产品详情', requiresAuth: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/users/index.vue'),
        meta: { title: '用户管理', requiresAuth: true }
      },
      {
        path: 'users/create',
        name: 'CreateUser',
        component: () => import('../views/users/create.vue'),
        meta: { title: '添加用户', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/profile/index.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../views/inventory/index.vue'),
        meta: { title: '库存管理', requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/orders/index.vue'),
        meta: { title: '订单管理', requiresAuth: true }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('../views/orders/detail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      },
      {
        path: 'logistics',
        name: 'Logistics',
        component: () => import('../views/logistics/index.vue'),
        meta: { title: '物流管理', requiresAuth: true }
      },
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  // 可选：添加通配符路由处理 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局守卫
router.beforeEach((to, _from, next) => {
  document.title = (to.meta?.title as string) || '后台管理系统'

  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  // 如果目标路由需要认证，但未登录
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // 用户管理模块仅超级管理员可访问
  if (to.path.startsWith('/users')) {
    try {
      const raw = localStorage.getItem('userInfo')
      const userInfo = raw ? JSON.parse(raw) : null
      if (!userInfo || userInfo.role !== 'super_admin') {
        next('/homeView')
        return
      }
    } catch {
      next('/homeView')
      return
    }
  }

  // 新增/编辑产品仅超管和管理员可访问
  if (to.path === '/creatProduct') {
    try {
      const raw = localStorage.getItem('userInfo')
      const userInfo = raw ? JSON.parse(raw) : null
      if (!userInfo || userInfo.role === 'user') {
        next('/products')
        return
      }
    } catch {
      next('/products')
      return
    }
  }

  if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router