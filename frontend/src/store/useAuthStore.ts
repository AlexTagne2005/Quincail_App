import { create } from "zustand"
import { authApi } from "@/api/authApi"
import { User } from "@/types"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem("quincail_user")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })(),
  token: localStorage.getItem("quincail_token"),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await authApi.login(username, password)
      localStorage.setItem("quincail_token", data.access_token)
      localStorage.setItem("quincail_user", JSON.stringify(data.user))
      set({
        token: data.access_token,
        user: data.user,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Échec de connexion. Vérifiez vos identifiants."
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  logout: () => {
    localStorage.removeItem("quincail_token")
    localStorage.removeItem("quincail_user")
    set({ user: null, token: null, error: null })
  },

  initialize: async () => {
    const token = localStorage.getItem("quincail_token")
    if (!token) {
      set({ user: null, token: null })
      return
    }
    try {
      const user = await authApi.getCurrentUser()
      localStorage.setItem("quincail_user", JSON.stringify(user))
      set({ user, token })
    } catch {
      localStorage.removeItem("quincail_token")
      localStorage.removeItem("quincail_user")
      set({ user: null, token: null })
    }
  },
}))
