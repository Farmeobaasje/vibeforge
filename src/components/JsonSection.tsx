import { useState, useCallback } from 'react'
import { generateSchemaPrompt } from '../lib/schemaPrompt'
import { parseProjectDefinitionJson, type SchemaType } from '../lib/projectDefinitionParser'
import JsonImportModal from './JsonImportModal'

interface JsonSectionProps {
  onImport: (rawJson: string) => void
}

type FeedbackType = 'idle' | 'success' | 'error' | 'warning'

interface FeedbackState {
  type: FeedbackType
  message: string | null
  schemaType?: SchemaType
  warnings?: string[]
  missingFields?: string[]
}

export default function JsonSection({ onImport }: JsonSectionProps) {
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle')
  const [modalOpen, setModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({ type: 'idle', message: null })

  const handleCopySchema = useCallback(async () => {
    try {
      const prompt = generateSchemaPrompt()
      await navigator.clipboard.writeText(prompt)
      setCopyFeedback('success')
    } catch {
      setCopyFeedback('error')
    }
    setTimeout(() => setCopyFeedback('idle'), 2500)
  }, [])

  const handleImport = useCallback((rawJson: string) => {
    const result = parseProjectDefinitionJson(rawJson)

    if (!result.success) {
      // ❌ Rood: echte errors — blokkeren import
      setFeedback({
        type: 'error',
        message: result.error,
      })
      return
    }

    // ✅ Succes — check of er warnings zijn
    if (result.warnings.length > 0) {
      // 🟡 Geel: import gelukt met warnings
      setFeedback({
        type: 'warning',
        message: `Imported as ${result.schemaType} schema with ${result.warnings.length} warning(s).`,
        schemaType: result.schemaType,
        warnings: result.warnings,
        missingFields: result.missingFields,
      })
    } else {
      // 🟢 Groen: alles perfect
      setFeedback({
        type: 'success',
        message: `Successfully imported as ${result.schemaType} schema.`,
        schemaType: result.schemaType,
      })
    }

    onImport(rawJson)
    setModalOpen(false)
  }, [onImport])

  const handleCloseFeedback = useCallback(() => {
    setFeedback({ type: 'idle', message: null })
  }, [])

  return (
    <Section title="JSON Import" description="Import a Project Definition from ChatGPT, Claude, Gemini, or the built-in AI helper">
      <div className="space-y-3">
        {/* Copy rich JSON schema */}
        <button
          onClick={handleCopySchema}
          className="w-full px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-sm font-medium rounded-lg transition-colors border border-indigo-500/30"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copyFeedback === 'success'
              ? '✓ Copied!'
              : copyFeedback === 'error'
                ? '✗ Copy failed'
                : 'Copy JSON schema for ChatGPT/Claude/Gemini'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-900/50 px-2 text-gray-500">or</span>
          </div>
        </div>

        {/* Paste JSON button — opens modal */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Import ProjectDefinition JSON
          </span>
        </button>

        {/* Upload placeholder (Phase 5) */}
        <button
          disabled
          className="w-full px-4 py-3 bg-gray-800/50 text-gray-600 text-sm font-medium rounded-lg border border-gray-800 cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload JSON file (coming soon)
          </span>
        </button>
      </div>

      {/* How it works helper box */}
      <div className="mt-4 p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-lg">
        <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">How it works</h3>
        <ol className="space-y-1.5">
          <li className="text-xs text-gray-400 flex items-start gap-2">
            <span className="text-indigo-400 font-bold shrink-0 mt-0.5">1.</span>
            <span>Click <span className="text-indigo-300 font-medium">Copy JSON schema</span> above to copy a structured prompt to your clipboard.</span>
          </li>
          <li className="text-xs text-gray-400 flex items-start gap-2">
            <span className="text-indigo-400 font-bold shrink-0 mt-0.5">2.</span>
            <span>Paste it into <span className="text-indigo-300 font-medium">ChatGPT, Claude, or Gemini</span> and describe your project idea.</span>
          </li>
          <li className="text-xs text-gray-400 flex items-start gap-2">
            <span className="text-indigo-400 font-bold shrink-0 mt-0.5">3.</span>
            <span>The LLM returns a <span className="text-indigo-300 font-medium">Project Definition JSON</span> — copy that JSON.</span>
          </li>
          <li className="text-xs text-gray-400 flex items-start gap-2">
            <span className="text-indigo-400 font-bold shrink-0 mt-0.5">4.</span>
            <span>Click <span className="text-indigo-300 font-medium">Import ProjectDefinition JSON</span> and paste the LLM's output.</span>
          </li>
          <li className="text-xs text-gray-400 flex items-start gap-2">
            <span className="text-indigo-400 font-bold shrink-0 mt-0.5">5.</span>
            <span>Review and edit your project definition, then export Cline-ready files.</span>
          </li>
        </ol>
      </div>

      {/* Feedback area */}
      {feedback.type !== 'idle' && (
        <div className="mt-3 space-y-2">
          {/* Error (rood) */}
          {feedback.type === 'error' && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-400 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {feedback.message}
              </p>
            </div>
          )}

          {/* Warning (geel) */}
          {feedback.type === 'warning' && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-yellow-300 font-medium">
                    {feedback.message}
                  </p>
                  {feedback.warnings && feedback.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {feedback.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-yellow-400/80 flex items-start gap-1.5">
                          <span className="mt-0.5 block w-1 h-1 rounded-full bg-yellow-400/60 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  )}
                  {feedback.missingFields && feedback.missingFields.length > 0 && (
                    <p className="mt-2 text-xs text-yellow-400/60">
                      Missing fields: {feedback.missingFields.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCloseFeedback}
                  className="text-yellow-400/50 hover:text-yellow-300 transition-colors shrink-0"
                  aria-label="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Success (groen) */}
          {feedback.type === 'success' && (
            <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-green-300 font-medium">
                    {feedback.message}
                  </p>
                  {feedback.schemaType && (
                    <span className="mt-1.5 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-800/40 text-green-300 border border-green-700/40">
                      {feedback.schemaType === 'nested' ? '📦 Nested' : feedback.schemaType === 'flat' ? '📄 Flat' : '❓ Unknown'}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCloseFeedback}
                  className="text-green-400/50 hover:text-green-300 transition-colors shrink-0"
                  aria-label="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      <JsonImportModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setFeedback({ type: 'idle', message: null })
        }}
        onImport={handleImport}
      />
    </Section>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}
