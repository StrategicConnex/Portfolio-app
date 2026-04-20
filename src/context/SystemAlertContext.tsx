'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface SystemAlert {
  id: number
  level: 'ALERT' | 'WARN' | 'INFO'
  src: string
  msg: string
  timestamp: string
}

interface SystemAlertContextType {
  lastAlert: SystemAlert | null
  broadcastAlert: (alert: SystemAlert) => void
}

const SystemAlertContext = createContext<SystemAlertContextType | undefined>(undefined)

export function SystemAlertProvider({ children }: { children: React.ReactNode }) {
  const [lastAlert, setLastAlert] = useState<SystemAlert | null>(null)

  const broadcastAlert = useCallback((alert: SystemAlert) => {
    // Only broadcast ALERT level to the system for reaction
    if (alert.level === 'ALERT') {
      setLastAlert(alert)
    }
  }, [])

  return (
    <SystemAlertContext.Provider value={{ lastAlert, broadcastAlert }}>
      {children}
    </SystemAlertContext.Provider>
  )
}

export function useSystemAlert() {
  const context = useContext(SystemAlertContext)
  if (context === undefined) {
    throw new Error('useSystemAlert must be used within a SystemAlertProvider')
  }
  return context
}
