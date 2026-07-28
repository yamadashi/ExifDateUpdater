import { create } from 'zustand'

type AuthState = {
  jwt: string | null
  setJwt: (token: string) => void
  clearJwt: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  jwt: null,
  setJwt: (token) => set({ jwt: token }),
  clearJwt: () => set({ jwt: null }),
}))
