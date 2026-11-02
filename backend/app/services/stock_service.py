import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status
from app.models.article import Article
from app.models.stock_movement import StockMovement

class StockService:
    @staticmethod
    async def record_movement(
        db: AsyncSession,
        article_id: uuid.UUID,
        movement_type: str,
        direction: str,
        quantity: float,
        unit_cost_or_price: Optional[float] = None,
        reference_id: Optional[uuid.UUID] = None,
        reference_code: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        notes: Optional[str] = None,
        allow_negative_stock: bool = False
    ) -> StockMovement:
        # Lock article row for update
        result = await db.execute(select(Article).where(Article.id == article_id).with_for_update())
        article = result.scalars().first()
        
        if not article:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article non trouvé")
        
        quantity_before = float(article.current_stock)
        
        if direction == "IN":
            quantity_after = quantity_before + quantity
        elif direction == "OUT":
            if not allow_negative_stock and quantity_before < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuffisant pour '{article.name}'. Disponible: {quantity_before}, Demandé: {quantity}"
                )
            quantity_after = quantity_before - quantity
        else:
            raise ValueError(f"Direction de mouvement invalide: {direction}")

        # Update article stock
        article.current_stock = quantity_after
        
        movement = StockMovement(
            id=uuid.uuid4(),
            article_id=article_id,
            movement_type=movement_type,
            direction=direction,
            quantity=quantity,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            unit_cost_or_price=unit_cost_or_price,
            reference_id=reference_id,
            reference_code=reference_code,
            user_id=user_id,
            notes=notes
        )
        db.add(movement)
        return movement
