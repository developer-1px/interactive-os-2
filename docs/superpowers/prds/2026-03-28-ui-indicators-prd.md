# UI Indicators 모듈 — PRD

> Discussion: UI 완성품 내부에서 상태를 시각화하는 비-인터랙티브 요소 18개를 `ui/indicators/`로 독립 모듈화 + `/ui/indicators` showcase 라우트 추가

## ① 동기

### WHY

- **Impact**: UI 완성품 개발자가 chevron/check/radio/switch indicator를 매번 중복 구현한다. 6개+ 컴포넌트에 동일 역할의 시각 요소가 산재하여 일관성이 깨지고, indicator를 한눈에 검증할 경로가 없다.
- **Forces**: indicator는 비-인터랙티브(engine/pattern 밖)인데 완성품 내부 구현 디테일로 취급되어 독립 레이어로 인식되지 않았다. lucide-react 의존은 허용.
- **Decision**: `ui/indicators/` 하위 모듈로 독립. 기각된 대안: primitives/(behavioral 성격 불일치), 별도 최상위 폴더(레이어 역전), 자체 SVG(lucide 충분).
- **Non-Goals**: engine/pattern 통합, 인터랙티브 동작 추가, indicator 자체의 키보드/포커스 관리.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 새 UI 완성품을 만들고 있다 | expand/collapse가 필요하다 | `ExpandIndicator`를 import하면 chevron이 동작한다 — 직접 lucide import/조건 분기 불필요 | |
| M2 | 기존 TreeView의 chevron 디자인을 바꾸고 싶다 | ExpandIndicator의 CSS를 수정한다 | 6개 사용처가 동시에 반영된다 | |
| M3 | indicator 전체 상태 조합을 검토하고 싶다 | `/ui/indicators`로 이동한다 | 18개 indicator × 상태 조합이 grid로 나열된다 | |
| M4 | 디자인 토큰을 변경했다 | indicator가 토큰을 참조한다 | 토큰 변경이 모든 indicator에 즉시 반영된다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

