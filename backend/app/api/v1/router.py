from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    categories,
    articles,
    entries,
    sales,
    movements,
    dashboard,
    partners
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentification"])
api_router.include_router(users.router, prefix="/users", tags=["Utilisateurs"])
api_router.include_router(categories.router, prefix="/categories", tags=["Catégories"])
api_router.include_router(articles.router, prefix="/articles", tags=["Articles & Stock"])
api_router.include_router(entries.router, prefix="/entries", tags=["Entrées de Stock"])
api_router.include_router(sales.router, prefix="/sales", tags=["Ventes & Caisse"])
api_router.include_router(movements.router, prefix="/movements", tags=["Mouvements & Audit"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Tableau de bord & Stats"])
api_router.include_router(partners.router, prefix="/partners", tags=["Fournisseurs & Clients"])
