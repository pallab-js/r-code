'use client'

import { useState, useCallback, useEffect } from 'react'
import ContextMenu from '@/components/ContextMenu/ContextMenu'
import type { MenuItem } from '@/components/ContextMenu/ContextMenu'

export interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: TreeNode[]
  isOpen?: boolean
}

interface DirEntry {
  name: string
  path: string
  is_directory: boolean
}

interface FileTreeProps {
  rootPath: string
  onFileClick: (path: string) => void
}

async function readDir(path: string): Promise<DirEntry[]> {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke<DirEntry[]>('read_directory', { path })
    } catch {
      return []
    }
  }
  return []
}

function FileIcon({ isDirectory, isOpen }: { isDirectory: boolean; isOpen?: boolean }) {
  if (isDirectory) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        {isOpen ? (
          <path 
            d="M1.5 4.5v8a1 1 0 001 1h11a1 1 0 001-1V6a1 1 0 00-1-1h-6l-1.5-1.5h-4A1 1 0 001.5 3.5v1z" 
            stroke="currentColor" 
            strokeWidth="1.2"
            fill="none"
          />
        ) : (
          <path 
            d="M2 4.5a1 1 0 011-1h3.5l1 1H13a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7z" 
            stroke="currentColor" 
            strokeWidth="1.2"
            fill="none"
          />
        )}
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path 
        d="M3.5 2a1 1 0 011-1h4l2 2h3a1 1 0 011 1v10a1 1 0 01-1 1h-10a1 1 0 01-1-1V3a1 1 0 011-1z" 
        stroke="currentColor" 
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  onFileClick: (path: string) => void
  onToggle: (path: string) => void
  isOpen: boolean
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void
}

function TreeItem({ 
  node, 
  depth, 
  onFileClick,
  onToggle,
  isOpen,
  onContextMenu,
}: TreeItemProps) {
  const handleClick = () => {
    if (node.isDirectory) {
      onToggle(node.path)
    } else {
      onFileClick(node.path)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu(e, node)
  }

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleClick}
        className={`
          flex items-center gap-1.5 py-1 px-2 cursor-pointer
          hover:bg-surface-400 transition-colors text-sm select-none
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDirectory && (
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none"
            className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
          >
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {!node.isDirectory && <span className="w-3" />}
        
        <span className={node.isDirectory ? 'text-cursor-dark' : 'text-cursor-dark/80'}>
          <FileIcon isDirectory={node.isDirectory} isOpen={isOpen} />
        </span>
        
        <span className="truncate font-gothic">{node.name}</span>
      </div>
      
      {node.isDirectory && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              onToggle={onToggle}
              isOpen={child.isOpen || false}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

async function loadChildren(path: string): Promise<TreeNode[]> {
  const entries = await readDir(path)
  return entries.map(entry => ({
    name: entry.name,
    path: entry.path,
    isDirectory: entry.is_directory,
    children: entry.is_directory ? [] : undefined,
    isOpen: false,
  }))
}

async function loadTree(path: string): Promise<TreeNode[]> {
  const nodeName = path.split('/').pop() || 'project'
  const children = await loadChildren(path)
  return [{
    name: nodeName,
    path,
    isDirectory: true,
    children,
    isOpen: true,
  }]
}

export default function FileTree({ rootPath, onFileClick }: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: TreeNode } | null>(null)

  useEffect(() => {
    if (rootPath) {
      setIsLoading(true)
      loadTree(rootPath).then(t => {
        setTree(t)
        setExpandedPaths(new Set([rootPath]))
        setIsLoading(false)
      })
    }
  }, [rootPath])

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const contextMenuItems: MenuItem[] = contextMenu ? [
    { id: 'open', label: 'Open', action: () => onFileClick(contextMenu.node.path) },
    { id: 'div1', label: '', divider: true, action: () => {} },
    { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', action: () => {} },
    { id: 'new-folder', label: 'New Folder', action: () => {} },
    { id: 'div2', label: '', divider: true, action: () => {} },
    { id: 'rename', label: 'Rename', action: () => {} },
    { id: 'delete', label: 'Delete', action: () => {} },
  ] : []

  const toggleDirectory = useCallback(async (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })

    if (!expandedPaths.has(path)) {
      const children = await loadChildren(path)
      setTree(prev => {
        const updateNode = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(node => {
            if (node.path === path && node.isDirectory) {
              return { ...node, children, isOpen: true }
            }
            if (node.children) {
              return { ...node, children: updateNode(node.children) }
            }
            return node
          })
        }
        return updateNode(prev)
      })
    } else {
      setTree(prev => {
        const updateNode = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(node => {
            if (node.path === path && node.isDirectory) {
              return { ...node, isOpen: false }
            }
            if (node.children) {
              return { ...node, children: updateNode(node.children) }
            }
            return node
          })
        }
        return updateNode(prev)
      })
    }
  }, [expandedPaths])

  if (isLoading) {
    return (
      <div className="py-2 px-4 text-sm text-cursor-dark/60">
        Loading...
      </div>
    )
  }

  return (
    <div className="py-2">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          onFileClick={onFileClick}
          onToggle={toggleDirectory}
          isOpen={node.isOpen || false}
          onContextMenu={handleContextMenu}
        />
      ))}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}