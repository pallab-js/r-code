'use client'

import { useState, useRef, useEffect } from 'react'

interface TerminalTab {
  id: string
  name: string
  history: string[]
  currentInput: string
}

interface TerminalProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Terminal({ isOpen, onToggle }: TerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: '1', name: 'Terminal 1', history: [], currentInput: '' }
  ])
  const [activeTab, setActiveTab] = useState('1')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isCollapsed, setIsCollapsed] = useState(!isOpen)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    if (!isCollapsed && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCollapsed])

  const executeCommand = async (cmd: string) => {
    const newOutput = [...output, `$ ${cmd}`]
    setOutput(newOutput)

    if (cmd.trim()) {
      try {
        const result = await executeShellCommand(cmd)
        if (result) {
          setOutput([...newOutput, result])
        }
      } catch (error) {
        setOutput([...newOutput, `Error: ${error}`])
      }
    }
  }

  const executeShellCommand = async (cmd: string): Promise<string> => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<string>('execute_command', { command: cmd })
        return result
      } catch (error) {
        return `Command execution not available: ${error}`
      }
    }
    return 'Tauri not available'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    executeCommand(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()
      setOutput(prev => [...prev, `^C`])
      setInput('')
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setOutput([])
    }
  }

  const addTab = () => {
    const newId = String(Date.now())
    setTabs(prev => [...prev, { id: newId, name: `Terminal ${prev.length + 1}`, history: [], currentInput: '' }])
    setActiveTab(newId)
    setOutput([])
    setInput('')
  }

  const closeTab = (id: string) => {
    if (tabs.length === 1) return
    setTabs(prev => prev.filter(t => t.id !== id))
    if (activeTab === id) {
      setActiveTab(tabs[0].id)
    }
  }

  const clearTerminal = () => {
    setOutput([])
  }

  return (
    <div 
      className={`
        border-t border-border-primary bg-surface-200 transition-all duration-200
        ${isCollapsed ? 'h-10' : 'h-64'}
      `}
    >
      <div className="flex items-center justify-between px-2 py-1 bg-surface-300 border-b border-border-primary">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-surface-400 transition-colors"
            title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              {isCollapsed ? (
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
          
          <div className="flex items-center gap-1 ml-2">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsCollapsed(false) }}
                className={`
                  flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer
                  ${activeTab === tab.id ? 'bg-surface-200 text-cursor-dark' : 'text-cursor-dark/60 hover:bg-surface-400'}
                `}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="1" y="2" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M3 5l1.5 1.5L6 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{tab.name}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                    className="ml-1 hover:text-cursor-error"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addTab}
              className="p-1 rounded hover:bg-surface-400 transition-colors text-cursor-dark/60"
              title="New terminal"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearTerminal}
            className="p-1 rounded hover:bg-surface-400 transition-colors"
            title="Clear terminal"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10l8-8M10 10V2H2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-surface-400 transition-colors"
            title="Close terminal"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div 
          ref={outputRef}
          className="h-[calc(100%-36px)] overflow-auto p-2 font-mono text-xs text-cursor-dark"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="mb-1 text-cursor-dark/40">
            Welcome to R-Code Terminal
          </div>
          {output.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
          
          <form onSubmit={handleSubmit} className="flex items-center">
            <span className="text-cursor-orange mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-cursor-dark"
              autoFocus
            />
          </form>
        </div>
      )}
    </div>
  )
}
