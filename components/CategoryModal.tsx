'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Category {
  id?: string
  name: string
  description: string | null
}

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  category?: Category | null
}

export default function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const [formData, setFormData] = useState<Category>({
    name: '',
    description: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData(category)
      } else {
        setFormData({ name: '', description: '' })
      }
    }
  }, [isOpen, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (category?.id) {
        // Update existing category
        const { error } = await (supabase as any)
          .from('categories')
          .update({
            name: formData.name,
            description: formData.description || null,
          })
          .eq('id', category.id)

        if (error) throw error
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert({
            name: formData.name,
            description: formData.description || null,
          } as any)

        if (error) throw error
      }

      alert(category?.id ? 'Category updated successfully!' : 'Category created successfully!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {category?.id ? 'Edit Category' : 'Add New Category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Electronics"
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
                placeholder="Category description..."
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
                {isSubmitting ? 'Saving...' : category?.id ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
