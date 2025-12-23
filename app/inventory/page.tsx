'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useRole } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import ProductModal from '@/components/ProductModal'
import StockAdjustmentModal from '@/components/StockAdjustmentModal'
import CategoryModal from '@/components/CategoryModal'
import Link from 'next/link'
import { useRealtimeProducts, useRealtimeCategories } from '@/hooks/useRealtime'

interface Category {
  id: string
  name: string
  description: string | null
}

interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category_id: string | null
  low_stock_threshold: number
  created_at: string
  category?: Category | null
}

export default function InventoryPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { isAdmin, isManager } = useRole()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchProducts(), fetchCategories()])
    setLoading(false)
  }

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
    } else {
      setProducts(data || [])
    }
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (data) setCategories(data)
  }

  // Realtime updates
  const handleProductUpdate = useCallback((payload: any) => {
    console.log('[Realtime] Product update:', payload)
    fetchProducts()
  }, [])

  const handleCategoryUpdate = useCallback((payload: any) => {
    console.log('[Realtime] Category update:', payload)
    fetchCategories()
  }, [])

  useRealtimeProducts(handleProductUpdate)
  useRealtimeCategories(handleCategoryUpdate)

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    } else {
      alert('Product deleted successfully!')
      fetchProducts()
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    const { error } = await supabase.from('categories').delete().eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category. It may be in use by products.')
    } else {
      alert('Category deleted successfully!')
      fetchCategories()
    }
  }

  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())

    // Category filter
    const matchesCategory = !categoryFilter || product.category_id === categoryFilter

    // Stock filter
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold
    } else if (stockFilter === 'out') {
      matchesStock = product.stock_quantity === 0
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
  ).length

  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access inventory management</p>
      </div>
    )
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 max-w-md text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">
            Access Denied
          </h2>
          <p className="text-gray-600 font-medium">You don&apos;t have permission to access inventory management</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-10">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-white/40 p-8 relative overflow-hidden">
            {/* Decorative gradient orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-indigo-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                      Inventory
                    </h1>
                  </div>
                  <p className="text-gray-600 font-semibold text-lg ml-1">Manage products, categories, and stock levels</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Total Products
            </p>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{products.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Categories
            </p>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{categories.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Low Stock
            </p>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{lowStockCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Out of Stock
            </p>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">{outOfStockCount}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setSelectedProduct(null)
                setShowProductModal(true)
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Add Product
            </button>
            <button
              onClick={() => {
                setSelectedCategory(null)
                setShowCategoryModal(true)
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Add Category
            </button>
            <Link
              href="/inventory/suppliers"
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Suppliers
            </Link>
            <Link
              href="/inventory/purchase-orders"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Purchase Orders
            </Link>
            <Link
              href="/inventory/categories"
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Manage Categories
            </Link>
            <Link
              href="/inventory/stock-movements"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Stock History
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Search
              </label>
              <input
                type="text"
                placeholder="Name, SKU, or Barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 font-semibold text-lg">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 font-semibold text-lg">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const isLowStock =
                      product.stock_quantity > 0 &&
                      product.stock_quantity <= product.low_stock_threshold
                    const isOutOfStock = product.stock_quantity === 0

                    return (
                      <tr key={product.id} className="hover:bg-blue-50/50 transition-all border-b border-gray-100">
                        <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-700">{product.sku}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gray-800">{product.name}</p>
                            {product.barcode && (
                              <p className="text-xs text-gray-500 font-medium">Barcode: {product.barcode}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {product.category?.name || (
                            <span className="text-gray-400 italic">No category</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-600">
                          {settings.currency} {product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-base font-extrabold text-gray-800">{product.stock_quantity}</td>
                        <td className="px-6 py-4">
                          {isOutOfStock ? (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-red-100 text-red-800 border-2 border-red-200">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border-2 border-yellow-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-green-100 text-green-800 border-2 border-green-200">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowProductModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-bold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowStockModal(true)
                              }}
                              className="text-green-600 hover:text-green-800 text-sm font-bold hover:underline"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-bold hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 mb-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-white/40 p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full opacity-10 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Inventory System</p>
                    <p className="text-sm text-gray-600">Professional Stock Management</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 font-medium">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Displayed
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 font-medium">
                    {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false)
          setSelectedProduct(null)
        }}
        onSave={fetchProducts}
        product={selectedProduct}
      />

      <StockAdjustmentModal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          setSelectedCategory(null)
        }}
        onSave={fetchCategories}
        category={selectedCategory}
      />
    </div>
  )
}
