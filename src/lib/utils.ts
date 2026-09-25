export const waNumber = (phone: string): string => {
  const d = (phone || '').replace(/\D/g, '')
  if (!d) return ''
  return d.length === 10 ? '1' + d : d
}

export const waLink = (phone: string, text: string): string =>
  `https://wa.me/${waNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const fbUrl = (v: string): string => (!v ? '' : /^https?:/.test(v) ? v : `https://www.facebook.com/${v}`)

/** Normalizes a business name for duplicate checks (lowercase, strip punctuation/whitespace). */
export const normalizeName = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

export const today = (): string => new Date().toISOString().slice(0, 10)

export const addDays = (n: number, from?: string): string => {
  const d = from ? new Date(from) : new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export const daysSince = (iso: string): number => Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)

export const plural = (n: number, a: string, b?: string) => (n === 1 ? a : b || a + 's')

/** Escapes text for safe interpolation into a raw HTML string (used by the concept generator, which builds a standalone document). */
export const escapeHtml = (s: string): string =>
  (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Strips common legal suffixes for friendlier copy ("Sunset Tours Ltd" -> "Sunset Tours"). */
export const shortName = (name: string): string =>
  name.replace(/\s*\b(ltd\.?|limited|inc\.?|llc|co\.?)\b\.?\s*$/gi, '').trim() || name

/** Formats a short "Mon D" style date for follow-up/funnel UI. */
export const fmtShortDate = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
