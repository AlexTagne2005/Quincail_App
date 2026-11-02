import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class StockEntry(Base):
    __tablename__ = "stock_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # ex: ENT-2026-0001
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    reference_invoice: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Facture ou Bon de livraison
    entry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    total_cost: Mapped[float] = mapped_column(Numeric(14, 2), default=0.00, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Offline-ready idempotency
    idempotency_key: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="stock_entries")
    user = relationship("User", back_populates="stock_entries")
    items = relationship("StockEntryItem", back_populates="stock_entry", cascade="all, delete-orphan")

class StockEntryItem(Base):
    __tablename__ = "stock_entry_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stock_entry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stock_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    # Relationships
    stock_entry = relationship("StockEntry", back_populates="items")
    article = relationship("Article", back_populates="entry_items")
