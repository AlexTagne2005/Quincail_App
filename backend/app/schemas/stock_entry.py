import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class StockEntryItemCreate(BaseModel):
    article_id: uuid.UUID
    quantity: float = Field(gt=0)
    unit_cost: float = Field(ge=0)

class StockEntryItemResponse(BaseModel):
    id: uuid.UUID
    article_id: uuid.UUID
    article_name: Optional[str] = None
    article_code: Optional[str] = None
    quantity: float
    unit_cost: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)

class StockEntryCreate(BaseModel):
    id: Optional[uuid.UUID] = None  # Offline-first: client can provide UUID
    supplier_id: Optional[uuid.UUID] = None
    reference_invoice: Optional[str] = None
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    items: List[StockEntryItemCreate] = Field(min_length=1)

class StockEntryResponse(BaseModel):
    id: uuid.UUID
    entry_number: str
    supplier_id: Optional[uuid.UUID] = None
    supplier_name: Optional[str] = None
    user_id: uuid.UUID
    user_name: Optional[str] = None
    reference_invoice: Optional[str] = None
    entry_date: datetime
    total_cost: float
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime
    items: List[StockEntryItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
