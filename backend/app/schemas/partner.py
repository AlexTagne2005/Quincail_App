import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_pro: bool = False

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_pro: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
