import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Article(Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # SKU
    barcode: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    unit: Mapped[str] = mapped_column(String(30), default="Pièce", nullable=False)  # Pièce, Mètre, Kg, Litre, Boîte, Paquet
    purchase_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)  # Coût d'achat unitaire
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)   # Prix de vente au comptoir
    wholesale_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)         # Prix de gros/artisan
    
    current_stock: Mapped[float] = mapped_column(Numeric(12, 3), default=0.000, nullable=False) # Quantité actuelle
    min_stock_alert: Mapped[float] = mapped_column(Numeric(12, 3), default=5.000, nullable=False) # Seuil d'alerte
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Rayon, Étagère, Casier
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="articles")
    stock_movements = relationship("StockMovement", back_populates="article")
    entry_items = relationship("StockEntryItem", back_populates="article")
    sale_items = relationship("SaleItem", back_populates="article")

    __table_args__ = (
        Index("idx_article_stock_alert", "current_stock", "min_stock_alert"),
    )
