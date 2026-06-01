<template>
  <div class="profile-container" v-loading="loading">

    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="profile-form">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名" />
      </el-form-item>

      <el-form-item label="新密码" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="留空则不修改密码" show-password />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="formData.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" />
      </el-form-item>

      <el-form-item label="手机号" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入手机号" />
      </el-form-item>

      <el-form-item label="真实姓名" prop="real_name">
        <el-input v-model="formData.real_name" placeholder="请输入真实姓名" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">保存修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getCurrentUser, updateProfile } from '@/api/user'

const formRef = ref<FormInstance>()
const loading = ref(false)
const isSubmitting = ref(false)

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  real_name: ''
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (formData.password && !value) {
    callback(new Error('请输入确认密码'))
  } else if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const res = await getCurrentUser()
    if (res.data.code === 200 && res.data.data) {
      const user = res.data.data
      formData.username = user.username || ''
      formData.email = user.email || ''
      formData.phone = user.phone || ''
      formData.real_name = user.real_name || ''
      formData.password = ''
      formData.confirmPassword = ''
    }
  } catch {
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value || isSubmitting.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  isSubmitting.value = true
  try {
    const payload: any = {
      username: formData.username,
      email: formData.email || '',
      phone: formData.phone || '',
      real_name: formData.real_name || ''
    }
    if (formData.password) {
      payload.password = formData.password
    }

    const res = await updateProfile(payload)
    if (res.data.code === 200) {
      ElMessage.success('个人资料更新成功')
      formData.password = ''
      formData.confirmPassword = ''

      const stored = localStorage.getItem('userInfo')
      if (stored) {
        const info = JSON.parse(stored)
        info.username = res.data.data?.username || formData.username
        localStorage.setItem('userInfo', JSON.stringify(info))
      }
    } else {
      ElMessage.error(res.data?.message || '更新失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '更新失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style lang="scss" scoped>
.profile-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;

  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 24px;
  }

  .profile-form {
    max-width: 520px;

    :deep(.el-input) {
      width: 100%;
    }
  }
}
</style>
