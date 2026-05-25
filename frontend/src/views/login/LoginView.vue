<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-left">
        <div class="left-content">
          <div class="left-logo">
            <img src="../../assets/huiyi-logo.webp" alt="徽一 logo" />
          </div>
          <h2 class="left-title">徽一产品档案库</h2>
        </div>
      </div>
      <div class="login-right">
        <div class="right-content">
          <h3 class="right-title">欢迎登录</h3>
          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="isLoading"
                class="login-btn"
                @click="handleLogin"
              >
                {{ isLoading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../../api/user'

const router = useRouter()
const formRef = ref()
const isLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  isLoading.value = true
  try {
    const res = await login(loginForm)
    if (res.data && res.data.code === 200 && res.data.data) {
      const { token, user } = res.data.data
      localStorage.setItem('token', token)
      const userInfo = {
        id: user.id,
        username: user.username,
        role: user.role
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      ElMessage.success('登录成功！')
      router.push('/')
    } else {
      ElMessage.error(res.data?.message || '登录失败，用户名或密码错误')
    }
  } catch (error: any) {
    console.error('登录请求出错：', error)
    if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络连接失败，请检查后端服务是否启动')
    } else if (error.response) {
      const status = error.response.status
      if (status === 401) {
        ElMessage.error('用户名或密码错误')
      } else if (status === 404) {
        ElMessage.error('登录接口不存在，请检查后端配置')
      } else {
        ElMessage.error(`服务器错误 (${status})，请稍后重试`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('登录失败，请检查用户名和密码')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #4a5c72 0%, #35485d 100%);
}

.login-card {
  display: flex;
  width: 800px;
  height: 480px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.login-left {
  width: 380px;
  background: linear-gradient(135deg, #5a7fa0 0%, #6d9bc5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .left-content {
    text-align: center;
    padding: 40px;

    .left-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .left-title {
      font-size: 22px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 12px;
    }

    .left-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      line-height: 1.6;
    }
  }
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .right-content {
    width: 320px;

    .right-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 36px;
    }
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 0 0 1px #409EFF inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #409EFF inset;
    }
  }

  :deep(.el-input__prefix) {
    .el-input__icon {
      font-size: 18px;
      color: #909399;
    }
  }

  .login-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    font-size: 16px;
    letter-spacing: 2px;
    margin-top: 4px;
  }
}
</style>
