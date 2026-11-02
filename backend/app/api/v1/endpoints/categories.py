import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_stock_manager_or_admin
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()

@router.get("", response_model=List[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Category).order_by(Category.name.asc()))
    return [CategoryResponse.model_validate(c) for c in result.scalars().all()]

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    cat_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_stock_manager_or_admin)
):
    existing = await db.execute(select(Category).where(Category.name == cat_in.name))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Une catégorie avec ce nom existe déjà")

    category = Category(
        id=uuid.uuid4(),
        name=cat_in.name,
        description=cat_in.description
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryResponse.model_validate(category)
