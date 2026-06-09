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

function UrgencyBadge({ urgency }) {
  const meta = URGENCY_META[urgency]
  if (!meta) return <span className="text-slate-400">—</span>
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

export default function LeadRow({ lead, onOpen, onUpdate }) {
  const { score, tier, reasons } = scoreLead(lead)
  const personalEmail = isFreeEmail(lead.email)
  const meta = statusMeta(lead.status)
  const today = isToday(lead.created_at)
  const qual = qualificationInfo(lead)

  return (
    <tr className="group border-b border-slate-100 hover:bg-indigo-50/40">
      {/* Explicit "open detail" affordance so it's clear the row is clickable. */}
      <td className="py-3 pl-4 pr-1">
        <button
          type="button"
          onClick={() => onOpen(lead)}
          aria-label={`${lead.name || 'Lead'} detayını aç`}
          title="Detay ve sohbet dökümünü aç"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 transition hover:bg-indigo-100 hover:text-indigo-600 group-hover:text-slate-500"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </td>
      <td className="px-4 py-3">
        <span
          title={reasons.join(' · ') || 'Sinyal yok'}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.className}`}
        >
          {tier.label} · {score}
        </span>
        {qual.sparse && (
          <div
            title={`Paylaşılmayan: ${qual.missing.join(', ')} — düşük skor ilgisizlik değil, eksik bilgi olabilir`}
            className="mt-1 text-[10px] font-medium text-slate-400"
          >
            ⓘ eksik bilgi ({qual.provided}/{qual.total})
          </div>
        )}
      </td>

      {/* Inline status — the core "takip" interaction; no need to open the lead. */}
      <td className="px-4 py-3">
        <select
          value={lead.status || 'new'}
          onChange={(e) => onUpdate(lead.id, { status: e.target.value })}
          aria-label={`${lead.name || 'Lead'} durumu`}
          className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ring-1 ring-inset ring-black/5 ${meta.className}`}
        >
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="text-left text-sm font-medium text-slate-900 hover:text-indigo-600 hover:underline"
        >
          {lead.name || '—'}
        </button>
        {lead.owner && (
          <div className="text-xs text-slate-400">👤 {lead.owner}</div>
        )}
      </td>

      <td className="px-4 py-3 text-sm">
        {lead.email ? (
          <a
            href={`mailto:${lead.email}`}
            className="text-indigo-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
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
      </td>

      <td className="px-4 py-3 text-sm text-slate-700">{lead.company || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{lead.company_size || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-700">
        {INTEREST_LABELS[lead.interest] || lead.interest || '—'}
      </td>
      <td className="px-4 py-3">
        <UrgencyBadge urgency={lead.urgency} />
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-slate-500">
        {formatDateTime(lead.created_at)}
        {today && (
          <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            bugün
          </span>
        )}
      </td>
    </tr>
  )
}
