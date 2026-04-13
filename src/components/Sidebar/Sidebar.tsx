'use client'

import { useState } from 'react'
import FileTree from './FileTree'

interface SidebarProps {
  rootPath?: string
  onFileOpen: (path: string) => void
}

export default function Sidebar({ rootPath = '/', onFileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [width, setWidth] = useState(240)
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(180, Math.min(400, e.clientX))
      setWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  return (
    <div 
      className={`
        flex flex-shrink-0 bg-surface-200 border-r border-border-primary
        ${isCollapsed ? 'w-10' : ''}
        transition-all duration-200
      `}
      style={{ width: isCollapsed ? undefined : width }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-primary">
          {!isCollapsed && (
            <span className="font-gothic text-caption uppercase tracking-wider text-cursor-dark/60">
              Explorer
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-surface-400 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {isCollapsed ? (
                <path d="M5 2l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex-1 overflow-auto py-2">
            <FileTree rootPath={rootPath} onFileClick={onFileOpen} />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={`
            w-1 cursor-col-resize hover:bg-cursor-orange/30 active:bg-cursor-orange/50
            ${isResizing ? 'bg-cursor-orange/50' : ''}
          `}
        />
      )}
    </div>
  )
}
