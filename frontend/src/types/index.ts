export type UserRole = "admin" | "stock" | "caisse"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
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
  category_id: string
  code: string
  name: string
  description?: string
  unit: string
  purchase_price: number
  selling_price: number
  stock_current: number
  stock_min: number
  stock_max: number
  barcode?: string
  is_active: boolean
  created_at: string
  category?: Category
}

export interface ArticleCreate {
  category_id: string
  code: string
  name: string
  description?: string
  unit?: string
  purchase_price: number
  selling_price: number
  stock_min?: number
  stock_max?: number
  barcode?: string
}

export interface ArticleUpdate extends Partial<ArticleCreate> {
  is_active?: boolean
}

export interface Supplier {
  id: string
  name: string
  contact_person?: string
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
}

export type MovementDirection = "IN" | "OUT"

export type MovementType =
  | "ENTRY_PURCHASE"
  | "EXIT_SALE"
  | "EXIT_LOSS"
  | "EXIT_INTERNAL"
  | "INVENTORY_ADJUST"
  | "RETURN_CUSTOMER"
  | "RETURN_SUPPLIER"

export interface StockMovement {
  id: string
  article_id: string
  movement_type: MovementType
  direction: MovementDirection
  quantity: number
  unit_price?: number
  quantity_before: number
  quantity_after: number
  reference?: string
  notes?: string
  user_id?: string
  created_at: string
  article?: Article
  user?: User
}

export interface StockEntryItemCreate {
  article_id: string
  quantity: number
  purchase_price: number
}

export interface StockEntryItem {
  id: string
  article_id: string
  quantity: number
  purchase_price: number
  total_price: number
  article?: Article
}

export interface StockEntryCreate {
  supplier_id?: string
  reference_doc?: string
  notes?: string
  items: StockEntryItemCreate[]
}

export interface StockEntry {
  id: string
  entry_number: string
  supplier_id?: string
  user_id: string
  total_amount: number
  status: string
  reference_doc?: string
  notes?: string
  created_at: string
  items: StockEntryItem[]
  supplier?: Supplier
}

export interface SaleItemCreate {
  article_id: string
  quantity: number
  unit_price: number
  discount?: number
}

export interface SaleCreate {
  customer_id?: string
  payment_method?: "CASH" | "MOMO" | "CARD" | "CREDIT"
  discount_amount?: number
  notes?: string
  items: SaleItemCreate[]
}

export interface SaleItem {
  id: string
  article_id: string
  quantity: number
  unit_price: number
  discount: number
  total_price: number
  article?: Article
}

export interface Sale {
  id: string
  invoice_number: string
  customer_id?: string
  user_id: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  status: string
  notes?: string
  created_at: string
  items: SaleItem[]
}

export interface DashboardKPIs {
  today_sales: number
  today_sales_count: number
  month_sales: number
  month_sales_count: number
  month_margin: number
  margin_percentage: number
  stock_value_purchase: number
  stock_value_sale: number
  potential_margin: number
  low_stock_count: number
  out_of_stock_count: number
}

export interface SalesMarginPoint {
  date: string
  sales: number
  margin: number
}

export interface TopProductPoint {
  article_id: string
  code: string
  name: string
  quantity_sold: number
  revenue: number
}

export interface CategoryDistributionPoint {
  category_id: string
  category_name: string
  article_count: number
  stock_value: number
}

export interface LowStockAlertItem {
  id: string
  code: string
  name: string
  stock_current: number
  stock_min: number
  unit: string
  category_name: string
}

export interface DashboardOverview {
  kpis: DashboardKPIs
  sales_margin_chart: SalesMarginPoint[]
  top_articles: TopProductPoint[]
  category_distribution: CategoryDistributionPoint[]
  low_stock_alerts: LowStockAlertItem[]
}
