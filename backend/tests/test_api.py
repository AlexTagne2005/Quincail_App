import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_login_and_articles():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login with seeded admin
        login_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@quincail.com", "password": "admin123"}
        )
        assert login_resp.status_code == 200
        token_data = login_resp.json()
        assert "access_token" in token_data
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get current user profile
        me_resp = await ac.get("/api/v1/auth/me", headers=headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "admin@quincail.com"

        # 3. List articles
        art_resp = await ac.get("/api/v1/articles", headers=headers)
        assert art_resp.status_code == 200
        articles = art_resp.json()
        assert len(articles) > 0

        # 4. Dashboard overview
        dash_resp = await ac.get("/api/v1/dashboard/overview", headers=headers)
        assert dash_resp.status_code == 200
        dash_data = dash_resp.json()
        assert "kpis" in dash_data
        assert "recent_sales_chart" in dash_data
        assert "top_selling_articles" in dash_data
        assert dash_data["kpis"]["total_articles_count"] > 0

@pytest.mark.asyncio
async def test_sale_checkout_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as cashier
        login_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "caisse@quincail.com", "password": "caisse123"}
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get first article
        art_resp = await ac.get("/api/v1/articles", headers=headers)
        articles = art_resp.json()
        target_art = articles[0]
        initial_stock = target_art["current_stock"]

        # 3. Create a sale (POS Checkout)
        sale_payload = {
            "payment_method": "ESPECES",
            "discount_amount": 0.0,
            "items": [
                {
                    "article_id": target_art["id"],
                    "quantity": 1.0,
                    "unit_price": target_art["selling_price"]
                }
            ]
        }
        sale_resp = await ac.post("/api/v1/sales", json=sale_payload, headers=headers)
        assert sale_resp.status_code == 201
        sale_data = sale_resp.json()
        assert sale_data["sale_number"].startswith("VNT-")
        assert len(sale_data["items"]) == 1

        # 4. Check that article stock was decremented
        art_after = await ac.get(f"/api/v1/articles/{target_art['id']}", headers=headers)
        assert art_after.status_code == 200
        assert art_after.json()["current_stock"] == initial_stock - 1.0

        # 5. Check stock movement audit log
        mvt_resp = await ac.get(f"/api/v1/movements?article_id={target_art['id']}", headers=headers)
        assert mvt_resp.status_code == 200
        movements = mvt_resp.json()
        assert len(movements) > 0
        latest_mvt = movements[0]
        assert latest_mvt["movement_type"] == "SORTIE_VENTE"
        assert latest_mvt["quantity"] == 1.0
