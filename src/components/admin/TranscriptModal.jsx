import { useEffect, useRef, useState } from 'react'
import { scoreLead, isFreeEmail, qualificationInfo } from '../../lib/leadScore.js'
import { STATUSES } from '../../lib/leadStatus.js'

const INTEREST_LABELS = {
  sales: 'Satış',
  marketing: 'Pazarlama',
  support: 'Müşteri Desteği',
  other: 'Diğer',
}
const URGENCY_LABELS = {
  high: 'Acil — bu hafta',
  medium: 'Bu çeyrek içinde',
  low: 'Sadece araştırıyor',
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{value || '—'}</dd>
    </div>
  )
}

function focusable(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.disabled)
}

export default function TranscriptModal({ lead, onClose, onUpdate }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const [owner, setOwner] = useState(lead?.owner ?? '')

  // Esc to close + a basic focus trap (Tab cycles within the dialog).
  useEffect(() => {
    if (!lead) return
    closeRef.current?.focus()
    function onKey(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const items = focusable(dialogRef.current)
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lead, onClose])

  if (!lead) return null
  const transcript = Array.isArray(lead.transcript) ? lead.transcript : []
  const { score, tier, reasons } = scoreLead(lead)
  const personalEmail = isFreeEmail(lead.email)
  const qual = qualificationInfo(lead)

  function saveOwner() {
    const trimmed = owner.trim()
    if (trimmed !== (lead.owner ?? '')) onUpdate(lead.id, { owner: trimmed || null })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${lead.name || 'Lead'} detayı`}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900">{lead.name || 'İsimsiz'}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tier.className}`}>
                {tier.label} · {score}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">
                {lead.email}
              </a>
              {personalEmail && <span className="ml-1 text-amber-600">(kişisel e-posta)</span>}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pipeline controls — let sales work the lead without leaving the view. */}
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-200 px-5 py-3">
          <label className="text-xs text-slate-500">
            Durum
            <select
              value={lead.status || 'new'}
              onChange={(e) => onUpdate(lead.id, { status: e.target.value })}
              className="mt-1 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800 outline-none focus:border-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="flex-1 text-xs text-slate-500">
            Sahip (kim aldı)
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              onBlur={saveOwner}
              placeholder="örn. Ayşe"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
          </label>
        </div>

        {/* Structured summary — what sales needs at a glance. */}
        <div className="border-b border-slate-200 px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Şirket" value={lead.company} />
            <Field label="Ekip boyutu" value={lead.company_size} />
            <Field label="İlgi alanı" value={INTEREST_LABELS[lead.interest] || lead.interest} />
            <Field label="Aciliyet" value={URGENCY_LABELS[lead.urgency] || lead.urgency} />
          </dl>
          {lead.message && (
            <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-indigo-400">Mesajı</dt>
              <dd className="text-sm text-slate-800">{lead.message}</dd>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Skor: {reasons.length ? reasons.join(' · ') : 'belirgin sinyal yok'}
          </p>
          {qual.missing.length > 0 && (
            <p className="mt-1 text-xs text-amber-600">
              ⓘ Ziyaretçi şu alanları paylaşmadı: {qual.missing.join(', ')}.
              {qual.sparse && ' Düşük skor ilgisizlik değil, eksik bilgi olabilir — nitelemek için aramaya değer.'}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-4">
          <p className="text-center text-xs uppercase tracking-wide text-slate-400">
            Sohbet dökümü
          </p>
          {transcript.length === 0 && (
            <p className="text-center text-sm text-slate-400">Sohbet dökümü yok.</p>
          )}
          {transcript.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={[
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  m.role === 'bot' ? 'bg-slate-200 text-slate-800' : 'bg-indigo-600 text-white',
                ].join(' ')}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
