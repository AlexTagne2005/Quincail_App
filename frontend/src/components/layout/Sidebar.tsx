import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ArrowDownToLine,
  History,
  LogOut,
  Wrench,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { Badge } from "@/components/ui/badge"

const navItems = [
  {
    path: "/",
    label: "Tableau de Bord",
    icon: LayoutDashboard,
    roles: ["admin", "stock", "caisse"],
  },
  {
    path: "/pos",
    label: "Caisse & Vente",
    icon: ShoppingCart,
    roles: ["admin", "caisse"],
  },
  {
    path: "/articles",
    label: "Articles & Stock",
    icon: Package,
    roles: ["admin", "stock", "caisse"],
  },
  {
    path: "/entries",
    label: "Réceptions Fournisseurs",
    icon: ArrowDownToLine,
    roles: ["admin", "stock"],
  },
  {
    path: "/movements",
    label: "Audit des Mouvements",
    icon: History,
    roles: ["admin", "stock"],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const userRole = user?.role || "caisse"

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "stock":
        return "warning"
      default:
        return "secondary"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur"
      case "stock":
        return "Responsable Stock"
      default:
        return "Caissier"
    }
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight">Quincail App</h1>
          <p className="text-xs text-slate-400">Gestion & Ventes Comptoir</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Navigation Principale
        </div>
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-semibold text-sm">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.full_name || "Utilisateur"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={getRoleBadgeVariant(userRole)} className="text-[10px] px-1.5 py-0 h-4">
                {getRoleLabel(userRole)}
              </Badge>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-slate-800 hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
