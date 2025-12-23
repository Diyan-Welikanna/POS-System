'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useRole } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface Transaction {
  id: string
  total: number
  created_at: string
  cashier: {
    full_name: string | null
    email: string
  }
}

interface TransactionWithItems extends Transaction {
  items: Array<{
    product: {
      id: string
      name: string
      category: {
        name: string
      } | null
    }
    quantity: number
    total: number
  }>
}

interface DailySales {
  date: string
  total: number
  count: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface CategorySales {
  category: string
  revenue: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { isAdmin, isManager } = useRole()
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCashierId, setSelectedCashierId] = useState<string>('')
  const [cashiers, setCashiers] = useState<{ id: string; full_name: string | null }[]>([])
  
  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [averageTransaction, setAverageTransaction] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // Chart data
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [categorySales, setCategorySales] = useState<CategorySales[]>([])
  const [cashierPerformance, setCashierPerformance] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      // Set default date range (last 30 days)
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      
      setEndDate(end.toISOString().split('T')[0])
      setStartDate(start.toISOString().split('T')[0])
      
      // Fetch cashiers list
      fetchCashiers()
    }
  }, [user])

  const fetchCashiers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'cashier')
        .order('full_name')

      if (error) throw error
      setCashiers(data || [])
    } catch (error) {
      console.error('Error fetching cashiers:', error)
    }
  }

  useEffect(() => {
    if (user && startDate && endDate) {
      fetchAnalytics()
    }
  }, [user, startDate, endDate, selectedCashierId])

  const fetchAnalytics = async () => {
    setLoading(true)

    try {
      // Fetch transactions with items
      let query = supabase
        .from('transactions')
        .select(`
          *,
          cashier:profiles(full_name, email),
          items:transaction_items(
            quantity,
            total,
            product:products(
              id,
              name,
              category:categories(name)
            )
          )
        `)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .eq('status', 'completed')
        .order('created_at', { ascending: true })

      // Filter by selected cashier if specified
      if (selectedCashierId) {
        query = query.eq('cashier_id', selectedCashierId)
      }

      const { data: transactions, error } = await query

      if (error) throw error

      if (transactions) {
        processAnalytics(transactions as any)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalytics = (transactions: TransactionWithItems[]) => {
    // Calculate totals
    const revenue = transactions.reduce((sum, t) => sum + t.total, 0)
    setTotalRevenue(revenue)
    setTotalTransactions(transactions.length)
    setAverageTransaction(transactions.length > 0 ? revenue / transactions.length : 0)

    // Daily sales
    const dailyMap = new Map<string, DailySales>()
    transactions.forEach((t) => {
      const date = new Date(t.created_at).toLocaleDateString()
      const existing = dailyMap.get(date) || { date, total: 0, count: 0 }
      dailyMap.set(date, {
        date,
        total: existing.total + t.total,
        count: existing.count + 1,
      })
    })
    setDailySales(Array.from(dailyMap.values()))

    // Top products
    const productMap = new Map<string, TopProduct>()
    let totalProductsSold = 0
    
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const name = item.product.name
        const existing = productMap.get(name) || { name, quantity: 0, revenue: 0 }
        productMap.set(name, {
          name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total,
        })
        totalProductsSold += item.quantity
      })
    })
    
    setTotalProducts(totalProductsSold)
    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    setTopProducts(sortedProducts)

    // Category sales
    const categoryMap = new Map<string, number>()
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const category = item.product.category?.name || 'Uncategorized'
        categoryMap.set(category, (categoryMap.get(category) || 0) + item.total)
      })
    })
    setCategorySales(
      Array.from(categoryMap.entries()).map(([category, revenue]) => ({ category, revenue }))
    )

    // Cashier performance
    const cashierMap = new Map<string, { name: string; sales: number; transactions: number }>()
    transactions.forEach((t) => {
      const name = t.cashier.full_name || 'Unknown'
      const existing = cashierMap.get(name) || { name, sales: 0, transactions: 0 }
      cashierMap.set(name, {
        name,
        sales: existing.sales + t.total,
        transactions: existing.transactions + 1,
      })
    })
    setCashierPerformance(Array.from(cashierMap.values()))
  }

  // Chart configurations
  const salesChartData = {
    labels: dailySales.map((d) => d.date),
    datasets: [
      {
        label: 'Daily Revenue ($)',
        data: dailySales.map((d) => d.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const topProductsChartData = {
    labels: topProducts.map((p) => p.name),
    datasets: [
      {
        label: 'Revenue ($)',
        data: topProducts.map((p) => p.revenue),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  }

  const categoryChartData = {
    labels: categorySales.map((c) => c.category),
    datasets: [
      {
        data: categorySales.map((c) => c.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  }

  const cashierChartData = {
    labels: cashierPerformance.map((c) => c.name),
    datasets: [
      {
        label: 'Sales ($)',
        data: cashierPerformance.map((c) => c.sales),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
      },
    ],
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view analytics</p>
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
          <p className="text-gray-600 font-medium">You don't have permission to view analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Analytics & Reports</h1>
          </div>
          <p className="text-gray-600 font-medium ml-16">Sales insights and performance metrics</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Filter by Cashier
              </label>
              <select
                value={selectedCashierId}
                onChange={(e) => setSelectedCashierId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-medium transition-all"
              >
                <option value="">All Cashiers</option>
                {cashiers.map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.full_name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={fetchAnalytics}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-600 font-semibold text-lg">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  Total Revenue
                </p>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{settings.currency} {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  Transactions
                </p>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{totalTransactions}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  Avg Transaction
                </p>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {settings.currency} {averageTransaction.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 hover:scale-105 transition-all duration-200">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  Products Sold
                </p>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{totalProducts}</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Sales Trend
                </h2>
                {dailySales.length > 0 ? (
                  <Line
                    data={salesChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false },
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8 font-medium">No sales data available</p>
                )}
              </div>

              {/* Top Products */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Top 10 Products
                </h2>
                {topProducts.length > 0 ? (
                  <Bar
                    data={topProductsChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8 font-medium">No product data available</p>
                )}
              </div>

              {/* Category Performance */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Category Performance
                </h2>
                {categorySales.length > 0 ? (
                  <div className="flex justify-center">
                    <div className="w-64 h-64">
                      <Doughnut
                        data={categoryChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: { position: 'bottom' },
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8 font-medium">No category data available</p>
                )}
              </div>

              {/* Cashier Performance */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Cashier Performance
                </h2>
                {cashierPerformance.length > 0 ? (
                  <Bar
                    data={cashierChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-8 font-medium">No cashier data available</p>
                )}
              </div>
            </div>

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Top Products Table */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Top Products Details
                </h2>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Qty Sold
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topProducts.map((product, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-all">
                          <td className="px-4 py-3 text-sm font-semibold">{product.name}</td>
                          <td className="px-4 py-3 text-sm font-bold text-indigo-600">{product.quantity}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">
                            {settings.currency} {product.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cashier Performance Table */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Cashier Details
                </h2>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Cashier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Sales
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cashierPerformance.map((cashier, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/50 transition-all">
                          <td className="px-4 py-3 text-sm font-semibold">{cashier.name}</td>
                          <td className="px-4 py-3 text-sm font-bold text-orange-600">{cashier.transactions}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600">
                            {settings.currency} {cashier.sales.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
