import api, { Response } from '@services/api'

type LoginResponse = {
  jwt: string
}

export async function login(
  id: string,
  password: string,
): Promise<LoginResponse> {
  const url = '/auth/login'
  return await api.post(url, { id, password })
}

export async function refresh(): Promise<LoginResponse> {
  const url = '/auth/refresh'
  return await api.post(url)
}
