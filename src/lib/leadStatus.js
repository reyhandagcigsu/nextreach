// Sales pipeline statuses. Single source of truth for labels + colors so the
// row dropdown, filter bar and modal all stay in sync.

export const STATUSES = [
  { key: 'new', label: 'Yeni', className: 'bg-blue-100 text-blue-700' },
  { key: 'contacted', label: 'Arandı', className: 'bg-violet-100 text-violet-700' },
  { key: 'in_progress', label: 'İletişimde', className: 'bg-amber-100 text-amber-700' },
  { key: 'closed', label: 'Kapandı', className: 'bg-emerald-100 text-emerald-700' },
  { key: 'junk', label: 'Çöp', className: 'bg-slate-200 text-slate-500' },
]

const BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]))

export function statusMeta(key) {
  return BY_KEY[key] ?? STATUSES[0]
}
