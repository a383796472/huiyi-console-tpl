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
        active-text-color="#409EFF"
      >
        <el-menu-item index="/homeView">首页</el-menu-item>
        <el-menu-item index="/products">产品管理</el-menu-item>
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
}

.sidebar {
  width: 200px;
  height: 100%;
  background: #304156;
  color: white;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;

  .sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    .header-logo {
      width: 140px;
      height: 40px;
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
  height: 60px;
  padding: 0 20px;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
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
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
    outline: none;

    &:hover {
      background-color: #f5f7fa;
    }

    .user-avatar {
      background-color: #409EFF;
      color: #fff;
      flex-shrink: 0;
    }

    .user-name {
      font-size: 14px;
      color: #303133;
    }
  }
}

.breadcrumb-nav {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 2px;

  .breadcrumb-item {
    font-size: 14px;
    color: #909399;
    padding: 4px 0;
    border-radius: 4px;
    transition: color 0.2s;

    &.is-link {
      color: #303133;
      cursor: pointer;

      &:hover {
        color: #409EFF;
      }
    }

    &:not(.is-link) {
      color: #303133;
      font-weight: 600;
    }
  }

  .breadcrumb-sep {
    font-size: 12px;
    color: #c0c4cc;
    margin: 0 10px;
    user-select: none;
  }
}

.main-content {
  flex: 1;
  padding: 12px;
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
