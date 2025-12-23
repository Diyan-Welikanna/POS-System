'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useSettings } from './SettingsContext'

export interface CartItem {
  id: string
  productId: string
  sku: string
  name: string
  price: number
  quantity: number
  total: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Omit<CartItem, 'quantity' | 'total'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  tax: number
  discount: number
  total: number
  setDiscount: (amount: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [items, setItems] = useState<CartItem[]>([])
  const [discount, setDiscountAmount] = useState(0)

  const addItem = (product: Omit<CartItem, 'quantity' | 'total'>) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.productId === product.productId)
      
      if (existingItem) {
        return prev.map((item) =>
          item.productId === product.productId
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        )
      }

      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          total: product.price,
        },
      ]
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              total: quantity * item.price,
            }
          : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    setDiscountAmount(0)
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * settings.taxRate
  const total = subtotal + tax - discount

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    tax,
    discount,
    total,
    setDiscount: setDiscountAmount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
