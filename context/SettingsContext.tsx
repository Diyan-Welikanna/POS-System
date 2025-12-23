'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface Settings {
  taxRate: number // e.g., 0.1 for 10%
  currency: string // e.g., '$', 'Rs', '€'
  // Future settings can be added here
  // receiptHeader: string
  // etc.
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  loading: boolean
}

const defaultSettings: Settings = {
  taxRate: 0.1, // 10% default
  currency: '$', // USD default
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('pos_settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    setLoading(false)
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('pos_settings', JSON.stringify(updated))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
