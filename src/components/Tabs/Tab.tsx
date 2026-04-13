'use client'

import { useTauri, FileState } from '@/lib/tauri-context'

interface TabProps {
  file: FileState
  isActive: boolean
  onClick: () => void
  onClose: () => void
}

export default function Tab({ file, isActive, onClick, onClose }: TabProps) {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleMiddleClick = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      onClick={onClick}
      onMouseDown={handleMiddleClick}
      className={`
        group flex items-center gap-2 px-3 py-1.5 cursor-pointer
        border-r border-border-primary transition-colors
        min-w-0 max-w-[180px]
        ${isActive 
          ? 'bg-surface-200 text-cursor-dark border-t-2 border-t-cursor-orange' 
          : 'bg-surface-300 text-cursor-dark/60 hover:bg-surface-200 hover:text-cursor-dark border-t-2 border-t-transparent'
        }
      `}
    >
      <span className="truncate font-mono text-sm flex-1 min-w-0">
        {file.name}
      </span>
      
      {file.isDirty && (
        <span 
          className="w-2 h-2 rounded-full bg-cursor-orange flex-shrink-0"
          title="Unsaved changes"
        />
      )}
      
      <button
        onClick={handleCloseClick}
        className={`
          opacity-0 group-hover:opacity-100 p-0.5 rounded
          hover:bg-surface-500 transition-opacity
          flex-shrink-0
        `}
        title="Close tab"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path 
            d="M9 3L3 9M3 3l6 6" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
