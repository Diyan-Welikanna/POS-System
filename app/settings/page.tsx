'use client'

import { useState } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { useRole } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { isAdmin } = useRole()
  const router = useRouter()
  const [taxRate, setTaxRate] = useState((settings.taxRate * 100).toString())
  const [currency, setCurrency] = useState(settings.currency)
  const [saved, setSaved] = useState(false)

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-white/20 text-center">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6 font-medium">Only administrators can access settings.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            ← Go to Home
          </button>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    const rate = parseFloat(taxRate) / 100
    if (isNaN(rate) || rate < 0 || rate > 1) {
      alert('Please enter a valid tax rate between 0 and 100')
      return
    }

    updateSettings({ taxRate: rate, currency })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
          {/* Header */}
          <div className="border-b-2 border-gray-200 px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">⚙️</span>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">System Settings</h1>
            </div>
            <p className="text-gray-600 font-medium ml-14">Configure your POS system preferences</p>
          </div>

          {/* Settings Content */}
          <div className="p-8 space-y-8">
            {/* Tax Settings */}
            <div className="border-b-2 border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Tax Configuration
              </h2>
              
              <div className="max-w-lg">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Tax Rate (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="flex-1 px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-semibold transition-all"
                    placeholder="10"
                  />
                  <span className="text-gray-700 font-bold text-xl">%</span>
                </div>
                <p className="text-sm text-gray-600 mt-3 font-medium bg-blue-50 px-4 py-2 rounded-lg">
                  Current rate: <span className="font-bold text-blue-600">{(settings.taxRate * 100).toFixed(2)}%</span> (Applied to all sales)
                </p>
              </div>
            </div>

            {/* Currency Settings */}
            <div className="border-b-2 border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Currency Settings
              </h2>
              
              <div className="max-w-lg">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-gray-50/50 font-semibold transition-all"
                >
                  <option value="$">$ - US Dollar</option>
                  <option value="Rs">Rs - Rupee</option>
                  <option value="₹">₹ - Indian Rupee</option>
                  <option value="€">€ - Euro</option>
                  <option value="£">£ - British Pound</option>
                  <option value="¥">¥ - Japanese Yen</option>
                  <option value="₨">₨ - Pakistani Rupee</option>
                  <option value="৳">৳ - Bangladeshi Taka</option>
                  <option value="R">R - South African Rand</option>
                </select>
                <p className="text-sm text-gray-600 mt-3 font-medium bg-blue-50 px-4 py-2 rounded-lg">
                  Current: <span className="font-bold text-blue-600">{settings.currency}</span> (Applied to all prices)
                </p>
              </div>
            </div>

            {/* Future Settings Placeholder */}
            <div className="pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Additional Settings
              </h2>
              <p className="text-sm text-gray-600 italic mb-6 bg-indigo-50 px-4 py-3 rounded-lg font-medium">
                More configuration options will be available here in future updates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white/60 backdrop-blur-sm hover:border-blue-400 transition-all">
                  <p className="text-base font-bold text-gray-700">
                    Receipt Customization
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
                </div>
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white/60 backdrop-blur-sm hover:border-blue-400 transition-all">
                  <p className="text-base font-bold text-gray-700">
                    Notification Preferences
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
                </div>
                <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white/60 backdrop-blur-sm hover:border-blue-400 transition-all">
                  <p className="text-base font-bold text-gray-700">
                    Backup & Restore
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t-2 border-gray-200 px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold hover:bg-white rounded-xl transition-all"
            >
              Cancel
            </button>
            <div className="flex items-center gap-4">
              {saved && (
                <span className="text-emerald-600 text-base font-bold bg-emerald-50 px-4 py-2 rounded-xl border-2 border-emerald-200">
                  Settings saved successfully!
                </span>
              )}
              <button
                onClick={handleSave}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
