'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import SupplierModal from '@/components/SupplierModal'
import Link from 'next/link'

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export default function SuppliersPage() {
  const { user } = useAuth()
  const { isAdmin, isManager } = useRole()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    if (user) {
      fetchSuppliers()
    }
  }, [user])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      alert('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    try {
      const { error } = await (supabase as any)
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Supplier deleted successfully!')
      fetchSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Failed to delete supplier')
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access supplier management</p>
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
          <p className="text-gray-600 font-medium">You don't have permission to access supplier management</p>
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
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400 to-red-600 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-red-400 to-orange-600 rounded-full opacity-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                      Suppliers
                    </h1>
                  </div>
                  <p className="text-gray-600 font-semibold text-lg ml-1">Manage supplier relationships and procurement</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Total Suppliers
            </p>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{suppliers.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Active Suppliers
            </p>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{suppliers.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
            <p className="text-gray-600 text-sm font-semibold mb-2">
              Search Results
            </p>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{filteredSuppliers.length}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-gray-50/50 font-medium transition-all"
              />
            </div>
            <div className="flex gap-3">
              <Link
                href="/suppliers/purchase-orders"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Purchase Orders
              </Link>
              <button
                onClick={() => {
                  setSelectedSupplier(null)
                  setShowSupplierModal(true)
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Add Supplier
              </button>
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 font-semibold text-lg">Loading suppliers...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium text-lg">No suppliers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">Supplier Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Contact Person</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Address</th>
                    <th className="px-6 py-4 text-right text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{supplier.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{supplier.contact_person || '-'}</td>
                      <td className="px-6 py-4 text-gray-700">{supplier.email || '-'}</td>
                      <td className="px-6 py-4 text-gray-700">{supplier.phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{supplier.address || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setShowSupplierModal(true)
                            }}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold transition-all"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 mb-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-white/40 p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-orange-400 to-red-600 rounded-full opacity-10 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Supplier Management</p>
                    <p className="text-sm text-gray-600">Professional Procurement System</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 font-medium">
                    {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'Supplier' : 'Suppliers'} Displayed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={showSupplierModal}
        onClose={() => {
          setShowSupplierModal(false)
          setSelectedSupplier(null)
        }}
        onSave={fetchSuppliers}
        supplier={selectedSupplier}
      />
    </div>
  )
}
