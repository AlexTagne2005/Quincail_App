import { useState, useEffect } from "react"
import {
  Package,
  Plus,
  Search,
  Edit2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { articleApi } from "@/api/articleApi"
import { Article, ArticleCreate, Category } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, formatErrorMessage } from "@/lib/utils"

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form Fields
  const [formData, setFormData] = useState<ArticleCreate>({
    category_id: "",
    code: "",
    name: "",
    unit: "Pièce",
    purchase_price: 0,
    selling_price: 0,
    min_stock_alert: 5,
    initial_stock: 0,
    barcode: "",
  })

  const loadArticles = async () => {
    setLoading(true)
    try {
      const [arts, cats] = await Promise.all([
        articleApi.getArticles(),
        articleApi.getCategories(),
      ])
      setArticles(arts)
      setCategories(cats)
      if (cats.length > 0 && !formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: cats[0].id }))
      }
    } catch (err: unknown) {
      console.error("Error loading articles", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  const handleOpenAdd = () => {
    setEditingArticle(null)
    setFormData({
      category_id: categories[0]?.id || "",
      code: `ART-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      unit: "Pièce",
      purchase_price: 1000,
      selling_price: 1500,
      min_stock_alert: 5,
      initial_stock: 10,
      barcode: "",
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article)
    setFormData({
      category_id: article.category_id,
      code: article.code,
      name: article.name,
      unit: article.unit,
      purchase_price: article.purchase_price,
      selling_price: article.selling_price,
      min_stock_alert: article.min_stock_alert ?? 5,
      initial_stock: 0,
      barcode: article.barcode || "",
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      if (editingArticle) {
        await articleApi.updateArticle(editingArticle.id, {
          name: formData.name,
          category_id: formData.category_id,
          unit: formData.unit,
          purchase_price: formData.purchase_price,
          selling_price: formData.selling_price,
          min_stock_alert: formData.min_stock_alert,
          barcode: formData.barcode || undefined,
        })
      } else {
        await articleApi.createArticle({
          ...formData,
          barcode: formData.barcode || undefined,
        })
      }
      setIsModalOpen(false)
      loadArticles()
    } catch (err: unknown) {
      setFormError(formatErrorMessage(err, "Erreur lors de l'enregistrement de l'article"))
    } finally {
      setSubmitting(false)
    }
  }

  // Filtering
  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === "ALL" || art.category_id === selectedCategory
    const search = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !search ||
      art.name.toLowerCase().includes(search) ||
      art.code.toLowerCase().includes(search) ||
      (art.barcode && art.barcode.toLowerCase().includes(search))
    const currentStock = art.current_stock ?? art.stock_current ?? 0
    const minStock = art.min_stock_alert ?? art.stock_min ?? 0
    const matchesLowStock = !lowStockOnly || currentStock <= minStock
    return matchesCategory && matchesSearch && matchesLowStock
  })

  // Counters
  const totalArticles = articles.length
  const lowStockCount = articles.filter((a) => {
    const s = a.current_stock ?? a.stock_current ?? 0
    const m = a.min_stock_alert ?? a.stock_min ?? 0
    return s <= m && s > 0
  }).length
  const outOfStockCount = articles.filter((a) => (a.current_stock ?? a.stock_current ?? 0) <= 0).length

  return (
    <div className="space-y-6">
      {/* Top Counters & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Catalogue & Gestion du Stock
          </h1>
          <p className="text-sm text-slate-500">
            Gestion des articles, seuils de réapprovisionnement et marges
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Nouvel Article
          </Button>
          <Button variant="ghost" size="icon" onClick={loadArticles} title="Actualiser">
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Références</p>
            <p className="text-2xl font-bold text-slate-900">{totalArticles}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Articles en Stock Faible</p>
            <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Ruptures de Stock</p>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
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
              placeholder="Rechercher par référence, désignation ou code-barres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 whitespace-nowrap self-start md:self-center">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Stock critique uniquement</span>
          </label>
        </div>
      </Card>

      {/* Articles Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Désignation</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-center">Stock Actuel</th>
                <th className="px-4 py-3 text-center">Seuil Min</th>
                <th className="px-4 py-3 text-right">Prix Achat</th>
                <th className="px-4 py-3 text-right">Prix Vente</th>
                <th className="px-4 py-3 text-right">Marge Est.</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Chargement du catalogue...
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Aucun article ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => {
                  const currentStock = art.current_stock ?? art.stock_current ?? 0
                  const minStock = art.min_stock_alert ?? art.stock_min ?? 0
                  const isOutOfStock = currentStock <= 0
                  const isLowStock = currentStock <= minStock && !isOutOfStock
                  const marginUnit = art.selling_price - art.purchase_price
                  const marginPercent =
                    art.selling_price > 0 ? (marginUnit / art.selling_price) * 100 : 0

                  return (
                    <tr key={art.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">
                        {art.code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div>{art.name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {art.category_name || "Général"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {currentStock} {art.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {minStock} {art.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-600">
                        {formatCurrency(art.purchase_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {formatCurrency(art.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <span className="font-semibold text-emerald-600">
                          +{formatCurrency(marginUnit)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({marginPercent.toFixed(0)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(art)}
                          className="h-8 w-8 p-0"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4 text-slate-600" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Article Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingArticle ? "Modifier l'Article" : "Ajouter un Nouvel Article"}
          </DialogTitle>
          <DialogDescription>
            Renseignez les détails du produit, son conditionnement et ses prix.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Catégorie *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Code Référence *
              </label>
              <Input
                required
                disabled={!!editingArticle}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ex: VIS-001"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Désignation du Produit *
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex: Vis à bois tête fraisée 4x40 (boîte de 200)"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Unité *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="Pièce">Pièce</option>
                <option value="Paquet">Paquet</option>
                <option value="Boîte">Boîte</option>
                <option value="Sac">Sac</option>
                <option value="Mètre">Mètre</option>
                <option value="Kg">Kg</option>
                <option value="Litre">Litre</option>
                <option value="Rouleau">Rouleau</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Prix d'Achat (XAF) *
              </label>
              <Input
                type="number"
                min="0"
                required
                value={formData.purchase_price}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_price: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Prix de Vente (XAF) *
              </label>
              <Input
                type="number"
                min="0"
                required
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Seuil Min d'Alerte
              </label>
              <Input
                type="number"
                min="0"
                value={formData.min_stock_alert}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock_alert: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                {editingArticle ? "Stock Actuel" : "Stock Initial"}
              </label>
              <Input
                type="number"
                min="0"
                disabled={!!editingArticle}
                value={editingArticle ? (editingArticle.current_stock ?? editingArticle.stock_current ?? 0) : formData.initial_stock}
                onChange={(e) =>
                  setFormData({ ...formData, initial_stock: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Code-barres EAN
              </label>
              <Input
                value={formData.barcode || ""}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Optionnel"
              />
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
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? "Enregistrement..." : editingArticle ? "Mettre à jour" : "Créer l'article"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
