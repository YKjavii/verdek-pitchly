/**
 * Per-business-kind copy used across the audit, pitch and concept generator.
 * Ported from the original artifact's KINDS table, trimmed to the kinds
 * kindOf() (in pitch.ts) actually classifies into.
 */
export interface KindMeta {
  /** Title-case singular label, e.g. "Barbershop". */
  label: string
  /** Plural noun for what they sell/do, used in copy like "their cuts". */
  noun: string
  /** Short call-to-action verb phrase, e.g. "book a cut". */
  cta: string
  /** Sentence fragment describing the recommended website solution. */
  solution: string
  /** Three example service/offer cards for the concept generator. */
  offers: [string, string, string]
}

export const KIND_META: Record<string, KindMeta> = {
  barbershop: {
    label: 'Barbershop',
    noun: 'cuts',
    cta: 'book a cut',
    solution: 'a mobile-first page with your price list, photos of recent cuts, and a one-tap WhatsApp booking button',
    offers: ['Classic cut', 'Beard trim', 'Cut + beard combo'],
  },
  'nail bar': {
    label: 'Nail bar',
    noun: 'nail sets',
    cta: 'book a set',
    solution: 'a mobile-first page with a nail-art gallery, your price list, and a one-tap WhatsApp booking button',
    offers: ['Classic manicure', 'Gel set', 'Full set + design'],
  },
  spa: {
    label: 'Spa',
    noun: 'treatments',
    cta: 'book a treatment',
    solution: 'a calming, mobile-first page with your treatment menu and an easy WhatsApp booking button',
    offers: ['Massage', 'Facial', 'Spa day package'],
  },
  salon: {
    label: 'Salon',
    noun: 'services',
    cta: 'book an appointment',
    solution: 'a mobile-first page with your service menu, photos, and a one-tap WhatsApp booking button',
    offers: ['Wash & style', 'Colour', 'Treatment'],
  },
  'tour operator': {
    label: 'Tour operator',
    noun: 'tours',
    cta: 'book a tour',
    solution: 'a mobile-first page with your tour packages, photos, and a one-tap WhatsApp booking button',
    offers: ['Half-day tour', 'Full-day tour', 'Private charter'],
  },
  business: {
    label: 'Business',
    noun: 'services',
    cta: 'get in touch',
    solution: 'a clean, mobile-first page that puts your services, reviews and a WhatsApp button in one place',
    offers: ['Signature service', 'Popular package', 'Ask about custom options'],
  },
}

export const kindMeta = (key: string): KindMeta => KIND_META[key] ?? KIND_META.business
