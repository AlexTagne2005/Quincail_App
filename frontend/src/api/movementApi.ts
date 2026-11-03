import apiClient from "./client"
import { StockMovement } from "@/types"

export interface MovementQueryParams {
  article_id?: string
  movement_type?: string
  direction?: string
  limit?: number
}

export const movementApi = {
  getMovements: async (params?: MovementQueryParams): Promise<StockMovement[]> => {
    const cleanParams: Record<string, any> = {}
    if (params?.article_id && params.article_id !== "ALL") cleanParams.article_id = params.article_id
    if (params?.movement_type && params.movement_type !== "ALL") cleanParams.movement_type = params.movement_type
    if (params?.direction && params.direction !== "ALL") cleanParams.direction = params.direction
    if (params?.limit) cleanParams.limit = params.limit

    const response = await apiClient.get<StockMovement[]>("/movements", { params: cleanParams })
    return response.data
  },
}
