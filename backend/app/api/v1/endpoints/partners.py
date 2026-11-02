import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.partner import Supplier, Customer
from app.models.user import User
from app.schemas.partner import (
    SupplierCreate, SupplierResponse,
    CustomerCreate, CustomerResponse
)

router = APIRouter()

# Suppliers
@router.get("/suppliers", response_model=List[SupplierResponse])
async def list_suppliers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Supplier).order_by(Supplier.name.asc()))
    return [SupplierResponse.model_validate(s) for s in res.scalars().all()]

@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    sup_in: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = Supplier(
        id=uuid.uuid4(),
        name=sup_in.name,
        contact_name=sup_in.contact_name,
        phone=sup_in.phone,
        email=sup_in.email,
        address=sup_in.address
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return SupplierResponse.model_validate(supplier)

# Customers
@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Customer).order_by(Customer.name.asc()))
    return [CustomerResponse.model_validate(c) for c in res.scalars().all()]

@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    cust_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = Customer(
        id=uuid.uuid4(),
        name=cust_in.name,
        phone=cust_in.phone,
        email=cust_in.email,
        address=cust_in.address,
        is_pro=cust_in.is_pro
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return CustomerResponse.model_validate(customer)
