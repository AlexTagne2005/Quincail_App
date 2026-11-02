from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.stats import DashboardOverview
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    overview = await AnalyticsService.get_dashboard_overview(db)
    return overview
