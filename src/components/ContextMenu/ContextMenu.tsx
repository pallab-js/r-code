'use client'

import { useEffect, useRef } from 'react'

export interface MenuItem {
  id: string
  label: string
  shortcut?: string
  action: () => void
  disabled?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      let adjustedX = x
      let adjustedY = y
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8
      }
      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [x, y])

  const handleItemClick = (item: MenuItem) => {
    if (!item.disabled && !item.divider) {
      item.action()
      onClose()
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-40 bg-surface-200 border border-border-primary rounded-md shadow-lg py-1"
      style={{ 
        left: x, 
        top: y,
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {items.map((item) => (
        item.divider ? (
          <div 
            key={item.id} 
            className="my-1 border-t" 
            style={{ borderColor: 'var(--color-border)' }} 
          />
        ) : (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full px-3 py-1.5 text-sm text-left flex items-center justify-between
              ${item.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-surface-400 cursor-pointer'
              }
            `}
            style={{ color: 'var(--color-text)' }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-xs opacity-60 ml-4">{item.shortcut}</span>
            )}
          </button>
        )
      ))}
    </div>
  )
}