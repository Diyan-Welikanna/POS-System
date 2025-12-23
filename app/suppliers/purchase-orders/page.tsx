'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useAuth'
import { useSettings } from '@/context/SettingsContext'
import { supabase } from '@/lib/supabaseClient'
import PurchaseOrderModal from '@/components/PurchaseOrderModal'
import Link from 'next/link'

interface PurchaseOrder {
  id: string
  order_number: string
  order_date: string
  expected_delivery_date: string | null
  status: string
  total_amount: number
  notes: string | null
  supplier: {
    name: string
  }
  created_by_profile: {
    full_name: string | null
    email: string
  } | null
  received_by_profile: {
    full_name: string | null
    email: string
  } | null
  received_at: string | null
  created_at: string
  items?: Array<{
    id: string
    quantity: number
    unit_cost: number
    total_cost: number
    product: {
      name: string
      sku: string
    }
  }>
}

export default function PurchaseOrdersPage() {
  const { user } = useAuth()
  const { isAdmin, isManager } = useRole()
  const { settings } = useSettings()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showPOModal, setShowPOModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name),
          created_by_profile:profiles!purchase_orders_created_by_fkey(full_name, email),
          received_by_profile:profiles!purchase_orders_received_by_fkey(full_name, email),
          items:purchase_order_items(
            id,
            quantity,
            unit_cost,
            total_cost,
            product:products(name, sku)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      alert('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  const handleReceiveOrder = async (orderId: string) => {
    if (!confirm('Mark this order as received? This will automatically add stock to inventory.')) return

    try {
      const { error } = await (supabase as any)
        .from('purchase_orders')
        .update({ status: 'received' })
        .eq('id', orderId)

      if (error) throw error

      alert('Order received successfully! Stock has been updated.')
      fetchOrders()
    } catch (error) {
      console.error('Error receiving order:', error)
      alert('Failed to receive order')
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      const { error } = await (supabase as any)
        .from('purchase_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)

      if (error) throw error

      alert('Order cancelled successfully!')
      fetchOrders()
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access purchase orders</p>
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
          <p className="text-gray-600 font-medium">You don&apos;t have permission to access purchase orders</p>
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
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-indigo-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg -rotate-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                      Purchase Orders
                    </h1>
                  </div>
                  <p className="text-gray-600 font-semibold text-lg ml-1">Manage inventory procurement</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/suppliers"
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Suppliers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 bg-gray-50/50 font-medium transition-all"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={() => setShowPOModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Create Purchase Order
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-12 text-center">
              <p className="text-gray-600 font-semibold text-lg">Loading purchase orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-12 text-center">
              <p className="text-gray-500 font-medium text-lg">No purchase orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{order.order_number}</h3>
                      <p className="text-purple-100 font-semibold">{order.supplier.name}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm shadow-lg ${
                        order.status === 'pending' ? 'bg-yellow-500 text-white' :
                        order.status === 'received' ? 'bg-green-500 text-white' :
                        order.status === 'cancelled' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                      <p className="text-3xl font-black mt-2">{settings.currency}{order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm font-bold text-gray-500 mb-1">Order Date</p>
                      <p className="font-bold text-gray-900">{new Date(order.order_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 mb-1">Expected Delivery</p>
                      <p className="font-bold text-gray-900">
                        {order.expected_delivery_date 
                          ? new Date(order.expected_delivery_date).toLocaleDateString()
                          : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 mb-1">Created By</p>
                      <p className="font-bold text-gray-900">
                        {order.created_by_profile?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {order.status === 'received' && order.received_at && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                      <p className="text-sm font-bold text-green-700">
                        Received on {new Date(order.received_at).toLocaleString()} by{' '}
                        {order.received_by_profile?.full_name || 'Unknown'}
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="font-bold text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{item.quantity} × {settings.currency}{item.unit_cost.toFixed(2)}</p>
                            <p className="text-sm font-bold text-purple-600">{settings.currency}{item.total_cost.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-gray-500 mb-1">Notes</p>
                      <p className="text-gray-700">{order.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {order.status === 'pending' && (
                    <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                      <button
                        onClick={() => handleReceiveOrder(order.id)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        Mark as Received
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Purchase Order Modal */}
      <PurchaseOrderModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        onSave={fetchOrders}
      />
    </div>
  )
}
