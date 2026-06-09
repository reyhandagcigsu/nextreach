// ---------------------------------------------------------------------------
// leadScore — turns the raw fields a lead gave us into a single Sıcak/Ilık/Soğuk
// signal so sales can triage at a glance instead of eyeballing every row.
//
// Deliberately a simple, transparent additive model (no ML, no magic): every
// point is explainable, which matters when sales asks "why is this one hot?".
// Pure function → trivially testable and reused by the admin UI.
// ---------------------------------------------------------------------------

// Free / personal email providers. A corporate domain is a stronger B2B signal
// than a personal inbox, so personal emails score lower and get flagged.
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com',
  'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com',
  'aol.com', 'proton.me', 'protonmail.com', 'yandex.com', 'yandex.ru',
  'mail.com', 'gmx.com', 'gmx.net', 'hey.com', 'zoho.com',
])

export function isFreeEmail(email) {
  if (!email || typeof email !== 'string') return false
  const domain = email.split('@')[1]?.trim().toLowerCase()
  return domain ? FREE_EMAIL_DOMAINS.has(domain) : false
}

// Per-field weights. Urgency dominates because "ready to buy now" is the single
// best predictor of a workable lead.
const URGENCY_POINTS = { high: 3, medium: 2, low: 0 }
// Headcount is only a rough proxy for fit; kept modest on purpose. (A sharper
// model would ask order volume / sector — see README.)
const SIZE_POINTS = { '1-10': 0, '11-50': 1, '51-200': 2, '200+': 2 }

const TIERS = {
  hot: { key: 'hot', label: 'Sıcak', className: 'bg-red-500 text-white' },
  warm: { key: 'warm', label: 'Ilık', className: 'bg-amber-300 text-amber-900' },
  cold: { key: 'cold', label: 'Soğuk', className: 'bg-slate-200 text-slate-600' },
}

// Returns { score, tier, reasons } — reasons explain the number for the UI.
export function scoreLead(lead) {
  let score = 0
  const reasons = []

  const u = URGENCY_POINTS[lead?.urgency] ?? 0
  if (u) {
    score += u
    reasons.push(lead.urgency === 'high' ? 'Acil (+3)' : 'Orta aciliyet (+2)')
  }

  const s = SIZE_POINTS[lead?.company_size] ?? 0
  if (s) {
    score += s
    reasons.push(`Ekip ${lead.company_size} (+${s})`)
  }

  const corporate = lead?.email && !isFreeEmail(lead.email)
  if (corporate) {
    score += 2
    reasons.push('Kurumsal e-posta (+2)')
  }

  if (lead?.message && lead.message.trim().length > 0) {
    score += 1
    reasons.push('Mesaj bıraktı (+1)')
  }

  const tier = score >= 6 ? TIERS.hot : score >= 3 ? TIERS.warm : TIERS.cold
  return { score, tier, reasons }
}

// Qualifying fields the visitor *may* skip. Tracking how many were answered
// lets the UI tell "unknown" apart from "explicitly cold": a low score on a
// sparse lead means "qualify me with a call", not "ignore me".
const QUALIFYING = [
  ['company', 'Şirket'],
  ['company_size', 'Ekip boyutu'],
  ['interest', 'İlgi alanı'],
  ['urgency', 'Aciliyet'],
  ['message', 'Mesaj'],
]

export function qualificationInfo(lead) {
  const missing = QUALIFYING.filter(([key]) => {
    const v = lead?.[key]
    return v == null || (typeof v === 'string' && v.trim() === '')
  }).map(([, label]) => label)
  const total = QUALIFYING.length
  return {
    provided: total - missing.length,
    total,
    missing,
    sparse: missing.length >= 3, // answered 2 or fewer of the 5
  }
}
