'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Supplier {
  id?: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  supplier?: Supplier | null
}

export default function SupplierModal({ isOpen, onClose, onSave, supplier }: SupplierModalProps) {
  const [formData, setFormData] = useState<Supplier>({
    name: '',
    contact_person: null,
    email: null,
    phone: null,
    address: null,
    notes: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData(supplier)
      } else {
        setFormData({
          name: '',
          contact_person: null,
          email: null,
          phone: null,
          address: null,
          notes: null,
        })
      }
    }
  }, [isOpen, supplier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (supplier?.id) {
        // Update existing supplier
        const { error } = await (supabase as any)
          .from('suppliers')
          .update({
            name: formData.name,
            contact_person: formData.contact_person || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supplier.id)

        if (error) throw error
      } else {
        // Create new supplier
        const { error } = await (supabase as any)
          .from('suppliers')
          .insert({
            name: formData.name,
            contact_person: formData.contact_person || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            notes: formData.notes || null,
          })

        if (error) throw error
      }

      alert(supplier?.id ? 'Supplier updated successfully!' : 'Supplier created successfully!')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Failed to save supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            {supplier?.id ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                placeholder="ABC Wholesale"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Person */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person || ''}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                  placeholder="John Doe"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                placeholder="supplier@example.com"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                rows={2}
                placeholder="123 Main Street, City, State, ZIP"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
                rows={3}
                placeholder="Additional notes about the supplier..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
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
                {isSubmitting ? 'Saving...' : supplier?.id ? 'Update Supplier' : 'Create Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
