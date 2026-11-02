import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.sale import Sale, SaleItem
from app.models.user import User
from app.models.partner import Customer
from app.schemas.sale import SaleCreate, SaleResponse, SaleItemResponse
from app.services.sale_service import SaleService

router = APIRouter()

@router.get("", response_model=List[SaleResponse])
async def list_sales(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Sale)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.article),
            selectinload(Sale.customer),
            selectinload(Sale.user)
        )
        .order_by(Sale.sale_date.desc())
        .limit(limit)
    )
    res = await db.execute(query)
    sales = res.scalars().all()

    response = []
    for sale in sales:
        items_resp = [
            SaleItemResponse(
                id=item.id,
                article_id=item.article_id,
                article_name=item.article.name if item.article else None,
                article_code=item.article.code if item.article else None,
                quantity=float(item.quantity),
                unit_price=float(item.unit_price),
                purchase_cost_snapshot=float(item.purchase_cost_snapshot),
                subtotal=float(item.subtotal)
            ) for item in sale.items
        ]
        response.append(SaleResponse(
            id=sale.id,
            sale_number=sale.sale_number,
            customer_id=sale.customer_id,
            customer_name=sale.customer.name if sale.customer else None,
            user_id=sale.user_id,
            user_name=sale.user.full_name if sale.user else None,
            sale_date=sale.sale_date,
            total_amount=float(sale.total_amount),
            discount_amount=float(sale.discount_amount),
            payment_method=sale.payment_method,
            status=sale.status,
            idempotency_key=sale.idempotency_key,
            created_at=sale.created_at,
            items=items_resp
        ))
    return response

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_in: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = await SaleService.create_sale(
        db=db,
        sale_in=sale_in,
        user_id=current_user.id
    )

    # Reload with relations
    res = await db.execute(
        select(Sale)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.article),
            selectinload(Sale.customer),
            selectinload(Sale.user)
        )
        .where(Sale.id == sale.id)
    )
    sale_loaded = res.scalars().first()

    items_resp = [
        SaleItemResponse(
            id=item.id,
            article_id=item.article_id,
            article_name=item.article.name if item.article else None,
            article_code=item.article.code if item.article else None,
            quantity=float(item.quantity),
            unit_price=float(item.unit_price),
            purchase_cost_snapshot=float(item.purchase_cost_snapshot),
            subtotal=float(item.subtotal)
        ) for item in sale_loaded.items
    ]

    return SaleResponse(
        id=sale_loaded.id,
        sale_number=sale_loaded.sale_number,
        customer_id=sale_loaded.customer_id,
        customer_name=sale_loaded.customer.name if sale_loaded.customer else None,
        user_id=sale_loaded.user_id,
        user_name=sale_loaded.user.full_name if sale_loaded.user else None,
        sale_date=sale_loaded.sale_date,
        total_amount=float(sale_loaded.total_amount),
        discount_amount=float(sale_loaded.discount_amount),
        payment_method=sale_loaded.payment_method,
        status=sale_loaded.status,
        idempotency_key=sale_loaded.idempotency_key,
        created_at=sale_loaded.created_at,
        items=items_resp
    )
