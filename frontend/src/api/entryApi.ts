import apiClient from "./client"
import { StockEntry, StockEntryCreate } from "@/types"

export const entryApi = {
  createEntry: async (data: StockEntryCreate): Promise<StockEntry> => {
    const response = await apiClient.post<StockEntry>("/entries", data)
    return response.data
  },

  getEntries: async (params?: { limit?: number }): Promise<StockEntry[]> => {
    const response = await apiClient.get<StockEntry[]>("/entries", { params })
    return response.data
  },

  getEntry: async (id: string): Promise<StockEntry> => {
    const response = await apiClient.get<StockEntry>(`/entries/${id}`)
    return response.data
  },
}
