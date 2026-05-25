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
        <el-menu-item index="/users">用户管理</el-menu-item>
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
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div v-if="tabs.length > 0" class="tabs-nav">
        <div class="tabs-inner" ref="tabsInnerRef">
          <div
            v-for="tab in tabs"
            :key="tab.path"
            class="tab-item"
            :class="{ active: tab.path === $route.path }"
            @click="switchTab(tab.path)"
          >
            <span class="tab-label">{{ tab.label }}</span>
            <el-icon v-if="tab.closable" class="tab-close" @click.stop="closeTab(tab.path)">
              <Close />
            </el-icon>
          </div>
        </div>
      </div>

      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const userInfo = ref({
  username: '',
  email: '',
  role: ''
})

interface Tab {
  label: string
  path: string
  closable: boolean
}

const tabs = ref<Tab[]>([])

const labelMap: Record<string, string> = {
  '/homeView': '首页',
  '/products': '产品列表',
  '/creatProduct': '添加产品',
  '/users': '用户列表',
  '/users/create': '添加用户'
}

const saveTabs = () => {
  const paths = tabs.value.filter(t => t.closable).map(t => t.path)
  localStorage.setItem('savedTabs', JSON.stringify(paths))
}

const restoreTabs = () => {
  const raw = localStorage.getItem('savedTabs')
  if (!raw) return
  try {
    const paths: string[] = JSON.parse(raw)
    paths.forEach((p) => {
      const label = labelMap[p]
      if (label) {
        tabs.value.push({ label, path: p, closable: true })
      }
    })
  } catch { }
}

const addTab = (path: string) => {
  const label = labelMap[path]
  if (!label) return
  const exists = tabs.value.some(t => t.path === path)
  if (!exists) {
    tabs.value.push({
      label,
      path,
      closable: path !== '/homeView'
    })
    saveTabs()
  }
}

const switchTab = (path: string) => {
  if (path !== route.path) {
    router.push(path)
  }
}

const closeTab = (path: string) => {
  const idx = tabs.value.findIndex(t => t.path === path)
  if (idx === -1) return

  const isCurrent = path === route.path
  tabs.value.splice(idx, 1)
  saveTabs()

  if (isCurrent && tabs.value.length > 0) {
    const targetIdx = Math.min(idx, tabs.value.length - 1)
    router.push(tabs.value[targetIdx].path)
  }
}

watch(
  () => route.path,
  (path) => {
    addTab(path)
  }
)

onMounted(() => {
  restoreTabs()
  addTab(route.path)

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
  if (command === 'logout') {
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
      localStorage.removeItem('savedTabs')
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

.tabs-nav {
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  overflow: hidden;

  .tabs-inner {
    display: flex;
    align-items: center;
    padding: 0 8px;
    overflow-x: auto;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c0c4cc;
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: #909399;
    }
  }

  .tab-item {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 12px;
    margin: 10px 4px;
    font-size: 13px;
    color: #606266;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s;

    &:hover {
      color: #409EFF;
      border-color: #c6e2ff;
    }

    &.active {
      color: #fff;
      background: #5babf2;
      border-color: #5babf2;

      .tab-close {
        color: rgba(255, 255, 255, 0.8);

        &:hover {
          color: #fff;
        }
      }
    }

    .tab-label {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tab-close {
      margin-left: 6px;
      font-size: 12px;
      color: #c0c4cc;
      transition: color 0.2s;
      display: flex;
      align-items: center;

      &:hover {
        color: #606266;
      }
    }
  }
}

.main-content {
  flex: 1;
  padding: 12px;
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
