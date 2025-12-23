'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface StockMovement {
  id: string
  product_id: string
  quantity_change: number
  type: 'sale' | 'restock' | 'adjustment'
  notes: string | null
  created_at: string
  product: {
    name: string
    sku: string
  }
  user: {
    full_name: string | null
    email: string
  }
}

export default function StockMovementsPage() {
  const { user } = useAuth()
  const { isAdmin, isManager } = useRole()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (user) {
      fetchMovements()
    }
  }, [user])

  const fetchMovements = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('stock_movements')
      .select(
        `
        *,
        product:products(name, sku),
        user:profiles(full_name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching stock movements:', error)
    } else {
      setMovements(data || [])
    }

    setLoading(false)
  }

  const filteredMovements = movements.filter((movement) => {
    // Type filter
    const matchesType = !typeFilter || movement.type === typeFilter

    // Search filter
    const matchesSearch =
      movement.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.product.sku.toLowerCase().includes(searchTerm.toLowerCase())

    // Date filter
    let matchesDate = true
    if (startDate) {
      matchesDate = matchesDate && new Date(movement.created_at) >= new Date(startDate)
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      matchesDate = matchesDate && new Date(movement.created_at) <= endDateTime
    }

    return matchesType && matchesSearch && matchesDate
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access stock movements</p>
      </div>
    )
  }

  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>You don't have permission to access stock movements</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stock Movement History</h1>
            <p className="text-gray-600">Track all inventory changes and adjustments</p>
          </div>
          <Link
            href="/inventory"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back to Inventory
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search Product</label>
              <input
                type="text"
                placeholder="Product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Movement Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">All Types</option>
                <option value="sale">Sales</option>
                <option value="restock">Restocks</option>
                <option value="adjustment">Adjustments</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading movements...</p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No stock movements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(movement.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{movement.product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {movement.product.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {movement.type === 'sale' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Sale
                          </span>
                        )}
                        {movement.type === 'restock' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Restock
                          </span>
                        )}
                        {movement.type === 'adjustment' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Adjustment
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold ${
                            movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {movement.quantity_change > 0 ? '+' : ''}
                          {movement.quantity_change}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {movement.user.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredMovements.length} of {movements.length} movements
        </div>
      </div>
    </div>
  )
}
