import { useState, useEffect } from "react"
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  AlertCircle,
  Package,
} from "lucide-react"
import { articleApi } from "@/api/articleApi"
import { saleApi } from "@/api/saleApi"
import { partnerApi } from "@/api/partnerApi"
import { Article, Category, Customer, Sale } from "@/types"
import { useCartStore } from "@/store/useCartStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, formatDate, formatErrorMessage } from "@/lib/utils"

export function PosPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const {
    items,
    customerId,
    paymentMethod,
    globalDiscount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomerId,
    setPaymentMethod,
    setGlobalDiscount,
    getSubtotal,
    getTotal,
  } = useCartStore()

  const loadData = async () => {
    setLoading(true)
    try {
      const [arts, cats, custs] = await Promise.all([
        articleApi.getArticles(),
        articleApi.getCategories(),
        partnerApi.getCustomers(),
      ])
      setArticles(arts)
      setCategories(cats)
      setCustomers(custs)
    } catch (err) {
      console.error("Failed to load POS data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter products by category and search
  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === "ALL" || article.category_id === selectedCategory
    const search = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !search ||
      article.name.toLowerCase().includes(search) ||
      article.code.toLowerCase().includes(search) ||
      (article.barcode && article.barcode.toLowerCase().includes(search))
    return matchesCategory && matchesSearch
  })

  // Handle Checkout submission
  const handleCheckout = async () => {
    if (items.length === 0) return
    setSubmitting(true)
    setCheckoutError(null)

    try {
      const salePayload = {
        customer_id: customerId || undefined,
        payment_method: paymentMethod,
        discount_amount: globalDiscount,
        items: items.map((item) => ({
          article_id: item.article.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }

      const created = await saleApi.createSale(salePayload)
      setCompletedSale(created)
      setShowReceiptModal(true)
      clearCart()
      // Refresh articles stock
      loadData()
    } catch (err: unknown) {
      setCheckoutError(
        formatErrorMessage(err, "Échec de l'encaissement de la vente.")
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)]">
      {/* Left Column: Product Catalog & Fast Search (65%) */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Category Header */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par désignation, référence ou code-barres (scanner)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-300 focus:bg-white"
            />
          </div>

          {/* Category Chips Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tous les rayons ({articles.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-slate-500">Chargement des articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Package className="h-12 w-12 stroke-[1.5] mb-2" />
              <p className="text-sm">Aucun article ne correspond à cette recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredArticles.map((article) => {
                const stock = article.current_stock ?? article.stock_current ?? 0
                const minStock = article.min_stock_alert ?? article.stock_min ?? 0
                const isOutOfStock = stock <= 0
                return (
                  <div
                    key={article.id}
                    onClick={() => !isOutOfStock && addItem(article)}
                    className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isOutOfStock
                        ? "border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed"
                        : "border-slate-200 bg-white hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {article.code}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700"
                              : stock <= minStock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {stock} {article.unit}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug">
                        {article.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-base font-extrabold text-blue-600">
                        {formatCurrency(article.selling_price)}
                      </span>
                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        variant={isOutOfStock ? "outline" : "default"}
                        className="h-7 w-7 p-0 rounded-full"
                        title={isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: POS Cart & Checkout (35%) */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        {/* Ticket Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Panier / Caisse</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {items.reduce((sum, i) => sum + i.quantity, 0)} articles
          </span>
        </div>

        {/* Customer & Payment Method Selector */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div>
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1">
              <User className="h-3.5 w-3.5" /> Client
            </label>
            <select
              value={customerId || ""}
              onChange={(e) => setCustomerId(e.target.value || null)}
              className="w-full h-8 text-xs rounded-lg border border-slate-300 px-2 bg-white"
            >
              <option value="">Client Comptoir (Passager)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Mode d'encaissement
            </label>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => setPaymentMethod("ESPECES")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-semibold border flex flex-col items-center gap-0.5 ${
                  paymentMethod === "ESPECES"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                <span>Espèces</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("MOBILE_MONEY")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-semibold border flex flex-col items-center gap-0.5 ${
                  paymentMethod === "MOBILE_MONEY"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Momo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARTE")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-semibold border flex flex-col items-center gap-0.5 ${
                  paymentMethod === "CARTE"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Carte</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT")}
                className={`py-1.5 px-1 rounded-md text-[11px] font-semibold border flex flex-col items-center gap-0.5 ${
                  paymentMethod === "CREDIT"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Crédit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cart Item Lines */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
              <ShoppingCart className="h-10 w-10 stroke-[1.5] mb-2" />
              <p className="text-xs text-center">Le panier est vide.<br />Cliquez sur un article pour l'ajouter.</p>
            </div>
          ) : (
            items.map((item) => {
              const currentStock = item.article.current_stock ?? item.article.stock_current ?? 0
              return (
                <div
                  key={item.article.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.article.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatCurrency(item.unit_price)} x {item.quantity} {item.article.unit}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                      className="h-6 w-6 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (item.quantity < currentStock) {
                          updateQuantity(item.article.id, item.quantity + 1)
                        }
                      }}
                      disabled={item.quantity >= currentStock}
                      className="h-6 w-6 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-700 disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </p>
                    <button
                      onClick={() => removeItem(item.article.id)}
                      className="text-[10px] text-red-500 hover:text-red-700 transition-colors"
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer & Totals */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          {checkoutError && (
            <div className="p-2 rounded bg-red-100 text-red-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Subtotal & Discount */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total:</span>
              <span className="font-semibold">{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Remise globale:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={globalDiscount || ""}
                  onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-20 text-right h-6 px-1.5 text-xs rounded border border-slate-300 bg-white"
                />
                <span>XAF</span>
              </div>
            </div>
            <div className="flex justify-between text-slate-900 text-base font-extrabold pt-2 border-t border-slate-200">
              <span>TOTAL NET:</span>
              <span className="text-blue-600">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              disabled={items.length === 0 || submitting}
              className="text-slate-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={items.length === 0 || submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              size="lg"
            >
              {submitting ? (
                <span>Encaissement...</span>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-1.5" />
                  <span>Encaisser ({formatCurrency(getTotal())})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sale Receipt Confirmation Modal */}
      {completedSale && (
        <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-6 w-6" /> Vente Encaissée avec Succès
            </DialogTitle>
            <DialogDescription>
              Le stock a été décrémenté et le mouvement tracé dans l'audit ledger.
            </DialogDescription>
          </DialogHeader>

          {/* Printable Ticket Preview */}
          <div id="receipt-print-area" className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-mono space-y-3">
            <div className="text-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm">QUINCAIL EXPRESS</h3>
              <p className="text-[11px] text-slate-500">Matériaux, Outillage & Bricolage</p>
              <p className="text-[11px] text-slate-500">Tél: +237 600 00 00 00</p>
            </div>

            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Facture N°:</span>
                <span className="font-bold text-slate-900">{completedSale.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(completedSale.sale_date || completedSale.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mode Paiement:</span>
                <span className="font-semibold">{completedSale.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span>Caissier:</span>
                <span>{completedSale.user_name || user?.full_name || "Caisse"}</span>
              </div>
            </div>

            <table className="w-full text-left border-t border-b border-slate-200 py-2">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-1">Article</th>
                  <th className="py-1 text-center">Qté</th>
                  <th className="py-1 text-right">P.U</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedSale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1 max-w-[130px] truncate">{item.article_name || "Article"}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">{item.unit_price}</td>
                    <td className="py-1 text-right font-bold">{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total:</span>
                <span>{formatCurrency(completedSale.total_amount + completedSale.discount_amount)}</span>
              </div>
              {completedSale.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Remise:</span>
                  <span>-{formatCurrency(completedSale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 text-sm font-extrabold pt-1 border-t border-slate-300">
                <span>TOTAL PAYÉ:</span>
                <span>{formatCurrency(completedSale.total_amount)}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400">
              *** Merci de votre confiance & à bientôt ! ***
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> Imprimer le Ticket
            </Button>
            <Button
              onClick={() => {
                setShowReceiptModal(false)
                setCompletedSale(null)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Nouvelle Vente
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  )
}
