import uuid
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.article import ArticleResponse

class KpiStats(BaseModel):
    total_revenue_today: float
    total_revenue_month: float
    gross_margin_month: float
    gross_margin_percentage: float
    total_sales_count_today: int
    total_stock_value_cost: float
    total_stock_value_selling: float
    total_articles_count: int
    low_stock_count: int
    out_of_stock_count: int

class DailySalesStat(BaseModel):
    date: str
    revenue: float
    margin: float
    sales_count: int

class TopArticleStat(BaseModel):
    article_id: uuid.UUID
    name: str
    code: str
    quantity_sold: float
    total_revenue: float
    total_margin: float

class CategoryStockStat(BaseModel):
    category_id: uuid.UUID
    category_name: str
    articles_count: int
    stock_value: float

class DashboardOverview(BaseModel):
    kpis: KpiStats
    recent_sales_chart: List[DailySalesStat]
    top_selling_articles: List[TopArticleStat]
    category_distribution: List[CategoryStockStat]
    critical_stock_articles: List[ArticleResponse]
