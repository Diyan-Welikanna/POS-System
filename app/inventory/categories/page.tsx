'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import CategoryModal from '@/components/CategoryModal'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface CategoryWithCount extends Category {
  product_count?: number
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const { isAdmin, isManager } = useRole()
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    setLoading(true)

    // Fetch categories with product counts
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(count)')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      const categoriesWithCounts = (data || []).map((cat: any) => ({
        ...cat,
        product_count: cat.products?.[0]?.count || 0,
      }))
      setCategories(categoriesWithCounts)
    }

    setLoading(false)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Products using this category will have their category unset.')) return

    const { error } = await supabase.from('categories').delete().eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    } else {
      alert('Category deleted successfully!')
      fetchCategories()
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access category management</p>
      </div>
    )
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>You don't have permission to access category management</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Category Management</h1>
            <p className="text-gray-600">Organize your products into categories</p>
          </div>
          <Link
            href="/inventory"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back to Inventory
          </Link>
        </div>

        {/* Add Category Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setSelectedCategory(null)
              setShowModal(true)
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add New Category
          </button>
        </div>

        {/* Categories Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No categories found. Create your first category!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {category.product_count || 0} products
                    </span>
                  </div>
                  
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                  )}

                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedCategory(category)
                        setShowModal(true)
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedCategory(null)
        }}
        onSave={fetchCategories}
        category={selectedCategory as any}
      />
    </div>
  )
}
