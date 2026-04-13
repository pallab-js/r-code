'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface RecentFile {
  path: string
  name: string
  lastOpened: number
}

interface RecentFilesContextType {
  recentFiles: RecentFile[]
  addRecentFile: (path: string, name: string) => void
  removeRecentFile: (path: string) => void
  clearRecentFiles: () => void
}

const RecentFilesContext = createContext<RecentFilesContextType>({
  recentFiles: [],
  addRecentFile: () => {},
  removeRecentFile: () => {},
  clearRecentFiles: () => {},
})

export function useRecentFiles() {
  return useContext(RecentFilesContext)
}

const MAX_RECENT_FILES = 10

interface RecentFilesProviderProps {
  children: ReactNode
}

export function RecentFilesProvider({ children }: RecentFilesProviderProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('r-code-recent-files')
    if (stored) {
      try {
        setRecentFiles(JSON.parse(stored))
      } catch {
        setRecentFiles([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('r-code-recent-files', JSON.stringify(recentFiles))
  }, [recentFiles])

  const addRecentFile = useCallback((path: string, name: string) => {
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.path !== path)
      const updated = [{ path, name, lastOpened: Date.now() }, ...filtered].slice(0, MAX_RECENT_FILES)
      return updated
    })
  }, [])

  const removeRecentFile = useCallback((path: string) => {
    setRecentFiles(prev => prev.filter(f => f.path !== path))
  }, [])

  const clearRecentFiles = useCallback(() => {
    setRecentFiles([])
  }, [])

  return (
    <RecentFilesContext.Provider value={{ recentFiles, addRecentFile, removeRecentFile, clearRecentFiles }}>
      {children}
    </RecentFilesContext.Provider>
  )
}