import apiClient from "./client"
import { Article, ArticleCreate, ArticleUpdate, Category } from "@/types"

export interface ArticleQueryParams {
  category_id?: string
  search?: string
  low_stock_only?: boolean
}

export const articleApi = {
  getArticles: async (params?: ArticleQueryParams): Promise<Article[]> => {
    // Clean empty strings so UUID validation doesn't fail on empty category_id
    const cleanParams: Record<string, any> = {}
    if (params?.search) cleanParams.search = params.search
    if (params?.category_id && params.category_id !== "ALL") cleanParams.category_id = params.category_id
    if (params?.low_stock_only) cleanParams.low_stock_only = true

    const response = await apiClient.get<Article[]>("/articles", { params: cleanParams })
    return response.data
  },

  getArticle: async (id: string): Promise<Article> => {
    const response = await apiClient.get<Article>(`/articles/${id}`)
    return response.data
  },

  createArticle: async (data: ArticleCreate): Promise<Article> => {
    const response = await apiClient.post<Article>("/articles", data)
    return response.data
  },

  updateArticle: async (id: string, data: ArticleUpdate): Promise<Article> => {
    const response = await apiClient.put<Article>(`/articles/${id}`, data)
    return response.data
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories")
    return response.data
  },

  createCategory: async (data: { name: string; description?: string }): Promise<Category> => {
    const response = await apiClient.post<Category>("/categories", data)
    return response.data
  },
}
