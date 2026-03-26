# Agent Viewer Multi-Timeline + Modal File Viewer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agent Viewer를 멀티 타임라인 + 모달 파일 뷰어로 재구성하여 CLI tmux 경험을 웹에서 보존한다.

**Architecture:** Content/Modified 고정 패널을 제거하고, active 세션 수만큼 TimelineColumn을 나란히 배치. 파일 접근은 타임라인 이벤트 클릭 → 모달로 전환. 서버는 세션별 SSE 스트림과 active/inactive 분류를 제공. 가상 스크롤로 전체 내용 노출 + 성능 확보.

**Tech Stack:** React, CSS Modules, Vite plugin (server middleware), SSE, virtual scroll (직접 구현 또는 경량 라이브러리)

**PRD:** `docs/superpowers/prds/2026-03-22-agent-viewer-multiview-prd.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `vite-plugin-agent-ops.ts` | text slice 제거, active/inactive 분류, 세션별 SSE 스트림 |
| Create | `src/pages/viewer/TimelineColumn.tsx` | 단일 세션 타임라인 렌더링 (이벤트 목록 + 스크롤 로직) |
| Create | `src/pages/viewer/TimelineColumn.module.css` | 타임라인 컬럼 스타일 |
| Create | `src/pages/viewer/FileViewerModal.tsx` | 모달 + 파일 뷰어 (CodeBlock/Markdown/Mdx/Image) |
| Create | `src/pages/viewer/FileViewerModal.module.css` | 모달 스타일 |
| Create | `src/pages/viewer/useVirtualScroll.ts` | 가변 높이 가상 스크롤 훅 |
| Modify | `src/pages/PageAgentViewer.tsx` | 멀티 컬럼 레이아웃, Content/Modified 제거 |
| Modify | `src/pages/PageAgentViewer.module.css` | 레이아웃 + 삭제된 패널 스타일 제거 |

---

### Task 1: 서버 — text slice 제거 + active/inactive 분류

**Files:**
- Modify: `vite-plugin-agent-ops.ts:45,60,75,79,82` (slice 제거)
- Modify: `vite-plugin-agent-ops.ts:108-152` (listSessions에 active 필드 추가)
- Modify: `vite-plugin-agent-ops.ts:252-256` (sessions API 응답에 active 포함)

- [x] **Step 1: text slice 제거 + 이벤트 수 제한 제거**

`parseTranscriptLine`에서 모든 `.slice(0, N)` 호출 제거:
```typescript
// 변경 전: text.slice(0, 200), text.slice(0, 120), text.slice(0, 80)
// 변경 후: text 그대로 사용 (잘림 없음)
```

제거 대상 5곳:
- L45: `text: text.slice(0, 200)` → `text`
- L60: `text: text.slice(0, 200)` → `text`
- L75: `evt.editOld = (input.old_string as string)?.slice(0, 200)` → slice 제거
- L79: `evt.text = (input.command as string)?.slice(0, 120)` → slice 제거
- L82: `evt.text = (input.pattern as string)?.slice(0, 80)` → slice 제거

`loadTranscriptEvents`의 이벤트 수 제한도 제거 (가상 스크롤이 클라이언트 성능 담당):
```typescript
// 변경 전: function loadTranscriptEvents(filePath: string, limit = 300)
//          return allEvents.slice(-limit)
// 변경 후:
function loadTranscriptEvents(filePath: string): TimelineEvent[] {
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n').filter(Boolean)
  const allEvents: TimelineEvent[] = []
  for (const line of lines) {
    allEvents.push(...parseTranscriptLine(line))
  }
  return allEvents  // 제한 없이 전체 반환
}
```

- [x] **Step 2: SessionInfo에 active 필드 추가**

`listSessions`에서 mtime 기반 active 판정:
```typescript
const ACTIVE_THRESHOLD_MS = 6 * 60 * 60 * 1000 // 6시간

interface SessionInfo {
  id: string
  filePath: string
  mtime: number
  label: string
  active: boolean // NEW
}

