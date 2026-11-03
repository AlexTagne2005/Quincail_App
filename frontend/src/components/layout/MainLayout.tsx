import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

const pageHeaders: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Tableau de Bord Quincaillerie",
    subtitle: "Aperçu des performances financières, état du stock et indicateurs clés",
  },
  "/pos": {
    title: "Point de Vente / Caisse Comptoir",
    subtitle: "Enregistrement rapide des sorties et encaissements",
  },
  "/articles": {
    title: "Catalogue des Articles & Stock",
    subtitle: "Gestion des références, prix d'achat/vente et seuils d'alerte",
  },
  "/entries": {
    title: "Entrées de Stock & Réceptions",
    subtitle: "Enregistrement des bons de livraison et réapprovisionnements fournisseurs",
  },
  "/movements": {
    title: "Journal d'Audit des Mouvements",
    subtitle: "Traçabilité intégrale et immuable des flux de stock (Entrées & Sorties)",
  },
}

export function MainLayout() {
  const location = useLocation()
  const header = pageHeaders[location.pathname] || {
    title: "Gestion Quincaillerie",
    subtitle: "Plateforme de gestion commerciale et stocks",
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Navbar title={header.title} subtitle={header.subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
