import type { OrgSettings, Prospect } from './types'
import { fill } from './pitch'

export type ObjectionKey =
  | 'price'
  | 'time'
  | 'diy'
  | 'notsure'
  | 'competitor'
  | 'badexp'
  | 'decision'
  | 'seasonal'
  | 'trust'

export interface ObjectionDef {
  key: ObjectionKey
  label: string
  reply: (p: Prospect, settings: OrgSettings) => string
}

export const OBJECTIONS: Record<ObjectionKey, ObjectionDef> = {
  price: {
    key: 'price',
    label: 'Says it costs too much',
    reply: (p, s) =>
      fill(
        `Totally understand — {PRICE} is for a full {PKG} website built and launched for you, not just a template. Happy to break down exactly what's included, or start smaller and add on later.`,
        p,
        s
      ),
  },
  time: {
    key: 'time',
    label: "Doesn't have time right now",
    reply: (p, s) =>
      fill(`No problem at all — I do all the building. I just need about 15 minutes up front for details and photos, then I handle the rest.`, p, s),
  },
  diy: {
    key: 'diy',
    label: 'Wants to do it themselves',
    reply: (p, s) => fill(`Makes sense if that's something you enjoy! Happy to step back — if it ever feels like more than you want to manage, the offer still stands.`, p, s),
  },
  notsure: {
    key: 'notsure',
    label: 'Not sure they need a website',
    reply: (p, s) =>
      fill(
        `Fair question. With ${p.reviews} reviews and no site, most people searching for you online land on your Google listing alone — a simple page just gives them one more reason to trust you and book.`,
        p,
        s
      ),
  },
  competitor: {
    key: 'competitor',
    label: 'Already talking to someone else',
    reply: (p, s) => fill(`All good — happy to send a free {PKG} concept anyway so you have something real to compare, no pressure either way.`, p, s),
  },
  badexp: {
    key: 'badexp',
    label: 'Had a bad experience before',
    reply: (p, s) => fill(`Sorry to hear that. I'll send a concept first, on me, so you can see exactly what you're getting before committing to anything.`, p, s),
  },
  decision: {
    key: 'decision',
    label: 'Needs to check with a partner/owner',
    reply: (p, s) => fill(`Of course — I'll put together a one-pager with the {PKG} details and price so it's easy to share and discuss.`, p, s),
  },
  seasonal: {
    key: 'seasonal',
    label: 'Wants to wait for a slower season',
    reply: (p, s) => fill(`Makes sense — I can build it now and simply schedule the launch for whenever suits you best.`, p, s),
  },
  trust: {
    key: 'trust',
    label: "Hasn't heard of you before",
    reply: (p, s) => fill(`Fair enough — I'm a Jamaican designer working with local businesses like yours. Happy to send a free concept first so you can judge the work before paying anything.`, p, s),
  },
}

export const OBJECTION_LIST: ObjectionDef[] = Object.values(OBJECTIONS)

export const objectionOf = (key: string): ObjectionDef | undefined => OBJECTIONS[key as ObjectionKey]
