import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_stock_manager_or_admin
from app.models.stock_entry import StockEntry, StockEntryItem
from app.models.user import User
from app.models.partner import Supplier
from app.schemas.stock_entry import StockEntryCreate, StockEntryResponse, StockEntryItemResponse
from app.services.entry_service import EntryService

router = APIRouter()

@router.get("", response_model=List[StockEntryResponse])
async def list_stock_entries(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(StockEntry)
        .options(
            selectinload(StockEntry.items).selectinload(StockEntryItem.article),
            selectinload(StockEntry.supplier),
            selectinload(StockEntry.user)
        )
        .order_by(StockEntry.entry_date.desc())
        .limit(limit)
    )
    res = await db.execute(query)
    entries = res.scalars().all()

    response = []
    for entry in entries:
        items_resp = [
            StockEntryItemResponse(
                id=item.id,
                article_id=item.article_id,
                article_name=item.article.name if item.article else None,
                article_code=item.article.code if item.article else None,
                quantity=float(item.quantity),
                unit_cost=float(item.unit_cost),
                subtotal=float(item.subtotal)
            ) for item in entry.items
        ]
        response.append(StockEntryResponse(
            id=entry.id,
            entry_number=entry.entry_number,
            supplier_id=entry.supplier_id,
            supplier_name=entry.supplier.name if entry.supplier else None,
            user_id=entry.user_id,
            user_name=entry.user.full_name if entry.user else None,
            reference_invoice=entry.reference_invoice,
            entry_date=entry.entry_date,
            total_cost=float(entry.total_cost),
            notes=entry.notes,
            idempotency_key=entry.idempotency_key,
            created_at=entry.created_at,
            items=items_resp
        ))
    return response

@router.post("", response_model=StockEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_entry(
    entry_in: StockEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_stock_manager_or_admin)
):
    entry = await EntryService.create_stock_entry(
        db=db,
        entry_in=entry_in,
        user_id=current_user.id
    )
    
    # Reload with relations
    res = await db.execute(
        select(StockEntry)
        .options(
            selectinload(StockEntry.items).selectinload(StockEntryItem.article),
            selectinload(StockEntry.supplier),
            selectinload(StockEntry.user)
        )
        .where(StockEntry.id == entry.id)
    )
    entry_loaded = res.scalars().first()

    items_resp = [
        StockEntryItemResponse(
            id=item.id,
            article_id=item.article_id,
            article_name=item.article.name if item.article else None,
            article_code=item.article.code if item.article else None,
            quantity=float(item.quantity),
            unit_cost=float(item.unit_cost),
            subtotal=float(item.subtotal)
        ) for item in entry_loaded.items
    ]

    return StockEntryResponse(
        id=entry_loaded.id,
        entry_number=entry_loaded.entry_number,
        supplier_id=entry_loaded.supplier_id,
        supplier_name=entry_loaded.supplier.name if entry_loaded.supplier else None,
        user_id=entry_loaded.user_id,
        user_name=entry_loaded.user.full_name if entry_loaded.user else None,
        reference_invoice=entry_loaded.reference_invoice,
        entry_date=entry_loaded.entry_date,
        total_cost=float(entry_loaded.total_cost),
        notes=entry_loaded.notes,
        idempotency_key=entry_loaded.idempotency_key,
        created_at=entry_loaded.created_at,
        items=items_resp
    )
