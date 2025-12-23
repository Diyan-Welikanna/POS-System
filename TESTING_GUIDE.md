# POS System Testing Guide

## Prerequisites
- ✅ Supabase project configured with schema
- ✅ Environment variables set in `.env.local`
- ✅ Dependencies installed (`npm install`)

---

## Step 1: Start the Development Server

```bash
npm run dev
```

**Expected Result:**
- Server runs on http://localhost:3000
- No compilation errors
- Console shows "compiled successfully"

---

## Step 2: Database Setup (First Time Only)

### 2.1 Run the Schema in Supabase

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy entire content from `db/schema.sql`
5. Paste and click **Run**

**Expected Result:**
- ✅ Message: "Database schema created successfully! ✅"
- 8 tables created: profiles, products, categories, customers, transactions, transaction_items, stock_movements, audit_logs
- Sample data inserted (4 categories, 4 products)

### 2.2 Enable Realtime (Required for Phase 5)

1. In Supabase Dashboard, go to **Database** → **Replication**
2. Enable replication for these tables:
   - ✅ products
   - ✅ categories
   - ✅ transactions
   - ✅ stock_movements

**Expected Result:**
- Green checkmarks next to each table
- Realtime status: "Active"

---

## Step 3: User Authentication Testing

### 3.1 Create Admin User

1. Visit http://localhost:3000/auth/signup
2. Fill in:
   - Email: `admin@test.com`
   - Password: `password123`
   - Full Name: `Admin User`
3. Click **Sign Up**

**Expected Result:**
- Redirect to home page
- User logged in
- Navbar shows "Admin User"

### 3.2 Set Admin Role (In Supabase)

1. Go to Supabase → **Table Editor** → **profiles**
2. Find row with email `admin@test.com`
3. Edit `role` column: Change `cashier` → `admin`
4. Save

**Expected Result:**
- Role updated to `admin`
- Refresh browser - user now has admin access

### 3.3 Create Additional Users

Repeat signup for:
- **Manager**: `manager@test.com` (set role to `manager`)
- **Cashier**: `cashier@test.com` (keep role as `cashier`)

---

## Step 4: Test Inventory Management (Phase 3)

### 4.1 Access Inventory

1. Login as **Admin** or **Manager**
2. Click **Inventory** in navbar
3. Visit http://localhost:3000/inventory

**Expected Result:**
- See 4 sample products
- Stats cards show: 4 total products, 4 categories, 0 low stock, 0 out of stock
- Search and filter controls visible

### 4.2 Add New Product

1. Click **Add Product** button
2. Fill form:
   - SKU: `TEST001`
   - Barcode: `9999999999999`
   - Name: `Test Product`
   - Price: `25.00`
   - Category: Select any
   - Stock: `50`
   - Low Stock Threshold: `10`
3. Click **Save**

**Expected Result:**
- Modal closes
- Alert: "Product added successfully!"
- New product appears in table
- Total products: 5

### 4.3 Edit Product

1. Find product in table
2. Click **Edit** button
3. Change price to `30.00`
4. Click **Save**

**Expected Result:**
- Alert: "Product updated successfully!"
- Price updated in table

### 4.4 Adjust Stock

1. Click **Adjust Stock** button on any product
2. Select **Restock**
3. Enter quantity: `20`
4. Add notes: `Test restock`
5. Click **Save**

**Expected Result:**
- Alert: "Stock adjusted successfully!"
- Stock quantity increased by 20
- Preview shows new total before saving

### 4.5 View Stock Movements

1. Click **Stock Movements** link in inventory page
2. Visit http://localhost:3000/inventory/stock-movements

**Expected Result:**
- See history of stock changes
- "Restock" entry with +20 quantity
- Color-coded badges (green for restock)
- User name shown in "User" column

### 4.6 Manage Categories

1. Click **Categories** link
2. Visit http://localhost:3000/inventory/categories
3. Click **Add Category**
4. Enter:
   - Name: `Test Category`
   - Description: `For testing`
5. Click **Save**

**Expected Result:**
- Alert: "Category added successfully!"
- New category appears in table
- Total categories: 5

