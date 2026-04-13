'use client'

import { useRecentFiles } from '@/lib/recent-files'

interface RecentFilesPanelProps {
  onFileSelect: (path: string) => void
  onClose: () => void
}

export default function RecentFilesPanel({ onFileSelect, onClose }: RecentFilesPanelProps) {
  const { recentFiles, removeRecentFile, clearRecentFiles } = useRecentFiles()

  if (recentFiles.length === 0) {
    return (
      <div className="p-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        No recent files
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-3 py-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-muted)' }}>
          Recent Files
        </span>
        <button
          onClick={clearRecentFiles}
          className="text-xs hover:underline"
          style={{ color: 'var(--color-muted)' }}
        >
          Clear
        </button>
      </div>
      {recentFiles.map((file) => (
        <div
          key={file.path}
          className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-surface-400 text-sm"
          onClick={() => onFileSelect(file.path)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
              <path 
                d="M3.5 2a1 1 0 011-1h4l2 2h3a1 1 0 011 1v10a1 1 0 01-1 1h-10a1 1 0 01-1-1V3a1 1 0 011-1z" 
                stroke="currentColor" 
                strokeWidth="1.2"
                fill="none"
              />
            </svg>
            <span className="truncate">{file.name}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeRecentFile(file.path)
            }}
            className="p-1 rounded hover:bg-surface-500 flex-shrink-0"
            title="Remove from recent"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}