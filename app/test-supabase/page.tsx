'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  count?: number
}

export default function SupabaseTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const testResults: TestResult[] = []

    // Test 1: Auth Session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      testResults.push({
        name: 'Auth Session',
        status: error ? 'error' : (session ? 'success' : 'error'),
        message: error ? error.message : (session ? `Logged in as ${session.user.email}` : 'Not logged in')
      })
    } catch (error: any) {
      testResults.push({
        name: 'Auth Session',
        status: 'error',
        message: error.message
      })
    }

    // Test 2: Products
    try {
      const { data, error } = await supabase.from('products').select('*').limit(5)
      testResults.push({
        name: 'Products Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connection successful',
        count: data?.length || 0
      })
    } catch (error: any) {
      testResults.push({
        name: 'Products Table',
        status: 'error',
        message: error.message
      })
    }

    // Test 3: Categories
    try {
      const { data, error } = await supabase.from('categories').select('*')
      testResults.push({
        name: 'Categories Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connection successful',
        count: data?.length || 0
      })
    } catch (error: any) {
      testResults.push({
        name: 'Categories Table',
        status: 'error',
        message: error.message
      })
    }

    // Test 4: Customers
    try {
      const { data, error } = await supabase.from('customers').select('*').limit(5)
      testResults.push({
        name: 'Customers Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connection successful',
        count: data?.length || 0
      })
    } catch (error: any) {
      testResults.push({
        name: 'Customers Table',
        status: 'error',
        message: error.message
      })
    }

    // Test 5: Transactions
    try {
      const { data, error } = await supabase.from('transactions').select('*').limit(5)
      testResults.push({
        name: 'Transactions Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connection successful',
        count: data?.length || 0
      })
    } catch (error: any) {
      testResults.push({
        name: 'Transactions Table',
        status: 'error',
        message: error.message
      })
    }

    // Test 6: Profiles
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(5)
      testResults.push({
        name: 'Profiles Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connection successful',
        count: data?.length || 0
      })
    } catch (error: any) {
      testResults.push({
        name: 'Profiles Table',
        status: 'error',
        message: error.message
      })
    }

    // Test 7: Stock Movements
    try {
      const { data, error } = await supabase.from('stock_movements').select('*').limit(5)
      testResults.push({
        name: 'Stock Movements Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connection successful',
        count: data?.length || 0
      })
    } catch (error: any) {
      testResults.push({
        name: 'Stock Movements Table',
        status: 'error',
        message: error.message
      })
    }

    setResults(testResults)
    setTesting(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const passedTests = results.filter(r => r.status === 'success').length
  const totalTests = results.length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Supabase Connection Test</h1>
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={runTests}
                disabled={testing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Run Tests Again'}
              </button>
              
              {results.length > 0 && (
                <div className="text-lg font-semibold">
                  {passedTests === totalTests ? (
                    <span className="text-green-600">✅ All tests passed ({passedTests}/{totalTests})</span>
                  ) : (
                    <span className="text-red-600">⚠️ {passedTests}/{totalTests} tests passed</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${
                  result.status === 'success'
                    ? 'border-green-300 bg-green-50'
                    : result.status === 'error'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳'}
                      </span>
                      <h3 className="font-semibold text-gray-800">{result.name}</h3>
                    </div>
                    <p className={`text-sm ${result.status === 'error' ? 'text-red-700' : 'text-gray-600'}`}>
                      {result.message}
                    </p>
                    {result.count !== undefined && (
                      <p className="text-sm text-gray-500 mt-1">
                        Records found: {result.count}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Running tests...
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Environment Info</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Supabase URL:</strong>{' '}
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}
              </p>
              <p>
                <strong>Supabase Key:</strong>{' '}
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Common Issues & Solutions</h3>
            <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
              <li>If &quot;Not logged in&quot;: Go to <Link href="/auth/login" className="underline">/auth/login</Link> first</li>
              <li>If tables show errors: Run the schema.sql in Supabase SQL Editor</li>
              <li>If auth errors: Check .env.local has correct Supabase credentials</li>
              <li>If RLS errors: Ensure Row Level Security policies are set up</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
