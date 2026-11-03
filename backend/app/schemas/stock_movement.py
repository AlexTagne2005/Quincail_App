import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class StockMovementCreate(BaseModel):
    article_id: uuid.UUID
    movement_type: str  # SORTIE_PERTE, SORTIE_AJUSTEMENT, SORTIE_INTERNE, ENTREE_AJUSTEMENT
    quantity: float = Field(gt=0)
    notes: Optional[str] = None

class StockMovementResponse(BaseModel):
    id: uuid.UUID
    article_id: uuid.UUID
    article_name: Optional[str] = None
    article_code: Optional[str] = None
    movement_type: str
    direction: str
    quantity: float
    quantity_before: float
    quantity_after: float
    unit_cost_or_price: Optional[float] = None
    reference_id: Optional[uuid.UUID] = None
    reference_code: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    user_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