---

## Step 5: Test POS Terminal (Phase 2)

### 5.1 Access POS

1. Login as any user (admin, manager, or cashier)
2. Click **POS** in navbar
3. Visit http://localhost:3000/pos

**Expected Result:**
- Product grid on left
- Empty cart on right
- Barcode scanner visible
- Payment section at bottom

### 5.2 Add Products to Cart

**Method 1: Click Product**
1. Click any product card
2. Product appears in cart
3. Quantity: 1

**Method 2: Search**
1. Type product name in search box
2. Click filtered product

**Method 3: Barcode Scanner**
1. Click **Scan Barcode** button
2. Allow camera access
3. Scan a barcode OR type barcode: `1234567890123`
4. Product added to cart

**Expected Result:**
- Cart shows product details
- Subtotal calculates correctly
- Tax (10%) calculated
- Total = Subtotal + Tax - Discount

### 5.3 Modify Cart

1. Click **+** to increase quantity
2. Click **-** to decrease quantity
3. Click **Remove** to delete item

**Expected Result:**
- Quantities update
- Totals recalculate
- Cart empties when all items removed

### 5.4 Add Customer (Optional)

1. Type customer name in search: `John`
2. Click **+ Create New Customer**
3. Fill form:
   - Name: `John Doe`
   - Email: `john@test.com`
   - Phone: `1234567890`
4. Click **Create**

**Expected Result:**
- Modal closes
- Customer selected
- Shows in checkout section

### 5.5 Apply Discount

1. Enter discount amount: `5.00`
2. Click **Apply**

**Expected Result:**
- Discount shows in cart
- Total reduced by $5.00

### 5.6 Complete Checkout

1. Add at least 1 product to cart
2. Select payment method: **Cash**
3. Click **Checkout**
4. Confirm checkout

**Expected Result:**
- Alert: "Transaction completed successfully!"
- PDF receipt auto-downloads
- Cart cleared
- Stock quantity decreased (check inventory page)

### 5.7 View Transaction History

1. Click **Transaction History** link
2. Visit http://localhost:3000/pos/transactions

**Expected Result:**
- See completed transaction
- Shows date, items, total, payment method
- Cashier name displayed

---

## Step 6: Test Analytics Dashboard (Phase 4)

### 6.1 Access Reports

1. Login as **Admin** or **Manager**
2. Click **Reports** in navbar
3. Visit http://localhost:3000/reports

**Expected Result:**
- 4 stat cards (Revenue, Transactions, Avg Transaction, Products Sold)
- Date range filter (default: last 30 days)
- 4 charts: Sales Trend, Top Products, Category Performance, Cashier Performance

### 6.2 Test Date Filters

1. Set start date: 7 days ago
2. Set end date: Today
3. Click **Apply Filter**

**Expected Result:**
- Charts update with filtered data
- Stats recalculate
- Only transactions in date range shown

### 6.3 Verify Charts

**Sales Trend (Line Chart):**
- Shows daily revenue
- X-axis: Dates
- Y-axis: Revenue ($)

**Top Products (Bar Chart):**
- Shows top 10 products by revenue
- Sorted highest to lowest

**Category Performance (Doughnut Chart):**
- Shows revenue by category
- Color-coded slices
- Legend at bottom

**Cashier Performance (Bar Chart):**
- Shows sales per cashier
- Total revenue per user

### 6.4 Check Detailed Tables

Scroll down to see:
- Top Products Details (Product, Qty Sold, Revenue)
- Cashier Details (Cashier, Transactions, Sales)

---

## Step 7: Test Offline Support (Phase 5)

### 7.1 Verify Service Worker

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**

**Expected Result:**
- Service worker registered
- Status: "activated and is running"
- Source: `/sw.js`

### 7.2 Check IndexedDB

1. In DevTools → **Application** → **IndexedDB**
2. Expand `pos_system_db`

**Expected Result:**
- 5 object stores visible:
  - products
  - categories
  - customers
  - offline_transactions
  - sync_queue

### 7.3 Test Offline Mode

