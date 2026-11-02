import asyncio
import uuid
from datetime import datetime, timezone, timedelta
import random
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.article import Article
from app.models.partner import Supplier, Customer
from app.models.stock_entry import StockEntry, StockEntryItem
from app.models.sale import Sale, SaleItem
from app.models.stock_movement import StockMovement

async def seed_data():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        check_user = await db.execute(select(User).where(User.email == "admin@quincail.com"))
        if check_user.scalars().first():
            print("Base déjà initialisée. Ignorer le seed.")
            return

        print("=== Initialisation des données de la Quincaillerie ===")

        # 1. Users
        admin = User(
            id=uuid.uuid4(),
            email="admin@quincail.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Jean Admin",
            role="ADMIN",
            is_active=True
        )
        stock_mgr = User(
            id=uuid.uuid4(),
            email="stock@quincail.com",
            hashed_password=get_password_hash("stock123"),
            full_name="Moussa Gestionnaire",
            role="GESTIONNAIRE_STOCK",
            is_active=True
        )
        cashier = User(
            id=uuid.uuid4(),
            email="caisse@quincail.com",
            hashed_password=get_password_hash("caisse123"),
            full_name="Fatou Caissière",
            role="CAISSIER",
            is_active=True
        )
        db.add_all([admin, stock_mgr, cashier])
        await db.flush()

        # 2. Categories
        cat_visserie = Category(id=uuid.uuid4(), name="Visserie & Boulonnerie", description="Vis à bois, écrous, rondelles, chevilles, boulons zingués")
        cat_plomb = Category(id=uuid.uuid4(), name="Plomberie & Sanitaire", description="Tuyaux PVC, raccords laiton, robinetterie, colles et joints")
        cat_elec = Category(id=uuid.uuid4(), name="Électricité", description="Câbles 1.5/2.5mm², disjoncteurs, prises, interrupteurs, gaines ICTA")
        cat_outils = Category(id=uuid.uuid4(), name="Outillage & Protection", description="Marteaux, scies, meuleuses, tournevis, gants de chantier")
        cat_peinture = Category(id=uuid.uuid4(), name="Peinture & Droguerie", description="Peinture acrylique, solvants, pinceaux, rouleaux, enduit")
        cat_gros_oeuvre = Category(id=uuid.uuid4(), name="Gros Œuvre & Maçonnerie", description="Ciment, fer à béton, pelles, truelles, brouettes")
        
        categories = [cat_visserie, cat_plomb, cat_elec, cat_outils, cat_peinture, cat_gros_oeuvre]
        db.add_all(categories)
        await db.flush()

        # 3. Suppliers
        sup1 = Supplier(id=uuid.uuid4(), name="Quincail Import Cameroun SARL", contact_name="Alain Dupont", phone="+237 699 00 11 22", email="contact@quincail-import.cm", address="Zone Industrielle Bassa, Douala")
        sup2 = Supplier(id=uuid.uuid4(), name="Comptoir Métallurgique de l'Afrique", contact_name="Paul Mballa", phone="+237 677 33 44 55", email="sales@cma-afrique.com", address="Akwa, Douala")
        sup3 = Supplier(id=uuid.uuid4(), name="Câbleries & Plastiques du Golfe", contact_name="Eric Ndong", phone="+237 690 55 66 77", email="contact@cpg-plast.com", address="Ndokoti, Douala")
        suppliers = [sup1, sup2, sup3]
        db.add_all(suppliers)

        # 4. Customers
        cust_comptoir = Customer(id=uuid.uuid4(), name="Client Comptoir (Passager)", phone="Inconnu", is_pro=False)
        cust_btp = Customer(id=uuid.uuid4(), name="BTP Construction Moderne", phone="+237 699 88 77 66", email="btp-moderne@gmail.com", is_pro=True, address="Bonapriso, Douala")
        cust_artisan = Customer(id=uuid.uuid4(), name="Atelier Plomberie Tagne & Fils", phone="+237 670 12 34 56", is_pro=True, address="Deido, Douala")
        customers = [cust_comptoir, cust_btp, cust_artisan]
        db.add_all(customers)
        await db.flush()

        # 5. Articles
        articles_data = [
            # Visserie
            ("VIS-001", "370001001", "Vis à bois tête fraisée 4x40 (Boîte de 500)", cat_visserie.id, "Boîte", 2500, 4000, 3600, 35, 10, "Rayon A - Casier 01"),
            ("VIS-002", "370001002", "Cheville nylon universelle 8mm (Boîte de 100)", cat_visserie.id, "Boîte", 1500, 2500, 2200, 4, 8, "Rayon A - Casier 02"),  # En alerte
            ("VIS-003", "370001003", "Boulon acier zingué M8x60 avec écrou (x50)", cat_visserie.id, "Paquet", 3000, 5000, 4500, 15, 5, "Rayon A - Casier 05"),
            # Plomberie
            ("PLB-001", "370002001", "Tuyau PVC pression Diamètre 32mm (Longueur 4m)", cat_plomb.id, "Pièce", 2200, 3500, 3100, 45, 12, "Zone Extérieure Tubage"),
            ("PLB-002", "370002002", "Coude PVC 90° Diamètre 32mm", cat_plomb.id, "Pièce", 300, 600, 500, 120, 25, "Rayon B - Bac 03"),
            ("PLB-003", "370002003", "Robinet d'arrêt quart de tour 15/21 Laiton", cat_plomb.id, "Pièce", 1800, 3000, 2700, 2, 6, "Rayon B - Vitrine"),   # En alerte critique
            ("PLB-004", "370002004", "Colle PVC Haute Pression Pot 250ml", cat_plomb.id, "Pièce", 1200, 2200, 1900, 18, 5, "Rayon B - Étagère 1"),
            # Électricité
            ("ELC-001", "370003001", "Câble cuivre rigide H07VU 2.5mm² Rouge (Rouleau 100m)", cat_elec.id, "Rouleau", 18000, 26000, 24000, 8, 3, "Rayon C - Allée centrale"),
            ("ELC-002", "370003002", "Câble cuivre rigide H07VU 1.5mm² Bleu (Rouleau 100m)", cat_elec.id, "Rouleau", 12000, 18500, 17000, 12, 3, "Rayon C - Allée centrale"),
            ("ELC-003", "370003003", "Disjoncteur divisionnaire 16A Schneider", cat_elec.id, "Pièce", 3500, 5500, 5000, 1, 5, "Rayon C - Tableau"),  # En alerte critique
            ("ELC-004", "370003004", "Prise 2P+T étanche IP55 Saillie", cat_elec.id, "Pièce", 1600, 2800, 2500, 22, 6, "Rayon C - Bac 14"),
            # Outillage
            ("OUT-001", "370004001", "Marteau de coffreur manche fibre 800g", cat_outils.id, "Pièce", 4500, 7500, 6800, 14, 4, "Rayon D - Panneau outils"),
            ("OUT-002", "370004002", "Meuleuse d'angle 125mm 850W Bosch", cat_outils.id, "Pièce", 28000, 42000, 39000, 5, 2, "Rayon D - Vitrine outillage"),
            ("OUT-003", "370004003", "Mètre ruban professionnel 5m magnétique", cat_outils.id, "Pièce", 1500, 2800, 2400, 30, 8, "Rayon D - Étagère centrale"),
            # Peinture
            ("PNT-001", "370005001", "Peinture acrylique blanche satinée Pot 15L", cat_peinture.id, "Pot", 22000, 34000, 31000, 10, 4, "Rayon E - Palette 1"),
            ("PNT-002", "370005002", "Rouleau anti-goutte 180mm monture complète", cat_peinture.id, "Pièce", 2000, 3500, 3000, 25, 5, "Rayon E - Crochet 3"),
            # Gros Œuvre
            ("GRO-001", "370006001", "Sac de ciment CPJ 35 (50 kg)", cat_gros_oeuvre.id, "Sac", 4200, 5300, 5000, 85, 20, "Dépôt Extérieur Ciment"),
            ("GRO-002", "370006002", "Barre de fer à béton HA Diamètre 10mm (12m)", cat_gros_oeuvre.id, "Barre", 3200, 4400, 4100, 50, 15, "Dépôt Parc à Fer")
        ]

        created_articles = []
        for code, barcode, name, cat_id, unit, p_price, s_price, w_price, stock, min_alert, loc in articles_data:
            art = Article(
                id=uuid.uuid4(),
                code=code,
                barcode=barcode,
                name=name,
                category_id=cat_id,
                unit=unit,
                purchase_price=p_price,
                selling_price=s_price,
                wholesale_price=w_price,
                current_stock=stock,
                min_stock_alert=min_alert,
                location=loc,
                is_active=True
            )
            db.add(art)
            created_articles.append(art)

            # Record initial inventory stock movement
            mvt = StockMovement(
                id=uuid.uuid4(),
                article_id=art.id,
                movement_type="ENTREE_INVENTAIRE",
                direction="IN",
                quantity=stock,
                quantity_before=0.0,
                quantity_after=stock,
                unit_cost_or_price=p_price,
                user_id=admin.id,
                notes="Inventaire initial de démarrage",
                created_at=datetime.now(timezone.utc) - timedelta(days=20)
            )
            db.add(mvt)

        await db.flush()

        # 6. Simulate a Supplier Stock Entry (Réception de réapprovisionnement il y a 7 jours)
        entry_date = datetime.now(timezone.utc) - timedelta(days=7)
        stock_entry = StockEntry(
            id=uuid.uuid4(),
            entry_number="ENT-2026-0001",
            supplier_id=sup1.id,
            user_id=stock_mgr.id,
            reference_invoice="FAC-SUP-9842",
            entry_date=entry_date,
            total_cost=250000.0,
            notes="Livraison groupée visserie et colle PVC",
            created_at=entry_date
        )
        db.add(stock_entry)
        await db.flush()

        # 7. Simulate Sales across the last 14 days
        now = datetime.now(timezone.utc)
        sale_idx = 1
        for day_offset in range(13, -1, -1):
            date_for_day = now - timedelta(days=day_offset, hours=random.randint(1, 6))
            num_sales_today = random.randint(2, 5)

            for _ in range(num_sales_today):
                sale_number = f"VNT-2026-{sale_idx:04d}"
                sale_idx += 1

                # Pick 1 to 3 random articles
                sampled_articles = random.sample(created_articles, random.randint(1, 3))
                sale_id = uuid.uuid4()
                total_sale = 0.0
                sale_items = []

                for art in sampled_articles:
                    qty = random.randint(1, 4)
                    subtotal = qty * float(art.selling_price)
                    total_sale += subtotal

                    item = SaleItem(
                        id=uuid.uuid4(),
                        sale_id=sale_id,
                        article_id=art.id,
                        quantity=qty,
                        unit_price=float(art.selling_price),
                        purchase_cost_snapshot=float(art.purchase_price),
                        subtotal=subtotal
                    )
                    sale_items.append(item)

                    # Movement
                    mvt = StockMovement(
                        id=uuid.uuid4(),
                        article_id=art.id,
                        movement_type="SORTIE_VENTE",
                        direction="OUT",
                        quantity=qty,
                        quantity_before=float(art.current_stock) + qty,
                        quantity_after=float(art.current_stock),
                        unit_cost_or_price=float(art.selling_price),
                        reference_id=sale_id,
                        reference_code=sale_number,
                        user_id=cashier.id,
                        notes=f"Vente comptoir {sale_number}",
                        created_at=date_for_day
                    )
                    db.add(mvt)

                cust = random.choice(customers)
                sale = Sale(
                    id=sale_id,
                    sale_number=sale_number,
                    customer_id=cust.id,
                    user_id=cashier.id,
                    sale_date=date_for_day,
                    total_amount=total_sale,
                    discount_amount=0.0,
                    payment_method=random.choice(["ESPECES", "MOBILE_MONEY", "CARTE"]),
                    status="COMPLETED",
                    created_at=date_for_day
                )
                db.add(sale)
                db.add_all(sale_items)

        await db.commit()
        print("[OK] Données de la quincaillerie injectées avec succès !")
        print("Identifiants de connexion par défaut :")
        print("  - Admin : admin@quincail.com / admin123")
        print("  - Gestionnaire : stock@quincail.com / stock123")
        print("  - Caissier : caisse@quincail.com / caisse123")

if __name__ == "__main__":
    asyncio.run(seed_data())
