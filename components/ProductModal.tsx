'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Category {
  id: string
  name: string
}

interface Product {
  id?: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category_id: string | null
  low_stock_threshold: number
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  product?: Product | null
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<Product>({
    sku: '',
    barcode: null,
    name: '',
    description: null,
    price: 0,
    stock_quantity: 0,
    category_id: null,
    low_stock_threshold: 10,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (product) {
        setFormData({
          ...product,
          sku: product.sku || '',
          barcode: product.barcode || '',
          name: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          stock_quantity: product.stock_quantity || 0,
          low_stock_threshold: product.low_stock_threshold || 10,
        })
      } else {
        setFormData({
          sku: '',
          barcode: '',
          name: '',
          description: '',
          price: 0,
          stock_quantity: 0,
          category_id: null,
          low_stock_threshold: 10,
        })
      }
    }
  }, [isOpen, product])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (product?.id) {
        // Update existing product
        const { error } = await (supabase as any)
          .from('products')
          .update({
            sku: formData.sku,
            barcode: formData.barcode || null,
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price.toString()),
            stock_quantity: parseInt(formData.stock_quantity.toString()),
            category_id: formData.category_id,
            low_stock_threshold: parseInt(formData.low_stock_threshold.toString()),
          })
          .eq('id', product.id)

        if (error) throw error
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            sku: formData.sku,
            barcode: formData.barcode || null,
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price.toString()),
            stock_quantity: parseInt(formData.stock_quantity.toString()),
            category_id: formData.category_id,
            low_stock_threshold: parseInt(formData.low_stock_threshold.toString()),
          } as any)

        if (error) throw error
      }

      alert(product?.id ? 'Product updated successfully!' : 'Product created successfully!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {product?.id ? 'Edit Product' : 'Add New Product'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="PROD-001"
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium mb-2">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1234567890123"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Product Name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value || null })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock_quantity || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Low Stock Alert <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.low_stock_threshold || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>
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
                {isSubmitting ? 'Saving...' : product?.id ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
