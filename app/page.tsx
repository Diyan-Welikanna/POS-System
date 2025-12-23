'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRole } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, profile } = useAuth()
  const { isAdmin, isManager } = useRole()
  const router = useRouter()

  useEffect(() => {
    // Redirect cashiers to POS terminal only
    if (profile?.role === 'cashier') {
      router.push('/pos')
    }
  }, [profile, router])

  // Don't show dashboard to cashiers
  if (profile?.role === 'cashier') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            POS System
          </h1>
          <p className="text-2xl text-gray-600 mb-12 font-medium">
            Modern Point of Sale with Inventory Management
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mt-16">
            <a
              href="/pos"
              className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
                POS Terminal
              </h2>
              <p className="text-gray-600 font-medium">
                Process sales and manage transactions
              </p>
            </a>

            <a
              href="/inventory"
              className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-3">
                Inventory
              </h2>
              <p className="text-gray-600 font-medium">
                Manage products and stock levels
              </p>
            </a>

            <a
              href="/suppliers"
              className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                Suppliers
              </h2>
              <p className="text-gray-600 font-medium">
                Manage suppliers and purchase orders
              </p>
            </a>

            <a
              href="/reports"
              className="group p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:rotate-6 transition-transform">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent mb-3">
                Analytics
              </h2>
              <p className="text-gray-600 font-medium">
                View sales reports and insights
              </p>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
