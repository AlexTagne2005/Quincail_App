export type UserRole = "ADMIN" | "GESTIONNAIRE_STOCK" | "CAISSIER" | "admin" | "stock" | "caisse"

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at?: string
}

export interface Article {
  id: string
  code: string
  barcode?: string
  name: string
  category_id: string
  category_name?: string
  unit: string
  purchase_price: number
  selling_price: number
  wholesale_price?: number
  current_stock: number
  min_stock_alert: number
  location?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  // Compatibility aliases
  stock_current?: number
  stock_min?: number
}

export interface ArticleCreate {
  code: string
  name: string
  category_id: string
  unit?: string
  purchase_price: number
  selling_price: number
  wholesale_price?: number
  min_stock_alert?: number
  initial_stock?: number
  barcode?: string
  location?: string
}

export interface ArticleUpdate extends Partial<ArticleCreate> {
  is_active?: boolean
}

export interface Supplier {
  id: string
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  is_pro?: boolean
}

export type MovementDirection = "IN" | "OUT"

export interface StockMovement {
  id: string
  article_id: string
  article_name?: string
  article_code?: string
  movement_type: string
  direction: MovementDirection
  quantity: number
  quantity_before: number
  quantity_after: number
  unit_cost_or_price?: number
  reference_code?: string
  reference_id?: string
  user_id?: string
  user_name?: string
  notes?: string
  created_at: string
}

export interface StockEntryItemCreate {
  article_id: string
  quantity: number
  unit_cost: number
}

export interface StockEntryItem {
  id: string
  article_id: string
  article_name?: string
  article_code?: string
  quantity: number
  unit_cost: number
  subtotal: number
}

export interface StockEntryCreate {
  supplier_id?: string
  reference_invoice?: string
  notes?: string
  idempotency_key?: string
  items: StockEntryItemCreate[]
}

export interface StockEntry {
  id: string
  entry_number: string
  supplier_id?: string
  supplier_name?: string
  user_id: string
  user_name?: string
  reference_invoice?: string
  entry_date: string
  total_cost: number
  notes?: string
  created_at: string
  items: StockEntryItem[]
}

export interface SaleItemCreate {
  article_id: string
  quantity: number
  unit_price: number
}

export interface SaleCreate {
  customer_id?: string
  payment_method?: string
  discount_amount?: number
  idempotency_key?: string
  items: SaleItemCreate[]
}

export interface SaleItem {
  id: string
  article_id: string
  article_name?: string
  article_code?: string
  quantity: number
  unit_price: number
  purchase_cost_snapshot: number
  subtotal: number
}

export interface Sale {
  id: string
  sale_number: string
  customer_id?: string
  customer_name?: string
  user_id: string
  user_name?: string
  sale_date: string
  total_amount: number
  discount_amount: number
  payment_method: string
  status: string
  created_at: string
  items: SaleItem[]
}

export interface DashboardKPIs {
  total_revenue_today: number
  total_revenue_month: number
  gross_margin_month: number
  gross_margin_percentage: number
  total_sales_count_today: number
  total_stock_value_cost: number
  total_stock_value_selling: number
  total_articles_count: number
  low_stock_count: number
  out_of_stock_count: number
}

export interface DailySalesStat {
  date: string
  revenue: number
  margin: number
  sales_count: number
}

export interface TopArticleStat {
  article_id: string
  name: string
  code: string
  quantity_sold: number
  total_revenue: number
  total_margin: number
}

export interface CategoryStockStat {
  category_id: string
  category_name: string
  articles_count: number
  stock_value: number
}

export interface DashboardOverview {
  kpis: DashboardKPIs
  recent_sales_chart: DailySalesStat[]
  top_selling_articles: TopArticleStat[]
  category_distribution: CategoryStockStat[]
  critical_stock_articles: Article[]
}
