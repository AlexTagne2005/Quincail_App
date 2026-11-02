import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()

@router.get("", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return [UserResponse.model_validate(u) for u in result.scalars().all()]

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    existing = await db.execute(select(User).where(User.email == user_in.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
        
    user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
