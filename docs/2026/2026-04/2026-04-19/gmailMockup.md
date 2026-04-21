---
id: gmailMockup
type: decision
slug: gmailMockup
title: Gmail — Mockup
tags: [mockup, ux, fidelity-ladder, gmail]
created: 2026-04-19
updated: 2026-04-19
status: open
layer: design
phase: 5
---

# Gmail Mockup

Reference: http://localhost:5173/showcase/gmail (existing 14-defect implementation)
Goal: Climb the fidelity ladder (Data → Importance → Low-fi → Mid-fi → Hi-fi) so defects are caught at cheap fidelity tiers before implementation.

## Phase 1 — Data Inventory

- [x] `src/pages/__mockup__/gmail/schema.ts` — MailEntry / ThreadMessage / AttachmentEntry / FolderEntry
- [x] `src/pages/__mockup__/gmail/fixtures.ts` — 18 mail rows (3 edge-crafted + 15 faker seed=42), 11 folders, 3 thread messages, 2 attachments
- [x] Edge cases: `edge-max` (99ch subject, 3 labels), `edge-loaded` (busy row), `edge-min` (3-char sender)
- [x] State fixtures: populated / empty / loading (8 skeleton) / error message
- [x] `DataInspector.tsx` at `/__mockup__/gmail/data`
- [x] Screenshot: `screenshots/mockup-gmail-data.png`
- [ ] User approval

### LLM self-review (Phase 1 screenshot)

- **Observed measured ranges**:
  - from: 3–22 ch (typical 14)
  - subject: 2–99 ch (typical 43)
  - preview: 2–170 ch (typical 106)
  - labels: 0–3 chips, each 4–10 ch
  - unread: 7/18 · starred: 10/18 · hasAttachment: 9/18
- **Defects in DataInspector itself** (not the future Gmail UI):
  - Example column heavily truncated ("E..", "A..", "1..") because flex:'1' share is too narrow at the current viewport. Data is still captured in fixtures, but Phase 2+ should not repeat this mistake.
  - AppShell icon rail leaks into the mockup route. Future Phase 3–5 screens should register routes outside AppShell or apply a shell-clean fidelity theme.

## Phase 2 — Importance Matrix

| Field | 1st | 2nd | 3rd | hidden on list |
|---|---|---|---|---|
| from | ● | | | |
| subject | | ● | | |
| unread | | ● | | (state modifier) |
| preview | | | ● | |
| date | | | ● | |
| hasAttachment | | | ● | |
| labels | | | ● | |
| starred | | | ● | |
| important | | | ● | |
| id | | | | ● |
| email | | | | ● (detail only) |

Reasons: 1st = `from` (fastest triage signal, Gmail/Superhuman/Missive de facto). 2nd = `subject` + `unread` (unread is orthogonal state elevating subject). 3rd = metadata.

User approved: yes

## Phase 3 — Low-fi Wireframe

- [x] `Wireframe.tsx` + `Wireframe.module.css` (grayscale filter + monospace)
- [x] Route `/__mockup__/gmail/low` registered **outside AppShell** (shell-clean)
- [x] Screenshot: `screenshots/mockup-gmail-low.png`
- [x] LLM self-review (2 defects found + fixed in same turn)
- [ ] User approval

### LLM self-review (Phase 3)

**Initial defects found and fixed:**
- TopBar cluster rail-stuck left → fixed: search wrapped in `flex:'1' layout:'center'` → middle-aligned
- 3-pane body not filling viewport width → fixed: added `width: 'full'` to page + body row

**Remaining structural observations (not defects, acceptance notes):**
- Vertical viewport-fill is unachievable with current ax axes (no height axis, no `100vh`). Wireframe renders at natural height; area below is empty black. Phase 4+ inherit the same limit unless we accept module.css `height: 100vh` as an explicit last-mile exception or extend ax with a `size` axis.
- Shell-clean route works: no activity-bar rail leaking into the mockup.
- Boxes show intended layout: TopBar (7 slots with middle search), Sidebar (MAILBOX + LABELS groups with unread counts), MailList (tabs + toolbar + 12 rows + pagination), Detail (toolbar + subject + from + thread collapse + body + attachments + actions).

### Phase 3 findings to carry forward

- Field widths in list row: sender `width:'sm'` fits 14ch comfortably; subject gets no fixed width and will compete with preview at mid-fi. **Decision at Phase 4**: subject should be `width:'md'` or explicit flex share so preview doesn't eat its space.
- Chip is single placeholder; actual data has 0–3 chips per row. **Check at Phase 4** whether chips overflow horizontally at the narrowest list width.
- Detail subject box is currently equal-weight with other boxes. **Phase 5 will size it via `textStyle: 'page'`** (decision carried from Phase 2 matrix).

## Phase 4 — Mid-fi

- Screenshot: `screenshots/mockup-gmail-mid.png`
- Real fixtures rendered (18 mails, 11 folders, 3 thread, 2 attachments)
- Findings: text contrast weak, edge-max subject compresses row, date wraps vertically → carried to Phase 5

## Phase 5 — Hi-fi

- Screenshot: `screenshots/mockup-gmail-hi.png`
- Full ax axis applied per Importance Matrix
- Remaining defects: read-row text muted too faintly, detail toolbar fades mid-row, Reply-all/Forward ghost nearly invisible → Visual Contract below

## Visual Contract

### List row
- **sender-no-truncation**: `.list-row` sender span width='sm' flex='none' → sender up to 14ch typical renders without ellipsis
- **unread-contrast**: unread row surface='display', read row surface='ghost' → Δ background luminance ≥ WCAG 4.5:1
- **chip-flex-none**: `Badge` elements in list row must have computed flex-shrink = 0
- **chip-fits-content**: chip width = content width at 2–10 char labels, no truncation
- **date-fixed-width**: date span width='sm' flex='none', no line wrap
- **star-visible-filled**: `<Star fill="currentColor">` when starred=true → computed opacity > 0.7

### Hierarchy (monotonic)
- fontSize(textStyle='page') > fontSize('label') ≥ fontSize('body') > fontSize('caption')
- caption color luminance < body color luminance (dim tone enforced)

### Detail
- **subject-page-style**: detail subject uses textStyle='page'
- **attachments-cell**: each attachment wrapped in role='cell' surface='display'
- **reply-primary**: Reply uses surface='action' tone='accent'; Reply all/Forward use surface='ghost'
- **toolbar-uniform**: all 6 toolbar actions (Archive/Delete/Spam/Move/Labels/Snooze) have identical textStyle='caption' with equal contrast — no fade pattern

### TopBar
- **search-centered**: search bar centered between logo cluster and actions cluster
- **search-width-lg**: search input container width='lg'

### Sidebar
- **compose-fab**: Compose uses surface='action' tone='accent', full-width bar
- **unread-badge**: folder with unreadCount uses Badge tone='accent-dim'
- **selected-folder**: current folder uses surface='display' (distinct from ghost default)

### Theme
- **light-theme-contrast**: body text on light theme must meet WCAG 4.5:1 (this run shows fail → theme token fix required before /do)
