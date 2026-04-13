'use client'

import { useState, useEffect, useCallback } from 'react'
import Editor from '@/components/Editor/Editor'
import SettingsPanel from '@/components/Settings/SettingsPanel'
import Sidebar from '@/components/Sidebar/Sidebar'
import TabBar from '@/components/Tabs/TabBar'
import StatusBar from '@/components/StatusBar/StatusBar'
import Terminal from '@/components/Terminal/Terminal'
import GitPanel from '@/components/Git/GitPanel'
import SearchPanel from '@/components/Search/SearchPanel'
import CommandPalette from '@/components/CommandPalette/CommandPalette'
import { SettingsProvider, useSettings } from '@/lib/settings-context'
import { TauriProvider, useTauri } from '@/lib/tauri-context'
import { RecentFilesProvider, useRecentFiles } from '@/lib/recent-files'

interface Command {
  id: string
  label: string
  shortcut?: string
  category: string
  action: () => void
}

function AppContent() {
  const [showSettings, setShowSettings] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showGit, setShowGit] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [sidebarWidth] = useState(240)
  const [repoPath, setRepoPath] = useState('/')
  const { settings } = useSettings()
  const { newFile, openFile, saveFile, readFile, closeFile, state, setCurrentFile } = useTauri()
  const { addRecentFile } = useRecentFiles() || { addRecentFile: () => {} }

  const toggleTerminal = useCallback(() => setShowTerminal(prev => !prev), [])
  const toggleSearch = useCallback(() => setShowSearch(prev => !prev), [])
  const toggleGit = useCallback(() => setShowGit(prev => !prev), [])

  const commands: Command[] = [
    { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', category: 'File', action: () => newFile() },
    { id: 'open-file', label: 'Open File', shortcut: 'Ctrl+O', category: 'File', action: () => openFile() },
    { id: 'save-file', label: 'Save File', shortcut: 'Ctrl+S', category: 'File', action: () => saveFile() },
    { id: 'close-file', label: 'Close File', category: 'File', action: () => { if (state.currentFile?.path) closeFile(state.currentFile.path) } },
    { id: 'settings', label: 'Open Settings', shortcut: 'Ctrl+,', category: 'View', action: () => setShowSettings(true) },
    { id: 'toggle-terminal', label: 'Toggle Terminal', shortcut: 'Ctrl+`', category: 'View', action: toggleTerminal },
    { id: 'toggle-search', label: 'Toggle Search', shortcut: 'Ctrl+Shift+F', category: 'View', action: toggleSearch },
    { id: 'toggle-git', label: 'Toggle Source Control', shortcut: 'Ctrl+Shift+G', category: 'View', action: toggleGit },
    { id: 'command-palette', label: 'Show Command Palette', shortcut: 'Ctrl+Shift+P', category: 'General', action: () => setShowCommandPalette(true) },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault()
        setShowTerminal(prev => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch(prev => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
        e.preventDefault()
        setShowGit(prev => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleTerminal, toggleSearch, toggleGit])

  const handleFileOpen = async (path: string) => {
    try {
      const content = await readFile(path)
      const name = path.split('/').pop() || 'Untitled'
      const file = {
        path,
        name,
        content,
        isDirty: false,
        language: (() => {
          const ext = name.split('.').pop()?.toLowerCase() || ''
          const map: Record<string, string> = {
            'json': 'json', 'md': 'markdown', 'js': 'javascript', 'jsx': 'javascript',
            'ts': 'typescript', 'tsx': 'typescript', 'py': 'python', 'rs': 'rust',
            'html': 'html', 'css': 'css', 'txt': 'plaintext',
          }
          return map[ext] || 'plaintext'
        })(),
      }
      setCurrentFile(file)
      state.openFiles.forEach((f: any) => {
        if (f.path !== path) {
          // add existing files to state if not already there
        }
      })
      if (addRecentFile) {
        addRecentFile(path, name)
      }
    } catch (error) {
      console.error('Failed to open file:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border-primary bg-surface-100">
        <div className="flex items-center gap-3">
          <h1 className="font-gothic text-title-small">R-Code</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => newFile()}
              className="p-1.5 rounded hover:bg-surface-300 transition-colors"
              title="New file (Ctrl+N)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5l-4-4z" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8 1v4h4M5 8h4M7 6v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => openFile()}
              className="p-1.5 rounded hover:bg-surface-300 transition-colors"
              title="Open file (Ctrl+O)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4a1 1 0 011-1h3l1 1h4a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
            <button
              onClick={() => setShowSearch(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${showSearch ? 'bg-cursor-orange/20 text-cursor-orange' : 'hover:bg-surface-300'}`}
              title="Search (Ctrl+Shift+F)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => setShowGit(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${showGit ? 'bg-cursor-orange/20 text-cursor-orange' : 'hover:bg-surface-300'}`}
              title="Git (Ctrl+Shift+G)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="3" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="11" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3 4.5v4.5a.5.5 0 01-.5.5.5.5 0 00-.5.5v1a.5.5 0 01-.5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M11 5.5v3a.5.5 0 00.5.5.5.5 0 01.5.5v1a.5.5 0 01-.5.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
            <button
              onClick={() => setShowTerminal(prev => !prev)}
              className={`p-1.5 rounded transition-colors ${showTerminal ? 'bg-cursor-orange/20 text-cursor-orange' : 'hover:bg-surface-300'}`}
              title="Terminal (Ctrl+`)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 5l2 2-2 2M7 9h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded hover:bg-surface-300 transition-colors"
          title="Settings (Ctrl+,)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13.5 8a5.5 5.5 0 01-.4 2.1l1.1.9-1.5 2.6-1.2-.5-.2.3c-.2.4-.5.8-.8 1.1l-.3.2-.6 1.2h-3l-.6-1.2-.3-.2c-.3-.3-.6-.7-.8-1.1l-.2-.3-1.2.5-1.5-2.6 1.1-.9A5.5 5.5 0 012.5 8a5.5 5.5 0 01.4-2.1l-1.1-.9 1.5-2.6 1.2.5.2-.3c.2-.4.5-.8.8-1.1l.3-.2.6-1.2h3l.6 1.2.3.2c.3.3.6.7.8 1.1l.2.3 1.2-.5 1.5 2.6-1.1.9A5.5 5.5 0 0113.5 8z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar onFileOpen={handleFileOpen} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {state.openFiles.length > 0 && <TabBar />}
          
          <main className="flex-1 overflow-hidden relative">
            <Editor />
          </main>

          <SearchPanel 
            isOpen={showSearch} 
            onToggle={() => setShowSearch(false)} 
            rootPath={repoPath}
          />
          
          <GitPanel 
            isOpen={showGit} 
            onToggle={() => setShowGit(false)} 
            repoPath={repoPath}
          />
          
          <Terminal 
            isOpen={showTerminal} 
            onToggle={() => setShowTerminal(false)} 
          />
        </div>
      </div>

      <StatusBar />

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />
    </div>
  )
}

export default function Home() {
  return (
    <TauriProvider>
      <SettingsProvider>
        <RecentFilesProvider>
          <AppContent />
        </RecentFilesProvider>
      </SettingsProvider>
    </TauriProvider>
  )
}
