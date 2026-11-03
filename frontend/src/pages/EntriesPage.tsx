import { useState, useEffect } from "react"
import {
  ArrowDownToLine,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
} from "lucide-react"
import { entryApi } from "@/api/entryApi"
import { articleApi } from "@/api/articleApi"
import { partnerApi } from "@/api/partnerApi"
import { Article, StockEntry, Supplier, StockEntryItemCreate } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, formatDate, formatErrorMessage } from "@/lib/utils"

export function EntriesPage() {
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  // View Details Modal
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null)

  // New Reception Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [referenceInvoice, setReferenceInvoice] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [lines, setLines] = useState<StockEntryItemCreate[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [entriesData, articlesData, suppliersData] = await Promise.all([
        entryApi.getEntries(),
        articleApi.getArticles(),
        partnerApi.getSuppliers(),
      ])
      setEntries(entriesData)
      setArticles(articlesData)
      setSuppliers(suppliersData)
    } catch (err: unknown) {
      console.error("Error loading entries data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenNewEntry = () => {
    setSelectedSupplierId(suppliers[0]?.id || "")
    setReferenceInvoice(`BL-${Math.floor(10000 + Math.random() * 90000)}`)
    setNotes("")
    if (articles.length > 0) {
      setLines([
        {
          article_id: articles[0].id,
          quantity: 10,
          unit_cost: articles[0].purchase_price,
        },
      ])
    } else {
      setLines([])
    }
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleAddLine = () => {
    if (articles.length === 0) return
    const firstArt = articles[0]
    setLines([
      ...lines,
      {
        article_id: firstArt.id,
        quantity: 5,
        unit_cost: firstArt.purchase_price,
      },
    ])
  }

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const handleLineChange = (
    index: number,
    field: keyof StockEntryItemCreate,
    value: any
  ) => {
    const updated = [...lines]
    if (field === "article_id") {
      const art = articles.find((a) => a.id === value)
      updated[index] = {
        ...updated[index],
        article_id: value,
        unit_cost: art ? art.purchase_price : updated[index].unit_cost,
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
    }
    setLines(updated)
  }

  const totalReceptionAmount = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0),
    0
  )

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lines.length === 0) {
      setFormError("Veuillez ajouter au moins une ligne d'article.")
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      await entryApi.createEntry({
        supplier_id: selectedSupplierId || undefined,
        reference_invoice: referenceInvoice || undefined,
        notes: notes || undefined,
        items: lines.map((l) => ({
          article_id: l.article_id,
          quantity: Number(l.quantity),
          unit_cost: Number(l.unit_cost),
        })),
      })
      setIsModalOpen(false)
      loadData()
    } catch (err: unknown) {
      setFormError(
        formatErrorMessage(err, "Erreur lors de l'enregistrement de la réception")
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Réceptions Fournisseurs & Entrées de Stock
          </h1>
          <p className="text-sm text-slate-500">
            Enregistrement des bons de livraison, incrément du stock et traçabilité des coûts d'achat
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleOpenNewEntry} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Nouvelle Réception
          </Button>
          <Button variant="ghost" size="icon" onClick={loadData} title="Actualiser">
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* History Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3">
          <CardTitle className="text-sm font-semibold text-slate-700">
            Historique des Réceptions Enregistrées ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">N° Réception</th>
                  <th className="px-4 py-3">Date & Heure</th>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3">Réf. Document / BL</th>
                  <th className="px-4 py-3 text-center">Nombre d'Articles</th>
                  <th className="px-4 py-3 text-right">Montant Total</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Chargement des réceptions...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Aucune réception enregistrée. Cliquez sur "Nouvelle Réception" pour approvisionner le stock.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">
                        {entry.entry_number}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {formatDate(entry.entry_date || entry.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {entry.supplier_name || "Fournisseur non spécifié"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {entry.reference_invoice || "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        <span className="font-semibold text-slate-700">
                          {entry.items?.length || 0} lignes
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(entry.total_cost)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="success">Réceptionné</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(entry)}
                          className="h-8 w-8 p-0"
                          title="Consulter les articles"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Reception Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-blue-600" />
            Enregistrer une Entrée de Stock (Réception Fournisseur)
          </DialogTitle>
          <DialogDescription>
            Cette opération incrémente le stock des articles sélectionnés et met à jour leurs prix d'achat.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmitEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Fournisseur
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="">Sélectionner un fournisseur...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                N° Bon de Livraison / Facture Fournisseur *
              </label>
              <Input
                required
                value={referenceInvoice}
                onChange={(e) => setReferenceInvoice(e.target.value)}
                placeholder="ex: BL-84920"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Notes / Remarques de livraison
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Livraison par camionnette, état conforme"
            />
          </div>

          {/* Dynamic Lines Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Articles à réceptionner ({lines.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="text-xs h-7 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
              {lines.map((line, idx) => {
                const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0)

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white p-2.5 rounded-md border border-slate-200"
                  >
                    <div className="flex-1 min-w-0">
                      <select
                        value={line.article_id}
                        onChange={(e) => handleLineChange(idx, "article_id", e.target.value)}
                        className="w-full h-8 text-xs rounded border border-slate-300 bg-white px-2"
                      >
                        {articles.map((a) => {
                          const stock = a.current_stock ?? a.stock_current ?? 0
                          return (
                            <option key={a.id} value={a.id}>
                              [{a.code}] {a.name} (Stock: {stock} {a.unit})
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        required
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(idx, "quantity", Math.max(1, Number(e.target.value) || 1))
                        }
                        placeholder="Qté"
                        className="h-8 text-xs text-center"
                      />
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        required
                        value={line.unit_cost}
                        onChange={(e) =>
                          handleLineChange(
                            idx,
                            "unit_cost",
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        placeholder="P.U Achat"
                        className="h-8 text-xs text-right"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-xs text-slate-800">
                      {formatCurrency(lineTotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-900 uppercase">
                Montant Total Réception:
              </span>
              <span className="text-base font-extrabold text-blue-700">
                {formatCurrency(totalReceptionAmount)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Validation du stock..." : "Valider l'Entrée en Stock"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* View Entry Details Modal */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Détails de la Réception {selectedEntry.entry_number}</span>
              <Badge variant="success">Réceptionné</Badge>
            </DialogTitle>
            <DialogDescription>
              Enregistré le {formatDate(selectedEntry.entry_date || selectedEntry.created_at)} • Réf: {selectedEntry.reference_invoice || "N/A"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <p>
                <strong className="text-slate-700">Fournisseur:</strong>{" "}
                {selectedEntry.supplier_name || "Non spécifié"}
              </p>
              {selectedEntry.notes && (
                <p>
                  <strong className="text-slate-700">Remarques:</strong> {selectedEntry.notes}
                </p>
              )}
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-2">Article</th>
                  <th className="p-2 text-center">Quantité</th>
                  <th className="p-2 text-right">Coût Unitaire</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedEntry.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2 font-medium">{item.article_name || "Article"}</td>
                    <td className="p-2 text-center font-bold">
                      {item.quantity}
                    </td>
                    <td className="p-2 text-right">{formatCurrency(item.unit_cost)}</td>
                    <td className="p-2 text-right font-extrabold text-blue-600">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-extrabold">
              <span>TOTAL RÉCEPTIONNÉ:</span>
              <span className="text-blue-600">{formatCurrency(selectedEntry.total_cost)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSelectedEntry(null)}>Fermer</Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  )
}
