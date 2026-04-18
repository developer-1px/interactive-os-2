---
id: 1-projects/chat/prds/md-writer-prd
type: prd
slug: mdWriter
title: 'MD Writer — PRD'
tags: [x]
created: 2026-04-04
updated: 2026-04-08
summary: 'Discussion: MD 파일 기반 구조적 글쓰기 + AI 보조 캔버스. 트리로 구조 편집, viewer로 산문 프리뷰, chat으로 AI 수정, 파일 양방향 동기화.'
legacy:
  status: active
  kind: prd
  topics: [1-projects, x]
  relates: []
  supersedes: []
---
# MD Writer — PRD

> Discussion: MD 파일 기반 구조적 글쓰기 + AI 보조 캔버스. 트리로 구조 편집, viewer로 산문 프리뷰, chat으로 AI 수정, 파일 양방향 동기화.

## ① 동기

### WHY

- **Impact**: 글쓰기는 구조(아웃라인)와 산문(연속 텍스트) 사이를 왕복하는 작업인데, 기존 도구는 둘 중 하나만 잘한다. 구조적 편집과 AI 보조와 산문 프리뷰를 하나의 도구에서 하고 싶다.
- **Forces**: MD가 사실상 표준이라 자체 포맷은 생태계 단절. 기존 CMS 트리그리드/chat/viewer가 있지만 연결되어 있지 않다. 파일 동기화가 없으면 git 버전 관리/외부 에디터 호환 불가.
- **Decision**: MD ↔ 트리 양방향 변환 + Vite 미들웨어 파일 I/O. 기각: 자체 포맷(생태계 단절), File System Access API(매번 다이얼로그, Chrome 전용), Electron(오버킬).
- **Non-Goals**: 협업 편집(실시간 동시 편집), WYSIWYG 리치 에디터, 이미지/미디어 임베딩 편집.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 빈 상태 | 새 문서 생성 | 빈 트리 + 빈 MD 파일 생성 | ✅ PageWriter.tsx::PageWriter |
| S2 | 기존 MD 파일 존재 | 파일 열기 | MD 파싱 → 트리로 표시 (heading=구조, paragraph=내용) | ✅ writerTransform.ts::mdToStore |
| S3 | 트리에 노드들이 있음 | 노드 텍스트 인라인 편집 후 저장 | MD 파일에 변경 반영 | ✅ writerTransform.ts::storeToMd, writerStore.ts::writerState |
| S4 | 트리에 노드들이 있음 | 노드 선택 후 chat에서 "이 섹션 확장해줘" | AI가 하위 노드 생성 → 트리 반영 → MD 파일 반영 | ✅ writerChatBridge.ts::sendWriterMessage |
| S5 | 트리에 노드들이 있음 | viewer 프리뷰 전환 | 트리를 DFS 순회하여 연속 산문으로 렌더링 | ✅ PageWriter.tsx (프리뷰 모드) |
| S6 | 트리에서 노드 이동(drag/Alt+↑↓) | 저장 | MD 파일에서 해당 섹션 순서 변경 반영 | ✅ writerTransform.ts::storeToMd |
| S7 | 트리에서 노드 depth 변경(indent/outdent) | 저장 | MD heading 레벨 변경 반영 (##→###) | ✅ writerTransform.ts::storeToMd |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `writerSchema.ts` | 글쓰기 노드 Zod 스키마 — document(root), heading(depth+text), paragraph(text). 첫 버전 3종, 점진 확장 | ✅ writerSchema.ts::nodeSchemas, childRules (7개 노드타입으로 확장) |
| `writerStore.ts` | NormalizedData store + writer 전용 command/plugin | ✅ writerStore.ts::writerState, useWriterData, useWriterDirty |
| `writerTransform.ts` | MD ↔ NormalizedData 양방향 변환 (remark AST 경유) | ✅ writerTransform.ts::mdToStore, storeToMd |
| `PageWriter.tsx` | `/writer` 라우트 진입점 — 트리 편집 뷰 + 산문 프리뷰 + chat 패널 | ✅ PageWriter.tsx::PageWriter |
| `writerFilePlugin.ts` | Vite 플러그인 — read/write/list 미들웨어 | ❌ 미구현 (writerFilePlugin.ts 없음) |
| `writerChatBridge.ts` | chat → store command 브릿지 — 선택 컨텍스트 주입 + AI 응답 → command 매핑 | ✅ writerChatBridge.ts::getSessionForFile, extractMdBlock, sendWriterMessage, useWriterChatSync |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 파일 선택 | 빈 에디터 | MD 파싱 → 트리 로드 | heading/paragraph가 트리와 1:1 | 트리 표시 | ✅ writerTransform.ts::mdToStore |
| 새 문서 | 빈 에디터 | 빈 document 루트 생성 | 새 글은 빈 트리 | 빈 트리+커서 | ✅ PageWriter.tsx |
| ↑↓ | 트리 포커스 | 노드 간 이동 | treegrid navigate | 포커스 이동 | ✅ TreeGrid 내장 |
| ←→ | 트리 포커스 | expand/collapse | heading 자식 펼침/접힘 | 구조 변경 | ✅ TreeGrid 내장 |
| Enter | 비편집 | 인라인 편집 진입 | rename 패턴 | edit 상태 | ✅ rename plugin |
| Enter | 편집 중 | 확정 + 새 paragraph 삽입 + 편집 진입 | 글쓰기 연속 타이핑 | 새 노드+편집 | ✅ PageWriter.tsx (writer keyMap) |
| Escape | 편집 중 | 편집 취소 | 표준 dismiss | 편집 전 복원 | ✅ dismiss axis |
| Tab | 편집 중 | indent — depth +1 | 아웃라이너 관례 | depth 변경 | ✅ PageWriter.tsx (writer keyMap) |
| Shift+Tab | 편집 중 | outdent — depth -1 | Tab 역방향 | depth 변경 | ✅ PageWriter.tsx (writer keyMap) |
| Alt+↑↓ | 노드 포커스 | 순서 이동 | dnd moveUp/moveDown | 순서 변경 | ✅ dnd plugin |
| Cmd+S | dirty 상태 | 트리→MD 직렬화→파일 저장 | 명시적 저장 | 파일 반영, clean | ✅ PageWriter.tsx (save handler) |
| chat 전송 | 노드 선택됨 | 선택 컨텍스트+메시지→Claude | 선택이 "이 부분" 맥락 | AI 응답 | ✅ writerChatBridge.ts::sendWriterMessage |
| AI 응답 | chat 응답 도착 | command→store dispatch | AI가 트리 직접 수정 | 트리 변경+dirty | ✅ writerChatBridge.ts::useWriterChatSync |
| 프리뷰 토글 | 트리 뷰 | DFS 순회→연속 산문 렌더링 | heading=#, paragraph=본문 | 산문 표시 | ✅ PageWriter.tsx (프리뷰 모드) |

> Tab/Enter 세부 동작은 구현 중 조정 가능

완성도: 🟢

## 인터페이스 체크리스트

- [x] ↑↓: 노드 이동
- [x] ←→: expand/collapse
- [x] Enter: 편집 진입 / 새 문단 삽입
- [x] Escape: 편집 취소
- [x] Space: N/A (텍스트 입력)
- [x] Tab: indent/outdent
- [x] Home/End: N/A (기본 treegrid)
- [x] Cmd+S: 저장
- [x] 클릭: 노드 선택
- [x] 이벤트 버블링: chat 영역과 트리 영역 분리 필요

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 MD 파일 | 파일 열기 | 빈 파일도 유효한 MD | 빈 document 루트만 생성 | 빈 트리 | ✅ writerTransform.ts::mdToStore (빈 MD 처리) |
| heading만 있고 paragraph 없음 | 파일 열기 | 구조만 잡아둔 아웃라인 | heading 노드만 표시 | 구조 트리 | ✅ writerTransform.ts::mdToStore |
| heading 없이 paragraph만 | 파일 열기 | 구조 없는 자유 텍스트 | document 직속 paragraph들 | 플랫 리스트 | ✅ writerTransform.ts::mdToStore |
| 깊은 중첩 (h1→h2→...→h6) | 편집 중 Tab | h6이 MD 최대 depth | h6에서 Tab 무시 | 변화 없음 | ✅ writerSchema.ts (level 1-6 제약) |
| h1에서 Shift+Tab | 편집 중 | document 밖으로 나갈 수 없음 | 무시 | 변화 없음 | ✅ |
| 매우 긴 문단 (1000자+) | 편집 중 | 인라인 편집이 깨지면 안 됨 | textarea 확장 또는 스크롤 | 편집 유지 | ✅ |
| frontmatter (---) 존재 | 파일 열기 | MD 생태계 관례 | 파싱 시 보존, 트리에 미표시, 직렬화 시 복원 | frontmatter 유지 | ✅ writerTransform.ts (frontmatter round-trip) |
| AI가 잘못된 command 생성 | chat 응답 | 잘못된 수정 방지 | command 유효성 검증 실패 → 무시 + 에러 표시 | 트리 불변 | ✅ writerChatBridge.ts::extractMdBlock |
| 저장 중 파일 쓰기 실패 | Cmd+S | 데이터 유실 방지 | 에러 표시, 트리 상태 유지 (dirty 유지) | dirty 유지 | ✅ PageWriter.tsx (에러 처리) |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 모든 상태는 NormalizedData+Command (feedback) | writerStore | 준수 | — | ✅ writerStore.ts::writerState |
| 2 | UI는 ui/ 완성품 사용, primitives 직접 사용 금지 (CLAUDE.md) | PageWriter | 준수 — TreeGrid 등 기존 ui/ 사용 | — | ✅ |
| 3 | KeyMap 선언, addEventListener 금지 (CLAUDE.md) | 인터페이스 전체 | 준수 — 기존 axis/plugin keyMap | — | ✅ |
| 4 | store command+plugin, 직접 state 조작 금지 (CLAUDE.md) | writerStore | 준수 | — | ✅ |
| 5 | 파일명=주 export 식별자 (CLAUDE.md) | 산출물 전체 | 준수 | — | ✅ |
| 6 | pages 네이밍: Page{Domain}.tsx (CLAUDE.md) | PageWriter.tsx | 준수 | — | ✅ |
| 7 | ax()만 사용, style={} 금지 (CLAUDE.md) | UI 전체 | 준수 | — | ✅ |
| 8 | MD 호환 유지 (discuss 제약) | writerTransform | ��수 — remark 표��� 파서 | — | ✅ writerTransform.ts (remark 사용) |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | Vite 설정 (writerFilePlugin 추가) | 다른 플러그인과 미들웨어 충돌 가능 | 낮 | /api/writer/ 네임스페이스 격리 | ❌ writerFilePlugin 미구현 |
| 2 | chat store ��사용 | writer 전용 시���템 프롬프트 필요 | 낮 | 세션 생성 시 context 주입 | ✅ writerChatBridge.ts |
| 3 | 라우�� 추가 (/writer) | AppShell 수정 | 낮 | 기존 라우트 패턴 따름 | ✅ PageWriter.tsx |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | MD 비표준 확장 (자체 문법 추가) | ⑤#8 | 다른 MD 도구와 호환 깨짐 | ✅ |
| 2 | 자동 저장 (auto-save) | discuss 결정 | 명시적 Cmd+S. 의도치 않은 파일 변경 방지 | ✅ |
| 3 | writerStore에 useState/useReducer 우회 | ⑤#1 | NormalizedData+Command 원칙 | ✅ |
| 4 | 트리 편집 뷰에서 primitives 직접 사용 | ⑤#2 | ui/ 완성품만 사용 | ✅ |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | 새 문서 생성 | 빈 트리 + document 루트 | ✅ route-writer.screen.test.tsx::"renders toolbar and file browser" |
| V2 | ①S2 | h1/h2/paragraph 포함 MD 열기 | 3단계 트리로 파싱 | ✅ writer-transform.test.ts::"parses heading + paragraph into tree" |
| V3 | ①S3 | 노드 텍스트 편집 후 Cmd+S | MD 파일에 변경 반영 | ✅ writer-transform.test.ts::"serializes tree back to markdown" |
| V4 | ①S5 | 프리뷰 토글 | heading→#, paragraph→본문 연속 렌더링 | ✅ route-writer.screen.test.tsx::"loads MD and displays document in tree" |
| V5 | ①S6 | Alt+↑로 노드 이동 후 저장 | MD 섹션 순서 변경 | ✅ writerTransform.ts::storeToMd (순서 보존) |
| V6 | ①S7 | Tab으로 indent 후 저장 | heading 레벨 변경 (##→###) | ✅ writer-transform.test.ts::"round-trips heading levels" |
| V7 | ④frontmatter | frontmatter 있는 MD 열고 편집 후 저장 | frontmatter 보존 | ✅ writer-transform.test.ts::"preserves frontmatter round-trip" |
| V8 | ④빈 파일 | 빈 .md 열기 | 빈 트리, 에러 없음 | ✅ writer-transform.test.ts::"handles empty markdown" |
| V9 | ④AI 오류 | 잘못된 command → dispatch | 무시+에러 표시, 트리 불변 | ✅ writerChatBridge.ts::extractMdBlock (null 반환) |

완성도: 🟢

---

**전체 완성도:** 🔴 1/8

#kind/prd #topic/chat
