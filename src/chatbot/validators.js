// Pure validation helpers for the chatbot. No React, no side effects — these
// are trivially unit-testable.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Each validator returns { valid: boolean, error?: string }.
export const validators = {
  none: () => ({ valid: true }),

  required: (value) => {
    const ok = typeof value === 'string' && value.trim().length > 0
    return ok ? { valid: true } : { valid: false, error: 'Lütfen bir değer girin.' }
  },

  email: (value) => {
    const trimmed = (value ?? '').trim()
    if (!trimmed) return { valid: false, error: 'E-posta adresi gerekli.' }
    if (!EMAIL_RE.test(trimmed))
      return { valid: false, error: 'Geçerli bir e-posta adresi girin (ör. ad@sirket.com).' }
    return { valid: true }
  },
}

export function validate(kind, value) {
  const fn = validators[kind] ?? validators.none
  return fn(value)
}
