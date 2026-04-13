'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Command {
  id: string
  label: string
  shortcut?: string
  category: string
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: Command[]
}

export default function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  const flatCommands = filteredCommands

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const executeCommand = useCallback((command: Command) => {
    command.action()
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [flatCommands, selectedIndex, executeCommand, onClose])

  if (!isOpen) return null

  let globalIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-surface-100 border border-border-primary rounded-lg shadow-card overflow-hidden">
        <div className="p-3 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cursor-dark/60">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              className="flex-1 bg-transparent outline-none text-cursor-dark placeholder:text-cursor-dark/40"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-surface-400 text-cursor-dark/60 text-xs font-mono">
              Esc
            </kbd>
          </div>
        </div>

        <div 
          ref={listRef}
          className="max-h-80 overflow-auto py-2"
        >
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-3 py-1 text-xs font-gothic uppercase tracking-wider text-cursor-dark/50">
                {category}
              </div>
              {cmds.map((cmd) => {
                const currentIndex = globalIndex++
                return (
                  <div
                    key={cmd.id}
                    data-index={currentIndex}
                    onClick={() => executeCommand(cmd)}
                    className={`
                      flex items-center justify-between px-3 py-2 cursor-pointer
                      ${currentIndex === selectedIndex ? 'bg-cursor-orange/10' : 'hover:bg-surface-300'}
                    `}
                  >
                    <span className="text-sm text-cursor-dark">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-surface-400 text-cursor-dark/60 text-xs font-mono">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          {filteredCommands.length === 0 && (
            <div className="px-3 py-8 text-center text-cursor-dark/40 text-sm">
              No commands found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
