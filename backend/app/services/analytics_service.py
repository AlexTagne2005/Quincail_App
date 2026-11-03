import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from app.models.sale import Sale, SaleItem
from app.models.article import Article
from app.models.category import Category
from app.schemas.stats import (
    DashboardOverview,
    KpiStats,
    DailySalesStat,
    TopArticleStat,
    CategoryStockStat
)
from app.schemas.article import ArticleResponse

class AnalyticsService:
    @staticmethod
    async def get_dashboard_overview(db: AsyncSession) -> DashboardOverview:
        now = datetime.now(timezone.utc)
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        # 1. Total revenue & count today
        today_sales_res = await db.execute(
            select(
                func.coalesce(func.sum(Sale.total_amount), 0.0),
                func.count(Sale.id)
            ).where(
                and_(Sale.sale_date >= start_of_today, Sale.status == "COMPLETED")
            )
        )
        total_rev_today, count_today = today_sales_res.first()

        # 2. Total revenue & margin this month
        month_sales_res = await db.execute(
            select(
                func.coalesce(func.sum(Sale.total_amount), 0.0)
            ).where(
                and_(Sale.sale_date >= start_of_month, Sale.status == "COMPLETED")
            )
        )
        total_rev_month = month_sales_res.scalar_one()

        # Gross margin calculation this month
        margin_res = await db.execute(
            select(
                func.coalesce(
                    func.sum(
                        (SaleItem.unit_price - SaleItem.purchase_cost_snapshot) * SaleItem.quantity
                    ),
                    0.0
                )
            ).join(Sale, Sale.id == SaleItem.sale_id)
            .where(
                and_(Sale.sale_date >= start_of_month, Sale.status == "COMPLETED")
            )
        )
        gross_margin_month = float(margin_res.scalar_one())
        total_rev_month = float(total_rev_month)
        margin_percent = (gross_margin_month / total_rev_month * 100.0) if total_rev_month > 0 else 0.0

        # 3. Stock stats (Total count, total cost value, selling value, low stock, out of stock)
        articles_res = await db.execute(
            select(
                func.count(Article.id),
                func.coalesce(func.sum(Article.current_stock * Article.purchase_price), 0.0),
                func.coalesce(func.sum(Article.current_stock * Article.selling_price), 0.0),
                func.count().filter(and_(Article.current_stock <= Article.min_stock_alert, Article.current_stock > 0)),
                func.count().filter(Article.current_stock <= 0)
            ).where(and_(Article.is_active == True, Article.deleted_at.is_(None)))
        )
        art_count, val_cost, val_sell, low_count, out_count = articles_res.first()

        kpi_stats = KpiStats(
            total_revenue_today=float(total_rev_today),
            total_revenue_month=float(total_rev_month),
            gross_margin_month=float(gross_margin_month),
            gross_margin_percentage=round(margin_percent, 1),
            total_sales_count_today=int(count_today),
            total_stock_value_cost=float(val_cost),
            total_stock_value_selling=float(val_sell),
            total_articles_count=int(art_count),
            low_stock_count=int(low_count),
            out_of_stock_count=int(out_count)
        )

        # 4. Recent sales chart (Last 14 days)
        fourteen_days_ago = now - timedelta(days=14)
        daily_res = await db.execute(
            select(
                func.to_char(Sale.sale_date, 'YYYY-MM-DD').label('day'),
                func.sum(Sale.total_amount).label('revenue'),
                func.count(Sale.id).label('cnt')
            ).where(and_(Sale.sale_date >= fourteen_days_ago, Sale.status == 'COMPLETED'))
            .group_by('day')
            .order_by('day')
        )
        
        # Calculate daily margins
        daily_margins_res = await db.execute(
            select(
                func.to_char(Sale.sale_date, 'YYYY-MM-DD').label('day'),
                func.sum((SaleItem.unit_price - SaleItem.purchase_cost_snapshot) * SaleItem.quantity).label('margin')
            ).join(Sale, Sale.id == SaleItem.sale_id)
            .where(and_(Sale.sale_date >= fourteen_days_ago, Sale.status == 'COMPLETED'))
            .group_by('day')
        )
        margin_map = {row.day: float(row.margin) for row in daily_margins_res.all()}

        daily_stats: list[DailySalesStat] = []
        for row in daily_res.all():
            daily_stats.append(DailySalesStat(
                date=row.day,
                revenue=float(row.revenue),
                margin=margin_map.get(row.day, 0.0),
                sales_count=int(row.cnt)
            ))

        # 5. Top 8 selling articles
        top_art_res = await db.execute(
            select(
                Article.id,
                Article.name,
                Article.code,
                func.sum(SaleItem.quantity).label('qty'),
                func.sum(SaleItem.subtotal).label('rev'),
                func.sum((SaleItem.unit_price - SaleItem.purchase_cost_snapshot) * SaleItem.quantity).label('mrg')
            ).join(SaleItem, SaleItem.article_id == Article.id)
            .join(Sale, Sale.id == SaleItem.sale_id)
            .where(Sale.status == 'COMPLETED')
            .group_by(Article.id, Article.name, Article.code)
            .order_by(desc('rev'))
            .limit(8)
        )
        top_articles = [
            TopArticleStat(
                article_id=row.id,
                name=row.name,
                code=row.code,
                quantity_sold=float(row.qty),
                total_revenue=float(row.rev),
                total_margin=float(row.mrg)
            ) for row in top_art_res.all()
        ]

        # 6. Category stock distribution
        cat_res = await db.execute(
            select(
                Category.id,
                Category.name,
                func.count(Article.id).label('art_cnt'),
                func.coalesce(func.sum(Article.current_stock * Article.selling_price), 0.0).label('val')
            ).join(Article, Article.category_id == Category.id)
            .where(and_(Article.is_active == True, Article.deleted_at.is_(None)))
            .group_by(Category.id, Category.name)
            .order_by(desc('val'))
        )
        category_distribution = [
            CategoryStockStat(
                category_id=row.id,
                category_name=row.name,
                articles_count=int(row.art_cnt),
                stock_value=float(row.val)
            ) for row in cat_res.all()
        ]

        # 7. Critical stock articles (current_stock <= min_stock_alert)
        crit_res = await db.execute(
            select(Article, Category.name.label('cat_name'))
            .join(Category, Category.id == Article.category_id)
            .where(
                and_(
                    Article.current_stock <= Article.min_stock_alert,
                    Article.is_active == True,
                    Article.deleted_at.is_(None)
                )
            ).order_by(Article.current_stock.asc())
            .limit(10)
        )
        critical_articles = []
        for art, cat_name in crit_res.all():
            art_dict = {
                "id": art.id,
                "code": art.code,
                "barcode": art.barcode,
                "name": art.name,
                "category_id": art.category_id,
                "category_name": cat_name,
                "unit": art.unit,
                "purchase_price": float(art.purchase_price),
                "selling_price": float(art.selling_price),
                "wholesale_price": float(art.wholesale_price) if art.wholesale_price else None,
                "current_stock": float(art.current_stock),
                "min_stock_alert": float(art.min_stock_alert),
                "location": art.location,
                "is_active": art.is_active,
                "created_at": art.created_at,
                "updated_at": art.updated_at
            }
            critical_articles.append(ArticleResponse(**art_dict))

        return DashboardOverview(
            kpis=kpi_stats,
            recent_sales_chart=daily_stats,
            top_selling_articles=top_articles,
            category_distribution=category_distribution,
            critical_stock_articles=critical_articles
        )
