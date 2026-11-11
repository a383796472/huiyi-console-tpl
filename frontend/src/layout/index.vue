<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="header-logo">
          <img src="../assets/huiyi-logo.webp" alt="广州集客电子科技有限公司 logo" />
        </div>
      </div>
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/homeView">首页</el-menu-item>
        <el-menu-item index="/products">产品管理</el-menu-item>
        <el-menu-item index="/tasks">任务管理</el-menu-item>
        <el-sub-menu index="orders">
          <template #title>订单管理</template>
          <el-menu-item index="/orders">C端订单</el-menu-item>
          <el-menu-item index="/b2b-orders">B端订单</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/shop-stats">店铺数据</el-menu-item>
        <el-menu-item index="/logistics">物流管理</el-menu-item>
        <!-- <el-menu-item index="/inventory">库存管理</el-menu-item> -->
        <el-menu-item v-if="canManageOrg" index="/departments">部门管理</el-menu-item>
      </el-menu>
    </div>

    <div class="main-wrapper">
      <div class="top-nav">
        <el-dropdown trigger="hover" @command="handleDropdownCommand">
          <div class="user-info">
            <el-avatar :size="32" class="user-avatar">
              {{ userInfo.username ? userInfo.username.charAt(0).toUpperCase() : 'U' }}
            </el-avatar>
            <span class="user-name">{{ userInfo.username || '未登录' }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="breadcrumb-nav">
        <template v-for="(item, index) in breadcrumbList" :key="index">
          <span class="breadcrumb-item" :class="{ 'is-link': item.path && index < breadcrumbList.length - 1 }" @click="item.path ? router.push(item.path) : undefined">
            {{ item.label }}
          </span>
          <span v-if="index < breadcrumbList.length - 1" class="breadcrumb-sep">/</span>
        </template>
      </div>

      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const userInfo = ref({
  username: '',
  email: '',
  role: '',
  department_name: ''
})

const canManageOrg = computed(() =>
  ['super_admin', 'dept_admin'].includes(userInfo.value.role)
)

const parentMenuMap: Record<string, { name: string; path: string }> = {
  '/creatProduct': { name: '产品管理', path: '/products' },
  '/viewProduct': { name: '产品管理', path: '/products' },
  '/products': { name: '产品管理', path: '/products' },
  '/orders': { name: '订单管理', path: '/orders' },
  '/b2b-orders': { name: '订单管理', path: '/orders' },
  '/departments': { name: '部门管理', path: '/departments' }
}

// 动态路由（如 /orders/:id）无法用路径精确匹配，按正则归属到对应列表页
const dynamicParentRules: Array<{ test: RegExp; name: string; path: string }> = [
  { test: /^\/orders\/[^/]+$/, name: '订单管理', path: '/orders' },
  { test: /^\/b2b-orders\/[^/]+$/, name: 'B端订单', path: '/b2b-orders' }
]

const resolveParentMenu = (path: string) =>
  parentMenuMap[path] || dynamicParentRules.find((rule) => rule.test.test(path))

interface BreadcrumbItem {
  label: string
  path?: string
}

const getPageTitle = () => {
  const title = (route.meta?.title as string) || ''
  if (route.query.id && route.path === '/creatProduct') return '编辑产品'
  return title
}

const breadcrumbList = computed<BreadcrumbItem[]>(() => {
  const title = getPageTitle()
  const list: BreadcrumbItem[] = []

  const parent = resolveParentMenu(route.path)
  if (parent) {
    if (title && title !== parent.name) {
      list.push({ label: parent.name, path: parent.path })
      list.push({ label: title })
    } else {
      list.push({ label: parent.name })
    }
  } else {
    list.push({ label: title })
  }

  return list
})

onMounted(() => {
  const stored = localStorage.getItem('userInfo')
  if (stored) {
    try {
      userInfo.value = JSON.parse(stored)
    } catch {
      userInfo.value = { username: '', email: '', role: '', department_name: '' }
    }
  }
})

const handleDropdownCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    ).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 22%),
    linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%);
}

.sidebar {
  position: relative;
  width: 232px;
  height: 100%;
  color: white;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #172038 0%, #111a2c 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 12px 0 32px rgba(15, 23, 42, 0.14);

  // 顶部品牌光晕
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 240px;
    pointer-events: none;
    background: radial-gradient(60% 100% at 50% 0%, rgba(59, 130, 246, 0.22), transparent 70%);
  }

  .sidebar-header {
    position: relative;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 14px 28px -18px rgba(2, 8, 23, 0.9);

    .header-logo {
      width: 152px;
      height: 44px;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }

  :deep(.el-menu) {
    position: relative;
    border-right: none;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: transparent !important;

    &::-webkit-scrollbar {
      width: 4px;
      height: 0;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.14);
      border-radius: 999px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  :deep(.el-menu-item) {
    height: 46px;
    line-height: 46px;
    margin-bottom: 6px;
    padding: 0 14px !important;
    box-sizing: border-box;
    width: 100%;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.66) !important;
    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }

  :deep(.el-menu-item:hover) {
    background: rgba(255, 255, 255, 0.07) !important;
    color: #fff !important;
    transform: translateX(2px);
  }

  :deep(.el-sub-menu__title) {
    height: 46px;
    line-height: 46px;
    margin-bottom: 6px;
    padding: 0 14px !important;
    box-sizing: border-box;
    width: 100%;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.66) !important;
    transition: background 0.2s ease, color 0.2s ease;
  }

  :deep(.el-sub-menu__title:hover) {
    background: rgba(255, 255, 255, 0.07) !important;
    color: #fff !important;
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #fff !important;
  }

  :deep(.el-sub-menu__icon-arrow) {
    color: rgba(255, 255, 255, 0.5);
  }

  :deep(.el-menu--inline) {
    width: 100%;
    padding-left: 0 !important;
    background: transparent !important;
    overflow: visible;
  }

  :deep(.el-menu--inline .el-menu-item) {
    height: 42px;
    line-height: 42px;
    margin-bottom: 4px;
    padding-left: 34px !important;
    padding-right: 14px !important;
    font-size: 13.5px;
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%) !important;
    color: #fff !important;
    font-weight: 600;
    box-shadow: 0 12px 26px -16px rgba(59, 130, 246, 1);
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.top-nav {
  height: 72px;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  z-index: 10;

  :deep(.el-dropdown) {
    outline: none;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    transition: all 0.2s ease;
    outline: none;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
    }

    .user-avatar {
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 6px 14px rgba(59, 130, 246, 0.28);
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
  }
}

.breadcrumb-nav {
  background: transparent;
  flex-shrink: 0;
  padding: 18px 28px 8px;
  display: flex;
  align-items: center;
  gap: 2px;

  .breadcrumb-item {
    font-size: 14px;
    color: #94a3b8;
    padding: 4px 0;
    border-radius: 4px;
    transition: color 0.2s;

    &.is-link {
      color: #64748b;
      cursor: pointer;

      &:hover {
        color: #3b82f6;
      }
    }

    &:not(.is-link) {
      color: #0f172a;
      font-weight: 600;
    }
  }

  .breadcrumb-sep {
    font-size: 12px;
    color: #cbd5e1;
    margin: 0 10px;
    user-select: none;
  }
}

.main-content {
  flex: 1;
  padding: 0 28px 28px;
  overflow-y: auto;
}
</style>
