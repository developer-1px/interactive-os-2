# REC — Reproduction Recorder

> ARIA tree 스냅샷 기반 버그 재현 녹화. 에이전틱 브라우저 패턴으로 LLM이 바로 이해할 수 있는 텍스트 출력.

## 6채널 타임라인

| # | 채널 | 캡처 내용 |
|---|------|----------|
| 1 | Route | 현재 URL |
| 2 | Component | 소스 위치 (파일:줄) + 가장 가까운 컴포넌트명 |
| 3 | Input | keyboard/click/focus + runtime state (activeElement, defaultPrevented) |
| 4 | State | engine dispatch의 store diff |
| 5 | Console | error/warn 캡처 |
| 6 | AriaTree | 가장 가까운 role 컨테이너의 accessibility tree (첫 이벤트=전체, 이후=diff) |

## 에이전틱 브라우저 대비 이점

| 에이전틱 브라우저 | REC |
|------------------|-----|
| 외부에서 관찰 → activeElement 못 줌 | 내부 녹화 → focus, prevented 직접 캡처 |
| 매번 전체 스냅샷 | diff로 압축 + 컨테이너 변경 시 re-baseline |
| JSON/구조체 출력 | LLM-readable 텍스트 (토큰 60-70% 절감) |

## 출력 형식

```
# Reproduction — /devtools/inspector
# 2026-03-25T10:30:00.000Z · 3.2s · 8 events

[1] +0ms ⏎ → option "Widget A"  ← Listbox (PageListbox.tsx:42)
  - listbox "Products":
    - option "Widget A" [selected, ◀ focus]
    - option "Widget B"

[2] +0.8s ⌨ ArrowDown → option "Widget A"
  - option "Widget A" → + option "Widget B" [selected, ◀ focus]
  → moveCursor: cursor "item-1" → "item-2"

[3] +1.5s ⏎ → option "Widget B" (no changes)
```

## 압축 규칙

- `focus === target` → focus 줄 생략
- `prevented: false` → 생략 (yes일 때만 표시)
- source가 이전과 동일 → 생략
- ARIA tree 변화 없고 state/console도 없음 → 한 줄 축약 `(no changes)`
- 컨테이너 변경 → 전체 tree re-baseline

## 사용법

1. 우측 상단 REC 버튼 클릭 (또는 `Cmd+Shift+\`)
2. 버그 재현
3. STOP → 클립보드에 LLM-readable 텍스트 복사
4. 다른 에이전트에 붙여넣기

## 파일

| 파일 | 역할 |
|------|------|
| `src/devtools/rec/createReproRecorder.ts` | 녹화 엔진 (6채널 + ARIA tree + 텍스트 포맷터) |
| `src/devtools/rec/createRecorder.ts` | 기본 이벤트 레코더 (레거시) |
| `src/devtools/rec/ReproRecorderOverlay.tsx` | UI 오버레이 (REC 버튼 + 타이머) |
