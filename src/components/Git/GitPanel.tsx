'use client'

import { useState, useEffect } from 'react'
import { useTauri } from '@/lib/tauri-context'

interface GitFile {
  path: string
  status: string
}

interface GitStatus {
  branch: string
  staged: GitFile[]
  modified: GitFile[]
  untracked: GitFile[]
}

interface GitPanelProps {
  isOpen: boolean
  onToggle: () => void
  repoPath: string
}

export default function GitPanel({ isOpen, onToggle, repoPath }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [commitMessage, setCommitMessage] = useState('')
  const [diff, setDiff] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isGitRepo, setIsGitRepo] = useState(false)
  const [gitLoading, setGitLoading] = useState<string | null>(null)

  useEffect(() => {
    checkGitRepo()
  }, [repoPath])

  useEffect(() => {
    if (isGitRepo && isOpen) {
      fetchStatus()
    }
  }, [isGitRepo, isOpen, repoPath])

  const checkGitRepo = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<boolean>('is_git_repo', { path: repoPath })
        setIsGitRepo(result)
      }
    } catch (error) {
      setIsGitRepo(false)
    }
  }

  const fetchStatus = async () => {
    setLoading(true)
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<GitStatus>('git_status', { repoPath })
        setStatus(result)
      }
    } catch (error) {
      console.error('Failed to fetch git status:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewDiff = async (filePath: string) => {
    setSelectedFile(filePath)
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<string>('git_diff', { repoPath, filePath })
        setDiff(result)
      }
    } catch (error) {
      console.error('Failed to get diff:', error)
      setDiff('')
    }
  }

  const stageFile = async (filePath: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('git_stage_files', { repoPath, paths: [filePath] })
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to stage file:', error)
    }
  }

  const unstageFile = async (filePath: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('git_unstage_files', { repoPath, paths: [filePath] })
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to unstage file:', error)
    }
  }

  const commit = async () => {
    if (!commitMessage.trim()) return
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('git_commit', { repoPath, message: commitMessage })
        setCommitMessage('')
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to commit:', error)
    }
  }

  const gitPush = async () => {
    setGitLoading('push')
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('git_push', { repoPath })
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to push:', error)
    } finally {
      setGitLoading(null)
    }
  }

  const gitPull = async () => {
    setGitLoading('pull')
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('git_pull', { repoPath })
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to pull:', error)
    } finally {
      setGitLoading(null)
    }
  }

  const gitFetch = async () => {
    setGitLoading('fetch')
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('git_fetch', { repoPath })
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setGitLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'staged':
        return <span className="text-timeline-grep">●</span>
      case 'modified':
        return <span className="text-timeline-edit">●</span>
      case 'untracked':
        return <span className="text-cursor-dark/40">○</span>
      default:
        return <span>○</span>
    }
  }

  if (!isGitRepo) {
    return (
      <div 
        className={`border-t border-border-primary bg-surface-200 transition-all duration-200 ${isOpen ? 'h-48' : 'h-10'}`}
      >
        <div 
          onClick={onToggle}
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-surface-300"
        >
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="3" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3 4.5v4.5a.5.5 0 01-.5.5.5.5 0 00-.5.5v1a.5.5 0 01-.5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M11 5.5v3a.5.5 0 00.5.5.5.5 0 01.5.5v1a.5.5 0 01-.5.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            <span className="font-gothic text-caption">Source Control</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            {isOpen ? (
              <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </div>
        {isOpen && (
          <div className="px-3 py-2 text-caption text-cursor-dark/60">
            Not a Git repository
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`border-t border-border-primary bg-surface-200 transition-all duration-200 ${isOpen ? 'h-80' : 'h-10'}`}
    >
      <div 
        onClick={onToggle}
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-surface-300"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="3" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="11" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 4.5v4.5a.5.5 0 01-.5.5.5.5 0 00-.5.5v1a.5.5 0 01-.5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M11 5.5v3a.5.5 0 00.5.5.5.5 0 01.5.5v1a.5.5 0 01-.5.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span className="font-gothic text-caption">Source Control</span>
          {status && (
            <span className="px-1.5 py-0.5 rounded-full bg-cursor-orange text-white text-xs">
              {status.staged.length + status.modified.length + status.untracked.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-cursor-dark/60">{status?.branch || '...'}</span>
          <button
            onClick={(e) => { e.stopPropagation(); gitFetch() }}
            disabled={gitLoading !== null}
            className="p-1 rounded hover:bg-surface-400 disabled:opacity-50"
            title="Fetch"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 6h2m0 0l2-2m-2 2l2 2M7 1h2m0 0l2-2m-2 2l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); gitPull() }}
            disabled={gitLoading !== null}
            className="p-1 rounded hover:bg-surface-400 disabled:opacity-50"
            title="Pull"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v6m0 0l3-3m-3 3L3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); gitPush() }}
            disabled={gitLoading !== null}
            className="p-1 rounded hover:bg-surface-400 disabled:opacity-50"
            title="Push"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 11V5m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            {isOpen ? (
              <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="flex h-[calc(100%-40px)]">
          <div className="w-1/2 border-r border-border-primary overflow-auto">
            <div className="p-2 space-y-3">
              {status?.staged.length ? (
                <div>
                  <div className="text-xs font-gothic text-cursor-dark/60 mb-1">Staged Changes</div>
                  {status.staged.map((file) => (
                    <div 
                      key={file.path}
                      onClick={() => viewDiff(file.path)}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-surface-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <span className="text-sm font-mono truncate">{file.path.split('/').pop()}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); unstageFile(file.path) }}
                        className="text-xs text-cursor-dark/40 hover:text-cursor-error"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {status?.modified.length ? (
                <div>
                  <div className="text-xs font-gothic text-cursor-dark/60 mb-1">Changes</div>
                  {status.modified.map((file) => (
                    <div 
                      key={file.path}
                      onClick={() => viewDiff(file.path)}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-surface-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <span className="text-sm font-mono truncate">{file.path.split('/').pop()}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); stageFile(file.path) }}
                        className="text-xs px-1 rounded bg-timeline-grep/20 text-timeline-grep hover:bg-timeline-grep/40"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {status?.untracked.length ? (
                <div>
                  <div className="text-xs font-gothic text-cursor-dark/60 mb-1">Untracked</div>
                  {status.untracked.map((file) => (
                    <div 
                      key={file.path}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-surface-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        <span className="text-sm font-mono truncate">{file.path.split('/').pop()}</span>
                      </div>
                      <button
                        onClick={() => stageFile(file.path)}
                        className="text-xs px-1 rounded bg-timeline-grep/20 text-timeline-grep hover:bg-timeline-grep/40"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {status && status.staged.length === 0 && status.modified.length === 0 && status.untracked.length === 0 && (
                <div className="text-center py-4 text-cursor-dark/60 text-sm">
                  No changes
                </div>
              )}
            </div>

            <div className="p-2 border-t border-border-primary">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="w-full p-2 rounded border border-border-primary bg-surface-100 text-sm resize-none h-16"
              />
              <button
                onClick={commit}
                disabled={!commitMessage.trim() || status?.staged.length === 0}
                className="mt-2 w-full py-1.5 px-3 rounded bg-cursor-orange text-white text-sm font-gothic disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cursor-orange/90"
              >
                Commit ({status?.staged.length || 0})
              </button>
            </div>
          </div>

          <div className="w-1/2 overflow-auto p-2">
            {diff ? (
              <pre className="text-xs font-mono whitespace-pre-wrap text-cursor-dark/80">
                {diff}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-cursor-dark/40 text-sm">
                Select a file to view diff
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
