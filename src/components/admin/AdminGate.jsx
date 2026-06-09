import { useState } from 'react'

const STORAGE_KEY = 'nextreach_admin_ok'
const EXPECTED = import.meta.env.VITE_ADMIN_PASSWORD

// Deliberately lightweight gate. Auth is out of scope; this only keeps the
// /admin view from being wide open to anyone who finds the URL. Because Vite
// inlines VITE_ADMIN_PASSWORD into the bundle, this is a deterrent, NOT real
// security — a determined user can read it. Real protection = Supabase Auth.
export default function AdminGate({ children }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === '1'
  )
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (EXPECTED && value === EXPECTED) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
    }
  }

  if (authed) return children

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Paneli</h1>
          <p className="mt-1 text-sm text-slate-500">Devam etmek için parolayı girin.</p>
        </div>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          placeholder="Parola"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        {error && <p className="text-xs text-red-500">Parola hatalı.</p>}
        {!EXPECTED && (
          <p className="text-xs text-amber-600">
            VITE_ADMIN_PASSWORD tanımlı değil — .env.local dosyasını kontrol edin.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Giriş
        </button>
      </form>
    </div>
  )
}
