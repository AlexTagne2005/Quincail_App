import { create } from "zustand"
import { Article } from "@/types"

export interface CartItem {
  article: Article
  quantity: number
  unit_price: number
  discount: number
  total: number
}

interface CartState {
  items: CartItem[]
  customerId: string | null
  paymentMethod: "CASH" | "MOMO" | "CARD" | "CREDIT"
  globalDiscount: number
  notes: string

  addItem: (article: Article) => void
  updateQuantity: (articleId: string, quantity: number) => void
  updatePrice: (articleId: string, unit_price: number) => void
  updateDiscount: (articleId: string, discount: number) => void
  removeItem: (articleId: string) => void
  clearCart: () => void

  setCustomerId: (id: string | null) => void
  setPaymentMethod: (method: "CASH" | "MOMO" | "CARD" | "CREDIT") => void
  setGlobalDiscount: (amount: number) => void
  setNotes: (notes: string) => void

  getSubtotal: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  paymentMethod: "CASH",
  globalDiscount: 0,
  notes: "",

  addItem: (article: Article) => {
    const { items } = get()
    const existingIndex = items.findIndex((i) => i.article.id === article.id)

    if (existingIndex > -1) {
      const existing = items[existingIndex]
      const newQty = existing.quantity + 1
      const updated = [...items]
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        total: Math.max(0, newQty * existing.unit_price - existing.discount),
      }
      set({ items: updated })
    } else {
      const newItem: CartItem = {
        article,
        quantity: 1,
        unit_price: article.selling_price,
        discount: 0,
        total: article.selling_price,
      }
      set({ items: [...items, newItem] })
    }
  },

  updateQuantity: (articleId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(articleId)
      return
    }
    const updated = get().items.map((item) => {
      if (item.article.id === articleId) {
        return {
          ...item,
          quantity,
          total: Math.max(0, quantity * item.unit_price - item.discount),
        }
      }
      return item
    })
    set({ items: updated })
  },

  updatePrice: (articleId: string, unit_price: number) => {
    const updated = get().items.map((item) => {
      if (item.article.id === articleId) {
        return {
          ...item,
          unit_price,
          total: Math.max(0, item.quantity * unit_price - item.discount),
        }
      }
      return item
    })
    set({ items: updated })
  },

  updateDiscount: (articleId: string, discount: number) => {
    const updated = get().items.map((item) => {
      if (item.article.id === articleId) {
        return {
          ...item,
          discount,
          total: Math.max(0, item.quantity * item.unit_price - discount),
        }
      }
      return item
    })
    set({ items: updated })
  },

  removeItem: (articleId: string) => {
    set({ items: get().items.filter((i) => i.article.id !== articleId) })
  },

  clearCart: () => {
    set({
      items: [],
      customerId: null,
      globalDiscount: 0,
      notes: "",
      paymentMethod: "CASH",
    })
  },

  setCustomerId: (id) => set({ customerId: id }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setGlobalDiscount: (amount) => set({ globalDiscount: amount }),
  setNotes: (notes) => set({ notes }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0)
  },

  getTotal: () => {
    const subtotal = get().getSubtotal()
    return Math.max(0, subtotal - get().globalDiscount)
  },
}))
