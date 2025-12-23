# 🛒 Modern POS System

A full-featured Point of Sale (POS) system built with Next.js, TypeScript, and Supabase. Features real-time inventory management, role-based access control, offline support, and comprehensive analytics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## ✨ Features

### 🎯 Core Features

- **📦 Product Catalog & Inventory Management**
  - Add, edit, delete products with SKU, barcode, stock, and price
  - Real-time stock updates across multiple terminals
  - Low-stock alerts and restock logs
  - Category-based organization

- **💳 POS Interface (Cart & Checkout)**
  - Barcode scanning for quick item entry
  - Discounts, taxes, and loyalty points at checkout
  - Multiple payment methods (cash, card, manual)
  - Fast and intuitive cashier interface

- **🧾 Receipt Generation**
  - PDF receipts via jsPDF
  - Email receipts (planned)
  - SMS receipts (planned)
  - Bluetooth printer integration (planned)

- **👥 Role-Based Access Control (RBAC)**
  - **Admin**: Full system control (users, inventory, reports)
  - **Manager**: Inventory management + analytics
  - **Cashier**: Sales transactions only
  - Enforced via Supabase Auth + JWT

- **📊 Analytics Dashboard**
  - Sales trends and revenue charts
  - Top products and categories
  - Cashier performance metrics
  - Exportable reports
  - Real-time data visualization

- **🎁 Customer Loyalty System**
  - Points earned per purchase
  - Redeemable discounts
  - Customer profile management
  - Loyalty tracking

- **🔄 Multi-Terminal Sync**
  - Real-time inventory updates via Supabase Realtime
  - Instant transaction broadcasting
  - Synchronized across all devices

- **📱 PWA Support**
  - Installable on Android/iOS
  - Offline capability
  - App-like experience
  - Custom icons and manifest

- **🔒 Security & Audit**
  - JWT-based authentication
  - Row-level security policies
  - Comprehensive audit logging
  - Activity tracking

## 🚀 Technologies Used

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Chart.js](https://www.chartjs.org/)** / **[Recharts](https://recharts.org/)** - Data visualization

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database + Auth + Realtime
- **IndexedDB** - Offline caching
- **Service Workers** - PWA capabilities

### Utilities
- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF generation
- **[@zxing/library](https://github.com/zxing-js/library)** - Barcode scanning
- **[idb](https://github.com/jakearchibald/idb)** - IndexedDB wrapper

### Deployment
- **[Vercel](https://vercel.com/)** - Frontend hosting
- **[Supabase Cloud](https://supabase.com/)** - Backend hosting
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Supabase account** (free tier works)
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pos-system.git
cd pos-system
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `pos-system`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to you
4. Wait ~2 minutes for setup to complete

#### Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key

#### Run the Database Schema

1. Open **SQL Editor** in Supabase Dashboard
2. Copy the entire contents of `db/schema.sql`
3. Paste into the SQL Editor
4. Click **RUN**
5. Verify success message appears

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
pos-system/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   ├── pos/                 # POS terminal pages
│   ├── inventory/           # Inventory management
│   ├── reports/             # Analytics dashboard
│   └── auth/                # Login/signup pages
├── components/              # Reusable React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Receipt.tsx
│   ├── BarcodeScanner.tsx
│   └── LoyaltyCard.tsx
├── context/                 # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   └── CartContext.tsx     # Shopping cart state
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts          # Auth utilities
│   ├── useOfflineSync.ts   # Offline sync
│   └── usePrinter.ts       # Printer integration
├── lib/                     # Utility libraries
│   ├── supabaseClient.ts   # Supabase configuration
│   └── analytics.ts        # Analytics utilities
├── types/                   # TypeScript type definitions
│   └── database.ts         # Database types
├── styles/                  # Global styles
│   └── globals.css
├── db/                      # Database files
│   └── schema.sql          # PostgreSQL schema
├── docs/                    # Documentation
│   ├── architecture.md
│   ├── api.md
│   └── roadmap.md
├── public/                  # Static assets
│   ├── manifest.json       # PWA manifest
│   └── icons/              # App icons
└── tests/                   # Test files
    ├── pos.test.tsx
    ├── inventory.test.tsx
    └── auth.test.tsx
```

## 🎮 Usage

### Creating Your First Admin User

1. Sign up at `/auth/signup` with your email
2. Go to Supabase Dashboard → **Table Editor** → **profiles**
3. Find your user and change `role` from `cashier` to `admin`
4. Refresh the app - you now have full access!

### Using the POS Terminal

1. Navigate to `/pos`
2. Scan or search for products
3. Add items to cart
4. Apply discounts if needed
5. Select payment method
6. Complete transaction
7. Generate receipt

### Managing Inventory

1. Go to `/inventory`
2. Add new products with SKU, barcode, price
3. Set low-stock thresholds
4. Track stock movements
5. View low-stock alerts

### Viewing Analytics

1. Visit `/reports`
2. View sales trends
3. Check top products
4. Monitor cashier performance
5. Export reports

## 🧪 Testing

Run tests with:

```bash
npm run test
# or
yarn test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Import Project"**
4. Select your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**

### Supabase Production Setup

1. Ensure your database schema is applied
2. Enable Row Level Security on all tables
3. Configure auth providers if needed
4. Set up backup policies
5. Monitor usage in dashboard

## 📊 Database Schema

### Key Tables

- **profiles** - User accounts with roles
- **products** - Product catalog
- **categories** - Product categories
- **transactions** - Sales records
- **transaction_items** - Line items
- **customers** - Customer data + loyalty
- **stock_movements** - Inventory audit trail
- **audit_logs** - System activity logs

See [db/schema.sql](db/schema.sql) for complete schema.

## 🔐 Security

- **Authentication**: Supabase Auth with JWT
- **Authorization**: Row Level Security (RLS) policies
- **Data Validation**: TypeScript + Zod schemas
- **Audit Logging**: All actions tracked
- **HTTPS Only**: Enforced in production

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Vercel](https://vercel.com/) for hosting

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

## 🗺️ Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned features and timeline.

### Current Phase: POS Terminal Development
- [x] Core foundation
- [ ] Barcode scanning
- [ ] Receipt generation
- [ ] Transaction processing

### Next Phases
- Inventory management enhancements
- Advanced analytics
- Offline support
- Payment gateway integration

---

**Built with ❤️ using Next.js and Supabase**
