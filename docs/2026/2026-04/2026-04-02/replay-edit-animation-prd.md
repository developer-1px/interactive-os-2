---
id: 2-areas/engine/prds/replay-edit-animation-prd
title: 'Session Replay Phase B+ — 편집 애니메이션 PRD'
status: active
kind: prd
created: 2026-04-02
updated: 2026-04-08
summary: 'Discussion: replay에서 Edit이 휙 넘어가서 뭘 수정했는지 모름 → CodeBlock 하이라이트 확장 + 파일 상태 누적 + 편집 애니메이션 시퀀스'
topics: [2-areas]
relates: []
supersedes: []
---
# Session Replay Phase B+ — 편집 애니메이션 PRD

> Discussion: replay에서 Edit이 휙 넘어가서 뭘 수정했는지 모름 → CodeBlock 하이라이트 확장 + 파일 상태 누적 + 편집 애니메이션 시퀀스

## ① 동기

### WHY

- **Impact**: 리팩토링 세션(Edit 123회) replay에서 300ms 고정 delay로 모든 수정이 휙 지나감 → "뭘 고쳤는지" 전혀 파악 불가
- **Forces**: CodeBlock에 `highlightLines`(Set) + `code-line--edited` CSS 이미 있지만 tone 구분 없음. 파일 상태 누적 없음. 기존 사용처 호환 필수
- **Decision**: CodeBlock highlightLines를 `Set | Map<number, tone>`으로 확장. 파일별 상태 누적. 편집 5단계 애니메이션. 기각: replay 전용 에디터(CodeBlock+Shiki 중복)
- **Non-Goals**: column 단위 하이라이트. 가상 커서(별도 PRD). live 연동. 속도 조절 UI

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 같은 파일에 Read 후 Edit 3회 | replay 재생 | 파일 전체 표시 → Edit마다 5단계 애니메이션 | |
| S2 | Edit: old 5줄 → new 3줄 | Edit 스텝 도달 | selected(5줄)→deleted(5줄)→치환→inserted(3줄)→clear | |
| S3 | 다른 파일로 전환 | 새 파일 Read | 이전 파일 상태 보존, 새 파일 표시 | |
| S4 | Edit old_string이 파일에 없음 | Edit 스텝 도달 | 하이라이트 없이 진행 (graceful) | |
| S5 | 기존 코드에서 highlightLines Set 사용 | 렌더링 | 기존 동작 동일 (edited tone) | |

완성도: 🟢

## ② 산출물

| 산출물 | 위치 | 설명 | 역PRD |
|--------|------|------|-------|
| CodeBlock highlightLines 확장 | `src/interactive-os/ui/CodeBlock.tsx` | `Set<number> \| Map<number, HighlightTone>` 지원 | |
| HighlightTone CSS | `src/interactive-os/ui/CodeBlock.module.css` | selected(파란), deleted(빨간), inserted(초록) | |
| fileState | `src/pages/replay/fileState.ts` | `Map<filePath, content>` 누적 모델 | |
| editAnimation | `src/pages/replay/editAnimation.ts` | Edit → 5단계 TimedDelta[] 생성 | |
| PageReplay 확장 | `src/pages/replay/PageReplay.tsx` | FileState + CodeBlock + 하이라이트 상태 관리 | |

### 구조

```
PageReplay
  ├── SplitPane
  │   ├── 좌: CodeBlock(code=fileState.current, highlightLines=animHighlights)
  │   └── 우: ChatFeed (기존)
  └── editAnimation이 onRelease에서 fileState 갱신 + highlight 전환
```

> 가상 커서 overlay → 별도 PRD

완성도: 🟢

## ③ 인터페이스

### CodeBlock highlightLines

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `Set<number>` | 렌더링 | 기존 `code-line--edited` 적용 | 하위 호환 | 노란 하이라이트 | |
| `Map<number, 'selected'>` | 렌더링 | `code-line--selected` 적용 | 편집 대상 인지 | 파란 배경 | |
| `Map<number, 'deleted'>` | 렌더링 | `code-line--deleted` 적용 | 삭제 인지 | 빨간 배경 | |
| `Map<number, 'inserted'>` | 렌더링 | `code-line--inserted` 적용 | 삽입 인지 | 초록 배경 | |

