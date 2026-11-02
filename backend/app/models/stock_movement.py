import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    # Types: ENTREE_ACHAT, ENTREE_RETOUR, ENTREE_AJUSTEMENT, SORTIE_VENTE, SORTIE_PERTE, SORTIE_AJUSTEMENT, SORTIE_INTERNE
    movement_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)  # 'IN' or 'OUT'
    
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    quantity_before: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    quantity_after: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    
    unit_cost_or_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    
    # Traceability
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)  # sale_id, entry_id, etc.
    reference_code: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True) # VNT-2026-0001, ENT-2026-0001
    
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)

    # Relationships
    article = relationship("Article", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")

    __table_args__ = (
        Index("idx_movement_article_date", "article_id", "created_at"),
        Index("idx_movement_type_date", "movement_type", "created_at"),
    )
