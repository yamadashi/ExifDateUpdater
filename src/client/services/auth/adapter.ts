import * as AuthService from './service'
import { useAuthStore } from '@stores/authStore'

export async function login(id: string, pw: string): Promise<void> {
  const res = await AuthService.login(id, pw)
  if (res?.jwt) {
    useAuthStore.getState().setJwt(res.jwt)
  }
}

export async function refresh(): Promise<void> {
  const res = await AuthService.refresh()
  if (res?.jwt) {
    useAuthStore.getState().setJwt(res.jwt)
  }
}
