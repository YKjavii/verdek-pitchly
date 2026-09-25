import type { Prospect } from './types'
import { kindOf } from './pitch'
import { kindMeta } from './kinds'
import { escapeHtml, shortName, waNumber } from './utils'

export interface ConceptStyle {
  name: string
  bg: string
  ink: string
  brand: string
  accent: string
  soft: string
  onBrand: string
}

export const CONCEPT_STYLES: Record<string, ConceptStyle> = {
  ocean: { name: 'Ocean', bg: '#f3fafb', ink: '#0b2b33', brand: '#0e7c86', accent: '#f2a541', soft: '#dcf1f2', onBrand: '#ffffff' },
  sunset: { name: 'Sunset', bg: '#fff8f1', ink: '#2b1a12', brand: '#cf4f1b', accent: '#1f6f5c', soft: '#ffe5d2', onBrand: '#ffffff' },
  forest: { name: 'Forest', bg: '#f5f8f3', ink: '#13271b', brand: '#1e6a3e', accent: '#e0a800', soft: '#dbeadc', onBrand: '#ffffff' },
  night: { name: 'Night', bg: '#0e1a1d', ink: '#eaf3f1', brand: '#2fc1a3', accent: '#ffd166', soft: '#173037', onBrand: '#062b25' },
}

export interface ConceptOptions {
  style: string
  tagline: string
  offers: [string, string, string]
  img: string
}

export function defaultConceptOptions(p: Prospect): ConceptOptions {
  const meta = kindMeta(kindOf(p))
  return {
    style: 'ocean',
    tagline: `${meta.label} in ${p.area && p.area !== 'Jamaica' ? `${p.area}, Jamaica` : 'Jamaica'}`,
    offers: [...meta.offers],
    img: '',
  }
}

/**
 * Builds a full standalone one-page "website concept" for a prospect — a
 * quick, honest mockup (clearly labelled as such) using only real facts
 * already on file (name, rating, reviews, phone). Meant to be shown in a
 * preview iframe and/or copied out as a .html file. Ported from the
 * original artifact's conceptHtml().
 */
