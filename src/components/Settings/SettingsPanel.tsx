'use client'

import { useSettings } from '@/lib/settings-context'

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useSettings()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      <div 
        className="relative bg-surface-200 border border-border-primary rounded-lg shadow-card w-full max-w-md p-6"
        style={{ 
          backgroundColor: 'var(--color-bg)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-gothic text-sub-heading">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-system-caption text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
              Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`py-2 px-4 rounded-lg border transition-all ${
                  settings.theme === 'light' 
                    ? 'border-cursor-orange' 
                    : 'border-border-primary'
                }`}
                style={{ 
                  borderColor: settings.theme === 'light' ? 'var(--color-accent)' : 'var(--color-border)',
                  backgroundColor: settings.theme === 'light' ? 'var(--color-surface)' : undefined,
                }}
              >
                <span className="font-mono text-sm">Light</span>
              </button>
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`py-2 px-4 rounded-lg border transition-all ${
                  settings.theme === 'dark' 
                    ? 'border-cursor-orange' 
                    : 'border-border-primary'
                }`}
                style={{ 
                  borderColor: settings.theme === 'dark' ? 'var(--color-accent)' : 'var(--color-border)',
                  backgroundColor: settings.theme === 'dark' ? 'var(--color-surface)' : undefined,
                }}
              >
                <span className="font-mono text-sm">Dark</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block font-system-caption text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
              Font Size
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface)' }}
              />
              <span className="font-mono text-sm w-12 text-right" style={{ color: 'var(--color-text)' }}>
                {settings.fontSize}px
              </span>
            </div>
          </div>

          <div>
            <label className="block font-system-caption text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
              Tab Size
            </label>
            <div className="flex gap-2">
              {[2, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => updateSettings({ tabSize: size })}
                  className={`py-2 px-4 rounded-lg border transition-all ${
                    settings.tabSize === size 
                      ? 'border-cursor-orange' 
                      : 'border-border-primary'
                  }`}
                  style={{ 
                    borderColor: settings.tabSize === size ? 'var(--color-accent)' : 'var(--color-border)',
                    backgroundColor: settings.tabSize === size ? 'var(--color-surface)' : undefined,
                  }}
                >
                  <span className="font-mono text-sm">{size} spaces</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-system-caption text-xs" style={{ color: 'var(--color-muted)' }}>
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface-400 font-mono text-xs">Ctrl+,</kbd> to open settings
          </p>
        </div>
      </div>
    </div>
  )
}
