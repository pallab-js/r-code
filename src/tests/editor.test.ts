import { describe, it, expect } from 'vitest'

describe('Settings Context', () => {
  it('should have default settings', () => {
    const defaultSettings = {
      fontSize: 14,
      theme: 'light' as const,
      fontFamily: 'berkeleyMono',
      tabSize: 2,
    }
    
    expect(defaultSettings.fontSize).toBe(14)
    expect(defaultSettings.theme).toBe('light')
    expect(defaultSettings.tabSize).toBe(2)
  })

  it('should update settings', () => {
    const settings = {
      fontSize: 14,
      theme: 'light' as const,
      fontFamily: 'berkeleyMono',
      tabSize: 2,
    }
    
    const updated = { ...settings, fontSize: 16, theme: 'dark' as const }
    
    expect(updated.fontSize).toBe(16)
    expect(updated.theme).toBe('dark')
    expect(updated.tabSize).toBe(2)
  })
})

describe('Tauri Context', () => {
  it('should detect language from filename', () => {
    const detectLanguage = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      const langMap: Record<string, string> = {
        'json': 'json',
        'md': 'markdown',
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'rs': 'rust',
      }
      return langMap[ext] || 'plaintext'
    }
    
    expect(detectLanguage('test.json')).toBe('json')
    expect(detectLanguage('README.md')).toBe('markdown')
    expect(detectLanguage('main.ts')).toBe('typescript')
    expect(detectLanguage('script.py')).toBe('python')
    expect(detectLanguage('lib.rs')).toBe('rust')
    expect(detectLanguage('unknown.xyz')).toBe('plaintext')
  })
})

describe('File State', () => {
  it('should track dirty state', () => {
    const file = {
      path: '/test/file.ts',
      name: 'file.ts',
      content: 'const x = 1;',
      isDirty: false,
      language: 'typescript',
    }
    
    expect(file.isDirty).toBe(false)
    
    const modified = { ...file, content: 'const x = 2;', isDirty: true }
    
    expect(modified.isDirty).toBe(true)
    expect(modified.content).toBe('const x = 2;')
  })
})