export function conceptHtml(p: Prospect, o: ConceptOptions): string {
  const meta = kindMeta(kindOf(p))
  const C = CONCEPT_STYLES[o.style] || CONCEPT_STYLES.ocean
  const e = escapeHtml
  const wa = waNumber(p.phone)
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hi, I'd like to ${meta.cta.replace(/^book /, 'book ')} with ${shortName(p.name)}`)}` : '#'
  const sig = (p.signals || [])
    .filter((s) => !/^\d/.test(s) && !/stars? from/i.test(s) && !/reviews?/i.test(s) && !/website|early-stage/i.test(s))
    .slice(0, 3)
  const img = /^https?:\/\//.test(o.img || '') ? o.img.replace(/["'()\s<>\\]/g, encodeURIComponent) : ''
  const hero = img
    ? `background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.55)),url("${img}") center/cover`
    : `background:linear-gradient(135deg,${C.brand},${C.accent})`
  const offerCards = o.offers
    .filter((x) => x.trim())
    .map(
      (x) =>
        `<div class="card"><h3>${e(x)}</h3><p>Short description, what's included and the price go here.</p><a href="${waLink}">Ask about this →</a></div>`
    )
    .join('')

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(p.name)}</title><style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:${C.bg};color:${C.ink};line-height:1.5}
a{color:inherit}.w{max-width:1040px;margin:0 auto;padding:0 20px}
.rib{background:${C.ink};color:${C.bg};font-size:12px;text-align:center;padding:6px 12px;letter-spacing:.04em}
nav{display:flex;align-items:center;justify-content:space-between;padding:14px 0}.logo{font-weight:800;font-size:18px;letter-spacing:-.01em}
.btn{display:inline-block;background:${C.brand};color:${C.onBrand};text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px}.btn.alt{background:transparent;border:2px solid currentColor;color:inherit}
.hero{${hero};color:#fff;padding:72px 0 64px}.hero h1{font-size:clamp(2rem,6vw,3.4rem);line-height:1.05;margin:0 0 12px;letter-spacing:-.02em;max-width:16ch}.hero p{font-size:1.1rem;max-width:44ch;margin:0 0 24px;opacity:.95}
.hero .btn{background:#fff;color:${C.brand}}.hero .btn.alt{background:transparent;color:#fff;border-color:#fff;margin-left:8px}
.trust{display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center;padding:20px 0;border-bottom:1px solid ${C.soft}}.trust b{font-size:1.4rem}.trust span{opacity:.75;font-size:.9rem}
section.s{padding:44px 0}h2{font-size:1.6rem;margin:0 0 20px;letter-spacing:-.01em}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.card{background:${C.soft};border-radius:16px;padding:20px}.card h3{margin:0 0 6px;font-size:1.05rem}.card p{margin:0 0 12px;opacity:.8;font-size:.92rem}.card a{font-weight:700;color:${C.brand};text-decoration:none}
.quote{border-left:4px solid ${C.accent};padding:4px 16px;margin:0 0 12px;font-size:1.02rem}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}.steps div{padding:16px;border:1px solid ${C.soft};border-radius:14px;background:${C.bg}}.steps b{display:block;color:${C.brand}}
.cta{background:${C.brand};color:${C.onBrand};text-align:center;padding:48px 20px;border-radius:24px;margin:24px 0 40px}.cta h2{margin-bottom:8px}.cta .btn{background:${C.onBrand};color:${C.brand}}
footer{padding:24px 0 40px;font-size:.9rem;opacity:.75}
</style></head><body><div class="rib">CONCEPT: sample layout for ${e(shortName(p.name))}. Text and images to be confirmed with the owner.</div>
<div class="w"><nav><span class="logo">${e(shortName(p.name))}</span><a class="btn" href="${waLink}">${e(meta.cta.charAt(0).toUpperCase() + meta.cta.slice(1))}</a></nav></div>
<header class="hero"><div class="w"><h1>${e(shortName(p.name))}</h1><p>${e(o.tagline)}</p><a class="btn" href="${waLink}">${e(meta.cta.charAt(0).toUpperCase() + meta.cta.slice(1))}</a>${p.phone ? `<a class="btn alt" href="tel:${e(p.phone)}">Call ${e(p.phone)}</a>` : ''}</div></header>
<div class="w trust"><div><b>★ ${p.rating.toFixed(1)}</b><br><span>Google rating</span></div><div><b>${p.reviews}</b><br><span>Google reviews</span></div>${p.area && p.area !== 'Jamaica' ? `<div><b>${e(p.area)}</b><br><span>Jamaica</span></div>` : ''}</div>
<div class="w"><section class="s"><h2>${e(meta.noun.charAt(0).toUpperCase() + meta.noun.slice(1))}</h2><div class="cards">${offerCards}</div></section>
${sig.length ? `<section class="s"><h2>What guests highlight</h2>${sig.map((s) => `<p class="quote">${e(s)}</p>`).join('')}<p style="opacity:.6;font-size:.85rem">Paraphrased from Google reviews. Real quotes go here once the owner approves them.</p></section>` : ''}
<section class="s"><h2>How it works</h2><div class="steps"><div><b>1. Message us</b>Tap the button and tell us what you want.</div><div><b>2. Pick a date</b>We confirm availability and details.</div><div><b>3. Enjoy it</b>We look after the rest.</div></div></section>
<div class="cta"><h2>Ready when you are</h2><p style="margin:0 0 20px;opacity:.9">One message is all it takes to start.</p><a class="btn" href="${waLink}">${e(meta.cta.charAt(0).toUpperCase() + meta.cta.slice(1))}</a></div>
<footer>${e(p.name)}${p.address ? ' · ' + e(p.address) : ''}${p.phone ? ' · ' + e(p.phone) : ''}</footer></div></body></html>`
}
