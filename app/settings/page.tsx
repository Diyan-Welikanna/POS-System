'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { useRole } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { isAdmin } = useRole()
  const router = useRouter()
  const [taxRate, setTaxRate] = useState((settings.taxRate * 100).toString())
  const [currency, setCurrency] = useState(settings.currency)
  const [saved, setSaved] = useState(false)
  
  // User management states
  const [users, setUsers] = useState<User[]>([])
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'cashier'>('cashier')
  const [editUserName, setEditUserName] = useState('')
  const [editUserRole, setEditUserRole] = useState<'admin' | 'manager' | 'cashier'>('cashier')
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch users on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      alert('Please fill in all fields')
      return
    }

    if (newUserPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setIsCreating(true)

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      // Update profile with selected role
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: newUserEmail,
          full_name: newUserName,
          role: newUserRole,
        })

      if (profileError) throw profileError

      alert(`User created successfully! Role: ${newUserRole}`)
      
      // Reset form and close modal
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserName('')
      setNewUserRole('cashier')
      setShowAddUserModal(false)
      
      // Refresh user list
      fetchUsers()

    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditUserName(user.full_name || '')
    setEditUserRole(user.role as 'admin' | 'manager' | 'cashier')
    setShowEditUserModal(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser || !editUserName) {
      alert('Please fill in all fields')
      return
    }

    setIsUpdating(true)

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: editUserName,
          role: editUserRole,
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      alert('User updated successfully!')
      setShowEditUserModal(false)
      setSelectedUser(null)
      fetchUsers()

    } catch (error: any) {
      console.error('Error updating user:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user: ${user.full_name || user.email}?\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      // Delete from profiles table
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      alert('User deleted successfully!')
      fetchUsers()

    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Error: ${error.message}`)
    }
  }

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

            {/* Additional Settings Placeholder */}
            <div className="border-b-2 border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                User Management
              </h2>
              
              <div className="mb-6">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  + Add New User
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold">Name</th>
                      <th className="px-6 py-4 text-left font-bold">Email</th>
                      <th className="px-6 py-4 text-left font-bold">Role</th>
                      <th className="px-6 py-4 text-left font-bold">Created</th>
                      <th className="px-6 py-4 text-left font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 font-semibold text-gray-900">{user.full_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-700">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="Min. 6 characters"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'manager' | 'cashier')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 font-semibold"
                  >
                    <option value="cashier">Cashier - POS Terminal Only</option>
                    <option value="manager">Manager - Full Access (No Settings)</option>
                    <option value="admin">Admin - Full System Access</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddUserModal(false)
                    setNewUserEmail('')
                    setNewUserPassword('')
                    setNewUserName('')
                    setNewUserRole('cashier')
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email (Cannot be changed)</label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as 'admin' | 'manager' | 'cashier')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 font-semibold"
                  >
                    <option value="cashier">Cashier - POS Terminal Only</option>
                    <option value="manager">Manager - Full Access (No Settings)</option>
                    <option value="admin">Admin - Full System Access</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditUserModal(false)
                    setSelectedUser(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
