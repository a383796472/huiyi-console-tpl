<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-left">
        <div class="left-content">
          <div class="left-logo">
            <img src="../../assets/huiyi-logo.webp" alt="徽一 logo" />
          </div>
          <h2 class="left-title">硕为数据管理系统</h2>
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
                placeholder="请输入用户名或邮箱"
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
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
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
      ElMessage.error(res.data?.message || '登录失败，用户名/邮箱或密码错误')
    }
  } catch (error: any) {
    console.error('登录请求出错：', error)
    if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络连接失败，请检查后端服务是否启动')
    } else if (error.response) {
      const status = error.response.status
      if (status === 401) {
        ElMessage.error('用户名/邮箱或密码错误')
      } else if (status === 404) {
        ElMessage.error('登录接口不存在，请检查后端配置')
      } else {
        ElMessage.error(`服务器错误 (${status})，请稍后重试`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('登录失败，请检查用户名/邮箱和密码')
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
  background:
    radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.18), transparent 50%),
    radial-gradient(ellipse at 75% 20%, rgba(96, 165, 250, 0.12), transparent 50%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.login-card {
  display: flex;
  width: 880px;
  height: 520px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24px;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.08),
    0 40px 80px rgba(15, 23, 42, 0.24);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.login-left {
  width: 400px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.4), transparent 60%),
    linear-gradient(160deg, #1e293b 0%, #334155 70%, #475569 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3), transparent 50%),
      radial-gradient(circle at 20% 80%, rgba(96, 165, 250, 0.2), transparent 50%);
  }

  .left-content {
    text-align: center;
    padding: 48px;
    position: relative;
    z-index: 1;

    .left-logo {
      width: 88px;
      height: 88px;
      margin: 0 auto 28px;
      background: rgba(255, 255, 255, 0.96);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .left-title {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 10px;
      letter-spacing: 1px;
    }

    .left-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
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
  background: #fff;

  .right-content {
    width: 320px;

    .right-title {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 28px;
      letter-spacing: -0.5px;
    }

    .right-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 36px;
    }
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 14px;
    padding: 4px 14px;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    transition: all 0.2s;
    background: #f8fafc;

    &:hover {
      box-shadow: 0 0 0 1px #60a5fa inset;
      background: #fff;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) inset;
      background: #fff;
    }
  }

  :deep(.el-input__prefix) {
    .el-input__icon {
      font-size: 18px;
      color: #94a3b8;
    }
  }

  .login-btn {
    width: 100%;
    height: 48px;
    border-radius: 14px;
    font-size: 16px;
    letter-spacing: 2px;
    margin-top: 8px;
    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
    border: none;
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.3);
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 14px 32px rgba(59, 130, 246, 0.4);
    }
  }
}
</style>
