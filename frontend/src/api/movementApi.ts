import apiClient from "./client"
import { StockMovement } from "@/types"

export interface MovementQueryParams {
  article_id?: string
  movement_type?: string
  direction?: string
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}

export const movementApi = {
  getMovements: async (params?: MovementQueryParams): Promise<StockMovement[]> => {
    const response = await apiClient.get<StockMovement[]>("/movements/", { params })
    return response.data
  },
}
