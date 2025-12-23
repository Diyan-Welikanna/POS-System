// Supabase Connection Test
// Run this in browser console to verify all connections work

import { supabase } from '@/lib/supabaseClient'

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')
  
  const results = {
    auth: false,
    products: false,
    categories: false,
    customers: false,
    transactions: false,
    profiles: false,
  }

  try {
    // Test 1: Check Supabase client initialization
    console.log('1️⃣ Testing client initialization...')
    if (supabase) {
      console.log('✅ Supabase client initialized')
    } else {
      console.error('❌ Supabase client not initialized')
      return results
    }

    // Test 2: Test Auth Session
    console.log('\n2️⃣ Testing Auth Session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('❌ Auth session error:', sessionError.message)
    } else if (session) {
      console.log('✅ Auth session active:', session.user.email)
      results.auth = true
    } else {
      console.log('⚠️ No active session (user not logged in)')
    }

    // Test 3: Test Products Table
    console.log('\n3️⃣ Testing Products table...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1)
    
    if (productsError) {
      console.error('❌ Products query error:', productsError.message)
    } else {
      console.log(`✅ Products table accessible (${products?.length || 0} products)`)
      results.products = true
    }

    // Test 4: Test Categories Table
    console.log('\n4️⃣ Testing Categories table...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1)
    
    if (categoriesError) {
      console.error('❌ Categories query error:', categoriesError.message)
    } else {
      console.log(`✅ Categories table accessible (${categories?.length || 0} categories)`)
      results.categories = true
    }

    // Test 5: Test Customers Table
    console.log('\n5️⃣ Testing Customers table...')
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1)
    
    if (customersError) {
      console.error('❌ Customers query error:', customersError.message)
    } else {
      console.log(`✅ Customers table accessible (${customers?.length || 0} customers)`)
      results.customers = true
    }

    // Test 6: Test Transactions Table
    console.log('\n6️⃣ Testing Transactions table...')
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .limit(1)
    
    if (transactionsError) {
      console.error('❌ Transactions query error:', transactionsError.message)
    } else {
      console.log(`✅ Transactions table accessible (${transactions?.length || 0} transactions)`)
      results.transactions = true
    }

    // Test 7: Test Profiles Table
    console.log('\n7️⃣ Testing Profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Profiles query error:', profilesError.message)
    } else {
      console.log(`✅ Profiles table accessible (${profiles?.length || 0} profiles)`)
      results.profiles = true
    }

    // Summary
    console.log('\n📊 Test Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`)
    })
    
    const passedCount = Object.values(results).filter(r => r).length
    const totalCount = Object.keys(results).length
    console.log(`\n${passedCount}/${totalCount} tests passed`)
    
    if (passedCount === totalCount) {
      console.log('\n🎉 All Supabase connections working!')
    } else {
      console.log('\n⚠️ Some connections failed. Check errors above.')
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }

  return results
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('Supabase connection test loaded. Call testSupabaseConnection() to run.')
}