function listSessions(projectRoot: string, limit = 20): SessionInfo[] {
  // ... 기존 로직 ...
  const now = Date.now()
  return files.map(f => {
    // ... 기존 label 추출 ...
    return {
      id, filePath, mtime: f.mtime, label,
      active: (now - f.mtime) < ACTIVE_THRESHOLD_MS,
    }
  })
}
```

- [x] **Step 3: sessions API 응답에 active 포함**

```typescript
// /api/agent-ops/sessions 핸들러
res.end(JSON.stringify(sessions.map(s => ({
  id: s.id, mtime: s.mtime, label: s.label, active: s.active,
}))))
```

- [x] **Step 4: 세션별 SSE 스트림 지원**

현재 `/api/agent-ops/timeline-stream`은 최신 세션만 watch. 세션 ID를 쿼리로 받아 다중 세션 watch 지원.

**4a. 클라이언트 관리 구조 변경:**

```typescript
// 변경 전: const timelineClients = new Set<Response>()
// 변경 후: key = transcript file path, value = connected clients
const timelineClients = new Map<string, Set<import('node:http').ServerResponse>>()

// 각 세션 파일의 마지막 읽은 크기도 추적
const transcriptSizes = new Map<string, number>()
```

**4b. SSE 엔드포인트에 session 파라미터 추가:**

```typescript
if (url.pathname === '/api/agent-ops/timeline-stream') {
  const sessionId = url.searchParams.get('session')
  const dir = getTranscriptDir(projectRoot)
  let targetPath: string | null = null

  if (sessionId && dir) {
    const candidate = path.join(dir, `${sessionId}.jsonl`)
    if (fs.existsSync(candidate)) targetPath = candidate
  } else {
    targetPath = findLatestTranscript(projectRoot)
  }

  if (!targetPath) { res.statusCode = 404; res.end(); return }

  // 파일 watch 등록
  server.watcher.add(targetPath)
  if (!transcriptSizes.has(targetPath)) {
    transcriptSizes.set(targetPath, fs.statSync(targetPath).size)
  }

  // 클라이언트 등록
  if (!timelineClients.has(targetPath)) {
    timelineClients.set(targetPath, new Set())
  }
  timelineClients.get(targetPath)!.add(res)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000)

  req.on('close', () => {
    timelineClients.get(targetPath!)?.delete(res)
    clearInterval(heartbeat)
  })
  return
}
```

**4c. watcher change 핸들러 — 세션별 디스패치:**

```typescript
server.watcher.on('change', (changedPath) => {
  // 해당 파일을 구독하는 클라이언트에게만 전송
  const clients = timelineClients.get(changedPath)
  if (!clients || clients.size === 0) return

  const prevSize = transcriptSizes.get(changedPath) ?? 0
  const stat = fs.statSync(changedPath)
  if (stat.size <= prevSize) return

  const fd = fs.openSync(changedPath, 'r')
  const buf = Buffer.alloc(stat.size - prevSize)
  fs.readSync(fd, buf, 0, buf.length, prevSize)
  fs.closeSync(fd)
  transcriptSizes.set(changedPath, stat.size)

  const newLines = buf.toString('utf-8').trim().split('\n').filter(Boolean)
  for (const line of newLines) {
    const events = parseTranscriptLine(line)
    for (const evt of events) {
      const json = JSON.stringify(evt)
      for (const client of clients) {
        client.write(`data: ${json}\n\n`)
      }
    }
  }
})
```

- [ ] **Step 5: dev 서버에서 동작 확인**

Run: `npm run dev` → 브라우저에서 `/api/agent-ops/sessions` 호출
Expected: 각 세션에 `active: true/false` 필드 포함

- [ ] **Step 6: Commit**

```bash
git add vite-plugin-agent-ops.ts
git commit -m "feat(agent-viewer): remove text slicing, add active session classification and per-session SSE"
```

---

### Task 2: TimelineColumn 컴포넌트 추출

**Files:**
- Create: `src/pages/viewer/TimelineColumn.tsx`
- Create: `src/pages/viewer/TimelineColumn.module.css`
- Modify: `src/pages/PageAgentViewer.tsx` (TimelineItem, EventIcon, eventLabel 이동)

- [ ] **Step 1: TimelineColumn.tsx 생성**

기존 PageAgentViewer에서 타임라인 관련 로직을 추출:
- `TimelineItem` (memo 컴포넌트)
- `EventIcon`
- `eventLabel`
- 타임라인 body 렌더링
- SSE 연결 + 이벤트 수신 + 재연결 로직
- 스크롤 관리 (user 이벤트 → 최상단, auto-follow)

```typescript
// TimelineColumn.tsx
interface TimelineColumnProps {
  sessionId: string
  sessionLabel: string
  isLive: boolean
  isArchive?: boolean        // 아카이브 컬럼이면 닫기 버튼 표시
  onClose?: () => void       // 아카이브 닫기
  onFileClick: (filePath: string, editRanges?: string[]) => void
}
```

**SSE 연결 (세션별 URL + 재연결):**

```typescript
// live 세션일 때만 SSE 연결
useEffect(() => {
  if (!isLive) return
  const es = new EventSource(`/api/agent-ops/timeline-stream?session=${encodeURIComponent(sessionId)}`)

  let pendingEvents: TimelineEvent[] = []
  let rafId = 0

  function flushPending() {
    rafId = 0
    if (pendingEvents.length === 0) return
    const batch = pendingEvents
    pendingEvents = []
    setTimeline(prev => [...prev, ...batch])  // 제한 없이 누적 (가상 스크롤이 성능 담당)
  }

  es.onmessage = (event) => {
    let evt: TimelineEvent
    try { evt = JSON.parse(event.data) } catch { return }
    pendingEvents.push(evt)
    if (!rafId) rafId = requestAnimationFrame(flushPending)
  }

  // 재연결 시 세션별 전체 타임라인 refetch (E5)
  es.onerror = () => {
    es.addEventListener('open', function refetch() {
      es.removeEventListener('open', refetch)
      fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}`)
        .then(res => res.json())
        .then((events: TimelineEvent[]) => setTimeline(events))
    })
  }

  return () => {
    es.close()
    if (rafId) cancelAnimationFrame(rafId)
  }
}, [isLive, sessionId])
```

**초기 타임라인 로딩 (아카이브 포함):**

```typescript
useEffect(() => {
  fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}`)
    .then(res => res.json())
    .then(setTimeline)
}, [sessionId])
```

- [ ] **Step 2: 스마트 스크롤 로직 구현**

```typescript
// user 이벤트 도착 시: 해당 이벤트를 뷰포트 최상단으로 스크롤
// assistant/tool 이벤트 도착 시:
//   - 하단 근처면 auto-scroll to bottom
//   - 위로 스크롤 중이면 유지

const isNearBottom = (el: HTMLElement, threshold = 100) =>
  el.scrollHeight - el.scrollTop - el.clientHeight < threshold

// user 이벤트용: 마지막 user 이벤트 ref를 추적하여 scrollIntoView
const lastUserEventRef = useRef<HTMLDivElement>(null)
```

하단 여백 확보: 타임라인 끝에 `min-height: 100vh` spacer 추가 (마지막 user 이벤트 이후).

- [ ] **Step 3: 타임라인 헤더에 세션 라벨 + live 표시**

```tsx
<div className={styles.tcHeader}>
  {isLive && <span className={styles.tcLive}>●</span>}
  <span className={styles.tcLabel}>{sessionLabel}</span>
  {isArchive && (
    <button className={styles.tcClose} onClick={onClose}>×</button>
  )}
</div>
```

- [ ] **Step 4: CSS 작성**

`TimelineColumn.module.css`: 기존 `avTimeline*` 스타일을 `tc*` 접두사로 이동. 컬럼 min-width: 360px.

- [ ] **Step 5: PageAgentViewer에서 기존 타임라인 코드 제거**

TimelineItem, EventIcon, eventLabel, 타임라인 body JSX를 PageAgentViewer에서 삭제하고 TimelineColumn import로 대체.

- [ ] **Step 6: dev 서버에서 단일 타임라인 컬럼 동작 확인**

Run: `npm run dev` → `/agent` 접근
Expected: 기존과 동일하게 타임라인 표시 (TimelineColumn 컴포넌트 사용)

- [ ] **Step 7: Commit**

```bash
git add src/pages/viewer/TimelineColumn.tsx src/pages/viewer/TimelineColumn.module.css src/pages/PageAgentViewer.tsx
git commit -m "refactor(agent-viewer): extract TimelineColumn component with smart scroll"
```

---

### Task 3: FileViewerModal 컴포넌트

**Files:**
- Create: `src/pages/viewer/FileViewerModal.tsx`
- Create: `src/pages/viewer/FileViewerModal.module.css`

- [ ] **Step 1: FileViewerModal.tsx 생성**

기존 Content 패널의 뷰어 로직을 모달로 이동:

```typescript
interface FileViewerModalProps {
  filePath: string | null     // null이면 모달 닫힘
  editRanges?: string[]       // edit highlight용
  onClose: () => void
}
```

내부 구조:
- `dialog` role 사용 (ARIA)
- 배경 클릭 → `onClose` (defaultPrevented 가드)
- ESC → `onClose` (keydown 핸들러)
- 파일 fetch + CodeBlock/MarkdownViewer/MdxViewer/Image 분기 (기존 로직 재사용)
- Breadcrumb + FileIcon + 메타정보 (line count, edited lines)
- 에러 시 "File not found" 표시

```tsx
export function FileViewerModal({ filePath, editRanges, onClose }: FileViewerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [fileContent, setFileContent] = useState('')
  const [error, setError] = useState(false)

  // filePath 변경 시 모달 열기/닫기
  useEffect(() => {
    if (filePath) {
      dialogRef.current?.showModal()  // 네이티브 <dialog> — ESC, focus trap 내장
      fetch(`/api/fs/file?path=${encodeURIComponent(filePath)}`)
        .then(res => { if (!res.ok) throw new Error(); return res.text() })
        .then(text => { setFileContent(text); setError(false) })
        .catch(() => { setFileContent(''); setError(true) })
    } else {
      dialogRef.current?.close()
    }
  }, [filePath])

  // <dialog>의 네이티브 close 이벤트 (ESC 포함) → onClose 콜백
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handler = () => onClose()
    dialog.addEventListener('close', handler)
    return () => dialog.removeEventListener('close', handler)
  }, [onClose])

  // 배경 클릭 — defaultPrevented 가드 (P3 원칙)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return
    if (e.target === dialogRef.current) onClose()
  }

  // editedLines 계산 — 기존 PageAgentViewer L322-349 로직 이동
  const editedLines = useMemo<Set<number>>(() => {
    const lines = new Set<number>()
    if (!fileContent || !editRanges?.length) return lines
    const contentLines = fileContent.split('\n')
    for (const editNew of editRanges) {
      const editLines = editNew.split('\n')
      for (let i = 0; i <= contentLines.length - editLines.length; i++) {
        let match = true
        for (let j = 0; j < editLines.length; j++) {
          if (contentLines[i + j].trim() !== editLines[j].trim()) { match = false; break }
        }
        if (match) {
          for (let j = 0; j < editLines.length; j++) lines.add(i + j + 1)
          break
        }
      }
    }
    return lines
  }, [fileContent, editRanges])

  const filename = filePath?.split('/').pop() ?? ''
  const ext = filename.split('.').pop() ?? ''
  const isMdx = filename.endsWith('.mdx')
  const isMarkdown = !isMdx && filename.endsWith('.md')
  const isImage = IMAGE_EXTS.has(ext.toLowerCase())

  return (
    <dialog ref={dialogRef} className={styles.fvmDialog} onClick={handleBackdropClick}>
      <div className={styles.fvmModal} onClick={e => e.stopPropagation()}>
        <div className={styles.fvmHeader}>
          {filePath && <Breadcrumb path={filePath} root={DEFAULT_ROOT} />}
          <button className={styles.fvmClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.fvmBody}>
          {error ? (
            <div className={styles.fvmError}>File not found</div>
          ) : isImage ? (
            <img src={`/api/fs/file?path=${encodeURIComponent(filePath!)}`} alt={filename} />
          ) : isMdx ? (
            <MdxViewer filePath={filePath!} />
          ) : isMarkdown ? (
            <MarkdownViewer content={fileContent} />
          ) : (
            <CodeBlock code={fileContent} filename={filename}
              highlightLines={editedLines.size > 0 ? editedLines : undefined} />
          )}
        </div>
      </div>
    </dialog>
  )
}
```

- [ ] **Step 2: CSS 작성**

```css
.fvmBackdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.fvmModal {
  width: 85vw;
  height: 85vh;
  background: var(--surface-2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.fvmHeader { /* Breadcrumb + meta + close button */ }
.fvmBody { /* flex: 1, overflow: auto */ }
```

- [ ] **Step 3: dev 서버에서 모달 동작 확인**

임시로 PageAgentViewer에 FileViewerModal을 연결하여 테스트:
- 타임라인 파일 이벤트 클릭 → 모달 열림
- ESC → 닫힘
- 배경 클릭 → 닫힘
- 다른 파일 클릭 → 내용 교체

- [ ] **Step 4: Commit**

```bash
git add src/pages/viewer/FileViewerModal.tsx src/pages/viewer/FileViewerModal.module.css
git commit -m "feat(agent-viewer): add FileViewerModal component"
```

---

### Task 4: 가상 스크롤 훅

**Files:**
- Create: `src/pages/viewer/useVirtualScroll.ts`

- [ ] **Step 1: 가변 높이 가상 스크롤 훅 구현**

타임라인 이벤트는 높이가 제각각 (user 메시지 짧음, assistant 응답 김). 가변 높이 가상 스크롤이 필요하다.

```typescript
interface UseVirtualScrollOptions {
  itemCount: number
  estimatedItemHeight: number   // 초기 추정값 (예: 40px)
  overscan?: number             // 뷰포트 밖 추가 렌더 개수 (기본 5)
}

interface UseVirtualScrollReturn {
  containerRef: RefObject<HTMLDivElement>
  totalHeight: number
  visibleRange: { start: number; end: number }
  offsetTop: number
  measureItem: (index: number, height: number) => void  // 렌더 후 실측값 기록
}

export function useVirtualScroll(options: UseVirtualScrollOptions): UseVirtualScrollReturn {
  // 각 아이템의 실측 높이를 캐시 (Map<number, number>)
  // 스크롤 위치로부터 visible range 계산
  // ResizeObserver로 아이템 높이 변경 감지
}
```

- [ ] **Step 2: TimelineColumn에 가상 스크롤 적용**

```tsx
const { containerRef, totalHeight, visibleRange, offsetTop, measureItem } = useVirtualScroll({
  itemCount: timeline.length,
  estimatedItemHeight: 40,
  overscan: 10,
})

// 렌더:
<div ref={containerRef} className={styles.tcBody}>
  <div style={{ height: totalHeight }}>
    <div style={{ transform: `translateY(${offsetTop}px)` }}>
      {timeline.slice(visibleRange.start, visibleRange.end).map((evt, i) => (
        <TimelineItem
          key={visibleRange.start + i}
          evt={evt}
          onClick={handleClick}
          ref={(el) => { if (el) measureItem(visibleRange.start + i, el.offsetHeight) }}
        />
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 3: 스크롤 성능 확인**

Run: `npm run dev` → 이벤트가 많은 세션에서 빠르게 스크롤
Expected: 버벅임 없이 부드러운 스크롤, 뷰포트 밖 DOM 노드 최소화

- [ ] **Step 4: Commit**

```bash
git add src/pages/viewer/useVirtualScroll.ts src/pages/viewer/TimelineColumn.tsx
git commit -m "feat(agent-viewer): add variable-height virtual scroll for timeline"
```

---

### Task 5: PageAgentViewer 멀티 컬럼 레이아웃

**Files:**
- Modify: `src/pages/PageAgentViewer.tsx` (대규모 재구성)
- Modify: `src/pages/PageAgentViewer.module.css`

- [ ] **Step 1: 상태 모델 변경**

```typescript
// 기존: 단일 activeSession
// 변경: active 세션 목록 + 수동 열린 아카이브 목록

const [sessions, setSessions] = useState<SessionInfo[]>([])
const [openArchiveIds, setOpenArchiveIds] = useState<Set<string>>(new Set())
const [modalFile, setModalFile] = useState<{ path: string; editRanges?: string[] } | null>(null)

// active 세션: sessions.filter(s => s.active)
// 아카이브: sessions.filter(s => !s.active)
// 표시할 컬럼: [...activeSessions, ...archiveSessions.filter(s => openArchiveIds.has(s.id))]
```

- [ ] **Step 2: Content/Modified 패널 제거**

삭제 대상:
- `selectedFile`, `fileContent`, `followMode`, `fetchCounter` state
- `modifiedFiles`, `modifiedStore`, `buildModifiedStore`
- `handleModifiedChange`
- `editedLines` useMemo
- Content 패널 JSX 전체
- Modified 패널 JSX 전체

- [ ] **Step 3: 멀티 컬럼 레이아웃 구성**

```tsx
return (
  <div className={styles.av}>
    {/* Sessions 패널 — 아카이브 전용 */}
    {archiveSessions.length > 0 && (
      <div className={styles.avSessions}>
        <div className={styles.avSessionsHeader}>
          <span className={styles.avSessionsTitle}>Archive</span>
        </div>
        <div className={styles.avSessionList}>
          <Aria behavior={sessionListbox} data={archiveStore} plugins={CORE_PLUGINS} onChange={handleArchiveSelect}>
            <Aria.Item render={/* 세션 라벨 */} />
          </Aria>
        </div>
      </div>
    )}

    {/* 타임라인 컬럼 영역 — 가로 스크롤 가능 */}
    <div className={styles.avColumns}>
      {displayColumns.length === 0 ? (
        <div className={styles.avEmpty}>세션을 선택하세요</div>
      ) : (
        displayColumns.map(session => (
          <TimelineColumn
            key={session.id}
            sessionId={session.id}
            sessionLabel={session.label}
            isLive={session.active}
            isArchive={openArchiveIds.has(session.id)}
            onClose={() => setOpenArchiveIds(prev => { const next = new Set(prev); next.delete(session.id); return next })}
            onFileClick={(path, editRanges) => setModalFile({ path, editRanges })}
          />
        ))
      )}
    </div>

    {/* 파일 뷰어 모달 */}
    <FileViewerModal
      filePath={modalFile?.path ?? null}
      editRanges={modalFile?.editRanges}
      onClose={() => setModalFile(null)}
    />
  </div>
)
```

- [ ] **Step 4: 세션 목록 자동 갱신 (polling)**

active 세션 감지를 위해 sessions 목록을 주기적으로 refetch:
```typescript
useEffect(() => {
  const fetchSessions = () =>
    fetch('/api/agent-ops/sessions').then(r => r.json()).then(setSessions)

  fetchSessions()
  const interval = setInterval(fetchSessions, 5000) // 5초마다
  return () => clearInterval(interval)
}, [])
```

- [ ] **Step 5: CSS 업데이트**

```css
/* 삭제: avContent, avContentHeader, avContentBody, avContentMeta, avContentMetaSep,
   avEditBadge, avModified, avModifiedHeader, avModifiedTitle, avModifiedBody,
   avModifiedItem, avModifiedPath, avModifiedBadge, avFollowBtn, avFollowBtnActive,
   avImageViewer, avImage, avEmpty, avEmptyIcon */

/* 변경: */
.av {
  display: flex;
  flex: 1;
  min-height: 0;
  grid-column: 2 / -1;
}

.avColumns {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;  /* 가로 스크롤 */
}

/* avTimeline 관련 스타일은 TimelineColumn.module.css로 이동 완료 */
```

- [ ] **Step 6: 전체 동작 확인**

Run: `npm run dev` → `/agent` 접근
확인 항목:
- active 세션이 자동으로 컬럼 표시
- 아카이브 세션 클릭 → 컬럼 추가, 닫기 버튼으로 제거
- 파일 이벤트 클릭 → 모달
- 4개+ 컬럼 시 가로 스크롤

- [ ] **Step 7: Commit**

```bash
git add src/pages/PageAgentViewer.tsx src/pages/PageAgentViewer.module.css
git commit -m "feat(agent-viewer): multi-column layout with active auto-display and archive panels"
```

---

### Task 6: CSS line-clamp 제거 + 정리

**Files:**
- Modify: `src/pages/PageAgentViewer.module.css`
- Modify: `src/pages/viewer/TimelineColumn.module.css` (Task 2에서 이동된 스타일)

- [ ] **Step 1: line-clamp 제거**

TimelineColumn.module.css에서:
```css
/* 삭제: */
.tcText {
  /* -webkit-line-clamp: 2; 제거 */
  /* -webkit-box-orient: vertical; 제거 */
  /* display: -webkit-box; 제거 */
  overflow: hidden;           /* 유지 — 가로 오버플로 방지 */
  word-break: break-word;     /* 유지 */
}
```

- [ ] **Step 2: 사용하지 않는 CSS 클래스 제거**

PageAgentViewer.module.css에서 삭제 대상:
- `.avTimeline*` (TimelineColumn.module.css로 이동됨)
- `.avContent*`, `.avModified*`, `.avFollow*`, `.avImage*`, `.avEmpty*`, `.avEditBadge`

- [ ] **Step 3: Commit**

```bash
git add src/pages/PageAgentViewer.module.css src/pages/viewer/TimelineColumn.module.css
git commit -m "fix(agent-viewer): remove text truncation and dead CSS"
```

---

### Task 7: 통합 확인 + 엣지케이스

- [ ] **Step 1: V1~V15 시나리오 수동 검증**

PRD ⑧ 검증 시나리오를 하나씩 확인:
- V1: active 2개 → 컬럼 2개 나란히
- V3: 긴 assistant 응답 → 잘림 없이 전체 표시
- V5: Edit 이벤트 클릭 → 모달에 edit highlight
- V7: ESC → 모달 닫힘
- V10: active 0개 → "세션을 선택하세요"
- V14: user 메시지 도착 → 최상단 스크롤 + 하단 여백

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공, 사용하지 않는 import 없음

- [ ] **Step 3: Commit (필요 시 수정사항)**

```bash
git add -A
git commit -m "fix(agent-viewer): integration fixes for multi-timeline viewer"
```
