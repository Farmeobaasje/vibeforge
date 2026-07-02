import { useState, useCallback } from 'react'
import { generateProjectDefinitionPrompt } from '../lib/aiPromptTemplate'
import { copyToClipboard } from '../lib/clipboard'
import { PROVIDER_CONFIGS, type ProviderId } from '../ai/AIProvider'
import { generateProjectDefinition } from '../ai/AIService'
import type { ProjectDefinition } from '../types/projectDefinition'

interface IdeaSectionProps {
  onSetProjectDefinition: (data: ProjectDefinition) => void
}

type GenerateStatus = 'idle' | 'generating' | 'success' | 'error'

export default function IdeaSection({ onSetProjectDefinition }: IdeaSectionProps) {
  const [rawIdea, setRawIdea] = useState('')
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle')
  const [providerId, setProviderId] = useState<ProviderId>('mock')
  const [apiKey, setApiKey] = useState('')
  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle')
  const [generateError, setGenerateError] = useState<string | null>(null)

  const selectedProvider = PROVIDER_CONFIGS.find((p) => p.id === providerId)!

  const handleCopyPrompt = useCallback(async () => {
    const prompt = generateProjectDefinitionPrompt()
    const ok = await copyToClipboard(prompt)
    setCopyFeedback(ok ? 'success' : 'error')
    setTimeout(() => setCopyFeedback('idle'), 2500)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!rawIdea.trim()) {
      setGenerateError('Please enter a project idea first.')
      setGenerateStatus('error')
      setTimeout(() => { setGenerateStatus('idle'); setGenerateError(null) }, 3000)
      return
    }

    setGenerateStatus('generating')
    setGenerateError(null)

    const result = await generateProjectDefinition(rawIdea, providerId, apiKey || undefined)

    if (result.success) {
      onSetProjectDefinition(result.data)
      setGenerateStatus('success')
      setTimeout(() => setGenerateStatus('idle'), 2500)
    } else {
      setGenerateError(result.error || 'Generation failed.')
      setGenerateStatus('error')
    }
  }, [rawIdea, providerId, apiKey, onSetProjectDefinition])

  const handleClear = useCallback(() => {
    setRawIdea('')
    setGenerateStatus('idle')
    setGenerateError(null)
  }, [])

  return (
    <Section title="Idea Input" description="Paste raw ideas, chat transcripts, or research notes">
      {/* Helper copy: built-in AI vs external LLM */}
      <div className="mb-4 p-3 bg-gray-800/40 border border-gray-700/50 rounded-lg">
        <p className="text-xs text-gray-400 leading-relaxed">
          Use the <span className="text-indigo-300 font-medium">built-in AI helper</span> (Mock provider — no API key needed)
          to quickly generate a Project Definition from your idea. For richer results, select <span className="text-indigo-300 font-medium">OpenAI</span> or{' '}
          <span className="text-indigo-300 font-medium">Anthropic</span> and enter your API key.
        </p>
        <p className="text-xs text-gray-500 mt-1.5">
          Alternatively, click <span className="text-indigo-300 font-medium">Copy AI JSON Prompt</span> below and paste it into ChatGPT, Claude, or Gemini —
          then import the JSON they return using the <span className="text-indigo-300 font-medium">JSON Import</span> card.
        </p>
      </div>

      {/* Textarea */}
      <textarea
        value={rawIdea}
        onChange={(e) => setRawIdea(e.target.value)}
        className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        placeholder="Paste your raw project idea here...&#10;&#10;Example:&#10;'I want to build a CLI tool that converts markdown to Notion pages...'"
      />

      {/* Provider select + API key + Generate */}
      <div className="mt-3 space-y-3">
        {/* Provider select */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 w-20 shrink-0">Provider:</label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value as ProviderId)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {PROVIDER_CONFIGS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* API key input (alleen bij externe providers) */}
        {selectedProvider.requiresApiKey && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-20 shrink-0">API Key:</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedProvider.apiKeyPlaceholder || 'Enter API key'}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Generate button + status */}
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generateStatus === 'generating'}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
              generateStatus === 'generating'
                ? 'bg-indigo-600/50 text-indigo-300 cursor-not-allowed'
                : generateStatus === 'success'
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : generateStatus === 'error'
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {generateStatus === 'generating' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : generateStatus === 'success' ? (
              '✓ Generated!'
            ) : generateStatus === 'error' ? (
              '✗ Failed'
            ) : (
              'Generate with AI'
            )}
          </button>

          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
          >
            Clear
          </button>
        </div>

        {/* Error message */}
        {generateError && (
          <p className="text-xs text-red-400 mt-1">{generateError}</p>
        )}
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-900/50 px-2 text-gray-500">or</span>
        </div>
      </div>

      {/* Copy AI JSON Prompt */}
      <button
        onClick={handleCopyPrompt}
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
              : 'Copy AI JSON Prompt'}
        </span>
      </button>
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
