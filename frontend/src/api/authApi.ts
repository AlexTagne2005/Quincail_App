import apiClient from "./client"
import { LoginResponse, User } from "@/types"

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      email: username,
      password: password,
    })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me")
    return response.data
  },
}
