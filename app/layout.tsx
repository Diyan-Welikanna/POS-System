import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import '../styles/custom-scrollbar.css'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { SettingsProvider } from '@/context/SettingsContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ServiceWorkerInit from '@/components/ServiceWorkerInit'
import OfflineIndicator from '@/components/OfflineIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'POS System',
  description: 'Modern Point of Sale System with Inventory Management',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <ServiceWorkerInit />
              <OfflineIndicator />
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </div>
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
