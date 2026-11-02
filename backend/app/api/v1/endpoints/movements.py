import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_stock_manager_or_admin
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.schemas.stock_movement import StockMovementCreate, StockMovementResponse
from app.services.stock_service import StockService

router = APIRouter()

@router.get("", response_model=List[StockMovementResponse])
async def list_stock_movements(
    article_id: Optional[uuid.UUID] = None,
    movement_type: Optional[str] = None,
    direction: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(StockMovement)
        .options(
            selectinload(StockMovement.article),
            selectinload(StockMovement.user)
        )
    )

    filters = []
    if article_id:
        filters.append(StockMovement.article_id == article_id)
    if movement_type:
        filters.append(StockMovement.movement_type == movement_type)
    if direction:
        filters.append(StockMovement.direction == direction)

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(StockMovement.created_at.desc()).limit(limit)
    res = await db.execute(query)
    movements = res.scalars().all()

    response = []
    for m in movements:
        response.append(StockMovementResponse(
            id=m.id,
            article_id=m.article_id,
            article_name=m.article.name if m.article else None,
            article_code=m.article.code if m.article else None,
            movement_type=m.movement_type,
            direction=m.direction,
            quantity=float(m.quantity),
            quantity_before=float(m.quantity_before),
            quantity_after=float(m.quantity_after),
            unit_cost_or_price=float(m.unit_cost_or_price) if m.unit_cost_or_price else None,
            reference_id=m.reference_id,
            reference_code=m.reference_code,
            user_id=m.user_id,
            user_name=m.user.full_name if m.user else None,
            notes=m.notes,
            created_at=m.created_at
        ))
    return response

@router.post("/adjustment", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_adjustment(
    adj_in: StockMovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_stock_manager_or_admin)
):
    # Determine direction
    if adj_in.movement_type in ["SORTIE_PERTE", "SORTIE_AJUSTEMENT", "SORTIE_INTERNE"]:
        direction = "OUT"
    elif adj_in.movement_type in ["ENTREE_AJUSTEMENT", "ENTREE_RETOUR"]:
        direction = "IN"
    else:
        direction = "OUT"

    movement = await StockService.record_movement(
        db=db,
        article_id=adj_in.article_id,
        movement_type=adj_in.movement_type,
        direction=direction,
        quantity=adj_in.quantity,
        user_id=current_user.id,
        notes=adj_in.notes
    )
    await db.commit()
    await db.refresh(movement)

    # Reload relations
    res = await db.execute(
        select(StockMovement)
        .options(
            selectinload(StockMovement.article),
            selectinload(StockMovement.user)
        )
        .where(StockMovement.id == movement.id)
    )
    m = res.scalars().first()

    return StockMovementResponse(
        id=m.id,
        article_id=m.article_id,
        article_name=m.article.name if m.article else None,
        article_code=m.article.code if m.article else None,
        movement_type=m.movement_type,
        direction=m.direction,
        quantity=float(m.quantity),
        quantity_before=float(m.quantity_before),
        quantity_after=float(m.quantity_after),
        unit_cost_or_price=float(m.unit_cost_or_price) if m.unit_cost_or_price else None,
        reference_id=m.reference_id,
        reference_code=m.reference_code,
        user_id=m.user_id,
        user_name=m.user.full_name if m.user else None,
        notes=m.notes,
        created_at=m.created_at
    )
