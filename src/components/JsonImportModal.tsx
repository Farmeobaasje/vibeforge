import { useState, useEffect, useRef, useCallback } from 'react'

interface JsonImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rawJson: string) => void
  initialValue?: string
}

export default function JsonImportModal({ isOpen, onClose, onImport, initialValue = '' }: JsonImportModalProps) {
  const [rawJson, setRawJson] = useState(initialValue)
  const [pasteFeedback, setPasteFeedback] = useState<'idle' | 'success' | 'error'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRawJson(initialValue)
      setPasteFeedback('idle')
      // Auto-focus textarea after mount
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [isOpen, initialValue])

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (rawJson.trim()) {
        onImport(rawJson)
      }
    }
  }, [onClose, onImport, rawJson])

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRawJson(text)
      setPasteFeedback('success')
    } catch {
      setPasteFeedback('error')
    }
    setTimeout(() => setPasteFeedback('idle'), 2500)
  }, [])

  const handleImport = useCallback(() => {
    if (rawJson.trim()) {
      onImport(rawJson)
    }
  }, [rawJson, onImport])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-100">Import ProjectDefinition JSON</h2>
            <p className="text-sm text-gray-400">
              Paste the JSON returned by ChatGPT, Claude, Gemini, or another LLM.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-64 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono"
            placeholder='Paste your JSON here...&#10;&#10;{&#10;  "project": {&#10;    "name": "...",&#10;    "tagline": "...",&#10;    ...&#10;  }&#10;}'
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900/50 rounded-b-xl">
          <button
            onClick={handlePasteFromClipboard}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {pasteFeedback === 'success'
              ? '✓ Pasted!'
              : pasteFeedback === 'error'
                ? '✗ Clipboard access denied'
                : 'Paste from clipboard'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!rawJson.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Import into VibeForge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
