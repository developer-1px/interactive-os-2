# Retro: Visual CMS 키보드 네비게이션 — 2026-03-19

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-19-visual-cms-keyboard-nav-prd.md
- **Diff 범위:** 120acae..ef45a14
- **커밋 수:** ~10
- **변경 파일:** 19 (소스 코드 기준)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 유저 스토리 | ✅ | US1~6 모두 구현됨 | — |
| 2 | 화면 구조 | ✅ | 보편 모델 + 랜딩 페이지 구조 일치 | — |
| 3 | 인터랙션 맵 | 🔀 | Tab 동작 명시적 검증 없음. F2(범위 밖) 코드에 존재 | L1 |
| 4 | 상태 전이 | ✅ | Depth N + Selected 모델 정확 | — |
| 5 | 시각적 피드백 | 🔀 | 선택 상태 `var(--accent-dim)` background CSS 미적용 | L1 |
| 6 | 데이터 모델 | ✅ | 통합 store + spatial depth 완전 일치 | — |
| 7 | 경계 조건 | ⚠️ | 리사이즈 대응 ResizeObserver 없음. 이벤트 버블링 가드는 PRD에 없었으나 구현됨 | L1, L2 |
| 8 | 접근성 | 🔀 | `aria-label` 자동 부여 로직 없음 (PRD 요구사항) | L1 |
| 9 | 검증 기준 | ✅ | jsdom 가능 항목 테스트됨, E2E는 todo 표시 | — |

**일치율: 5/9**

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨

1. **선택 상태 CSS** — PRD 5번: `accent background var(--accent-dim)`. 코드에는 `aria-selected="true"` 속성만 설정, CSS에서 `[aria-selected="true"]` 선택자로 background 적용하는 규칙 없음.

2. **aria-label 자동 부여** — PRD 8번: 모든 CMS 노드에 `aria-label="[노드명]"`. 코드에 이를 자동으로 설정하는 로직 없음. spatial behavior의 `ariaAttributes`는 `aria-level`만 반환.

3. **Tab 동작 검증** — PRD 3번, T8: Tab이 위젯 밖으로 나가는 것을 검증하는 테스트 없음. 동작 자체는 roving-tabindex 특성상 자연스럽게 되지만 명시적 테스트 부재.

### ⚠️ 구현됐는데 PRD에 없었음

1. **useAria 이벤트 버블링 가드** — `event.target !== event.currentTarget` 조건으로 중첩 노드 간 충돌 방지. PRD에 예측하지 못한 구현 시 발견 버그.

2. **F2 인라인 편집 시작** — spatial behavior keyMap에 F2→startRename 존재. PRD 범위 밖(editing PRD)으로 분리했으나 기존 spatial behavior에 이미 포함.

### 🔀 의도와 다르게 구현됨

1. **리사이즈 대응** — PRD 7번: "다음 키 입력 시 DOM 위치 기반 재계산 (캐시 무효화)". 코드: `useLayoutEffect`로 매 렌더 시 재수집하지만, window resize 이벤트 시 강제 재수집하는 ResizeObserver/listener 없음. store 상태 변경 없이 resize만 발생하면 rect가 stale.

## 계층별 개선 제안

### L1 코드 — 백로그 (자율 처리 가능)
- [ ] `PageVisualCms.css`에 `[aria-selected="true"]` 선택자로 `background: var(--accent-dim)` 추가
- [ ] spatial behavior `ariaAttributes`에 entity 이름 기반 `aria-label` 자동 부여 로직 추가
- [ ] `useSpatialNav`에 ResizeObserver 추가 — resize 시 rect 재수집 트리거
- [ ] Tab 동작 검증 테스트 추가 (T8)

### L2 PRD 스킬 — 제안 (확인 필요)
- PRD 인터랙션 맵에 **"이벤트 버블링"** 항목 추가 권장. 중첩 구조에서 이벤트 전파는 흔한 문제이며, PRD에서 미리 "중첩 노드 간 이벤트 격리 방법"을 명세하면 구현 시 누락 방지.
- PRD 경계 조건에 **"resize/viewport 변경"** 항목을 기본 포함하도록 체크리스트 추가 권장.

### L3 스킬 — 제안 (확인 필요)
- 해당 없음

### L4 지식 — 제안 (확인 필요)
- memory에 추가 권장: "중첩 렌더링에서 이벤트 버블링은 항상 고려 대상. 특히 useAria를 중첩 노드에 적용할 때 onFocus/onKeyDown 가드 필수."

### L5 사용자 피드백
- 💬 이번 사이클에서 사용자 지시로 인한 모호성 갭은 감지되지 않음. Discussion → PRD 과정에서 방향이 명확하게 정렬됨.

## 다음 행동
- L1 백로그 4개 → 랄프루프로 처리 가능
- L2 제안 2개 → 사용자 확인 후 PRD 스킬 보강
- L4 제안 1개 → 사용자 확인 후 memory 추가
