import apiClient from "./client"
import { Sale, SaleCreate } from "@/types"

export const saleApi = {
  createSale: async (data: SaleCreate): Promise<Sale> => {
    const response = await apiClient.post<Sale>("/sales/", data)
    return response.data
  },

  getSales: async (params?: {
    start_date?: string
    end_date?: string
    customer_id?: string
    skip?: number
    limit?: number
  }): Promise<Sale[]> => {
    const response = await apiClient.get<Sale[]>("/sales/", { params })
    return response.data
  },

  getSale: async (id: string): Promise<Sale> => {
    const response = await apiClient.get<Sale>(`/sales/${id}`)
    return response.data
  },
}
