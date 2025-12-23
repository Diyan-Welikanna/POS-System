# API Documentation

## Authentication

All API requests require authentication via Supabase. Include the session token in requests.

### Auth Endpoints (via Supabase)

#### Sign Up
```typescript
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

#### Sign In
```typescript
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

#### Sign Out
```typescript
await supabase.auth.signOut()
```

## Products API

### Get All Products
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*, categories(*)')
  .order('name')
```

### Get Product by ID
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .single()
```

### Get Product by Barcode
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('barcode', barcodeValue)
  .single()
```

### Create Product
```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    sku: 'PROD001',
    name: 'Product Name',
    price: 29.99,
    stock_quantity: 100,
    category_id: 'uuid'
  })
```

### Update Product
```typescript
const { data, error } = await supabase
  .from('products')
  .update({ stock_quantity: 50 })
  .eq('id', productId)
```

### Delete Product
```typescript
const { data, error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId)
```

## Transactions API

### Create Transaction
```typescript
const { data: transaction, error } = await supabase
  .from('transactions')
  .insert({
    cashier_id: userId,
    customer_id: customerId, // optional
    subtotal: 100.00,
    tax: 10.00,
    discount: 5.00,
    total: 105.00,
    payment_method: 'cash'
  })
  .select()
  .single()

// Add transaction items
const { error: itemsError } = await supabase
  .from('transaction_items')
  .insert([
    {
      transaction_id: transaction.id,
      product_id: 'product-uuid',
      quantity: 2,
      unit_price: 50.00,
      total: 100.00
    }
  ])
```

### Get Transactions
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select(`
    *,
    cashier:profiles(*),
    customer:customers(*),
    items:transaction_items(*, product:products(*))
  `)
  .order('created_at', { ascending: false })
```

### Get Transaction by ID
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*, items:transaction_items(*, product:products(*))')
  .eq('id', transactionId)
  .single()
```

## Inventory API

### Get Low Stock Products
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .lt('stock_quantity', supabase.raw('low_stock_threshold'))
```

### Add Stock Movement
```typescript
const { data, error } = await supabase
  .from('stock_movements')
  .insert({
    product_id: productId,
    quantity_change: 50,
    type: 'restock',
    user_id: userId,
    notes: 'Weekly restock'
  })

// Also update product stock
await supabase
  .from('products')
  .update({ 
    stock_quantity: supabase.raw('stock_quantity + 50')
  })
  .eq('id', productId)
```

### Get Stock History
```typescript
const { data, error } = await supabase
  .from('stock_movements')
  .select('*, product:products(*), user:profiles(*)')
  .eq('product_id', productId)
  .order('created_at', { ascending: false })
```

## Customers API

### Create Customer
```typescript
const { data, error } = await supabase
  .from('customers')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  })
```

### Update Loyalty Points
```typescript
const { data, error } = await supabase
  .from('customers')
  .update({ 
    loyalty_points: supabase.raw('loyalty_points + 10')
  })
  .eq('id', customerId)
```

### Get Customer by Email
```typescript
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('email', email)
  .single()
```

## Analytics API

### Sales by Date Range
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('created_at, total')
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .eq('status', 'completed')
```

### Top Selling Products
```typescript
const { data, error } = await supabase
  .from('transaction_items')
  .select('product_id, products(name), quantity, total')
  .gte('created_at', startDate)
  .order('quantity', { ascending: false })
  .limit(10)
```

### Cashier Performance
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('cashier_id, profiles(full_name), total')
  .gte('created_at', startDate)
  .eq('status', 'completed')
```

## Real-time Subscriptions

### Subscribe to Product Updates
```typescript
const channel = supabase
  .channel('product-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'products'
    },
    (payload) => {
      console.log('Product changed:', payload)
    }
  )
  .subscribe()
```

### Subscribe to New Transactions
```typescript
const channel = supabase
  .channel('new-transactions')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'transactions'
    },
    (payload) => {
      console.log('New transaction:', payload)
    }
  )
  .subscribe()
```

## Error Handling

All Supabase queries return `{ data, error }`. Always check for errors:

```typescript
const { data, error } = await supabase.from('products').select()

if (error) {
  console.error('Error:', error.message)
  // Handle error appropriately
}

// Use data
console.log(data)
```

## Rate Limiting

Supabase has built-in rate limiting. For production:
- Free tier: 500 requests/minute
- Pro tier: Higher limits available

## Response Formats

### Success Response
```json
{
  "data": [...],
  "error": null,
  "count": 10,
  "status": 200,
  "statusText": "OK"
}
```

### Error Response
```json
{
  "data": null,
  "error": {
    "message": "Error description",
    "details": "...",
    "hint": "...",
    "code": "42501"
  }
}
```
