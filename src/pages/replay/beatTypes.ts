// ② replayV2BeatPrd
export type BeatKind = 'thinking' | 'terminal' | 'diff' | 'commit' | 'filetree' | 'preview'

export interface BeatBase {
  kind: BeatKind
  /** 카드 재생 시간(ms). useBeatPlayer가 progress 0..1 계산 기준 */
  duration: number
}

export interface ThinkingBeat extends BeatBase {
  kind: 'thinking'
  text: string
}

export interface TerminalBeat extends BeatBase {
  kind: 'terminal'
  command: string
  /** type: 'cmd'|'out'|'ok'|'err'로 라인 분류, char-by-char reveal */
  lines: Array<{ t: 'cmd' | 'out' | 'ok' | 'err'; v: string }>
}

export interface DiffBeat extends BeatBase {
  kind: 'diff'
  file: string
  lines: Array<{ t: 'add' | 'del' | 'ctx'; v: string }>
}

export interface CommitBeat extends BeatBase {
  kind: 'commit'
  message: string         // conventional commit subject 또는 마지막 assistant 1문장
  body: string            // body (assistant 요약 또는 빈 문자열)
  hash: string            // "draft" 또는 git hash 추출
  branch: string          // "session" fallback
  files: number
  additions: number
  deletions: number
}

export interface FiletreeBeat extends BeatBase {
  kind: 'filetree'
  before: Array<{ name: string; type: 'file' | 'dir'; hl?: 'add' | 'del' }>
  after: Array<{ name: string; type: 'file' | 'dir'; hl?: 'add' | 'del' }>
}

export interface PreviewBeat extends BeatBase {
  kind: 'preview'
  url: string
  title: string
  sub: string
  eyebrow: string
}

export type Beat = ThinkingBeat | TerminalBeat | DiffBeat | CommitBeat | FiletreeBeat | PreviewBeat

/** 세션 메타 — ShortCard에 표시 */
export interface BeatSession {
  id: string
  agent: { name: string; avatar: string; hue: number }  // hue 0..360 → CSS var
  title: string
  repo: string
  beats: Beat[]
}
