export type Role = 'admin' | 'member'

export type WebsiteType = 'none' | 'weak' | 'listing' | 'has_site'

export type Status =
  | 'new'
  | 'contacted'
  | 'replied'
  | 'interested'
  | 'qualified'
  | 'mockup'
  | 'proposal'
  | 'won'
  | 'lost'

export const STATUSES: [Status, string][] = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['replied', 'Replied'],
  ['interested', 'Interested'],
  ['qualified', 'Qualified'],
  ['mockup', 'Concept sent'],
  ['proposal', 'Proposal sent'],
  ['won', 'Won'],
  ['lost', 'Lost'],
]

export const statusLabel = (s: Status) => STATUSES.find(([k]) => k === s)?.[1] ?? s

export interface Profile {
  id: string
  org_id: string
  email: string
  display_name: string | null
  role: Role
  created_at: string
}

export interface Sweep {
  id: string
  org_id: string
  query: string
  area: string
  criteria: string
  status: 'queued' | 'running' | 'done' | 'failed'
  count: number
  requested_by: string | null
  requested_at: string
  completed_at: string | null
}

export interface Prospect {
  id: string
  org_id: string
  name: string
  category: string
  area: string
  address: string
  phone: string
  rating: number
  reviews: number
  website_type: WebsiteType
  website_url: string
  website_note: string
  instagram: string
  facebook: string
  owner_replies: number
  signals: string[]
  source: string
  sweep_id: string | null
  added_at: string

  status: Status
  pitch: string | null
  notes: string
  package: string
  quote: string
  delivery_days: string
  qualification: string
  objection: string
  lost_reason: string
  lost_note: string
  concept: unknown
  won_value: number
  follow_up_date: string | null
  contacted_at: string | null
  fu_done: number
  events: Record<string, string>

  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLogEntry {
  id: string
  prospect_id: string
  org_id: string
  text: string
  created_by: string | null
  created_at: string
}

export interface PackageDef {
  name: string
  price: string
  days: string
  items: string[]
}

export interface OrgSettings {
  org_id: string
  owner_name: string
  default_area: string
  packages: Record<string, PackageDef>
  updated_at: string
}
