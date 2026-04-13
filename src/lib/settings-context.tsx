'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Settings {
  fontSize: number
  theme: 'light' | 'dark'
  fontFamily: string
  tabSize: number
}

const defaultSettings: Settings = {
  fontSize: 14,
  theme: 'light',
  fontFamily: 'berkeleyMono',
  tabSize: 2,
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  isLoading: true,
})

export function useSettings() {
  return useContext(SettingsContext)
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      saveSettings(settings)
    }
  }, [settings, isLoading])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const loadSettings = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        const loaded = await invoke<Settings>('load_settings')
        if (loaded) {
          setSettings(loaded)
        }
      }
    } catch (error) {
      console.log('Using default settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (settingsToSave: Settings) => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('save_settings', { settings: settingsToSave })
      }
    } catch (error) {
      console.log('Settings save skipped (Tauri not available)')
    }
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}
