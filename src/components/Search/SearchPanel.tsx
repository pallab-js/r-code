'use client'

import { useState } from 'react'

interface SearchMatch {
  file_path: string
  line_number: number
  line_content: string
  match_start: number
  match_end: number
}

interface SearchResult {
  file_path: string
  matches: SearchMatch[]
  total_matches: number
}

interface SearchPanelProps {
  isOpen: boolean
  onToggle: () => void
  rootPath: string
}

export default function SearchPanel({ isOpen, onToggle, rootPath }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [regex, setRegex] = useState(false)
  const [showReplace, setShowReplace] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<SearchResult[]>('search_in_directory', {
          dirPath: rootPath,
          query,
          caseSensitive,
          wholeWord,
          regex,
        })
        setResults(result)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const replaceAll = async () => {
    if (!query.trim() || !replace.trim()) return
    setLoading(true)
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core')
        const result = await invoke<{ file_path: string; replacements: number }[]>('replace_in_files', {
          dirPath: rootPath,
          find: query,
          replace,
          caseSensitive,
          wholeWord,
          regex,
        })
        console.log('Replacements made:', result)
        search()
      }
    } catch (error) {
      console.error('Replace failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey && showReplace) {
        replaceAll()
      } else {
        search()
      }
    }
  }

  const totalMatches = results.reduce((sum, r) => sum + r.total_matches, 0)

  return (
    <div 
      className={`border-t border-border-primary bg-surface-200 transition-all duration-200 ${isOpen ? 'h-72' : 'h-10'}`}
    >
      <div 
        onClick={onToggle}
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-surface-300"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-gothic text-caption">Search</span>
          {results.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-surface-400 text-cursor-dark text-xs">
              {totalMatches}
            </span>
          )}
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
        <div className="h-[calc(100%-40px)] flex flex-col">
          <div className="p-2 border-b border-border-primary space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="flex-1 px-2 py-1 rounded border border-border-primary bg-surface-100 text-sm font-mono"
              />
              <button
                onClick={search}
                disabled={loading}
                className="px-3 py-1 rounded bg-cursor-orange text-white text-sm font-gothic disabled:opacity-50"
              >
                {loading ? '...' : 'Find'}
              </button>
            </div>

            {showReplace && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replace}
                  onChange={(e) => setReplace(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Replace..."
                  className="flex-1 px-2 py-1 rounded border border-border-primary bg-surface-100 text-sm font-mono"
                />
                <button
                  onClick={replaceAll}
                  disabled={loading}
                  className="px-3 py-1 rounded bg-surface-400 text-cursor-dark text-sm font-gothic disabled:opacity-50"
                >
                  Replace All
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1 text-xs text-cursor-dark/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded"
                />
                Aa
              </label>
              <label className="flex items-center gap-1 text-xs text-cursor-dark/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="rounded"
                />
                Ab
              </label>
              <label className="flex items-center gap-1 text-xs text-cursor-dark/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regex}
                  onChange={(e) => setRegex(e.target.checked)}
                  className="rounded"
                />
                .*
              </label>
              <button
                onClick={() => setShowReplace(!showReplace)}
                className="text-xs text-cursor-orange hover:underline"
              >
                {showReplace ? 'Hide Replace' : 'Replace'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {results.length === 0 && query && !loading && (
              <div className="flex items-center justify-center h-full text-cursor-dark/40 text-sm">
                No results found
              </div>
            )}
            
            {results.map((result) => (
              <div key={result.file_path} className="border-b border-border-primary">
                <div className="px-2 py-1 bg-surface-300 text-xs font-mono text-cursor-dark/60">
                  {result.file_path} ({result.total_matches})
                </div>
                {result.matches.map((match, i) => (
                  <div 
                    key={i}
                    className="px-2 py-1 hover:bg-surface-300 cursor-pointer font-mono text-xs"
                  >
                    <span className="text-cursor-dark/40 mr-2">{match.line_number}</span>
                    <span className="text-cursor-dark/80">
                      {match.line_content.slice(0, match.match_start)}
                      <span className="bg-timeline-grep/40">{match.line_content.slice(match.match_start, match.match_end)}</span>
                      {match.line_content.slice(match.match_end)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
