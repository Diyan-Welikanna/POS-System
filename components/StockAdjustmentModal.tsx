'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

interface Product {
  id: string
  name: string
  sku: string
  stock_quantity: number
}

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StockAdjustmentModalProps) {
  const { user } = useAuth()
  const [adjustmentType, setAdjustmentType] = useState<'restock' | 'adjustment'>('restock')
  const [quantity, setQuantity] = useState(0)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      const quantityChange = adjustmentType === 'restock' ? quantity : -Math.abs(quantity)
      const newStockQuantity = product.stock_quantity + quantityChange

      if (newStockQuantity < 0) {
        alert('Adjustment would result in negative stock!')
        setIsSubmitting(false)
        return
      }

      // Update product stock
      const { error: updateError } = await (supabase as any)
        .from('products')
        .update({ stock_quantity: newStockQuantity })
        .eq('id', product.id)

      if (updateError) throw updateError

      // Log stock movement
      const { error: logError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: product.id,
          quantity_change: quantityChange,
          type: adjustmentType,
          user_id: user.id,
          notes: notes || null,
        } as any)

      if (logError) throw logError

      alert('Stock adjusted successfully!')
      onSuccess()
      onClose()
      setQuantity(0)
      setNotes('')
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Failed to adjust stock')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Adjust Stock</h2>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Product</p>
            <p className="font-semibold">{product.name}</p>
            <p className="text-sm text-gray-600 mt-2">Current Stock</p>
            <p className="text-2xl font-bold text-blue-600">{product.stock_quantity}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Adjustment Type</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as 'restock' | 'adjustment')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="restock">Restock (Add)</option>
                <option value="adjustment">Adjustment (Subtract)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                New stock will be:{' '}
                <span className="font-semibold">
                  {adjustmentType === 'restock'
                    ? product.stock_quantity + quantity
                    : product.stock_quantity - quantity}
                </span>
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Reason for adjustment..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Adjusting...' : 'Adjust Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
