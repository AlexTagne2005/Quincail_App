import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.stock_entry import StockEntry, StockEntryItem
from app.models.article import Article
from app.models.partner import Supplier
from app.schemas.stock_entry import StockEntryCreate
from app.services.stock_service import StockService

class EntryService:
    @staticmethod
    async def create_stock_entry(
        db: AsyncSession,
        entry_in: StockEntryCreate,
        user_id: uuid.UUID
    ) -> StockEntry:
        # Idempotency check
        if entry_in.idempotency_key:
            existing = await db.execute(
                select(StockEntry).where(StockEntry.idempotency_key == entry_in.idempotency_key)
            )
            found = existing.scalars().first()
            if found:
                return found

        # Generate entry number: ENT-YYYY-XXXX
        year = datetime.now().year
        count_res = await db.execute(
            select(func.count(StockEntry.id)).where(
                func.extract("year", StockEntry.entry_date) == year
            )
        )
        count = count_res.scalar_one() + 1
        entry_number = f"ENT-{year}-{count:04d}"

        entry_id = entry_in.id or uuid.uuid4()
        total_cost = sum(item.quantity * item.unit_cost for item in entry_in.items)

        stock_entry = StockEntry(
            id=entry_id,
            entry_number=entry_number,
            supplier_id=entry_in.supplier_id,
            user_id=user_id,
            reference_invoice=entry_in.reference_invoice,
            total_cost=total_cost,
            notes=entry_in.notes,
            idempotency_key=entry_in.idempotency_key,
            entry_date=datetime.now(timezone.utc)
        )
        db.add(stock_entry)

        for item_in in entry_in.items:
            subtotal = item_in.quantity * item_in.unit_cost
            entry_item = StockEntryItem(
                id=uuid.uuid4(),
                stock_entry_id=entry_id,
                article_id=item_in.article_id,
                quantity=item_in.quantity,
                unit_cost=item_in.unit_cost,
                subtotal=subtotal
            )
            db.add(entry_item)

            # Update article purchase price
            art_res = await db.execute(select(Article).where(Article.id == item_in.article_id))
            article = art_res.scalars().first()
            if article:
                article.purchase_price = item_in.unit_cost

            # Record stock movement
            await StockService.record_movement(
                db=db,
                article_id=item_in.article_id,
                movement_type="ENTREE_ACHAT",
                direction="IN",
                quantity=item_in.quantity,
                unit_cost_or_price=item_in.unit_cost,
                reference_id=entry_id,
                reference_code=entry_number,
                user_id=user_id,
                notes=f"Réception {entry_number}" + (f" - Réf: {entry_in.reference_invoice}" if entry_in.reference_invoice else "")
            )

        await db.commit()
        await db.refresh(stock_entry)
        return stock_entry