### 파일 구조

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/indicators/ExpandIndicator.tsx` | chevron 회전. expanded + hasChildren props | |
| `ui/indicators/CheckIndicator.tsx` | 체크마크 SVG. checked prop | |
| `ui/indicators/RadioIndicator.tsx` | radio dot. CSS-only, ARIA 부모 상태 반응 | |
| `ui/indicators/SwitchIndicator.tsx` | track + thumb. CSS-only, ARIA 부모 상태 반응 | |
| `ui/indicators/IndeterminateIndicator.tsx` | 부분 선택 (−) 마크. checked prop | |
| `ui/indicators/SortIndicator.tsx` | 정렬 방향 ↑↓. direction prop | |
| `ui/indicators/SpinnerIndicator.tsx` | 회전 로딩 원. size prop | |
| `ui/indicators/ProgressIndicator.tsx` | determinate 진행 bar. value/max props | |
| `ui/indicators/SkeletonIndicator.tsx` | shimmer placeholder. width/height props | |
| `ui/indicators/StatusIndicator.tsx` | success/error/warning/info dot. tone prop | |
| `ui/indicators/PageIndicator.tsx` | 페이지네이션 dot. total/current props | |
| `ui/indicators/DirectionIndicator.tsx` | prev/next 화살표. direction prop | |
| `ui/indicators/StepIndicator.tsx` | 스텝 번호 원 + 완료 체크. step/completed props | |
| `ui/indicators/SeparatorIndicator.tsx` | 구분선/구분 기호. orientation prop | |
| `ui/indicators/BadgeIndicator.tsx` | 숫자 카운트 원. count prop | |
| `ui/indicators/OverflowIndicator.tsx` | "+N" 잘림 표시. count prop | |
| `ui/indicators/GripIndicator.tsx` | ⋮⋮ 드래그 핸들. orientation prop | |
| `ui/indicators/TreeConnector.tsx` | 수직/수평 계층 연결선. level/isLast props | |
| `ui/indicators/index.ts` | barrel export | |
| `ui/indicators/indicators.css` | 기존 interactive.css에서 indicator CSS 이동 + 신규 | |
| `src/pages/uiCategories.ts` | 'Indicators' 카테고리 추가 | |
| `contents/ui/Indicators.md` | showcase 콘텐츠 (데모 + props 문서) | |
| `docs/2-areas/ui/indicators.md` | Area 진척 문서 (이미 생성됨) | |

### 의존 관계

```
indicators/indicators.css  ← tokens.css (토큰 참조)
indicators/*.tsx            ← lucide-react (ExpandIndicator, DirectionIndicator, SortIndicator 등)
indicators/*.tsx            ← indicators.css (스타일)
ui/TreeView.tsx 등          ← indicators/ (import하여 사용)
pages/uiCategories.ts      ← indicators slug 등록
contents/ui/Indicators.md  ← showcase 콘텐츠
```

완성도: 🟢

## ③ 인터페이스

> indicator는 비-인터랙티브이므로 키보드 인터랙션 없음. props → 시각 출력 인터페이스.

### Phase 1: 추출 (기존 중복)

| 입력 (props) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|-------------|----------|------|-------------------|----------|-------|
| `ExpandIndicator` expanded=true | 미확장 | chevron 렌더 | expanded=true → 아래 방향(Down), 열림을 시각화 | ChevronDown 16px 표시 | |
| `ExpandIndicator` expanded=false | 확장됨 | chevron 렌더 | expanded=false → 오른쪽 방향(Right), 닫힘을 시각화 | ChevronRight 16px 표시 | |
| `ExpandIndicator` hasChildren=false | — | 빈 공간 렌더 | 자식 없으면 확장 불가 → chevron 의미 없음, 정렬 유지 위해 공간 보존 | 동일 너비의 빈 span | |
| `CheckIndicator` checked=true | 미체크 | 체크마크 렌더 | checked=true → 선택됨을 시각 표시 | SVG 체크마크 표시 | |
| `CheckIndicator` checked=false | 체크됨 | 빈 상태 렌더 | checked=false → 선택 안 됨, 컨테이너만 표시 | 빈 checkbox 컨테이너 | |
| `RadioIndicator` (ARIA 부모 반응) | 미선택 | dot 렌더 | aria-checked="true" → CSS가 dot 표시 | filled dot | |
| `SwitchIndicator` (ARIA 부모 반응) | off | thumb 이동 | aria-checked="true" → CSS translateX로 thumb 우측 이동 | thumb 우측 위치 | |
| `SeparatorIndicator` orientation="horizontal" | — | 가로 구분선 렌더 | 수평 구분 → 가로선 | `<hr>` role="separator" | |
| `SeparatorIndicator` orientation="vertical" | — | 세로 구분선 렌더 | 수직 구분 → 세로선 (breadcrumb 등) | 세로 구분 요소 | |

### Phase 2: 확장

| 입력 (props) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|-------------|----------|------|-------------------|----------|-------|
| `IndeterminateIndicator` checked=true | — | 대시(−) 렌더 | 부분 선택 = 전체도 미선택도 아님 → − 기호로 표현 | − SVG 표시 | |
| `SortIndicator` direction="ascending" | — | ↑ 렌더 | 오름차순 정렬 활성 | ArrowUp 아이콘 | |
| `SortIndicator` direction="descending" | — | ↓ 렌더 | 내림차순 정렬 활성 | ArrowDown 아이콘 | |
| `SortIndicator` direction=undefined | — | 정렬 없음 렌더 | 미정렬 → 양방향 암시 | ArrowUpDown 아이콘 (muted) | |

### Phase 3: 신규

| 입력 (props) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|-------------|----------|------|-------------------|----------|-------|
| `SpinnerIndicator` size="md" | — | 회전 원 렌더 | 비동기 작업 진행 중 → 시각 피드백 | 회전 애니메이션 원 | |
| `ProgressIndicator` value=60, max=100 | — | 60% 채워진 bar | value/max 비율 → 시각적 진행률 | 60% fill bar | |
| `SkeletonIndicator` width/height | — | shimmer 사각형 | 콘텐츠 로딩 중 → placeholder로 레이아웃 유지 | shimmer 애니메이션 | |
| `StatusIndicator` tone="success" | — | 녹색 dot | success 상태 → 긍정 색상 | var(--tone-success-base) dot | |
| `StatusIndicator` tone="error" | — | 빨간 dot | error 상태 → 경고 색상 | var(--tone-destructive-base) dot | |
| `PageIndicator` total=5, current=2 | — | 5개 dot 중 2번째 활성 | 현재 페이지 위치 → dot 강조 | 활성 dot 1개 + 비활성 4개 | |
| `DirectionIndicator` direction="next" | — | → 화살표 | 다음 항목 존재 → 이동 가능 표시 | ChevronRight 아이콘 | |
| `DirectionIndicator` direction="prev" | — | ← 화살표 | 이전 항목 존재 → 이동 가능 표시 | ChevronLeft 아이콘 | |
| `StepIndicator` step=2, completed=false | — | 숫자 2 원 | 현재 스텝 위치 → 번호 표시 | 원 안에 숫자 2 | |
| `StepIndicator` step=1, completed=true | — | 체크 원 | 완료된 스텝 → 체크마크 교체 | 원 안에 ✓ | |
| `BadgeIndicator` count=3 | — | "3" 원 | 알림/카운트 → 숫자 표시 | 빨간 원 안에 3 | |
| `BadgeIndicator` count=100 | — | "99+" 원 | 100 이상 → 상한 표기 | "99+" 텍스트 | |
| `OverflowIndicator` count=5 | — | "+5" 텍스트 | 잘린 항목 수 → 나머지 표시 | "+5" 텍스트 | |
| `GripIndicator` orientation="vertical" | — | ⋮⋮ 세로 점 패턴 | 드래그 가능 → 핸들 어포던스 | 6-dot grip | |
| `TreeConnector` level=2, isLast=false | — | ├ 연결선 | 트리 구조 시각화 → 부모-자식 연결 | 수직+수평 연결선 | |
| `TreeConnector` level=2, isLast=true | — | └ 연결선 | 마지막 자식 → 수직선 종료 | 수평선 + 꺾임 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| ExpandIndicator에 expanded prop 없이 렌더 | — | hasChildren=false와 동일 취급, 빈 공간이 안전 | 빈 span (정렬 공간 보존) | 정렬 유지 | |
| BadgeIndicator count=0 | — | 0이면 알림 없음 → 표시 불필요 | 렌더하지 않음 (null) | 숨김 | |
| BadgeIndicator count 음수 | — | 비정상 입력 → 방어적 처리 | 0과 동일 (null) | 숨김 | |
| ProgressIndicator value > max | — | 100% 초과 불가, 시각 오버플로 방지 | 100%로 clamp | 가득 찬 bar | |
| ProgressIndicator value < 0 | — | 음수 진행률 없음 | 0%로 clamp | 빈 bar | |
| PageIndicator total=0 | — | 페이지 없으면 표시 불필요 | 렌더하지 않음 (null) | 숨김 | |
| PageIndicator current > total | — | 범위 초과 → clamp | current = total로 clamp | 마지막 dot 활성 | |
| TreeConnector level=0 | — | 루트 레벨은 연결선 불필요 | 렌더하지 않음 (null) | 숨김 | |
| StepIndicator step=0 | — | 0번 스텝 없음 | 최소 1로 clamp | 숫자 1 원 | |
| 모든 indicator에 className prop 전달 | — | 완성품이 추가 스타일 주입 가능해야 | className 병합 | 기존 + 추가 class | |
| CSS 토큰 미정의 환경 | — | 토큰 없으면 레이아웃 깨짐 — tokens.css가 전제 | fallback 없음, tokens.css 필수 | 깨짐 (의도적) | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 토큰 전용 — 모든 디자인 수치는 토큰 (feedback) | ③ 전체 | 준수 | — | |
| P2 | item-{part} 역할 어휘 (feedback) | ② 산출물 CSS class | 준수 — 기존 `item-chevron`, `item-indicator--*` 유지 | — | |
| P3 | :where() 래핑 — ARIA 공통 스타일 specificity 0 (feedback) | ② indicators.css | 준수 — interactive.css에서 이동 시 :where() 유지 | — | |
| P4 | engine 밖 — indicator는 비-인터랙티브 (discuss 제약) | ③ 전체 | 준수 — useAria/engine 사용 안 함 | — | |
| P5 | ARIA 표준 이름 우선 (feedback) | ② 이름 | 검토 필요 — ExpandIndicator는 ARIA에 없는 이름 | ExpandIndicator → `aria-expanded`에서 파생, disclosure indicator가 더 정확할 수 있음 (?) | |
| P6 | module.css 3블록 (feedback) | ② indicators.css | N/A — indicator는 공유 CSS이므로 module.css 아닌 공유 CSS | — | |
| P7 | 같은 역할 = 같은 디자인 (feedback) | ③ 6개 chevron 사용처 | 준수 — 추출 후 단일 소스 | — | |
| P8 | 선언적 OCP (feedback) | ② index.ts barrel | 준수 — 새 indicator 추가 = 파일 추가 + export 추가, 기존 코드 불변 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | interactive.css indicator 섹션 (lines 428-550) | CSS를 indicators.css로 이동하면 import 순서/specificity 변경 가능 | 중 | :where()로 specificity 0 유지, import 순서 검증 | |
| S2 | TreeView, TreeGrid, DisclosureGroup, Accordion, MenuList, Breadcrumb의 defaultRenderItem | lucide import 제거 + ExpandIndicator import로 교체 | 낮 | 원자적 교체 (한 커밋에 전부) | |
| S3 | Checkbox, RadioGroup, SwitchGroup, Toggle의 indicator JSX | 인라인 SVG/CSS 제거 + indicator import로 교체 | 낮 | 원자적 교체 | |
| S4 | Accordion.module.css의 `.chevron`, `.chevronExpanded` | Accordion 전용 CSS가 공유 CSS와 충돌 가능 | 중 | Accordion이 ExpandIndicator 사용 시 variant prop으로 rotation 방식 선택, 또는 module.css에서 override | |
| S5 | uiCategories.ts | 새 카테고리 'Indicators' 추가 → sidebar에 항목 증가 | 낮 | 허용 | |
| S6 | renderItem을 override하지 않는 모든 사용처 | defaultRenderItem 내부 변경 → 시각적 동일해야 함 | 중 | 추출 후 스크린샷 비교로 시각 회귀 검증 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | indicator에 useAria/useEngine 사용 | ⑤ P4 | 비-인터랙티브 원칙 위반 | |
| F2 | indicator에 포커스 관리/tabIndex 부여 | ⑤ P4 | engine 밖 요소에 포커스 금지 | |
| F3 | CSS에 raw 수치 사용 | ⑤ P1 | 토큰 전용 원칙 | |
| F4 | 점진적 교체 (일부만 교체하고 나머지 방치) | ⑥ S2/S3 | 원자적 교체 필수 — 중간 상태에서 일관성 깨짐 | |
| F5 | indicator 내부에 이벤트 핸들러 부착 | ⑤ P4 | 비-인터랙티브, 이벤트는 부모 완성품 소관 | |
| F6 | indicators.css에서 :where() 래핑 생략 | ⑤ P3 / ⑥ S1 | specificity 충돌 방지 | |
| F7 | indicator별 module.css 생성 | ⑤ P6 | 공유 CSS 단일 파일로 관리 — indicators.css | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | ExpandIndicator를 expanded=true/false로 렌더 | ChevronDown/Right가 각각 표시 | |
| V2 | ①M1 | ExpandIndicator를 hasChildren=false로 렌더 | 빈 span, chevron과 동일 너비 | |
| V3 | ①M2 | indicators.css의 chevron color 변경 후 6개 사용처 확인 | 전부 동일하게 반영 | |
| V4 | ①M3 | `/ui/indicators` 라우트 진입 | 18개 indicator × 상태 조합 grid 표시 | |
| V5 | ①M4 | tokens.css 토큰 변경 후 indicator 확인 | 즉시 반영 | |
| V6 | ④경계 | BadgeIndicator count=0 렌더 | null (숨김) | |
| V7 | ④경계 | ProgressIndicator value=150, max=100 렌더 | 100%로 clamp | |
| V8 | ④경계 | 모든 indicator에 className="custom" 전달 | 기존 class + "custom" 병합 | |
| V9 | ⑥S6 | 추출 전후 TreeView 스크린샷 비교 | 시각적 동일 (pixel diff 0) | |
| V10 | ⑥S6 | 추출 전후 Checkbox 스크린샷 비교 | 시각적 동일 | |
| V11 | ⑥S1 | indicators.css import 후 기존 완성품 스타일 깨짐 여부 | specificity 충돌 없음 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 (①🟢 ②🟢 ③🟢 ④🟢 ⑤🟢 ⑥🟢 ⑦🟢 ⑧🟢)

## 교차 검증

1. **동기 ↔ 검증**: M1~M4 → V1~V5, V9~V11 커버 ✅
2. **인터페이스 ↔ 산출물**: 18개 indicator × props ↔ 산출물 파일 1:1 ✅
3. **경계 ↔ 검증**: count=0 → V6, clamp → V7, className → V8 ✅
4. **금지 ↔ 출처**: F1~F7 출처 ⑤/⑥ 유효 ✅
5. **원칙 대조 ↔ 전체**: 새 위반 없음 ✅
