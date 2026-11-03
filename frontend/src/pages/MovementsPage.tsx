import { useState, useEffect } from "react"
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Search,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react"
import { movementApi } from "@/api/movementApi"
import { StockMovement, MovementDirection } from "@/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"

export function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [directionFilter, setDirectionFilter] = useState<string>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState<string>("")

  const loadMovements = async () => {
    setLoading(true)
    try {
      const data = await movementApi.getMovements({ limit: 500 })
      setMovements(data)
    } catch (err) {
      console.error("Error loading stock movements", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [])

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "ENTRY_PURCHASE":
        return "Achat / Réception Fournisseur"
      case "EXIT_SALE":
        return "Sortie / Vente Comptoir"
      case "EXIT_LOSS":
        return "Perte / Casse / Avarie"
      case "EXIT_INTERNAL":
        return "Consommation Interne / Chantier"
      case "INVENTORY_ADJUST":
        return "Ajustement d'Inventaire"
      case "RETURN_CUSTOMER":
        return "Retour Client"
      case "RETURN_SUPPLIER":
        return "Retour Fournisseur"
      default:
        return type
    }
  }

  const filteredMovements = movements.filter((m) => {
    const matchesDirection =
      directionFilter === "ALL" || m.direction === directionFilter
    const matchesType = typeFilter === "ALL" || m.movement_type === typeFilter
    const search = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !search ||
      (m.article?.name && m.article.name.toLowerCase().includes(search)) ||
      (m.article?.code && m.article.code.toLowerCase().includes(search)) ||
      (m.reference && m.reference.toLowerCase().includes(search))
    return matchesDirection && matchesType && matchesSearch
  })

  const countIn = movements.filter((m) => m.direction === "IN").length
  const countOut = movements.filter((m) => m.direction === "OUT").length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Journal d'Audit des Mouvements de Stock
          </h1>
          <p className="text-sm text-slate-500">
            Livre d'audit immuable : chaque incrément ou décrément de stock est tracé avec ses quantités avant/après
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={loadMovements} title="Actualiser">
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Counters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Flux Enregistrés</p>
            <p className="text-2xl font-bold text-slate-900">{movements.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <History className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Mouvements Entrants (IN)</p>
            <p className="text-2xl font-bold text-emerald-600">{countIn}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Mouvements Sortants (OUT)</p>
            <p className="text-2xl font-bold text-red-600">{countOut}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par référence, désignation d'article ou n° pièce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-full md:w-44">
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">Tous les flux</option>
              <option value="IN">Entrées uniquement (IN)</option>
              <option value="OUT">Sorties uniquement (OUT)</option>
            </select>
          </div>

          <div className="w-full md:w-56">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">Tous les motifs</option>
              <option value="ENTRY_PURCHASE">Achat / Réception</option>
              <option value="EXIT_SALE">Vente Caisse</option>
              <option value="EXIT_LOSS">Perte / Casse</option>
              <option value="EXIT_INTERNAL">Consommation interne</option>
              <option value="INVENTORY_ADJUST">Ajustement inventaire</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date & Heure</th>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3 text-center">Direction</th>
                <th className="px-4 py-3">Motif du Flux</th>
                <th className="px-4 py-3 text-center">Quantité</th>
                <th className="px-4 py-3 text-center">Évolution Stock</th>
                <th className="px-4 py-3">N° Pièce / Réf.</th>
                <th className="px-4 py-3">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Chargement du journal d'audit...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Aucun mouvement ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isEntry = mov.direction === "IN"

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(mov.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {mov.article?.name || "Article"}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {mov.article?.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={isEntry ? "success" : "destructive"}>
                          {isEntry ? "+ ENTRÉE" : "- SORTIE"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">
                        {getMovementTypeLabel(mov.movement_type)}
                      </td>
                      <td className="px-4 py-3 text-center font-extrabold text-sm">
                        <span className={isEntry ? "text-emerald-600" : "text-red-600"}>
                          {isEntry ? "+" : "-"}
                          {mov.quantity} {mov.article?.unit || ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
                        <span className="text-slate-400">{mov.quantity_before}</span>
                        <span className="mx-1.5 text-slate-300">➔</span>
                        <span className="font-bold text-slate-900">{mov.quantity_after}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {mov.reference || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {mov.user?.full_name || "Système"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
