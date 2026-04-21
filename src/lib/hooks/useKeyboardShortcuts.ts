'use client'

import { useEffect, useCallback } from 'react'

export type ShortcutAction =
  | { type: 'save' }
  | { type: 'find' }
  | { type: 'findReplace' }
  | { type: 'toggleTerminal' }
  | { type: 'newFile' }
  | { type: 'openFile' }
  | { type: 'closeFile' }
  | { type: 'commandPalette' }
  | { type: 'settings' }

interface ShortcutBinding {
  key: string
  action: ShortcutAction
}

function parseKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}

export function useKeyboardShortcuts(
  onAction: (action: ShortcutAction) => void,
  customBindings?: Record<string, ShortcutAction>
) {
  const defaultBindings: Record<string, ShortcutAction> = {
    'mod+s': { type: 'save' },
    'mod+f': { type: 'find' },
    'mod+h': { type: 'findReplace' },
    'mod+`': { type: 'toggleTerminal' },
    'mod+n': { type: 'newFile' },
    'mod+o': { type: 'openFile' },
    'mod+w': { type: 'closeFile' },
    'mod+shift+p': { type: 'commandPalette' },
    'mod+,': { type: 'settings' },
  }

  const bindings = { ...defaultBindings, ...customBindings }

  const handler = useCallback(
    (e: KeyboardEvent) => {
      const combo = parseKeyCombo(e)
      const action = bindings[combo]
      if (action) {
        e.preventDefault()
        onAction(action)
      }
    },
    [bindings, onAction]
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}

export function useAutoSave(
  content: string,
  onSave: (content: string) => void,
  delay: number = 2000
) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) {
        onSave(content)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [content, onSave, delay])
}