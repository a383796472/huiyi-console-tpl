<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-left">
        <div class="left-content">
          <div class="left-logo">
            <img src="../../assets/huiyi-logo.webp" alt="广州集客电子科技有限公司 logo" />
          </div>
          <h2 class="left-title">广州集客电子<span class="title-dot">·</span>业务管理平台</h2>
          <p class="left-desc">产品 · 订单 · 物流，一站式协同管理</p>
        </div>
        <p class="left-footer">
          © 2026 广州集客电子科技有限公司<br />
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2026175553号-1</a>
        </p>
      </div>

      <div class="login-right">
        <div class="right-content">
          <h3 class="right-title">欢迎登录</h3>
          <p class="right-subtitle">请使用您的账号登录管理系统</p>
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
        real_name: user.real_name || '',
        role: user.role,
        department_id: user.department_id ?? null,
        department_name: user.department_name || ''
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
$brand: #3b82f6;
$brand-light: #60a5fa;
$ink: #0f172a;
$line: #e2e8f0;

.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(135deg, #0b1220 0%, #131f36 50%, #0b1220 100%);

  // 背景光晕
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(48rem 32rem at 12% 18%, rgba(59, 130, 246, 0.3), transparent 62%),
      radial-gradient(42rem 30rem at 88% 82%, rgba(96, 165, 250, 0.22), transparent 62%);
    animation: auraDrift 18s ease-in-out infinite alternate;
  }

  // 背景网格
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(70% 62% at 50% 45%, #000 0%, transparent 100%);
    -webkit-mask-image: radial-gradient(70% 62% at 50% 45%, #000 0%, transparent 100%);
  }
}

.login-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 880px;
  max-width: 100%;
  height: 520px;
  border-radius: 26px;
  overflow: hidden;
  box-shadow:
    0 32px 64px -18px rgba(2, 8, 23, 0.6),
    0 1px 2px rgba(15, 23, 42, 0.12);
  animation: cardIn 0.5s ease both;
}

.login-left {
  position: relative;
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(160deg, #1f2a44 0%, #25324f 58%, #182033 100%);

  // 品牌光晕
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 78% 14%, rgba(59, 130, 246, 0.4), transparent 55%),
      radial-gradient(circle at 14% 88%, rgba(96, 165, 250, 0.24), transparent 55%);
  }

  // 点阵质感
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px);
    background-size: 22px 22px;
    opacity: 0.5;
    mask-image: radial-gradient(78% 70% at 50% 38%, #000 0%, transparent 100%);
    -webkit-mask-image: radial-gradient(78% 70% at 50% 38%, #000 0%, transparent 100%);
  }

  .left-content {
    position: relative;
    z-index: 1;
    width: 100%;
    text-align: center;

    .left-logo {
      width: 92px;
      height: 92px;
      margin: 0 auto 26px;
      padding: 15px;
      box-sizing: border-box;
      background: #fff;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.6),
        0 18px 36px -12px rgba(2, 8, 23, 0.6),
        0 0 0 10px rgba(59, 130, 246, 0.1);

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .left-title {
      font-size: 22px;
      line-height: 1.45;
      font-weight: 700;
      color: #fff;
      margin: 0;
      letter-spacing: 0.5px;
      text-wrap: balance;

      .title-dot {
        color: $brand-light;
        margin: 0 2px;
      }
    }

    .left-desc {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.62);
      margin: 14px 0 0;
      line-height: 1.7;
      letter-spacing: 0.2px;
    }
  }

  .left-footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 24px;
    z-index: 1;
    margin: 0;
    text-align: center;
    font-size: 12px;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.35);
    line-height: 1.9;

    a {
      color: rgba(255, 255, 255, 0.42);
      text-decoration: none;
      letter-spacing: 0.5px;
      transition: color 0.2s ease;

      &:hover {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}

.login-right {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 48px;
  background: #fff;

  .right-content {
    width: 320px;

    .right-title {
      font-size: 26px;
      font-weight: 700;
      color: $ink;
      margin: 0 0 10px;
      letter-spacing: -0.5px;
    }

    .right-subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 30px;
      line-height: 1.6;
    }
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 14px;
    padding: 7px 14px;
    background: #f8fafc;
    box-shadow: 0 0 0 1px $line inset;
    transition: box-shadow 0.2s ease, background 0.2s ease;

    &:hover {
      background: #fff;
      box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.85) inset;
    }

    &.is-focus {
      background: #fff;
      box-shadow: 0 0 0 1px $brand inset, 0 0 0 4px rgba(59, 130, 246, 0.14);
    }
  }

  :deep(.el-input__prefix) {
    .el-input__icon {
      font-size: 18px;
      color: #94a3b8;
    }
  }

  :deep(.el-form-item.is-error .el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-color-danger) inset;
  }

  .login-btn {
    width: 100%;
    height: 48px;
    margin-top: 6px;
    border-radius: 14px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    background: linear-gradient(135deg, $brand 0%, $brand-light 100%);
    box-shadow: 0 12px 26px -12px rgba(59, 130, 246, 0.9);
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;

    &:hover:not(:disabled):not(.is-loading) {
      transform: translateY(-1px);
      filter: saturate(1.06);
      box-shadow: 0 18px 34px -14px rgba(59, 130, 246, 1);
    }

    &:active:not(:disabled):not(.is-loading) {
      transform: translateY(0);
    }

    &:focus-visible {
      outline: 2px solid rgba(59, 130, 246, 0.55);
      outline-offset: 2px;
    }
  }
}

@keyframes cardIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes auraDrift {
  from {
    transform: translate3d(-2%, -1%, 0) scale(1.02);
  }
  to {
    transform: translate3d(2%, 2%, 0) scale(1.06);
  }
}

// 高度受限时卡片自适应，避免内容被裁切
@media (max-height: 640px) {
  .login-card {
    height: auto;
  }

  .login-left,
  .login-right {
    padding-top: 36px;
    padding-bottom: 36px;
  }
}

// 窄屏：左侧品牌区收缩为顶部标头
@media (max-width: 900px) {
  .login-container {
    padding: 20px;
  }

  .login-card {
    flex-direction: column;
    width: 100%;
    max-width: 420px;
    height: auto;
  }

  .login-left {
    width: 100%;
    padding: 34px 28px 10px;
    justify-content: flex-start;
    border-radius: 26px 26px 0 0;

    .left-content {
      .left-logo {
        width: 68px;
        height: 68px;
        padding: 11px;
        border-radius: 20px;
        margin-bottom: 18px;
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.5),
          0 14px 28px -12px rgba(2, 8, 23, 0.6),
          0 0 0 8px rgba(59, 130, 246, 0.1);
      }

      .left-title {
        font-size: 18px;
      }

      .left-desc {
        display: none;
      }
    }

    .left-footer {
      display: none;
    }
  }

  .login-right {
    width: 100%;
    padding: 30px 28px 40px;

    .right-content {
      width: 100%;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-container::before,
  .login-card {
    animation: none;
  }
}
</style>
