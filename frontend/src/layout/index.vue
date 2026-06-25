<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="header-logo">
          <img src="../assets/huiyi-logo.webp" alt="徽一 logo" />
        </div>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#304156"
        text-color="#fff"
        active-text-color="#60a5fa"
      >
        <el-menu-item index="/homeView">首页</el-menu-item>
        <el-menu-item index="/products">产品管理</el-menu-item>
        <!-- <el-menu-item index="/inventory">库存管理</el-menu-item> -->
        <el-menu-item v-if="userInfo.role === 'super_admin'" index="/users">用户管理</el-menu-item>
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
  role: ''
})

const parentMenuMap: Record<string, { name: string; path: string }> = {
  '/creatProduct': { name: '产品管理', path: '/products' },
  '/viewProduct': { name: '产品管理', path: '/products' },
  '/products': { name: '产品管理', path: '/products' },
  '/users/create': { name: '用户管理', path: '/users' },
  '/users': { name: '用户管理', path: '/users' }
}

interface BreadcrumbItem {
  label: string
  path?: string
}

const getPageTitle = () => {
  const title = (route.meta?.title as string) || ''
  if (route.query.id) {
    if (route.path === '/creatProduct') return '编辑产品'
    if (route.path === '/users/create') return '编辑用户'
  }
  return title
}

const breadcrumbList = computed<BreadcrumbItem[]>(() => {
  const title = getPageTitle()
  const list: BreadcrumbItem[] = []

  const parent = parentMenuMap[route.path]
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
      userInfo.value = { username: '', email: '', role: '' }
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
  width: 232px;
  height: 100%;
  background: linear-gradient(180deg, #1f2a44 0%, #182033 100%);
  color: white;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  box-sizing: border-box;
  box-shadow: 12px 0 32px rgba(15, 23, 42, 0.12);

  .sidebar-header {
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(10px);

    .header-logo {
      width: 164px;
      height: 48px;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }

  :deep(.el-menu) {
    border-right: none;
    flex: 1;
    overflow-y: auto;
    background: transparent !important;
  }

  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin-bottom: 8px;
    border-radius: 14px;
    color: rgba(255, 255, 255, 0.74) !important;
    transition: all 0.2s ease;
  }

  :deep(.el-menu-item:hover) {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    transform: translateX(2px);
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%) !important;
    color: #fff !important;
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
