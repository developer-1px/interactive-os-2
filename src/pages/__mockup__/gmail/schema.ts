// Gmail list/detail mockup — entity schema
//
// Ranges (measured from real Gmail-style corp inbox):
//   from: 6–20 chars (typical 12)
//   email: always present, domain varies
//   subject: 10–80 chars (typical 30)
//   preview: 30–120 chars, single-line clamp in list
//   date: "Apr 14" or "12:43 PM" — always 7 chars
//   labels: 0–3 chips, each 2–10 chars
//   attachment: bool
//   starred: bool
//   unread: bool
//   important: bool

export interface MailEntry {
  id: string
  from: string
  email: string
  subject: string
  preview: string
  date: string
  starred: boolean
  unread: boolean
  hasAttachment: boolean
  labels: string[]
  important: boolean
}

// Thread message — for detail view (not list)
export interface ThreadMessage {
  id: string
  from: string
  email: string
  to: string
  date: string
  body: string
}

export interface AttachmentEntry {
  id: string
  name: string
  size: string
  kind: 'pdf' | 'doc' | 'xls' | 'img' | 'zip'
}

// Folder (sidebar nav)
export interface FolderEntry {
  id: string
  label: string
  unreadCount: number | null  // null = no badge
  kind: 'system' | 'label'    // system = Inbox/Sent/Spam; label = user-defined
}

// List-level state fixtures
export type ListState = 'populated' | 'empty' | 'loading' | 'error'
