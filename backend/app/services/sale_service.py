import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.sale import Sale, SaleItem
from app.models.article import Article
from app.schemas.sale import SaleCreate
from app.services.stock_service import StockService

class SaleService:
    @staticmethod
    async def create_sale(
        db: AsyncSession,
        sale_in: SaleCreate,
        user_id: uuid.UUID
    ) -> Sale:
        # Idempotency check
        if sale_in.idempotency_key:
            existing = await db.execute(
                select(Sale).where(Sale.idempotency_key == sale_in.idempotency_key)
            )
            found = existing.scalars().first()
            if found:
                return found

        # Generate sale number: VNT-YYYY-XXXX
        year = datetime.now().year
        count_res = await db.execute(
            select(func.count(Sale.id)).where(
                func.extract("year", Sale.sale_date) == year
            )
        )
        count = count_res.scalar_one() + 1
        sale_number = f"VNT-{year}-{count:04d}"

        sale_id = sale_in.id or uuid.uuid4()
        
        # Calculate totals & verify stock
        raw_total = 0.0
        sale_items_data = []

        for item_in in sale_in.items:
            art_res = await db.execute(
                select(Article).where(Article.id == item_in.article_id).with_for_update()
            )
            article = art_res.scalars().first()
            if not article:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Article {item_in.article_id} introuvable"
                )
            if not article.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Article '{article.name}' est inactif"
                )
            if float(article.current_stock) < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuffisant pour '{article.name}'. Disponible: {float(article.current_stock):.2f}, Requis: {item_in.quantity:.2f}"
                )

            subtotal = item_in.quantity * item_in.unit_price
            raw_total += subtotal
            purchase_cost_snapshot = float(article.purchase_price)

            sale_items_data.append({
                "article": article,
                "quantity": item_in.quantity,
                "unit_price": item_in.unit_price,
                "purchase_cost_snapshot": purchase_cost_snapshot,
                "subtotal": subtotal
            })

        final_total = max(0.0, raw_total - sale_in.discount_amount)

        sale = Sale(
            id=sale_id,
            sale_number=sale_number,
            customer_id=sale_in.customer_id,
            user_id=user_id,
            sale_date=datetime.now(timezone.utc),
            total_amount=final_total,
            discount_amount=sale_in.discount_amount,
            payment_method=sale_in.payment_method,
            status="COMPLETED",
            idempotency_key=sale_in.idempotency_key
        )
        db.add(sale)

        for item_data in sale_items_data:
            item_row = SaleItem(
                id=uuid.uuid4(),
                sale_id=sale_id,
                article_id=item_data["article"].id,
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                purchase_cost_snapshot=item_data["purchase_cost_snapshot"],
                subtotal=item_data["subtotal"]
            )
            db.add(item_row)

            # Record stock movement (OUT)
            await StockService.record_movement(
                db=db,
                article_id=item_data["article"].id,
                movement_type="SORTIE_VENTE",
                direction="OUT",
                quantity=item_data["quantity"],
                unit_cost_or_price=item_data["unit_price"],
                reference_id=sale_id,
                reference_code=sale_number,
                user_id=user_id,
                notes=f"Vente comptoir {sale_number}"
            )

        await db.commit()
        await db.refresh(sale)
        return sale
