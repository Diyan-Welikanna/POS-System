'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useRole } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { generateReceipt } from '@/components/Receipt'

interface Transaction {
  id: string
  created_at: string
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: string
  status: string
  cashier: {
    full_name: string | null
    email: string
  }
  customer: {
    name: string
  } | null
  items: Array<{
    product: {
      name: string
      sku: string
    }
    quantity: number
    unit_price: number
    total: number
  }>
}

export default function TransactionsPage() {
  const { user, profile } = useAuth()
  const { settings } = useSettings()
  const { isAdmin, isManager } = useRole()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchTransactions = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('transactions')
        .select(
          `
          *,
          cashier:profiles!transactions_cashier_id_fkey(full_name),
          customer:customers(name, email),
          items:transaction_items(*, product:products(name, sku))
        `
        )
        .order('created_at', { ascending: false })

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59')
      }

      const { data, error } = await query

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      alert('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleReprintReceipt = (transaction: Transaction) => {
    generateReceipt({
      ...transaction,
      cashier: {
        ...transaction.cashier,
        full_name: transaction.cashier.full_name || undefined
      },
      customer: transaction.customer || undefined
    }, settings.currency)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access transactions</p>
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
          <p className="text-gray-600 font-medium">You don&apos;t have permission to view transaction history</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view transactions</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Transaction History</h1>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchTransactions}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-600 font-semibold text-lg">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-12 text-center">
            <p className="text-gray-600 font-semibold text-lg">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Cashier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-blue-50/50 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {new Date(transaction.created_at).toLocaleDateString()}{' '}
                      {new Date(transaction.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {transaction.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {transaction.cashier?.full_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {transaction.customer?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                      {transaction.items.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-green-600">
                      {settings.currency} {transaction.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-green-100 text-green-800 uppercase border-2 border-green-200">
                        {transaction.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-800 mr-3 hover:underline\">
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleReprintReceipt(transaction)}
                        className="text-green-600 hover:text-green-800 hover:underline\">\n                        🖨️ Reprint\n                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-white/40">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Transaction Details
                </h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:scale-110 transition-all"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                    <p className="text-gray-600 font-semibold mb-1">
                      Receipt #
                    </p>
                    <p className="font-extrabold text-blue-600 text-lg">
                      {selectedTransaction.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200">
                    <p className="text-gray-600 font-semibold mb-1">
                      Date
                    </p>
                    <p className="font-bold text-indigo-600">
                      {new Date(selectedTransaction.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                    <p className="text-gray-600 font-semibold mb-1">
                      Cashier
                    </p>
                    <p className="font-bold text-purple-600">
                      {selectedTransaction.cashier?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                    <p className="text-gray-600 font-semibold mb-1">
                      Customer
                    </p>
                    <p className="font-bold text-green-600">
                      {selectedTransaction.customer?.name || 'Walk-in'}
                    </p>
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="font-bold text-xl mb-4 text-gray-800">
                    Items
                  </h3>
                  <div className="space-y-3">
                    {selectedTransaction.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:bg-blue-50 transition-all"
                      >
                        <div>
                          <p className="font-bold text-gray-800">{item.product.name}</p>
                          <p className="text-sm text-gray-600 font-medium">
                            {item.product.sku} - {settings.currency} {item.unit_price.toFixed(2)} x{' '}
                            {item.quantity}
                          </p>
                        </div>
                        <p className="font-extrabold text-blue-600 text-lg">{settings.currency} {item.total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-6 space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-gray-800">{settings.currency} {selectedTransaction.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-700">Tax:</span>
                    <span className="text-gray-800">{settings.currency} {selectedTransaction.tax.toFixed(2)}</span>
                  </div>
                  {selectedTransaction.discount > 0 && (
                    <div className="flex justify-between text-base font-bold text-green-600">
                      <span>Discount:</span>
                      <span>-{settings.currency} {selectedTransaction.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-extrabold pt-3 border-t-2 border-blue-200">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Total:</span>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{settings.currency} {selectedTransaction.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2">
                    <span className="text-gray-700">Payment Method:</span>
                    <span className="uppercase px-3 py-1 rounded-full bg-green-100 text-green-800 border-2 border-green-200">{selectedTransaction.payment_method}</span>
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    onClick={() => handleReprintReceipt(selectedTransaction)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 font-bold transition-all hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
