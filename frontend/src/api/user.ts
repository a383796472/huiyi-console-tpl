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
  status?: string
}

interface CreateUserParams {
  username: string
  password?: string
  email?: string
  phone?: string
  real_name?: string
  role?: string
  status?: number
}

interface UpdateUserParams {
  username?: string
  password?: string
  email?: string
  phone?: string
  real_name?: string
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