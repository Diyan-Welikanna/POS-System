# POS System Architecture

## Overview
This POS (Point of Sale) system is built with modern web technologies focusing on performance, scalability, and offline-first capabilities.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Chart.js / React-Chartjs-2** - Data visualization

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - User authentication and authorization
- **Supabase Realtime** - Multi-terminal synchronization

### State Management
- **React Context API** - Global state (Auth, Cart)
- **IndexedDB** - Offline data caching

### Additional Libraries
- **jsPDF** - Receipt PDF generation
- **@zxing/library** - Barcode scanning
- **idb** - IndexedDB wrapper

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   POS    │  │ Inventory│  │ Analytics│  │  Auth   │ │
│  │ Terminal │  │Management│  │Dashboard │  │  Pages  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │             │             │            │       │
│         └─────────────┴─────────────┴────────────┘       │
│                           │                               │
│                    ┌──────▼──────┐                        │
│                    │  Context    │                        │
│                    │  Providers  │                        │
│                    └──────┬──────┘                        │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase      │
                    │   Client SDK    │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                     Backend Layer                         │
│                    ┌────────▼────────┐                     │
│                    │    Supabase     │                     │
│                    │    (Backend)    │                     │
│                    │                 │                     │
│  ┌─────────────┐  │  ┌───────────┐  │  ┌──────────────┐  │
│  │ PostgreSQL  │◄─┼──┤    Auth   │  ├──► Realtime API │  │
│  │  Database   │  │  │  Service  │  │  │  (WebSocket) │  │
│  └─────────────┘  │  └───────────┘  │  └──────────────┘  │
│                    └─────────────────┘                     │
└───────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables
1. **profiles** - User profiles with role-based access
2. **products** - Product catalog with SKU, barcode, pricing
3. **categories** - Product categorization
4. **transactions** - Sales transactions
5. **transaction_items** - Line items for each transaction
6. **customers** - Customer information and loyalty points
7. **stock_movements** - Inventory audit trail
8. **audit_logs** - System-wide audit logging

### Relationships
```
profiles (1) ──► (N) transactions
products (1) ──► (N) transaction_items
transactions (1) ──► (N) transaction_items
customers (1) ──► (N) transactions
categories (1) ──► (N) products
```

## Security Model

### Row Level Security (RLS)
All tables have RLS policies enforcing:
- **Cashiers**: Can create transactions, view their own sales
- **Managers**: Can manage inventory, view all transactions
- **Admins**: Full system access including user management

### Authentication Flow
1. User logs in via Supabase Auth
2. JWT token generated with user ID
3. Profile fetched with role information
4. RLS policies enforce permissions at database level
5. Client-side role checks for UI rendering

## Offline Support

### Strategy
- **Service Workers** - Cache static assets and API responses
- **IndexedDB** - Queue transactions when offline
- **Background Sync** - Auto-sync when connection restored

### Sync Process
```
1. User performs action while offline
2. Transaction saved to IndexedDB
3. UI updates optimistically
4. Service worker detects connectivity
5. Queued transactions pushed to Supabase
6. Local cache cleared on success
```

## Real-time Features

### Multi-Terminal Sync
- Inventory updates broadcast via Supabase Realtime
- New transactions trigger stock updates across all terminals
- Low-stock alerts synchronized

### Implementation
```typescript
supabase
  .channel('inventory-updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'products' },
    payload => updateLocalState(payload)
  )
  .subscribe()
```

## Performance Optimizations

1. **Static Generation** - Pre-render pages at build time
2. **Image Optimization** - Next.js Image component
3. **Code Splitting** - Automatic route-based splitting
4. **Lazy Loading** - Components loaded on demand
5. **Caching Strategy** - Service worker caches API calls

## Deployment Architecture

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Vercel     │      │    Supabase     │      │   GitHub     │
│  (Frontend)  │◄────►│   (Backend)     │◄─────┤  (CI/CD)     │
│              │      │                 │      │              │
│ - Next.js    │      │ - PostgreSQL    │      │ - Actions    │
│ - Edge       │      │ - Auth          │      │ - Workflows  │
│   Functions  │      │ - Realtime      │      │              │
└──────────────┘      └─────────────────┘      └──────────────┘
```

## Future Enhancements
- Bluetooth printer integration
- Advanced analytics with ML predictions
- Multi-location support
- Mobile app (React Native)
- API for third-party integrations
