import { useState, useMemo } from 'react'
import LeadRow from './LeadRow.jsx'
import LeadCard from './LeadCard.jsx'
import { scoreLead } from '../../lib/leadScore.js'
import { STATUSES, statusMeta } from '../../lib/leadStatus.js'
import { isToday } from '../../lib/date.js'
import { FETCH_LIMIT } from '../../hooks/useLeads.js'

const COLUMNS = ['Skor', 'Durum', 'Ad', 'E-posta', 'Şirket', 'Ekip', 'İlgi', 'Aciliyet', 'Tarih']
const PAGE_SIZE = 25

const INTEREST_LABELS = {
  sales: 'Satış',
  marketing: 'Pazarlama',
  support: 'Müşteri Desteği',
  other: 'Diğer',
}
const URGENCY_LABELS = { high: 'Acil', medium: 'Bu çeyrek', low: 'Araştırıyor' }

function csvCell(value) {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

function exportCsv(rows) {
  const header = [
    'Tarih', 'Ad', 'E-posta', 'Şirket', 'Ekip', 'İlgi', 'Aciliyet',
    'Durum', 'Sahip', 'Skor', 'Mesaj',
  ]
  const lines = rows.map((l) => {
    const { score, tier } = scoreLead(l)
    return [
      l.created_at, l.name, l.email, l.company, l.company_size,
      INTEREST_LABELS[l.interest] || l.interest,
      URGENCY_LABELS[l.urgency] || l.urgency,
      statusMeta(l.status).label, l.owner, `${tier.label} (${score})`, l.message,
    ].map(csvCell).join(',')
  })
  const csv = [header.map(csvCell).join(','), ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nextreach-leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LeadsTable({ leads, capped, onOpen, onUpdate }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('score') // 'score' | 'date'
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [todayOnly, setTodayOnly] = useState(false)
  const [page, setPage] = useState(0)

  // Any filter change should send us back to the first page.
  function withReset(setter) {
    return (value) => {
      setter(value)
      setPage(0)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = leads.filter((l) => {
      if (q && ![l.name, l.email, l.company].filter(Boolean).some((v) => v.toLowerCase().includes(q)))
        return false
      if (statusFilter !== 'all' && (l.status || 'new') !== statusFilter) return false
      if (urgencyFilter !== 'all' && l.urgency !== urgencyFilter) return false
      if (todayOnly && !isToday(l.created_at)) return false
      if (tierFilter !== 'all' && scoreLead(l).tier.key !== tierFilter) return false
      return true
    })

    rows = rows
      .map((l) => ({ lead: l, score: scoreLead(l).score }))
      .sort((a, b) => {
        if (sortBy === 'score' && b.score !== a.score) return b.score - a.score
        return new Date(b.lead.created_at) - new Date(a.lead.created_at)
      })
      .map((x) => x.lead)
    return rows
  }, [leads, query, sortBy, statusFilter, tierFilter, urgencyFilter, todayOnly])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const selectCls =
    'rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500'

  return (
    <div>
      {/* Filter / action bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => withReset(setQuery)(e.target.value)}
          placeholder="Ad, e-posta veya şirkette ara…"
          className="w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />

        <select value={statusFilter} onChange={(e) => withReset(setStatusFilter)(e.target.value)} className={selectCls}>
          <option value="all">Tüm durumlar</option>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        <select value={tierFilter} onChange={(e) => withReset(setTierFilter)(e.target.value)} className={selectCls}>
          <option value="all">Tüm skorlar</option>
          <option value="hot">Sıcak</option>
          <option value="warm">Ilık</option>
          <option value="cold">Soğuk</option>
        </select>

        <select value={urgencyFilter} onChange={(e) => withReset(setUrgencyFilter)(e.target.value)} className={selectCls}>
          <option value="all">Tüm aciliyetler</option>
          <option value="high">Acil</option>
          <option value="medium">Bu çeyrek</option>
          <option value="low">Araştırıyor</option>
        </select>

        <button
          type="button"
          onClick={() => withReset(setTodayOnly)(!todayOnly)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            todayOnly
              ? 'bg-emerald-600 text-white'
              : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Bugün
        </button>

        <label className="flex items-center gap-2 text-sm text-slate-500">
          Sırala:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
            <option value="score">Lead skoru</option>
            <option value="date">Tarih</option>
          </select>
        </label>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            CSV indir
          </button>
          <span className="text-sm text-slate-500">{filtered.length} kayıt</span>
        </div>
      </div>

      {capped && (
        <p className="mb-3 text-xs text-amber-600">
          En yeni {FETCH_LIMIT} kayıt gösteriliyor. Daha fazlası için sunucu tarafı
          sayfalama gerekir (bkz. README).
        </p>
      )}

      {/* Mobile: card layout (the wide table is unusable below sm). */}
      <div className="space-y-3 sm:hidden">
        {pageRows.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onOpen={onOpen} onUpdate={onUpdate} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
            {leads.length === 0 ? 'Henüz lead yok.' : 'Filtreyle eşleşen kayıt yok.'}
          </p>
        )}
      </div>

      {/* Desktop: table. w-full fills the container; overflow-x-auto stays only
          as a graceful fallback for unusually narrow desktop windows. */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm sm:block">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 pl-3 pr-1">
                <span className="sr-only">Detay</span>
              </th>
              {COLUMNS.map((c) => (
                <th key={c} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onOpen={onOpen} onUpdate={onUpdate} />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            {leads.length === 0 ? 'Henüz lead yok.' : 'Filtreyle eşleşen kayıt yok.'}
          </p>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            ‹ Önceki
          </button>
          <span className="text-slate-500">
            Sayfa {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Sonraki ›
          </button>
        </div>
      )}
    </div>
  )
}
