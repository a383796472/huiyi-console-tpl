<template>
  <div class="create-user" v-loading="loading">

    <el-form ref="formRef" :model="formData" label-width="120px" class="user-form">
      <!-- 用户名 -->
      <el-form-item label="用户名" prop="username" required>
        <el-input 
          v-model="formData.username" 
          placeholder="请输入用户名" 
          :disabled="!!route.query.id"
        />
      </el-form-item>

      <!-- 密码（添加时显示，编辑时不显示） -->
      <el-form-item v-if="!route.query.id" label="密码" prop="password" required>
        <el-input 
          v-model="formData.password" 
          type="password" 
          placeholder="请输入密码" 
        />
      </el-form-item>

      <!-- 确认密码（添加时显示） -->
      <el-form-item v-if="!route.query.id" label="确认密码" prop="confirmPassword" required>
        <el-input 
          v-model="formData.confirmPassword" 
          type="password" 
          placeholder="请再次输入密码" 
        />
      </el-form-item>

      <!-- 邮箱 -->
      <el-form-item label="邮箱" prop="email">
        <el-input 
          v-model="formData.email" 
          type="email" 
          placeholder="请输入邮箱" 
        />
      </el-form-item>

      <!-- 手机号 -->
      <el-form-item label="手机号" prop="phone">
        <el-input 
          v-model="formData.phone" 
          placeholder="请输入手机号" 
        />
      </el-form-item>

      <!-- 真实姓名 -->
      <el-form-item label="真实姓名" prop="real_name">
        <el-input 
          v-model="formData.real_name" 
          placeholder="请输入真实姓名" 
        />
      </el-form-item>

      <!-- 角色 -->
      <el-form-item label="角色" prop="role">
        <el-select v-model="formData.role" placeholder="请选择角色">
          <el-option v-if="currentUserRole === 'super_admin'" label="超级管理员" value="super_admin"></el-option>
          <el-option label="管理员" value="admin"></el-option>
          <el-option label="普通用户" value="user"></el-option>
        </el-select>
      </el-form-item>

      <!-- 状态 -->
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态">
          <el-option label="启用" :value="1"></el-option>
          <el-option label="停用" :value="0"></el-option>
        </el-select>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :disabled="isSubmitting">
          {{ isSubmitting ? '提交中...' : '保存' }}
        </el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserById, createUser, updateUser } from '@/api/user'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isSubmitting = ref(false)

const currentUserRole = ref('user')
try {
  const stored = localStorage.getItem('userInfo')
  if (stored) {
    const info = JSON.parse(stored)
    currentUserRole.value = info.role || 'user'
  }
} catch {}

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  real_name: '',
  role: 'user',
  status: 1
})

// 获取用户详情
const fetchUserDetail = async () => {
  const id = route.query.id as string
  if (!id) return
  
  loading.value = true
  try {
    const res = await getUserById(id)
    if (res.data.code === 200 && res.data.data) {
      const user = res.data.data
      formData.username = user.username || ''
      formData.email = user.email || ''
      formData.phone = user.phone || ''
      formData.real_name = user.real_name || ''
      formData.role = user.role || 'user'
      formData.status = user.status === undefined ? 1 : user.status
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  // 基本验证
  if (!formData.username) {
    ElMessage.error('请输入用户名')
    return
  }
  
  if (!route.query.id && !formData.password) {
    ElMessage.error('请输入密码')
    return
  }
  
  if (!route.query.id && formData.password !== formData.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  isSubmitting.value = true
  try {
    if (route.query.id) {
      const submitData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        real_name: formData.real_name,
        role: formData.role,
        status: formData.status
      }
      const response = await updateUser(route.query.id as string, submitData)
      if (response && response.data && response.data.code === 200) {
        ElMessage.success('更新成功！')
        router.push('/users')
      } else {
        ElMessage.error('操作失败，响应异常')
      }
    } else {
      const submitData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        real_name: formData.real_name,
        role: formData.role,
        status: formData.status
      }
      const response = await createUser(submitData)
      if (response && response.data && response.data.code === 200) {
        ElMessage.success('添加成功！')
        router.push('/users')
      } else {
        ElMessage.error('操作失败，响应异常')
      }
    }
  } catch (error) {
    console.error('提交失败', error)
    ElMessage.error('操作失败，请检查后端服务')
  } finally {
    isSubmitting.value = false
  }
}

// 取消
const handleCancel = () => {
  router.push('/users')
}

onMounted(() => {
  if (route.query.id) {
    fetchUserDetail()
  }
})
</script>

<style lang="scss" scoped>
.create-user {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
}

.user-header {
  margin-bottom: 24px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
}

.user-form {
  max-width: 600px;
}
</style>
