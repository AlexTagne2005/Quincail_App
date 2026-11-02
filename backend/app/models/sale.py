import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # ex: VNT-2026-0001
    customer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    sale_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.00, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), default="ESPECES", nullable=False)  # ESPECES, CARTE, MOBILE_MONEY, CREDIT, VIREMENT
    status: Mapped[str] = mapped_column(String(20), default="COMPLETED", nullable=False)        # COMPLETED, CANCELLED
    
    # Offline-ready idempotency
    idempotency_key: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="sales")
    user = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    purchase_cost_snapshot: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)  # Coût d'achat au moment de la vente pour calcul exact marge
    subtotal: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    # Relationships
    sale = relationship("Sale", back_populates="items")
    article = relationship("Article", back_populates="sale_items")
