'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export interface FileState {
  path: string | null
  name: string
  content: string
  isDirty: boolean
  language: string
}

interface EditorState {
  currentFile: FileState | null
  openFiles: FileState[]
  isLoading: boolean
}

interface TauriContextType {
  state: EditorState
  openFile: () => Promise<void>
  saveFile: (content?: string) => Promise<void>
  saveFileAs: () => Promise<void>
  newFile: () => void
  closeFile: (path: string) => void
  updateContent: (content: string) => void
  readFile: (path: string) => Promise<string>
  setCurrentFile: (file: FileState) => void
}

const TauriContext = createContext<TauriContextType | null>(null)

export function useTauri() {
  const context = useContext(TauriContext)
  if (!context) {
    throw new Error('useTauri must be used within TauriProvider')
  }
  return context
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    'json': 'json',
    'md': 'markdown',
    'markdown': 'markdown',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rs': 'rust',
    'html': 'html',
    'css': 'css',
    'txt': 'plaintext',
  }
  return langMap[ext] || 'plaintext'
}

interface TauriProviderProps {
  children: ReactNode
}

export function TauriProvider({ children }: TauriProviderProps) {
  const [state, setState] = useState<EditorState>({
    currentFile: null,
    openFiles: [],
    isLoading: false,
  })

  const invoke = async (cmd: string, args?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      return await (window as any).__TAURI__.core.invoke(cmd, args)
    }
    throw new Error('Tauri not available')
  }

  const openFile = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      const path = await invoke('open_file_dialog') as string | null
      if (path) {
        const content = await invoke('read_file', { path }) as string
        const name = path.split('/').pop() || 'Untitled'
        const file: FileState = {
          path,
          name,
          content,
          isDirty: false,
          language: detectLanguage(name),
        }
        setState(prev => ({
          ...prev,
          currentFile: file,
          openFiles: [...prev.openFiles.filter(f => f.path !== path), file],
          isLoading: false,
        }))
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Failed to open file:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const saveFile = useCallback(async (content?: string) => {
    const file = state.currentFile
    if (!file) return

    try {
      const newContent = content ?? file.content
      if (file.path) {
        await invoke('write_file', { path: file.path, content: newContent })
        const updatedFile = { ...file, content: newContent, isDirty: false }
        setState(prev => ({
          ...prev,
          currentFile: updatedFile,
          openFiles: prev.openFiles.map(f => f.path === file.path ? updatedFile : f),
        }))
      } else {
        await saveFileAs(newContent)
      }
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }, [state.currentFile])

  const saveFileAs = useCallback(async (content?: string) => {
    const file = state.currentFile
    if (!file) return

    try {
      const path = await invoke('save_file_dialog', { defaultName: file.name }) as string | null
      if (path) {
        const newContent = content ?? file.content
        await invoke('write_file', { path, content: newContent })
        const name = path.split('/').pop() || 'Untitled'
        const updatedFile: FileState = {
          ...file,
          path,
          name,
          content: newContent,
          isDirty: false,
        }
        setState(prev => ({
          ...prev,
          currentFile: updatedFile,
          openFiles: prev.openFiles.map(f => f.path === file.path ? updatedFile : f),
        }))
      }
    } catch (error) {
      console.error('Failed to save file as:', error)
    }
  }, [state.currentFile])

  const newFile = useCallback(() => {
    const file: FileState = {
      path: null,
      name: 'Untitled',
      content: '',
      isDirty: false,
      language: 'plaintext',
    }
    setState(prev => ({
      ...prev,
      currentFile: file,
      openFiles: [...prev.openFiles, file],
    }))
  }, [])

  const closeFile = useCallback((path: string) => {
    setState(prev => {
      const newOpenFiles = prev.openFiles.filter(f => f.path !== path)
      const newCurrent = prev.currentFile?.path === path 
        ? newOpenFiles[0] || null 
        : prev.currentFile
      return {
        ...prev,
        openFiles: newOpenFiles,
        currentFile: newCurrent,
      }
    })
  }, [])

  const updateContent = useCallback((content: string) => {
    const file = state.currentFile
    if (!file) return

    const updatedFile = { ...file, content, isDirty: content !== file.content }
    setState(prev => ({
      ...prev,
      currentFile: updatedFile,
      openFiles: prev.openFiles.map(f => f.path === file.path ? updatedFile : f),
    }))
  }, [state.currentFile])

  const readFile = useCallback(async (path: string): Promise<string> => {
    return await invoke('read_file', { path }) as string
  }, [])

  const setCurrentFile = useCallback((file: FileState) => {
    setState(prev => {
      const exists = prev.openFiles.some(f => f.path === file.path)
      return {
        ...prev,
        currentFile: file,
        openFiles: exists ? prev.openFiles : [...prev.openFiles, file],
      }
    })
  }, [])

  return (
    <TauriContext.Provider value={{
      state,
      openFile,
      saveFile,
      saveFileAs,
      newFile,
      closeFile,
      updateContent,
      readFile,
      setCurrentFile,
    }}>
      {children}
    </TauriContext.Provider>
  )
}
