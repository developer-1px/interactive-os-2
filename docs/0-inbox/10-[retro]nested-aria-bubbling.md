# Retro: Nested Aria Bubbling — 2026-03-21

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-21-nested-aria-bubbling-prd.md
- **Diff 범위:** dfa7f741..HEAD
- **커밋 수:** 9
- **변경 파일:** 16

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | ✅ | 3/3 일치 | — |
| 2 | 인터페이스 | ✅ | 6/6 일치 (Escape 행 하나 구버전 서술 잔존하나 실제 구현은 정확) | — |
| 3 | 산출물 | ✅ | 6/6 일치 | — |
| 4 | 경계 | ✅ | 6/6 일치 | — |
| 5 | 금지 | ✅ | 5/5 일치 | — |
| 6 | 검증 | ✅ | 10/10 일치 | — |

**일치율:** 6/6

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨
없음

### ⚠️ 구현됐는데 PRD에 없었음
1. **dispatchKeyAction boolean 반환** — PRD에 명시 안 됐으나 behavior-optional의 조건부 preventDefault를 위해 필요. combobox editable Backspace 버그도 함께 해결.
2. **Combobox blur-to-close** — QuickOpen 전환 중 발견된 companion fix. handleBlur + mouseDown preventDefault.
3. **Combobox navigateFiltered** — editable/creatable 모드에서 필터된 목록 기준 네비게이션.
4. **CMS Zod schema (cms-schema.ts)** — 완전히 별도 scope. 이 PRD와 무관한 변경이 같은 diff 범위에 포함됨.
5. **clipboard.ts idCounter reset + doc comments** — 코드 리뷰 후속 정리.

### 🔀 의도와 다르게 구현됨
1. **QuickOpen에서 `<Aria>` 컴포넌트 대신 `useAria` 훅 사용** — PRD는 `<Aria behavior={combobox}>` 명시했으나, combobox의 containerProps가 `<input>`에 가야 하므로 `useAria` 훅이 올바른 선택. 기존 Combobox.tsx와 동일 패턴. 의도 달성됨.

## 계층별 개선 제안

### L1 코드 — 없음
모든 PRD 항목 구현 완료.

### L2 PRD 스킬
- **dispatchKeyAction boolean 반환이 PRD에 없었던 이유:** PRD의 산출물 항목이 "파일별 변경"만 나열하고, 변경 간 의존성(behavior-optional → 조건부 preventDefault → dispatchKeyAction 반환값 필요)을 추적하지 않음.
- 그러나 이는 Plan 단계에서 자연스럽게 발견되는 수준이므로 PRD 스킬 수정 불필요.

### L3 스킬 — 없음
Discussion → PRD → Plan → Execute 파이프라인이 정상 작동.

### L4 지식
- Discussion에서 확인된 Knowledge 3건을 memory에 저장 필요:
  - K1: 글로벌/지역 단축키는 같은 메커니즘
  - K2: defaultPrevented 가드가 target 가드보다 범용적
  - K3: behavior는 optional이어야 함

### L5 사용자 피드백
없음 — 사용자 의도가 명확했고 Discussion에서 충분히 정렬됨.

## 다음 행동
- L4: Knowledge 3건 memory 저장
- 경험 DB 업데이트
- Areas 갱신
- PRD 아카이브
