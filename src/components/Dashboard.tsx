import { useCallback, useMemo, useState } from 'react'
import IdeaSection from './IdeaSection'
import JsonSection from './JsonSection'
import ReviewSection from './ReviewSection'
import ExportSection from './ExportSection'
import GeneratedFilesPreview from './GeneratedFilesPreview'
import ProjectDefinitionDiffPanel from './ProjectDefinitionDiffPanel'
import DebugPanel from './DebugPanel'
import AISettings from './AISettings'
import { useProjectDefinition } from '../hooks/useProjectDefinition'
import { parseProjectDefinitionJson } from '../lib/projectDefinitionParser'
import { generatePreviewFiles } from '../lib/previewFactory'

export default function Dashboard() {
  const {
    projectDefinition,
    lastSavedAt,
    saveError,
    updateProjectDefinition,
    setProjectDefinition,
  } = useProjectDefinition()

  const handleJsonImport = useCallback((rawJson: string) => {
    const result = parseProjectDefinitionJson(rawJson)
    if (result.success) {
      setProjectDefinition(result.data)
    }
  }, [setProjectDefinition])

  // ── Shared file selection for ExportSection ──
  const [selectedPath, setSelectedPath] = useState<string>("")
  const [showAISettings, setShowAISettings] = useState(false)

  const previewFiles = useMemo(
    () => generatePreviewFiles(projectDefinition),
    [projectDefinition]
  )

  const selectedFile = useMemo(() => {
    if (previewFiles.length === 0) return null
    const match = previewFiles.find((f) => f.path === selectedPath)
    return match ?? null
  }, [previewFiles, selectedPath])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* AI Settings modal */}
      <AISettings
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
      />

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">
              VF
            </div>
            <h1 className="text-xl font-semibold tracking-tight">VibeForge</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <span className="text-xs text-gray-500">
                Saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-400">{saveError}</span>
            )}
            <button
              onClick={() => setShowAISettings(true)}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              title="AI Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <span className="text-sm text-gray-500">Project Definition Builder</span>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IdeaSection onSetProjectDefinition={setProjectDefinition} />
          <JsonSection onImport={handleJsonImport} />
          <ReviewSection
            projectDefinition={projectDefinition}
            onUpdate={updateProjectDefinition}
          />
          <div className="space-y-6">
            <ExportSection
              projectDefinition={projectDefinition}
              selectedFile={selectedFile}
              generatedFiles={previewFiles}
            />
            <GeneratedFilesPreview
              projectDefinition={projectDefinition}
              selectedPath={selectedPath}
              onSelectPath={setSelectedPath}
            />
            <ProjectDefinitionDiffPanel
              projectDefinition={projectDefinition}
            />
          </div>
        </div>
      </main>

      {/* Debug Panel — floating button in bottom-right */}
      <DebugPanel projectDefinition={projectDefinition} />
    </div>
  )
}


