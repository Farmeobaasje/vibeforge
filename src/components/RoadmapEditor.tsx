import { useState } from 'react'
import type { Phase, RoadmapInfo } from '../types/projectDefinition'

import TextInput from './form/TextInput'

interface Props {
  roadmap: RoadmapInfo
  onUpdate: (partial: { roadmap: RoadmapInfo }) => void
}

let nextId = 1
function genId(): string {
  return `roadmap-${nextId++}-${Date.now()}`
}

export default function RoadmapEditor({ roadmap, onUpdate }: Props) {
  const { phases, activePhaseId } = roadmap

  const updatePhases = (next: Phase[]) => {
    onUpdate({ roadmap: { ...roadmap, phases: next } })
  }

  // ── Phase CRUD ────────────────────────────────

  const addPhase = () => {
    const id = genId()
    updatePhases([...phases, { id, title: 'New Phase', tasks: [] }])
  }

  const updatePhaseTitle = (phaseId: string, title: string) => {
    updatePhases(
      phases.map((p) => (p.id === phaseId ? { ...p, title } : p))
    )
  }

  const removePhase = (phaseId: string) => {
    const next = phases.filter((p) => p.id !== phaseId)
    const newActive =
      activePhaseId === phaseId
        ? next.length > 0
          ? next[0].id
          : null
        : activePhaseId
    onUpdate({ roadmap: { ...roadmap, phases: next, activePhaseId: newActive } })
  }

  // ── Active phase ──────────────────────────────

  const setActivePhase = (phaseId: string) => {
    onUpdate({ roadmap: { ...roadmap, activePhaseId: phaseId } })
  }

  // ── Task CRUD ─────────────────────────────────

  const addTask = (phaseId: string) => {
    updatePhases(
      phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: [...p.tasks, { id: genId(), title: 'New task', status: 'pending' as const }] }
          : p
      )
    )
  }

  const updateTaskTitle = (phaseId: string, taskId: string, title: string) => {
    updatePhases(
      phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)) }
          : p
      )
    )
  }

  const toggleTaskStatus = (phaseId: string, taskId: string) => {
    updatePhases(
      phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, status: t.status === 'done' ? 'pending' : 'done' }
                  : t
              ),
            }
          : p
      )
    )
  }

  const removeTask = (phaseId: string, taskId: string) => {
    updatePhases(
      phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p
      )
    )
  }

  // ── Active task (per phase) ───────────────────

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // ── Render ────────────────────────────────────

  return (
    <div className="space-y-4">
      {phases.length === 0 && (
        <p className="text-sm text-gray-500 italic">No phases defined yet. Add one below.</p>
      )}

      {phases.map((phase) => {
        const isActivePhase = phase.id === activePhaseId

        return (
          <div
            key={phase.id}
            className={`rounded-lg border p-4 transition-colors ${
              isActivePhase
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-gray-700 bg-gray-800/30'
            }`}
          >
            {/* ── Phase header ──────────────────── */}
            <div className="flex items-center gap-2 mb-3">
              {/* Active phase indicator */}
              <button
                type="button"
                onClick={() => setActivePhase(phase.id)}
                className={`shrink-0 w-4 h-4 rounded-full border-2 transition-colors ${
                  isActivePhase
                    ? 'border-indigo-400 bg-indigo-400'
                    : 'border-gray-600 hover:border-indigo-400'
                }`}
                title={isActivePhase ? 'Active phase' : 'Set as active phase'}
                aria-label={isActivePhase ? 'Active phase' : 'Set as active phase'}
              />

              {/* Phase title */}
              <div className="flex-1 min-w-0">
                <TextInput
                  label=""
                  value={phase.title}
                  onChange={(v) => updatePhaseTitle(phase.id, v)}
                  placeholder="Phase title..."
                />
              </div>

              {/* Delete phase */}
              <button
                type="button"
                onClick={() => removePhase(phase.id)}
                className="shrink-0 px-2 py-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                aria-label={`Remove phase ${phase.title}`}
              >
                &times;
              </button>
            </div>

            {/* ── Tasks ─────────────────────────── */}
            <div className="ml-6 space-y-1.5">
              {phase.tasks.length === 0 && (
                <p className="text-xs text-gray-500 italic">No tasks yet.</p>
              )}

              {phase.tasks.map((task) => {
                const isActiveTask = isActivePhase && task.id === activeTaskId

                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                      isActiveTask
                        ? 'bg-indigo-900/30 ring-1 ring-indigo-500/50'
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    {/* Active task indicator */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTaskId(isActiveTask ? null : task.id)
                      }
                      className={`shrink-0 w-3 h-3 rounded-full border-2 transition-colors ${
                        isActiveTask
                          ? 'border-indigo-300 bg-indigo-300'
                          : 'border-gray-500 hover:border-indigo-300'
                      }`}
                      title={isActiveTask ? 'Active task' : 'Mark as active task'}
                      aria-label={isActiveTask ? 'Active task' : 'Mark as active task'}
                    />

                    {/* Status checkbox */}
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => toggleTaskStatus(phase.id, task.id)}
                      className="shrink-0 w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />

                    {/* Task title */}
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTaskTitle(phase.id, task.id, e.target.value)}
                      className={`flex-1 bg-transparent text-sm border-none outline-none focus:ring-0 ${
                        task.status === 'done'
                          ? 'text-gray-500 line-through'
                          : 'text-gray-200'
                      }`}
                      placeholder="Task description..."
                    />

                    {/* Status badge */}
                    <span
                      className={`shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        task.status === 'done'
                          ? 'text-green-400 bg-green-900/30'
                          : 'text-yellow-400 bg-yellow-900/30'
                      }`}
                    >
                      {task.status}
                    </span>

                    {/* Delete task */}
                    <button
                      type="button"
                      onClick={() => removeTask(phase.id, task.id)}
                      className="shrink-0 px-1.5 py-0.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
                      aria-label={`Remove task ${task.title}`}
                    >
                      &times;
                    </button>
                  </div>
                )
              })}

              {/* Add task button */}
              <button
                type="button"
                onClick={() => addTask(phase.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
              >
                + Add task
              </button>
            </div>
          </div>
        )
      })}

      {/* ── Add phase ────────────────────────────── */}
      <button
        type="button"
        onClick={addPhase}
        className="w-full py-2.5 border-2 border-dashed border-gray-700 rounded-lg text-sm text-gray-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors"
      >
        + Add Phase
      </button>
    </div>
  )
}
