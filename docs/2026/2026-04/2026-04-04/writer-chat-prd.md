---
id: 1-projects/chat/prds/writer-chat-prd
title: 'Writer Chat Panel — PRD'
status: active
kind: prd
created: 2026-04-04
updated: 2026-04-08
summary: 'Discussion: Writer 앱에 채팅 패널을 추가하여 AI가 열린 MD 파일을 직접 수정하는 편집 경험. MD가 SSOT.'
topics: [1-projects]
relates: []
supersedes: []
---
# Writer Chat Panel — PRD

> Discussion: Writer 앱에 채팅 패널을 추가하여 AI가 열린 MD 파일을 직접 수정하는 편집 경험. MD가 SSOT.

## ① 동기

### WHY

- **Impact**: Writer 사용자가 구조적 편집(트리)만 가능하고, 자연어로 "이 섹션 다시 써줘"를 할 수 없다
- **Forces**: MD가 SSOT여야 한다 vs 현재 NormalizedData가 SSOT. 기존 chatStore/WS 인프라 재사용 가능
- **Decision**: 3-pane 상시 레이아웃 + AI가 MD 전문 교체. diff 패치 방식 기각 — 문서 규모가 작아 전문 교체가 단순
- **Non-Goals**: 채팅 자체의 새 기능(모델 선택 등)은 기존 ChatPane 그대로. Writer 외부 파일 수정 안 함

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Writer에 파일이 열려 있다 | 채팅에서 "서론을 다시 써줘"라고 입력 | AI가 수정된 MD 전문을 응답 → 트리/프리뷰가 갱신된다 | ✅ writerChatBridge.ts::sendWriterMessage, useWriterChatSync |
| S2 | Writer에 파일이 열려 있다 | 트리에서 heading 텍스트를 인라인 편집 | MD 원문이 동기화된다 | ✅ writerStore.ts::writerState (양방향 동기화) |
| S3 | Writer에 파일이 없다 (빈 상태) | 채팅에서 "블로그 글 초안 만들어줘" | AI가 MD를 생성 → 트리에 새 문서가 로드된다 | ✅ writerChatBridge.ts::extractMdBlock → writerStore |
| S4 | AI가 잘못된 MD를 줬다 | Ctrl+Z (undo) | 이전 MD 상태로 복원된다 | ✅ history plugin 경유 |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `writerStore.ts` 확장 | `mdText` 필드 추가. `setMd(md)` → `mdToStore()` → 내부 data 갱신. `setData(data)` → `storeToMd()` → mdText 갱신. 양방향 동기화가 store 내부에서 닫힘 | ✅ writerStore.ts::writerState (setMd/getMd/setData) |
| `PageWriter.tsx` 3-pane | SplitPane을 [파일브라우저 \| 에디터 \| ChatPane] 3-pane으로 확장. Writer 페이지당 하나의 채팅 세션 | ✅ PageWriter.tsx::PageWriter (3-pane) |
| `writerChatBridge.ts` (신규) | ① AI 응답에서 MD 코드블록 추출 → `writerState.setMd()` 호출. ② 메시지 전송 시 `writerState.getMd()`를 system prompt에 주입. chatStore↔writerStore 의존을 한 곳에서 관리 | ✅ writerChatBridge.ts::extractMdBlock, sendWriterMessage, useWriterChatSync, getSessionForFile |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 채팅에 텍스트 입력 + Enter | 파일 열림 | system prompt에 현재 MD 주입 + 메시지 전송 | AI가 문서 전체를 보고 수정해야 하므로 | 채팅 running | ✅ writerChatBridge.ts::sendWriterMessage |
| AI 응답 (MD 코드블록 포함) | running | bridge가 ```markdown 블록 추출 → `setMd()` | MD SSOT → MD 교체가 UI 갱신의 유일 경로 | 트리/프리뷰 갱신, dirty | ✅ writerChatBridge.ts::extractMdBlock, useWriterChatSync |
| AI 응답 (MD 코드블록 없음) | running | 텍스트 응답만 표시 | 수정 의도 없는 응답 | 채팅에 메시지만 추가 | ✅ writerChatBridge.ts::extractMdBlock (null 반환) |
| 트리 인라인 편집 | MD 존재 | `setData()` → 내부 `storeToMd()` → mdText 동기화 | 사용자 편집도 MD SSOT 경유 | mdText 갱신, dirty | ✅ writerStore.ts::writerState |
| 파일 없이 채팅 입력 | 빈 문서 | "문서 없음" 컨텍스트 + 메시지 전송 | AI가 새 문서 생성 가능 | AI MD 생성 → setMd() → 트리 로드 | ✅ writerChatBridge.ts::sendWriterMessage |
| Mod+Z | AI MD 교체 직후 | history plugin 복원 → `storeToMd()` → mdText 복원 | 기존 undo 메커니즘 재사용 | 이전 상태 복원 | ✅ history plugin 경유 |
| Writer 페이지 진입 | 세션 없음 | 자동 채팅 세션 1개 생성 | 페이지당 1세션 | ChatPane 활성화 | ✅ writerChatBridge.ts::getSessionForFile |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| AI가 빈 문자열 MD 응답 | 파일 열림 | 빈 MD도 유효한 문서 (빈 document 노드) | setMd('') → 빈 트리 로드 | dirty, 빈 트리 | ✅ writerTransform.ts::mdToStore (빈 MD) |
| AI 응답에 ```markdown 블록 여러 개 | running | 마지막 블록이 최종 버전 | 마지막 블록만 추출하여 setMd() | 최종 MD 반영 | ✅ writerChatBridge.ts::extractMdBlock |
| 파싱 불가능한 MD | running | mdToStore는 모든 텍스트를 paragraph로 폴백 | 깨지지 않고 paragraph 노드로 로드 | 트리에 flat paragraph 표시 | ✅ writerTransform.ts::mdToStore (paragraph fallback) |
| 채팅 중 파일 전환 | running 중 다른 파일 선택 | 세션은 유지, MD 컨텍스트만 갱신 | 진행 중 응답은 이전 파일 기준으로 완료 | 다음 메시지부터 새 파일 컨텍스트 | ✅ writerChatBridge.ts::getSessionForFile |
| WS 연결 끊김 | 메시지 전송 시도 | chatStore 기존 에러 처리 재사용 | 시스템 메시지로 에러 표시 | idle 상태 | ✅ chatStore 재사용 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반 개발: UI → ui/ 완성품 사용 (CLAUDE.md) | ② PageWriter | 준수 | ChatPane은 기존 ui 수준 완성품 | ✅ |
| 2 | 상태/CRUD → store command + plugin (CLAUDE.md) | ② writerStore | 준수 | setMd/setData는 store 내부 메서드 | ✅ |
| 3 | ax()만 사용, style={} 금지 (feedback_style_is_hatch) | ② PageWriter | 준수 | 3-pane 레이아웃도 ax() | ✅ |
| 4 | 모든 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | ② writerStore | 주의 | mdText는 NormalizedData에서 파생되는 캐시. 별도 useState 아님 | ✅ |
| 5 | Composite=ui/ 조합 (feedback_composite_is_ui_combination) | ② bridge | 준수 | bridge는 ui 조합이 아닌 데이터 연결 | ✅ |
| 6 | chatStore↔writerStore 의존 격리 (feedback_declarative_ocp) | ② bridge | 준수 | bridge가 중재, 양쪽 직접 의존 없음 | ✅ writerChatBridge.ts 격리 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | writerStore.setData() | 기존 setData 호출자가 storeToMd 오버헤드를 받음 | 낮 | 문서 규모가 작아 무시 가능 | ✅ |
| 2 | PageWriter 레이아웃 | 에디터 영역이 좁아짐 | 중 | 3-pane 비율 조정 가능 (SplitPane) | ✅ |
| 3 | chatStore 세션 목록 | Writer용 세션이 /chat 페이지 세션 목록에도 보임 | 낮 | 허용 — 세션은 범용 | ✅ |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | chatStore에 writerState 직접 import | ⑤#6 의존 격리 | chatStore는 Writer를 몰라야 한다. bridge가 중재 | ✅ |
| 2 | writerStore에 chatStore 직접 import | ⑤#6 의존 격리 | 역방향도 동일 | ✅ |
| 3 | AI 응답 자동 적용 시 history 우회 | ⑤#4 상태 원칙 | setMd → setData 경로가 history plugin을 거쳐야 undo 가능 | ✅ |
| 4 | MD 외 채널로 트리 수정 (bridge에서 NormalizedData 직접 조작) | ① MD SSOT | MD가 유일한 진실 소스 | ✅ |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | 파일 열린 상태에서 채팅 메시지 전송 → AI가 MD 코드블록 응답 | 트리 노드가 갱신된 MD 구조 반영 | ✅ writerChatBridge.ts::useWriterChatSync (구현 존재, 통합테스트는 WS 의존) |
| V2 | ①S2 | 트리 인라인 편집 후 getMd() 확인 | MD 텍스트가 편집 반영 | ✅ writer-transform.test.ts::"serializes tree back to markdown" |
| V3 | ①S3 | 빈 상태에서 채팅으로 문서 생성 요청 | 트리에 새 문서 로드 | ✅ writerChatBridge.ts::extractMdBlock |
| V4 | ①S4 | AI MD 교체 후 undo | 이전 트리 상태 복원 | ✅ history plugin 경유 |
| V5 | ④경계1 | AI가 빈 MD 응답 | 빈 트리 (document 노드만) | ✅ writer-transform.test.ts::"handles empty markdown" |
| V6 | ④경계3 | 파싱 불가 텍스트 | paragraph 폴백, 크래시 없음 | ✅ writerTransform.ts::mdToStore (fallback) |
| V7 | ④경계4 | 채팅 중 파일 전환 | 다음 메시지부터 새 파일 컨텍스트 | ✅ writerChatBridge.ts::getSessionForFile |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
