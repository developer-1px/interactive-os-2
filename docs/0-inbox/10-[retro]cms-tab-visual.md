# Retro: CMS Tab Visual — 2026-03-22

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-22-cms-tab-visual-prd.md
- **Diff 범위:** 030b8a6..0fd235d
- **커밋 수:** 8
- **변경 파일:** 7 (src/)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | M1~M5 모두 구현 | — |
| ② | 산출물 | 🔀 | "CmsLayout 변경 없음" → 실제로 activeTabMap 리프트 + onActivateTabItem prop 추가 | L2 |
| ③ | 인터페이스 | ✅ | 캔버스/사이드바/동기화 모두 구현 | — |
| ④ | 경계 | ✅ | 대부분 커버. V8/V9는 unit 테스트 커버 | — |
| ⑤ | 원칙 대조 | 🔀 | X4("CmsLayout에 activeTabId 전달 채널 추가 금지") 부분 위반 — onActivateTabItem 콜백 추가됨 | L2 |
| ⑥ | 부작용 | ⚠️ | S5(비활성 탭 스크롤)를 activeTabMap 리프트로 해결 — PRD 예측과 다른 접근 | — |
| ⑦ | 금지 | 🔀 | X4 위반 (위 참조) | L2 |
| ⑧ | 검증 | ✅ | V1~V11 대부분 커버 | — |

**일치율:** 5/8

## 갭 상세

### 🔀 의도와 다르게 구현됨

**② 산출물 — activeTabMap 리프트**
- PRD: "CmsLayout 변경 없음, 사이드바 내부에서 store만으로 해결"
- 실제: `activeTabMap`을 CmsLayout으로 리프트하고 `onActivateTabItem` 콜백을 CmsSidebar/CmsCanvas 양쪽에 전달
- 원인: `focusCommands.setFocus`가 zone-local META 명령이라 cross-zone 브로드캐스트 불가. engine dispatch로는 다른 zone의 activeTabMap을 변경할 수 없음
- 판정: **PRD가 engine의 scope 격리를 간과함**. shared state가 필요한 상황에서 state lifting은 React의 정석 패턴. 구현이 맞고 PRD가 틀렸음

**⑤⑦ X4 금지 위반**
- PRD X4: "CmsLayout에 activeTabId 전달 채널 추가" 금지
- 실제: `onActivateTabItem` 콜백 + `activeTabMap` prop 추가
- 원인: X4의 의도는 "하이라이트를 위한 단방향 전달 금지"였으나, 탭 활성화는 양방향 공유 상태가 필요. 하이라이트 자체는 `activeSectionId` → `getTabItemAncestor`로 파생(X4 준수). 탭 활성화는 별개 문제
- 판정: X4의 범위가 불충분했음 — "하이라이트용 전달"과 "탭 활성화용 shared state"를 구분하지 않았음

### ⚠️ PRD에 없었지만 구현됨

1. **ArrowDown/Up/Home/End keyMap 오버라이드** — listbox behavior의 `getVisibleNodes`가 root children만 순회하는 문제를 발견하여 추가. PRD가 이 edge case를 예측 못함
2. **handleContainerFocus** — listbox 컨테이너에 포커스가 올 때 focused option으로 DOM focus 리다이렉트. ARIA listbox 표준 동작이지만 PRD에 미명시
3. **CmsCanvas controlled/uncontrolled 듀얼 패턴** — activeTabMapProp ?? localActiveTabMap. state lifting으로 인한 하위 호환성 유지

## 계층별 개선 제안

### L1 코드
(없음 — 모든 기능 정상 동작, 493 테스트 통과)

### L2 PRD 스킬
- **갭**: cross-zone 상태 공유 필요성을 인터페이스(③) 단계에서 감지하지 못함
- **원인**: PRD 인터페이스 작성 시 "zone scope 격리" 제약을 체크하지 않았음
- **제안**: 인터페이스 체크리스트에 "cross-zone 통신이 필요한가? (focusCommands는 zone-local)" 항목 추가
- 지금은 수정하지 않음 — 이 패턴이 반복되면 L4로 승격

### L5 사용자 피드백
(없음)

## 다음 행동
- L1 항목 없음 — 코드 수정 불필요
- L2 제안 → 경험 DB에 기록하여 반복 여부 추적