**Step 1: Go Offline**
1. In DevTools → **Network** tab
2. Check **Offline** checkbox
3. Refresh page

**Expected Result:**
- Offline page shows OR app still loads from cache
- Offline indicator appears (bottom-right corner)
- Yellow warning: "Offline Mode"

**Step 2: Process Offline Sale**
1. Go to POS page (should load from cache)
2. Add products to cart (loads from IndexedDB)
3. Complete checkout
4. Click **Checkout**

**Expected Result:**
- Alert: "Transaction saved offline. Will sync when connection is restored."
- Transaction stored in IndexedDB
- Cart cleared
- Offline indicator shows "Pending Sync: 1 transaction(s)"

**Step 3: Go Back Online**
1. Uncheck **Offline** in DevTools
2. Wait 2-3 seconds

**Expected Result:**
- Offline indicator shows "Syncing..."
- Auto-sync starts
- Alert: "Synced successfully!" (or check console)
- Transaction appears in Supabase
- Pending count: 0
- Offline indicator hides

### 7.4 Manual Sync Test

1. Go offline
2. Process 2-3 sales
3. Go back online
4. Click **Sync Now** button in offline indicator

**Expected Result:**
- All transactions sync to Supabase
- Success message
- Pending count resets to 0

---

## Step 8: Test Realtime Sync (Phase 5)

### 8.1 Setup Two Browsers

1. Open Chrome: http://localhost:3000
2. Open Firefox (or Chrome Incognito): http://localhost:3000
3. Login to both

### 8.2 Test Product Updates

**In Browser 1:**
1. Go to Inventory
2. Edit product "Wireless Mouse"
3. Change price to $35.00
4. Save

**In Browser 2:**
1. Watch Inventory page
2. Wait 1-2 seconds

**Expected Result:**
- Browser 2 automatically refreshes
- Price updates to $35.00 WITHOUT manual refresh
- Console shows: "[Realtime] Product update"

### 8.3 Test Stock Changes

**In Browser 1:**
1. Go to POS
2. Sell 5x "Wireless Mouse"
3. Complete checkout

**In Browser 2:**
1. Watch Inventory page

**Expected Result:**
- Stock quantity decreases automatically
- Updates in real-time
- No page refresh needed

### 8.4 Test Category Sync

**In Browser 1:**
1. Add new category "Test Realtime"

**In Browser 2:**
1. Watch Categories page

**Expected Result:**
- New category appears automatically
- Realtime update within 1-2 seconds

---

## Step 9: Test Role-Based Access

### 9.1 Admin Access

Login as **admin@test.com**

**Can Access:**
- ✅ POS Terminal
- ✅ Inventory (full CRUD)
- ✅ Categories (full CRUD)
- ✅ Reports/Analytics
- ✅ Stock Movements
- ✅ Transaction History (all users)

### 9.2 Manager Access

Login as **manager@test.com**

**Can Access:**
- ✅ POS Terminal
- ✅ Inventory (full CRUD)
- ✅ Categories (full CRUD)
- ✅ Reports/Analytics
- ✅ Stock Movements
- ✅ Transaction History (all users)

**Cannot Access:**
- ❌ Admin-only features (none implemented yet)

### 9.3 Cashier Access

Login as **cashier@test.com**

**Can Access:**
- ✅ POS Terminal
- ✅ Transaction History (own only)

**Cannot Access:**
- ❌ Inventory Management
- ❌ Reports/Analytics
- ❌ Stock Movements
- ❌ Categories

**Expected Result:**
- Inventory page shows: "You don't have permission..."
- Reports page shows: "You don't have permission..."

---

## Step 10: PWA Testing

### 10.1 Test Manifest

1. Open DevTools → **Application** → **Manifest**

**Expected Result:**
- Name: "POS System - Point of Sale"
- Start URL: "/"
- Display: "standalone"
- Theme color: "#0ea5e9"
- 3 shortcuts visible (POS, Inventory, Analytics)
- Icons listed (multiple sizes)

### 10.2 Test Install Prompt

**On Desktop (Chrome/Edge):**
1. Look for install icon in address bar
2. Click to install as PWA

