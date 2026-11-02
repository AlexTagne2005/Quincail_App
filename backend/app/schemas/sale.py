import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class SaleItemCreate(BaseModel):
    article_id: uuid.UUID
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)

class SaleItemResponse(BaseModel):
    id: uuid.UUID
    article_id: uuid.UUID
    article_name: Optional[str] = None
    article_code: Optional[str] = None
    quantity: float
    unit_price: float
    purchase_cost_snapshot: float
    subtotal: float

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    id: Optional[uuid.UUID] = None  # Offline-first: client can provide UUID
    customer_id: Optional[uuid.UUID] = None
    discount_amount: float = Field(ge=0, default=0.0)
    payment_method: str = "ESPECES"  # ESPECES, CARTE, MOBILE_MONEY, CREDIT, VIREMENT
    idempotency_key: Optional[str] = None
    items: List[SaleItemCreate] = Field(min_length=1)

class SaleResponse(BaseModel):
    id: uuid.UUID
    sale_number: str
    customer_id: Optional[uuid.UUID] = None
    customer_name: Optional[str] = None
    user_id: uuid.UUID
    user_name: Optional[str] = None
    sale_date: datetime
    total_amount: float
    discount_amount: float
    payment_method: str
    status: str
    idempotency_key: Optional[str] = None
    created_at: datetime
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True
