import { scoreLead, isFreeEmail, qualificationInfo } from '../../lib/leadScore.js'
import { STATUSES, statusMeta } from '../../lib/leadStatus.js'
import { isToday, formatDateTime } from '../../lib/date.js'

const INTEREST_LABELS = {
  sales: 'Satış',
  marketing: 'Pazarlama',
  support: 'Müşteri Desteği',
  other: 'Diğer',
}
const URGENCY_META = {
  high: { label: 'Acil', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Bu çeyrek', className: 'bg-amber-100 text-amber-700' },
  low: { label: 'Araştırıyor', className: 'bg-slate-100 text-slate-600' },
}

// Mobile-only presentation of a lead (the table becomes unusable below sm).
export default function LeadCard({ lead, onOpen, onUpdate }) {
  const { score, tier } = scoreLead(lead)
  const meta = statusMeta(lead.status)
  const urgency = URGENCY_META[lead.urgency]
  const personalEmail = isFreeEmail(lead.email)
  const qual = qualificationInfo(lead)
  const today = isToday(lead.created_at)

  const summary = [
    lead.company,
    lead.company_size,
    INTEREST_LABELS[lead.interest] || lead.interest,
  ].filter(Boolean).join(' · ')

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.className}`}>
          {tier.label} · {score}
        </span>
        <select
          value={lead.status || 'new'}
          onChange={(e) => onUpdate(lead.id, { status: e.target.value })}
          aria-label={`${lead.name || 'Lead'} durumu`}
          className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ring-1 ring-inset ring-black/5 ${meta.className}`}
        >
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => onOpen(lead)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-label={`${lead.name || 'Lead'} detayını aç`}
      >
        <span className="text-base font-semibold text-slate-900">{lead.name || 'İsimsiz'}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-300">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {lead.owner && <p className="text-xs text-slate-400">👤 {lead.owner}</p>}

      <p className="text-sm">
        {lead.email ? (
          <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">
            {lead.email}
          </a>
        ) : (
          '—'
        )}
        {personalEmail && (
          <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            kişisel
          </span>
        )}
      </p>

      {summary && <p className="text-xs text-slate-500">{summary}</p>}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {urgency ? (
            <span className={`rounded-full px-2 py-0.5 font-medium ${urgency.className}`}>
              {urgency.label}
            </span>
          ) : (
            <span className="text-slate-400">aciliyet —</span>
          )}
        </span>
        <span>
          {formatDateTime(lead.created_at)}
          {today && (
            <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              bugün
            </span>
          )}
        </span>
      </div>

      {qual.sparse && (
        <p
          title={`Paylaşılmayan: ${qual.missing.join(', ')}`}
          className="text-[11px] text-slate-400"
        >
          ⓘ eksik bilgi ({qual.provided}/{qual.total})
        </p>
      )}
    </div>
  )
}
