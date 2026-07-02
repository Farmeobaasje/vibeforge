import { useState } from 'react'

interface ArrayEditorProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export default function ArrayEditor({ label, values, onChange, placeholder }: ArrayEditorProps) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const trimmed = input.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder={placeholder ?? `Add ${label.toLowerCase()}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
      {values.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No items added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {values.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-gray-500 hover:text-red-400 transition-colors leading-none"
                aria-label={`Remove ${item}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
