'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { supabase } from '@/lib/supabaseClient'

interface Product {
  id: string
  name: string
  sku: string
  price: number
}

interface Supplier {
  id: string
  name: string
}

interface PurchaseOrderItem {
  product_id: string
  quantity: number
  unit_cost: number
  total_cost: number
  product?: Product
}

interface PurchaseOrderFormData {
  supplier_id: string
  order_number: string
  order_date: string
  expected_delivery_date: string | null
  notes: string | null
  items: PurchaseOrderItem[]
}

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function PurchaseOrderModal({ isOpen, onClose, onSave }: PurchaseOrderModalProps) {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: '',
    order_number: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: null,
    notes: null,
    items: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
      fetchProducts()
      // Generate order number
      const orderNum = `PO-${Date.now()}`
      setFormData({
        supplier_id: '',
        order_number: orderNum,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: null,
        notes: null,
        items: [],
      })
    }
  }, [isOpen])

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .order('name')
    setSuppliers(data || [])
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, price')
      .order('name')
    setProducts(data || [])
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, unit_cost: 0, total_cost: 0 }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Calculate total cost
    if (field === 'quantity' || field === 'unit_cost') {
      newItems[index].total_cost = newItems[index].quantity * newItems[index].unit_cost
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.total_cost, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.items.length === 0) {
      alert('Please add at least one item to the purchase order')
      return
    }

    setIsSubmitting(true)

    try {
      // Create purchase order
      const { data: order, error: orderError } = await (supabase as any)
        .from('purchase_orders')
        .insert({
          supplier_id: formData.supplier_id,
          order_number: formData.order_number,
          order_date: formData.order_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          notes: formData.notes || null,
          status: 'pending',
          total_amount: getTotalAmount(),
          created_by: user?.id,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create purchase order items
      const items = formData.items.map(item => ({
        purchase_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
      }))

      const { error: itemsError } = await (supabase as any)
        .from('purchase_order_items')
        .insert(items)

      if (itemsError) throw itemsError

      alert('Purchase order created successfully!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Failed to create purchase order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Create Purchase Order
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Order Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.order_number}
                  onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Expected Delivery
                </label>
                <input
                  type="date"
                  value={formData.expected_delivery_date || ''}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            {/* Items */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Order Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold transition-all"
                >
                  Add Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items added yet</p>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-4 rounded-xl">
                      <div className="col-span-5">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Product</label>
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Unit Cost</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Total</label>
                        <input
                          type="text"
                          disabled
                          value={item.total_cost.toFixed(2)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-gray-100 text-sm font-bold"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="mt-6 flex justify-end">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl">
                  <p className="text-sm font-semibold mb-1">Total Amount</p>
                  <p className="text-3xl font-black">{settings.currency}{getTotalAmount().toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
