'use client'

import { useState, useEffect } from 'react'
import { useTauri } from '@/lib/tauri-context'

interface CursorPosition {
  line: number
  column: number
  selectionLength: number
}

export default function StatusBar() {
  const { state } = useTauri()
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1, selectionLength: 0 })

  const file = state.currentFile
  const language = file?.language || 'Plain Text'
  const encoding = 'UTF-8'
  const gitBranch = 'main'

  return (
    <footer className="flex items-center justify-between px-4 py-1 border-t border-border-primary bg-surface-100 text-caption text-cursor-dark/60">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1 4h10" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span>Ln {cursor.line}, Col {cursor.column}</span>
          {cursor.selectionLength > 0 && (
            <span className="text-cursor-orange">({cursor.selectionLength} selected)</span>
          )}
        </div>

        <div className="w-px h-3 bg-border-strong" />

        <span>Spaces: 2</span>

        <div className="w-px h-3 bg-border-strong" />

        <span>{encoding}</span>

        <div className="w-px h-3 bg-border-strong" />

        <span className="capitalize">{language}</span>
      </div>

      <div className="flex items-center gap-4">
        {gitBranch && (
          <>
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="3" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="9" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3 4.5v3a.5.5 0 01-.5.5.5.5 0 00-.5.5v1a.5.5 0 00.5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M9 4.5v3a.5.5 0 00.5.5.5.5 0 01.5.5v1a.5.5 0 01-.5.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span>{gitBranch}</span>
            </div>
            <div className="w-px h-3 bg-border-strong" />
          </>
        )}

        <span>{state.openFiles.length} files open</span>

        <div className="w-px h-3 bg-border-strong" />

        <span className={state.currentFile?.isDirty ? 'text-cursor-orange' : ''}>
          {state.currentFile?.isDirty ? 'Modified' : 'Saved'}
        </span>

        <div className="w-px h-3 bg-border-strong" />

        <span className="capitalize">
          {state.currentFile ? 'Light' : '—'}
        </span>
      </div>
    </footer>
  )
}
