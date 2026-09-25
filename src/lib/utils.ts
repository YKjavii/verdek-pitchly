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
