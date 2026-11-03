import apiClient from "./client"
import { Customer, Supplier } from "@/types"

export const partnerApi = {
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await apiClient.get<Supplier[]>("/partners/suppliers")
    return response.data
  },

  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>("/partners/customers")
    return response.data
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post<Supplier>("/partners/suppliers", data)
    return response.data
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post<Customer>("/partners/customers", data)
    return response.data
  },
}