**On Mobile:**
1. Open in Chrome/Safari
2. Menu → "Add to Home Screen"

**Expected Result:**
- App installs as standalone application
- Launches in app window (no browser UI)
- Works like native app

### 10.3 Test Offline Page

1. Go offline (disconnect internet)
2. Try to visit a new URL
3. Service worker serves offline page

**Expected Result:**
- Shows custom offline.html page
- Message: "You're Offline"
- Auto-retry every 5 seconds
- Lists offline features available

---

## Common Issues & Troubleshooting

### Issue: "No products showing in POS"
**Solution:**
- Check if sample data inserted in Supabase
- Run schema.sql seed data section
- Verify RLS policies allow SELECT

### Issue: "Transaction checkout fails"
**Solution:**
- Check browser console for errors
- Verify user is logged in
- Check Supabase RLS policies
- Ensure products have sufficient stock

### Issue: "Charts not showing data"
**Solution:**
- Complete at least 1 transaction first
- Check date range filter
- Verify transactions exist in Supabase

### Issue: "Offline sync not working"
**Solution:**
- Check DevTools → Console for errors
- Verify service worker is active
- Check Network tab - should go from offline to online
- Clear IndexedDB and try again

### Issue: "Realtime not updating"
**Solution:**
- Enable replication in Supabase Dashboard
- Check browser console for Realtime connection
- Verify both browsers are logged in
- Wait 2-3 seconds for propagation

### Issue: "Permission denied errors"
**Solution:**
- Check user role in Supabase profiles table
- Verify RLS policies are enabled
- Logout and login again

---

## Performance Benchmarks

**Expected Load Times:**
- Home page: < 1s
- POS page: < 2s (loading products)
- Inventory page: < 2s
- Reports page: < 3s (processing analytics)

**Expected Response Times:**
- Product search: < 100ms
- Add to cart: Instant
- Checkout: < 2s
- Stock update: < 1s
- Realtime sync: 1-3s

---

## Testing Checklist

### Phase 1 - Foundation
- [ ] User signup works
- [ ] User login works
- [ ] Role assignment works
- [ ] Navbar shows user info
- [ ] Logout works

### Phase 2 - POS Terminal
- [ ] Products load in grid
- [ ] Search filters products
- [ ] Barcode scanner works
- [ ] Add to cart works
- [ ] Quantity controls work
- [ ] Customer creation works
- [ ] Discount applies correctly
- [ ] Checkout completes
- [ ] Receipt PDF downloads
- [ ] Stock decreases after sale
- [ ] Transaction history shows sales

### Phase 3 - Inventory
- [ ] Product list loads
- [ ] Search/filter works
- [ ] Add product works
- [ ] Edit product works
- [ ] Delete product works (admin)
- [ ] Stock adjustment works
- [ ] Stock movements logged
- [ ] Categories CRUD works
- [ ] Low stock alerts show

### Phase 4 - Analytics
- [ ] Stats cards calculate correctly
- [ ] Date range filter works
- [ ] Sales trend chart renders
- [ ] Top products chart renders
- [ ] Category pie chart renders
- [ ] Cashier performance shows
- [ ] Tables show detailed data

### Phase 5 - Offline & Realtime
- [ ] Service worker registers
- [ ] IndexedDB creates stores
- [ ] Products cache for offline
- [ ] Offline sales queue
- [ ] Auto-sync on reconnect
- [ ] Manual sync works
- [ ] Offline indicator shows
- [ ] Realtime product updates work
- [ ] Realtime stock updates work
- [ ] Multi-terminal sync works
- [ ] PWA installs
- [ ] Offline page shows

---

## Next Steps After Testing

1. **Fix any bugs found**
2. **Add more test data** (products, customers)
3. **Test with real barcode scanner** (USB/Bluetooth)
4. **Deploy to production** (Vercel + Supabase)
5. **Configure custom domain**
6. **Setup production environment variables**
7. **Enable Supabase backups**

---

## Testing Complete! ✅

Your POS system is now fully tested and ready for production deployment.
