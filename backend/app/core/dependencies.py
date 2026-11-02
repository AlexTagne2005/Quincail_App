import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    
    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise credentials_exception
    
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
        
    return user

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

async def get_current_stock_manager_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in ["ADMIN", "GESTIONNAIRE_STOCK"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Stock manager or Admin privileges required"
        )
    return current_user
