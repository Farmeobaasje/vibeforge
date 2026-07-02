import { useMemo, useState, useCallback } from 'react'
import type { ProjectDefinition, GeneratedFile } from '../types/projectDefinition'
import { generateClineBootstrapPrompt } from '../lib/bootstrapPromptGenerator'
import { buildRenderModel } from '../generator/renderModel'
import { copyToClipboard } from '../lib/clipboard'
import { downloadText, downloadJson } from '../lib/download'
import { exportProjectZip } from '../lib/zipExporter'

interface Props {
  projectDefinition: ProjectDefinition
  selectedFile: GeneratedFile | null
  generatedFiles: GeneratedFile[]
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ExportSection({ projectDefinition, selectedFile, generatedFiles }: Props) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null)
  const [jsonDownloadFeedback, setJsonDownloadFeedback] = useState<string | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [zipFeedback, setZipFeedback] = useState<string | null>(null)

  const renderModel = useMemo(() => buildRenderModel(projectDefinition), [projectDefinition])

  const bootstrapPrompt = useMemo(
    () => generateClineBootstrapPrompt(projectDefinition, renderModel),
    [projectDefinition, renderModel]
  )
  const handleCopyPrompt = useCallback(async () => {
    const ok = await copyToClipboard(bootstrapPrompt)
    setCopyFeedback(ok ? '? Copied!' : '? Copy failed')
    setTimeout(() => setCopyFeedback(null), 2000)
  }, [bootstrapPrompt])
  const handleDownloadFile = useCallback(() => {
    if (!selectedFile) return
    const ok = downloadText(selectedFile.path, selectedFile.content)
    setDownloadFeedback(ok ? '✓ Downloaded!' : '✗ Download failed')
    setTimeout(() => setDownloadFeedback(null), 2000)
  }, [selectedFile])

  const handleDownloadJson = useCallback(() => {
    const name = projectDefinition.project.name || ''
    const slug = slugify(name)
    const filename = slug
      ? `${slug}.project-definition.json`
      : 'project-definition.json'
    const ok = downloadJson(filename, projectDefinition)
    setJsonDownloadFeedback(ok ? '✓ Downloaded!' : '✗ Download failed')
    setTimeout(() => setJsonDownloadFeedback(null), 2000)
  }, [projectDefinition])

  const handleDownloadZip = useCallback(async () => {
    setZipLoading(true)
    setZipFeedback(null)
    const ok = await exportProjectZip(projectDefinition, generatedFiles, bootstrapPrompt)
    setZipLoading(false)
    setZipFeedback(ok ? '✓ ZIP downloaded!' : '✗ ZIP failed')
    setTimeout(() => setZipFeedback(null), 2000)
  }, [projectDefinition, generatedFiles, bootstrapPrompt])

  return (
    <Section title="Export" description="Generate and download your project files">
      <div className="space-y-3">
        <button
          onClick={handleCopyPrompt}
          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {copyFeedback !== null ? copyFeedback : 'Copy Bootstrap Prompt'}
        </button>


        <div className="border-t border-gray-800 pt-3 space-y-2">
          <button
            onClick={handleDownloadFile}
            disabled={!selectedFile}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors border flex items-center justify-center gap-2 ${
              selectedFile
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloadFeedback !== null
              ? downloadFeedback
              : selectedFile
                ? `Download ${selectedFile.path}`
                : 'Select a file to download'}
          </button>
          <button
            onClick={handleDownloadJson}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {jsonDownloadFeedback !== null ? jsonDownloadFeedback : 'Download Project Definition JSON'}
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={zipLoading}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors border flex items-center justify-center gap-2 ${
              zipLoading
                ? 'bg-gray-900 text-gray-500 border-gray-800 cursor-wait'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {zipLoading ? 'Zipping...' : zipFeedback !== null ? zipFeedback : 'Download ZIP (all files)'}
          </button>
        </div>


        {/* Live Cline Bootstrap Prompt preview */}
        <div className="mt-4 p-4 bg-gray-950 rounded-lg border border-gray-800">
          <p className="text-xs text-gray-500 font-mono mb-2">// Cline Bootstrap Prompt (live)</p>
          <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
            {bootstrapPrompt}
          </pre>
        </div>

        {/* Live JSON preview */}
        <div className="mt-4 p-4 bg-gray-950 rounded-lg border border-gray-800">
          <p className="text-xs text-gray-500 font-mono mb-2">// Project Definition JSON preview</p>
          <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
            {JSON.stringify(projectDefinition, null, 2)}
          </pre>
        </div>
      </div>
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