### FileState

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Read + result | — | files.set(path, stripCatN(result)) | Read = 전체 스냅샷 | 파일 등록 | |
| Edit (old→new) | 파일 존재 | content.replace(old, new) | Edit = 부분 치환 | 콘텐츠 갱신 | |
| Edit | 파일 미존재 | skip | Read 없이 Edit만 | 변화 없음 | |
| Write | — | files.set(path, content) | Write = 전체 쓰기 | 파일 등록 | |

### EditAnimation 시퀀스

| 단계 | delay | 행동 | 왜 | 역PRD |
|------|-------|------|----|-------|
| ① scroll+select | 500ms | old 줄 → Map<n, 'selected'> | 위치 인식 | |
| ② hold | 줄수×100ms (500~2000ms) | selected 유지 | 읽을 시간 | |
| ③ delete | 300ms | Map<n, 'deleted'> | 삭제 인지 | |
| ④ replace+insert | 줄수×100ms (500~2000ms) | 콘텐츠 치환 → Map<n, 'inserted'> | 변경 확인 | |
| ⑤ clear | 300ms | 하이라이트 제거 | 다음 준비 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 역PRD |
|----------|------------------------|----------|-------|
| old_string 파일에 없음 | 누적 불일치 가능 | 하이라이트 skip, 다음 진행 | |
| old_string 2회 이상 매칭 | indexOf 첫 매칭이 Edit 의도 | 첫 번째 위치 하이라이트 | |
| Edit 100줄+ | hold delay max 캡 필요 | max 2000ms | |
| Read 없이 Edit만 | JSONL 중간 시작 | FileState 없으면 skip | |
| 연속 Edit 같은 파일 | 누적이 맞음 | 각각 5단계, 사이 최소 간격 | |
| Set<number> 기존 사용처 | 호환 깨지면 안 됨 | code-line--edited 그대로 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | UI → ui/ 완성품 사용 | CodeBlock 확장은 ui/ | ✅ 준수 | — | |
| 2 | 하위 호환 (Phase A) | Set 유지 | ✅ 준수 | — | |
| 3 | 파일명 = 주 export | fileState, editAnimation | ✅ 준수 | — | |
| 4 | ax() 전용 | CSS는 module.css | ✅ 준수 | — | |
| 5 | 렌더링 분기 없음 | tone→CSS class는 데이터 매핑 | ✅ 준수 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|---------------|-----------|--------|------|-------|
| 1 | CodeBlock highlightLines 타입 | 기존 Set 사용처 타입 에러 가능 | 중 | union type | |
| 2 | CodeBlock.module.css | 새 global class 추가 | 낮 | code-line-- prefix | |
| 3 | Shiki transformer | 기존 edited 분기 변경 | 중 | Set→기존, Map→새 분기 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | Set<number> 타입 제거 | ⑥#1 | 기존 사용처 깨짐 | |
| 2 | ChatFeed/ToolSummaryBlock 수정 | Phase A ⑦ | 채팅 오염 방지 | |
| 3 | CodeBlock에 애니메이션 로직 | SRP | replay가 소유 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | Read 후 Edit 3회 같은 파일 | 전체 파일 + 각 Edit 5단계 | |
| V2 | ①S2 | old 5줄→new 3줄 | selected→deleted→치환→inserted→clear | |
| V3 | ①S5 | 기존 Set 사용 | code-line--edited 동일 | |
| V4 | ④E1 | old_string 없음 | skip, crash 없음 | |
| V5 | ④E4 | Read 없이 Edit | skip | |
| V6 | ④E6 | Set 기존 사용처 typecheck | 에러 없음 | |

완성도: 🟢

---

### 교차 검증

1. **동기 ↔ 검증**: S1~S5 → V1~V6 ✅
2. **인터페이스 ↔ 산출물**: CodeBlock tone→CSS, FileState→content, EditAnim→5단계 ✅
3. **경계 ↔ 검증**: E1→V4, E4→V5, E6→V6 ✅
4. **금지 ↔ 출처**: 3개 모두 ⑥/Phase A 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 없음 ✅

**전체 완성도:** 🟢 8/8
