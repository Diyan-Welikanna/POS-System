'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useSettings } from '@/context/SettingsContext'
import { supabase } from '@/lib/supabaseClient'
import BarcodeScanner from '@/components/BarcodeScanner'
import { generateReceipt } from '@/components/Receipt'
import CreateCustomerModal from '@/components/CreateCustomerModal'
import Link from 'next/link'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useRealtimeProducts } from '@/hooks/useRealtime'
import { 
  getCachedProducts, 
  getCachedCustomers, 
  cacheProducts, 
  cacheCustomers 
} from '@/lib/indexedDB'
import { addOfflineTransaction } from '@/lib/offlineQueue'

interface Transaction {
  id: string
  cashier_id: string
  customer_id: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: string
  status: string
  created_at: string
}

interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category_id: string | null
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  loyalty_points: number
}

export default function POSPage() {
  const { user, profile } = useAuth()
  const isOnline = useOnlineStatus()
  const { settings } = useSettings()
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    tax,
    discount,
    total,
    setDiscount,
  } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount')
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  // Fetch products - online or from cache
  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  const fetchProducts = async () => {
    if (isOnline) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching products:', error)
        // Fall back to cache
        const cached = await getCachedProducts()
        setProducts(cached as Product[])
      } else {
        setProducts(data || [])
        // Cache for offline use
        if (data) {
          await cacheProducts(data)
        }
      }
    } else {
      // Load from cache when offline
      const cached = await getCachedProducts()
      setProducts(cached as Product[])
      console.log('[Offline] Loaded products from cache')
    }
  }

  // Realtime product updates
  const handleProductUpdate = useCallback((payload: any) => {
    console.log('[Realtime] Product updated:', payload)
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtimeProducts(handleProductUpdate)

  // Search products
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
  )

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode)
    if (product) {
      handleAddToCart(product)
      setSearchTerm('')
    } else {
      alert(`Product with barcode ${barcode} not found`)
    }
  }

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      alert('Product out of stock!')
      return
    }

    addItem({
      id: `item-${Date.now()}`,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
    })
  }

  // Search customers - online or from cache
  const searchCustomers = async (term: string) => {
    if (term.length < 2) {
      setCustomers([])
      return
    }

    if (isOnline) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(5)

      if (!error && data) {
        setCustomers(data)
        // Cache customers
        await cacheCustomers(data)
      }
    } else {
      // Search cached customers
      const cached = await getCachedCustomers()
      const filtered = (cached as Customer[]).filter((c: Customer) =>
        c.name.toLowerCase().includes(term.toLowerCase()) ||
        c.email?.toLowerCase().includes(term.toLowerCase()) ||
        c.phone?.includes(term)
      ).slice(0, 5)
      setCustomers(filtered)
    }
  }

  // Process checkout - online or offline queue
  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('Cart is empty!')
      return
    }

    if (!user) {
      alert('You must be logged in')
      return
    }

    setIsProcessing(true)

    try {
      const transactionData = {
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal,
        tax,
        discount,
        total,
        payment_method: paymentMethod,
        customer_id: selectedCustomer?.id,
        cashier_id: user.id,
      }

      if (isOnline) {
        // Online checkout
        // Create transaction
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            cashier_id: user.id,
            customer_id: selectedCustomer?.id || null,
            subtotal,
            tax,
            discount,
            total,
            payment_method: paymentMethod,
            status: 'completed' as const,
          } as any)
          .select()
          .single() as { data: Transaction | null, error: any }

        if (transactionError) throw transactionError
        if (!transaction) throw new Error('No transaction data returned')

        // Create transaction items
        const transactionItems = items.map((item) => ({
          transaction_id: transaction.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.total,
        }))

        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(transactionItems as any)

        if (itemsError) throw itemsError

        // Update loyalty points if customer selected
        if (selectedCustomer) {
          const pointsEarned = Math.floor(total / 10) // 1 point per $10
          const { error: updateError } = await (supabase as any)
            .from('customers')
            .update({
              loyalty_points: selectedCustomer.loyalty_points + pointsEarned,
            })
            .eq('id', selectedCustomer.id)
          
          if (updateError) {
            console.error('Failed to update loyalty points:', updateError)
          }
        }

        // Fetch complete transaction for receipt
        const { data: completeTransaction } = await supabase
          .from('transactions')
          .select(
            `
            *,
            cashier:profiles(*),
            customer:customers(*),
            items:transaction_items(*, product:products(*))
          `
          )
          .eq('id', transaction.id)
          .single()

        if (completeTransaction) {
          // Generate receipt
          await generateReceipt(completeTransaction, settings.currency)
        }

        alert('Transaction completed successfully!')
      } else {
        // Offline checkout - add to queue
        await addOfflineTransaction(transactionData)
        alert('Transaction saved offline. Will sync when connection is restored.')
      }

      // Clear cart and reset
      clearCart()
      setSelectedCustomer(null)
      setCustomerSearch('')
      setCustomers([])
      setDiscountInput('')
      setShowCheckout(false)
      setDiscountInput('')

      // Refresh products to update stock (if online)
      if (isOnline) {
        fetchProducts()
      }
    } catch (error: any) {
      console.error('==========================================');
      console.error('❌ CHECKOUT ERROR');
      console.error('==========================================');
      console.error('Error object:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('==========================================');
      
      let errorMsg = 'Failed to process transaction. Please try again.';
      if (error?.message?.includes('permission') || error?.message?.includes('RLS')) {
        errorMsg = 'Permission denied. Please check database access settings.';
      } else if (error?.message?.includes('network')) {
        errorMsg = 'Network error. Transaction saved offline and will sync when online.';
      }
      
      alert(errorMsg);
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApplyDiscount = () => {
    const amount = parseFloat(discountInput)
    if (!isNaN(amount) && amount >= 0) {
      if (discountType === 'percentage') {
        // Convert percentage to actual amount
        const discountAmount = (subtotal * amount) / 100
        setDiscount(discountAmount)
      } else {
        setDiscount(amount)
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access the POS terminal</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">POS Terminal</h1>
          <p className="text-gray-600">Fast checkout and inventory management</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Search & List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            <BarcodeScanner onScan={handleBarcodeScan} isActive={!showCheckout} />

            {/* Product Search */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search products by name, SKU, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-5 sticky top-4">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Products
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      product.stock_quantity > 0
                        ? 'bg-gradient-to-br from-white to-blue-50/50 border-2 border-blue-200/50 hover:border-blue-400 hover:shadow-xl hover:scale-105 hover:-translate-y-1'
                        : 'bg-gradient-to-br from-gray-50 to-red-50 border-2 border-red-200 cursor-not-allowed opacity-60'
                    }`}
                    disabled={product.stock_quantity <= 0}
                  >
                    <p className="font-bold text-sm truncate text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{product.sku}</p>
                    <p className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-3">
                      {settings.currency} {product.price.toFixed(2)}
                    </p>
                    <p className={`text-xs font-semibold mt-2 ${
                      product.stock_quantity <= 10 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {product.stock_quantity > 0 ? `✓ Stock: ${product.stock_quantity}` : '✗ Out of Stock'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Cart */}
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🛒</span> Cart
                </h2>
                {items.length > 0 && (
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-6xl mb-4">🛒</p>
                  <p className="text-gray-400 font-medium">Cart is empty</p>
                  <p className="text-gray-300 text-sm mt-1">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item) => (
                    <div key={item.id} className="group flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-200/50 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">{item.name}</p>
                        <p className="text-xs text-blue-600 font-semibold mt-0.5">{settings.currency} {item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg hover:from-red-400 hover:to-red-500 hover:text-white font-bold transition-all duration-200 hover:scale-110"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-bold text-gray-800 bg-white rounded-lg px-2 py-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg hover:from-blue-400 hover:to-blue-500 hover:text-white font-bold transition-all duration-200 hover:scale-110"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-1 w-7 h-7 bg-gradient-to-br from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 font-bold transition-all duration-200 hover:scale-110"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              {items.length > 0 && (
                <div className="mt-5 pt-5 border-t-2 border-gray-200 space-y-3">
                  <div className="flex justify-between text-sm font-semibold text-gray-700">
                    <span>Subtotal:</span>
                    <span className="text-gray-900">{settings.currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-gray-700">
                    <span>Tax ({(settings.taxRate * 100).toFixed(1)}%):</span>
                    <span className="text-gray-900">{settings.currency} {tax.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm font-semibold text-emerald-600">
                      <span>Discount:</span>
                      <span>-{settings.currency} {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
                    <span className="text-gray-800">Total:</span>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{settings.currency} {total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {items.length > 0 && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowCheckout(!showCheckout)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    {showCheckout ? '← Back to Shopping' : '💳 Proceed to Checkout →'}
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-red-50 hover:to-red-100 text-gray-700 hover:text-red-600 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:border-red-300 transition-all duration-200"
                  >
                    🗑️ Clear Cart
                  </button>
                </div>
              )}
            </div>

            {/* Checkout Panel */}
            {showCheckout && items.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">✅</span> Checkout
                </h2>

                {/* Customer Selection */}
                <div className="mb-5">
                  <label className="block text-sm font-bold mb-3 text-gray-700">👥 Customer (Optional)</label>
                  <input
                    type="text"
                    placeholder="Search customer by name, email, or phone..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      searchCustomers(e.target.value)
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all bg-gray-50/50"
                  />
                  {customers.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-32 overflow-y-auto">
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setCustomerSearch(customer.name)
                            setCustomers([])
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100"
                        >
                          <p className="font-medium text-sm">{customer.name}</p>
                          <p className="text-xs text-gray-500">
                            Points: {customer.loyalty_points}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedCustomer && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium">{selectedCustomer.name}</p>
                      <p className="text-xs text-gray-600">
                        Loyalty Points: {selectedCustomer.loyalty_points}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    + Create New Customer
                  </button>
                </div>

                {/* Discount */}
                <div className="mb-5">
                  <label className="block text-sm font-bold mb-3 text-gray-700">🏷️ Discount</label>
                  {/* Discount Type Selector */}
                  <div className="flex gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setDiscountType('amount')}
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                        discountType === 'amount'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      💵 Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                        discountType === 'percentage'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder={discountType === 'percentage' ? '0' : '0.00'}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all bg-gray-50/50 font-semibold"
                      min="0"
                      max={discountType === 'percentage' ? '100' : undefined}
                      step={discountType === 'percentage' ? '1' : '0.01'}
                    />
                    <button
                      onClick={handleApplyDiscount}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      ✓ Apply
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-3 text-gray-700">💳 Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['cash', 'card', 'other'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-4 rounded-xl font-bold capitalize transition-all duration-200 ${
                          paymentMethod === method
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {method === 'cash' && '💵'}
                        {method === 'card' && '💳'}
                        {method === 'other' && '📄'}
                        <br />
                        <span className="text-xs">{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complete Transaction */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-5 rounded-xl font-extrabold text-xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Complete Sale - ${settings.currency} ${total.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Creation Modal */}
      <CreateCustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerCreated={(newCustomer) => {
          setSelectedCustomer(newCustomer)
          setCustomerSearch(newCustomer.name)
          setShowCustomerModal(false)
        }}
      />
    </div>
  )
}
