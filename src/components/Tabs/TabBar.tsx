'use client'

import { useRef, useEffect, useState } from 'react'
import { useTauri } from '@/lib/tauri-context'
import Tab from './Tab'

export default function TabBar() {
  const { state, closeFile } = useTauri()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current
      setShowLeftScroll(el.scrollLeft > 0)
      setShowRightScroll(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }
  }, [state.openFiles])

  const handleScroll = () => {
    if (scrollRef.current) {
      const el = scrollRef.current
      setShowLeftScroll(el.scrollLeft > 0)
      setShowRightScroll(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -150, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 150, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex items-center bg-surface-300 border-b border-border-primary">
      {showLeftScroll && (
        <button
          onClick={scrollLeft}
          className="flex-shrink-0 p-2 hover:bg-surface-400 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto scrollbar-thin scrollbar-thin::-webkit-scrollbar { display: 'none' }"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {state.openFiles.map((file) => (
          <Tab
            key={file.path || file.name}
            file={file}
            isActive={state.currentFile?.path === file.path && state.currentFile?.name === file.name}
            onClick={() => {}}
            onClose={() => closeFile(file.path || '')}
          />
        ))}
      </div>
      
      {showRightScroll && (
        <button
          onClick={scrollRight}
          className="flex-shrink-0 p-2 hover:bg-surface-400 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
