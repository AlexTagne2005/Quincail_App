import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_stock_manager_or_admin
from app.models.article import Article
from app.models.category import Category
from app.models.user import User
from app.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse
from app.services.stock_service import StockService

router = APIRouter()

@router.get("", response_model=List[ArticleResponse])
async def list_articles(
    search: Optional[str] = None,
    category_id: Optional[uuid.UUID] = None,
    low_stock_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Article, Category.name.label("category_name")).join(
        Category, Category.id == Article.category_id
    ).where(and_(Article.is_active == True, Article.deleted_at.is_(None)))

    if search:
        search_filter = or_(
            Article.name.ilike(f"%{search}%"),
            Article.code.ilike(f"%{search}%"),
            Article.barcode.ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    if category_id:
        query = query.where(Article.category_id == category_id)

    if low_stock_only:
        query = query.where(Article.current_stock <= Article.min_stock_alert)

    query = query.order_by(Article.name.asc())
    result = await db.execute(query)
    
    articles_list = []
    for art, cat_name in result.all():
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
        articles_list.append(ArticleResponse(**art_dict))
    return articles_list

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(
        select(Article, Category.name.label("category_name"))
        .join(Category, Category.id == Article.category_id)
        .where(Article.id == article_id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    art, cat_name = row
    return ArticleResponse(
        id=art.id,
        code=art.code,
        barcode=art.barcode,
        name=art.name,
        category_id=art.category_id,
        category_name=cat_name,
        unit=art.unit,
        purchase_price=float(art.purchase_price),
        selling_price=float(art.selling_price),
        wholesale_price=float(art.wholesale_price) if art.wholesale_price else None,
        current_stock=float(art.current_stock),
        min_stock_alert=float(art.min_stock_alert),
        location=art.location,
        is_active=art.is_active,
        created_at=art.created_at,
        updated_at=art.updated_at
    )

@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    art_in: ArticleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_stock_manager_or_admin)
):
    existing_code = await db.execute(select(Article).where(Article.code == art_in.code))
    if existing_code.scalars().first():
        raise HTTPException(status_code=400, detail="Ce code article (SKU) existe déjà")

    if art_in.barcode:
        existing_barcode = await db.execute(select(Article).where(Article.barcode == art_in.barcode))
        if existing_barcode.scalars().first():
            raise HTTPException(status_code=400, detail="Ce code-barres existe déjà")

    article_id = uuid.uuid4()
    article = Article(
        id=article_id,
        code=art_in.code,
        barcode=art_in.barcode,
        name=art_in.name,
        category_id=art_in.category_id,
        unit=art_in.unit,
        purchase_price=art_in.purchase_price,
        selling_price=art_in.selling_price,
        wholesale_price=art_in.wholesale_price,
        current_stock=0.0,
        min_stock_alert=art_in.min_stock_alert,
        location=art_in.location,
        is_active=art_in.is_active
    )
    db.add(article)
    await db.flush()

    # Initial stock movement if > 0
    if art_in.initial_stock > 0:
        await StockService.record_movement(
            db=db,
            article_id=article_id,
            movement_type="ENTREE_INVENTAIRE",
            direction="IN",
            quantity=art_in.initial_stock,
            unit_cost_or_price=art_in.purchase_price,
            user_id=current_user.id,
            notes="Stock initial à la création"
        )

    await db.commit()
    await db.refresh(article)

    cat_res = await db.execute(select(Category.name).where(Category.id == article.category_id))
    cat_name = cat_res.scalar_one_or_none()

    return ArticleResponse(
        id=article.id,
        code=article.code,
        barcode=article.barcode,
        name=article.name,
        category_id=article.category_id,
        category_name=cat_name,
        unit=article.unit,
        purchase_price=float(article.purchase_price),
        selling_price=float(article.selling_price),
        wholesale_price=float(article.wholesale_price) if article.wholesale_price else None,
        current_stock=float(article.current_stock),
        min_stock_alert=float(article.min_stock_alert),
        location=article.location,
        is_active=article.is_active,
        created_at=article.created_at,
        updated_at=article.updated_at
    )

@router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: uuid.UUID,
    art_in: ArticleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_stock_manager_or_admin)
):
    res = await db.execute(select(Article).where(Article.id == article_id))
    article = res.scalars().first()
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    update_data = art_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(article, field, value)

    await db.commit()
    await db.refresh(article)

    cat_res = await db.execute(select(Category.name).where(Category.id == article.category_id))
    cat_name = cat_res.scalar_one_or_none()

    return ArticleResponse(
        id=article.id,
        code=article.code,
        barcode=article.barcode,
        name=article.name,
        category_id=article.category_id,
        category_name=cat_name,
        unit=article.unit,
        purchase_price=float(article.purchase_price),
        selling_price=float(article.selling_price),
        wholesale_price=float(article.wholesale_price) if article.wholesale_price else None,
        current_stock=float(article.current_stock),
        min_stock_alert=float(article.min_stock_alert),
        location=article.location,
        is_active=article.is_active,
        created_at=article.created_at,
        updated_at=article.updated_at
    )
