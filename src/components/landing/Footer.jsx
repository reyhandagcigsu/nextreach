import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} NextReach. Tüm hakları saklıdır.</p>
        <Link to="/admin" className="font-medium text-indigo-600 hover:underline">
          Admin Paneli
        </Link>
      </div>
    </footer>
  )
}
