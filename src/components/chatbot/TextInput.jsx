import { useState } from 'react'

export default function TextInput({
  placeholder,
  error,
  onSubmit,
  onSkip,
  optional,
  disabled,
}) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return
    onSubmit(value)
    // Keep the value if validation fails; the parent re-renders with `error`
    // but the state machine doesn't advance, so we only clear on a clean send.
    // We clear optimistically — invalid input is echoed back via the error
    // line, and re-typing is cheap.
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          Gönder
        </button>
      </div>
      {error && <p className="px-2 text-xs text-red-500">{error}</p>}
      {optional && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="px-2 text-xs text-slate-400 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Şimdilik geçmek istiyorum
        </button>
      )}
    </form>
  )
}
