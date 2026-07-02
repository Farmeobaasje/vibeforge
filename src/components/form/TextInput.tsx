interface TextInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function TextInput({ label, value, onChange, placeholder }: TextInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
