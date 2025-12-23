'use client'

import { useState, useEffect } from 'react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  isActive?: boolean
}

export default function BarcodeScanner({ onScan, isActive = true }: BarcodeScannerProps) {
  const [buffer, setBuffer] = useState('')
  const [lastKeyTime, setLastKeyTime] = useState(Date.now())

  useEffect(() => {
    if (!isActive) return

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime

      // If time between keystrokes is less than 50ms, it's likely a scanner
      if (timeDiff < 50 && e.key !== 'Enter') {
        setBuffer((prev) => prev + e.key)
        setLastKeyTime(currentTime)
      } else if (e.key === 'Enter' && buffer.length > 0) {
        // Submit the scanned barcode
        onScan(buffer)
        setBuffer('')
        setLastKeyTime(currentTime)
      } else {
        // Reset buffer if typing is too slow (manual input)
        setBuffer(e.key)
        setLastKeyTime(currentTime)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [buffer, lastKeyTime, onScan, isActive])

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-3">
        <svg
          className="w-6 h-6 text-blue-600 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            {isActive ? 'Barcode Scanner Active' : 'Scanner Inactive'}
          </p>
          <p className="text-xs text-blue-600">
            {buffer ? `Scanning: ${buffer}` : 'Ready to scan products'}
          </p>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        ></div>
      </div>
    </div>
  )
}
