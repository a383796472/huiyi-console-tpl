import request from '../utils/request'

interface LoginParams {
  username: string
  password: string
}

interface GetUsersParams {
  page?: number
  pageSize?: number
  searchType?: string
  keyword?: string
}

interface CreateUserParams {
  username: string
  password?: string
  email?: string
  phone?: string
  real_name?: string
  department_id?: number | null
  role?: string
  status?: number
}

interface UpdateUserParams {
  username?: string
  password?: string
  email?: string
  phone?: string
  real_name?: string
  department_id?: number | null
  role?: string
  status?: number
}

export const login = (data: LoginParams) => {
  return request({
    url: '/api/users/login',
    method: 'POST',
    data
  })
}

export const getUsers = (params: GetUsersParams) => {
  return request({
    url: '/api/users',
    method: 'GET',
    params
  })
}

export const getUserById = (id: number | string) => {
  return request({
    url: `/api/users/${id}`,
    method: 'GET'
  })
}

export const getCurrentUser = () => {
  return request({
    url: '/api/users/me',
    method: 'GET'
  })
}

export const updateProfile = (data: { username?: string; password?: string; email?: string; phone?: string; real_name?: string }) => {
  return request({
    url: '/api/users/me/profile',
    method: 'PUT',
    data
  })
}

export const createUser = (data: CreateUserParams) => {
  return request({
    url: '/api/users',
    method: 'POST',
    data
  })
}

export const updateUser = (id: number | string, data: UpdateUserParams) => {
  return request({
    url: `/api/users/${id}`,
    method: 'PUT',
    data
  })
}

export const updateUserStatus = (id: number | string, data: { status: number }) => {
  return request({
    url: `/api/users/${id}/status`,
    method: 'PUT',
    data
  })
}

export const deleteUser = (id: number | string) => {
  return request({
    url: `/api/users/${id}`,
    method: 'DELETE'
  })
}

export const getRoles = () => {
  return request({
    url: '/api/roles',
    method: 'GET'
  })
}

export const getRoleById = (id: number | string) => {
  return request({
    url: `/api/roles/${id}`,
    method: 'GET'
  })
}

export const getAllPermissions = () => {
  return request({
    url: '/api/roles/permissions',
    method: 'GET'
  })
}

export const updateRolePermissions = (id: number | string, permissionIds: number[]) => {
  return request({
    url: `/api/roles/${id}/permissions`,
    method: 'PUT',
    data: { permissionIds }
  })
}

export const getDepartments = () => {
  return request({
    url: '/api/departments',
    method: 'GET'
  })
}