'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view'
import { EditorState, Extension, Compartment, EditorSelection } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { autocompletion, completionKeymap, closeCompletion } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { json } from '@codemirror/lang-json'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { markdown } from '@codemirror/lang-markdown'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { sql } from '@codemirror/lang-sql'
import { useSettings } from '@/lib/settings-context'
import { useTauri } from '@/lib/tauri-context'
import { listen } from '@tauri-apps/api/event'

const languageCompartment = new Compartment()

const baseTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-content': {
    fontFamily: "'berkeleyMono', 'Menlo', 'Monaco', 'Consolas', monospace",
    padding: '8px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    color: 'var(--color-muted)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(245, 78, 0, 0.1)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(245, 78, 0, 0.05)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-text)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(245, 78, 0, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(245, 78, 0, 0.2) !important',
  },
  '.cm-line': {
    padding: '0 8px',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(245, 78, 0, 0.3)',
    color: 'inherit !important',
  },
})

function getLanguageExtension(lang: string): Extension {
  switch (lang.toLowerCase()) {
    case 'javascript':
    case 'jsx':
      return javascript()
    case 'typescript':
    case 'tsx':
      return javascript({ typescript: true })
    case 'python':
    case 'py':
      return python()
    case 'rust':
    case 'rs':
      return rust()
    case 'json':
      return json()
    case 'html':
      return html()
    case 'css':
      return css()
    case 'markdown':
    case 'md':
      return markdown()
    case 'java':
      return java()
    case 'c':
    case 'h':
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return cpp()
    case 'sql':
      return sql()
    default:
      return []
  }
}

export default function Editor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const { settings } = useSettings()
  const { state: editorState, updateContent, saveFile, openFile, newFile } = useTauri()

  const languageExtension = useMemo(() => {
    const lang = editorState.currentFile?.language || 'plaintext'
    return getLanguageExtension(lang)
  }, [editorState.currentFile?.language])

  useEffect(() => {
    if (!editorRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        updateContent(update.state.doc.toString())
      }
    })

    const clickHandler = EditorView.domEventHandlers({
      click(event, view) {
        if (event.altKey && event.shiftKey) {
          event.preventDefault()
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
          if (pos !== null) {
            const state = view.state
            const line = state.doc.lineAt(pos)
            const from = line.from
            const to = line.to
            view.dispatch({ selection: { anchor: from, head: to } })
          }
          return true
        }
        if (event.altKey) {
          event.preventDefault()
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
          if (pos !== null) {
            const state = view.state
            const selection = state.selection
            if (!selection.ranges.some(r => r.head === pos)) {
              const ranges = [...selection.ranges, EditorSelection.range(pos, pos)]
              view.dispatch({ selection: EditorSelection.create(ranges) })
            }
          }
          return true
        }
        return false
      }
    })

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      drawSelection(),
      bracketMatching(),
      highlightSelectionMatches(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      foldGutter(),
      languageCompartment.of(languageExtension),
      clickHandler,
      autocompletion({
        defaultKeymap: true,
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap,
        indentWithTab,
        {
          key: 'Mod-s',
          run: () => {
            saveFile()
            return true
          },
        },
        {
          key: 'Mod-o',
          run: () => {
            openFile()
            return true
          },
        },
        {
          key: 'Mod-n',
          run: () => {
            newFile()
            return true
          },
        },
      ]),
      baseTheme,
      updateListener,
      EditorView.lineWrapping,
    ]

    const initialState = EditorState.create({
      doc: editorState.currentFile?.content || '',
      extensions,
    })

    const view = new EditorView({
      state: initialState,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  useEffect(() => {
    if (viewRef.current && editorState.currentFile) {
      const currentContent = viewRef.current.state.doc.toString()
      if (currentContent !== editorState.currentFile.content) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: editorState.currentFile.content,
          },
        })
      }
    }
  }, [editorState.currentFile?.path])

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: languageCompartment.reconfigure(languageExtension)
      })
    }
  }, [editorState.currentFile?.language, languageExtension])

  useEffect(() => {
    if (viewRef.current) {
      const content = viewRef.current.dom.querySelector('.cm-content')
      if (content) {
        content.setAttribute('style', `font-size: ${settings.fontSize}px`)
      }
    }
  }, [settings.fontSize])

  useEffect(() => {
    if (!editorState.currentFile?.path) return

    let unlisten: (() => void) | undefined

    const setupWatcher = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const { listen } = await import('@tauri-apps/api/event')

        await invoke('watch_file', { path: editorState.currentFile?.path })

        unlisten = await listen<{ path: string; kind: string }>('file-changed', (event) => {
          if (event.payload.path === editorState.currentFile?.path) {
            if (event.payload.kind === 'modified') {
              const confirmReload = window.confirm('File has been modified externally. Reload?')
              if (confirmReload) {
                const path = editorState.currentFile?.path
                if (path) {
                  invoke<string>('read_file', { path }).then((content) => {
                    if (viewRef.current && content !== undefined) {
                      viewRef.current.dispatch({
                        changes: {
                          from: 0,
                          to: viewRef.current.state.doc.length,
                          insert: content,
                        },
                      })
                    }
                  })
                }
              }
            }
          }
        })
      } catch (error) {
        console.log('File watcher not available:', error)
      }
    }

    setupWatcher()

    return () => {
      if (unlisten) unlisten()
    }
  }, [editorState.currentFile?.path])

  return (
    <div 
      ref={editorRef} 
      className="h-full w-full overflow-hidden scrollbar-thin"
      style={{ backgroundColor: 'var(--color-bg)' }}
    />
  )
}
