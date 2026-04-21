'use client'

import { useState, useCallback, ReactNode } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

interface EditorLayoutProps {
  sidebar: ReactNode
  editor: ReactNode
  terminal?: ReactNode
  git?: ReactNode
  search?: ReactNode
  showTerminal?: boolean
  showGit?: boolean
  showSearch?: boolean
}

function ResizeHandle() {
  return (
    <PanelResizeHandle className="relative focus:outline-none">
      <div className="absolute inset-y-0 w-1 hover:bg-cursor-orange/50 cursor-col-resize transition-colors" />
    </PanelResizeHandle>
  )
}

export default function EditorLayout({
  sidebar,
  editor,
  terminal,
  git,
  search,
  showTerminal = false,
  showGit = false,
  showSearch = false,
}: EditorLayoutProps) {
  const [sidebarSize, setSidebarSize] = useState(20)
  const [terminalSize, setTerminalSize] = useState(30)

  return (
    <PanelGroup direction="horizontal" autoSaveId="editor-layout">
      <Panel defaultSize={sidebarSize} minSize={15} maxSize={40} onResize={setSidebarSize}>
        {sidebar}
      </Panel>
      
      <ResizeHandle />
      
      <Panel minSize={30}>
        <PanelGroup direction="vertical">
          <Panel minSize={20}>
            {editor}
          </Panel>
          
          {(showSearch || showGit) && (
            <>
              <ResizeHandle />
              <Panel defaultSize={30} minSize={15} maxSize={50}>
                <PanelGroup direction="horizontal">
                  {showSearch && (
                    <>
                      <Panel minSize={20}>
                        {search}
                      </Panel>
                      <ResizeHandle />
                    </>
                  )}
                  {showGit && (
                    <Panel minSize={20}>
                      {git}
                    </Panel>
                  )}
                </PanelGroup>
              </Panel>
            </>
          )}
          
          {showTerminal && terminal && (
            <>
              <ResizeHandle />
              <Panel defaultSize={terminalSize} minSize={10} maxSize={60} onResize={setTerminalSize}>
                {terminal}
              </Panel>
            </>
          )}
        </PanelGroup>
      </Panel>
    </PanelGroup>
  )
}