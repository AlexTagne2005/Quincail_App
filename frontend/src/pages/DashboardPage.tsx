import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  Boxes,
  PlusCircle,
  RefreshCw,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { dashboardApi } from "@/api/dashboardApi"
import { DashboardOverview } from "@/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"]

export function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const overview = await dashboardApi.getOverview()
      setData(overview)
    } catch (err: any) {
      setError(err.message || "Erreur de chargement des statistiques")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Chargement des données du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-700">{error || "Impossible de charger les données"}</p>
        <Button onClick={fetchDashboard} variant="outline" className="mt-3">
          <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
        </Button>
      </div>
    )
  }

  const { kpis, sales_margin_chart, top_articles, category_distribution, low_stock_alerts } = data

  return (
    <div className="space-y-6">
      {/* Quick Action Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Performance & Indicateurs
          </h1>
          <p className="text-sm text-slate-500">
            Données synchronisées en temps réel avec le stock central
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pos">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="h-4 w-4 mr-2" /> Caisse Comptoir
            </Button>
          </Link>
          <Link to="/entries">
            <Button variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" /> Réception Fournisseur
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={fetchDashboard} title="Actualiser">
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventes Aujourd'hui */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Ventes Aujourd'hui
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(kpis.today_sales)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-blue-600">{kpis.today_sales_count}</span> tickets encaissés ce jour
            </p>
          </CardContent>
        </Card>

        {/* Chiffre d'Affaires du Mois */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              CA du Mois en Cours
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(kpis.month_sales)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">{kpis.month_sales_count}</span> ventes sur le mois
            </p>
          </CardContent>
        </Card>

        {/* Marge Brute */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Marge Brute Réalisée
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(kpis.month_margin)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="success" className="text-xs font-semibold">
                {kpis.margin_percentage.toFixed(1)}% de marge
              </Badge>
              <span className="text-[11px] text-slate-500">sur prix de vente</span>
            </div>
          </CardContent>
        </Card>

        {/* Valeur du Stock & Alertes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Valeur du Stock (Achat)
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(kpis.stock_value_purchase)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {kpis.low_stock_count > 0 || kpis.out_of_stock_count > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {kpis.low_stock_count + kpis.out_of_stock_count} alertes
                </Badge>
              ) : (
                <Badge variant="success" className="text-xs">
                  Stock optimal
                </Badge>
              )}
              <span className="text-[11px] text-slate-500">
                Vente est. {formatCurrency(kpis.stock_value_sale)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Sales & Margin Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>Évolution des Ventes & Marge Brute (14 derniers jours)</span>
            <span className="text-xs font-normal text-slate-500">Données journalières agrégées</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_margin_chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Chiffre d'Affaires"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="margin"
                  name="Marge Brute"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMargin)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Top Articles & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 8 Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Top Articles les Plus Vendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top_articles.length === 0 ? (
              <p className="text-sm text-slate-400 py-12 text-center">Aucune vente enregistrée pour le moment</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={top_articles}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      width={100}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === "quantity_sold" ? `${val} unités` : formatCurrency(val),
                        name === "quantity_sold" ? "Quantité vendue" : "Revenu généré",
                      ]}
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px" }}
                    />
                    <Bar dataKey="quantity_sold" name="Quantité vendue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Value by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Répartition de la Valeur du Stock par Catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {category_distribution.length === 0 ? (
              <p className="text-sm text-slate-400 py-12 text-center">Aucune donnée de catégorie</p>
            ) : (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={category_distribution}
                      dataKey="stock_value"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {category_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), "Valeur du stock"]}
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Critical Low Stock Alerts Table */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50/50 border-b border-amber-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle className="text-base font-bold text-amber-900">
                Alertes de Stock Critique ({low_stock_alerts.length})
              </CardTitle>
              <p className="text-xs text-amber-700">
                Articles ayant atteint ou franchi le seuil d'approvisionnement d'urgence
              </p>
            </div>
          </div>
          <Link to="/entries">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              <PlusCircle className="h-4 w-4 mr-1.5" /> Réapprovisionner
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {low_stock_alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              ✅ Aucun article en stock critique. Tous les stocks sont au-dessus des seuils d'alerte.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Désignation</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3 text-center">Stock Actuel</th>
                    <th className="px-4 py-3 text-center">Seuil Min</th>
                    <th className="px-4 py-3 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {low_stock_alerts.map((item) => {
                    const isOutOfStock = item.stock_current <= 0
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                          {item.code}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {item.category_name}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          <span className={isOutOfStock ? "text-red-600" : "text-amber-600"}>
                            {item.stock_current} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">
                          {item.stock_min} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={isOutOfStock ? "destructive" : "warning"}>
                            {isOutOfStock ? "Rupture totale" : "Stock Faible"}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
