import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminGate from '../components/admin/AdminGate.jsx'
import LeadsTable from '../components/admin/LeadsTable.jsx'
import TranscriptModal from '../components/admin/TranscriptModal.jsx'
import { useLeads } from '../hooks/useLeads.js'

function AdminContent() {
  const { leads, status, error, capped, reload, updateLead } = useLeads()
  // Track the id (not a snapshot) so the modal reflects optimistic updates.
  const [selectedId, setSelectedId] = useState(null)
  const selected = leads.find((l) => l.id === selectedId) ?? null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">NextReach — Lead Paneli</h1>
            <p className="text-xs text-slate-500">Chatbot üzerinden gelen talepler</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reload}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Yenile
            </button>
            <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
              ← Siteye dön
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {status === 'loading' && (
          <p className="py-10 text-center text-sm text-slate-400">Yükleniyor…</p>
        )}
        {status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Lead'ler yüklenemedi: {error}
          </div>
        )}
        {status === 'ready' && (
          <>
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <LeadsTable
              leads={leads}
              capped={capped}
              onOpen={(lead) => setSelectedId(lead.id)}
              onUpdate={updateLead}
            />
          </>
        )}
      </main>

      <TranscriptModal
        key={selectedId}
        lead={selected}
        onClose={() => setSelectedId(null)}
        onUpdate={updateLead}
      />
    </div>
  )
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminContent />
    </AdminGate>
  )
}
