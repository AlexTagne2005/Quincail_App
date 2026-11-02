import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ArticleBase(BaseModel):
    code: str
    barcode: Optional[str] = None
    name: str
    category_id: uuid.UUID
    unit: str = "Pièce"
    purchase_price: float = Field(ge=0, default=0.0)
    selling_price: float = Field(ge=0, default=0.0)
    wholesale_price: Optional[float] = Field(ge=0, default=None)
    min_stock_alert: float = Field(ge=0, default=5.0)
    location: Optional[str] = None
    is_active: bool = True

class ArticleCreate(ArticleBase):
    initial_stock: float = Field(ge=0, default=0.0)

class ArticleUpdate(BaseModel):
    code: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    unit: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    min_stock_alert: Optional[float] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class ArticleResponse(ArticleBase):
    id: uuid.UUID
    current_stock: float
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
