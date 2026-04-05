# placement 축 — PRD

> Discussion: module.css의 position+inset 패턴을 ax() placement 축으로 흡수. 의도 기반 어휘로 배치를 선언.

## ① 동기

### WHY

- **Impact**: module.css에 position+inset+z-index+transform 조합이 ~25건 반복. 매번 수동 작성하고, 같은 패턴(bottom-center, above 등)이 파일마다 중복됨. ax() "디자인 시스템이 CSS를 내장한다"는 비전과 모순.
- **Forces**: ax()는 의도 기반 어휘(layout, surface)를 사용하지만 배치 의도를 표현할 축이 없음. position은 단독으로는 무의미하고 항상 inset/transform과 세트인데, CSS에서는 분리되어 있어 조합이 수동적.
- **Decision**: placement 축 신설. CSS 속성 1:1이 아닌 의도 기반 값 어휘. sticky는 layout에서 placement로 이관. 기각: position/inset을 별도 축으로 분리 → 의미 기반 원칙 위반.
- **Non-Goals**: pseudo-element(::before hit-area expander)의 position은 ax()로 표현 불가 — last-mile 유지. Tooltip의 CSS anchor positioning은 별도 메커니즘(JS 계산) — placement 축 대상 아님.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | dropdown이 input 아래에 펼쳐져야 함 | `ax({ placement: 'below' })` 선언 | absolute + top:100% + left:0 + right:0 적용 | |
| S2 | FAB이 컨테이너 하단 중앙에 뜸 | `ax({ placement: 'bottom-center' })` 선언 | absolute + bottom + left:50% + translateX(-50%) 적용 | |
| S3 | modal backdrop이 뷰포트 전체를 덮음 | `ax({ placement: 'viewport' })` 선언 | fixed + inset:0 적용 | |
| S4 | badge가 부모 좌상단에 붙음 | `ax({ placement: 'top-start' })` 선언 | absolute + top:0 + inset-inline-start:0 적용 | |
| S5 | overlay가 부모 중앙에 뜸 | `ax({ placement: 'center' })` 선언 | absolute + inset:0 + margin:auto (또는 translate) 적용 | |
| S6 | suggestion list가 input 위로 펼쳐짐 | `ax({ placement: 'above' })` 선언 | absolute + bottom:100% + left:0 + right:0 적용 | |
| S7 | progress bar가 부모 하단 전체에 걸림 | `ax({ placement: 'bottom' })` 선언 | absolute + bottom:0 + left:0 + right:0 적용 | |
| S8 | Aria 컨테이너가 relative 컨텍스트 역할 | useAria 적용된 컨테이너 | position:relative 자동 부여 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `Placement` 타입 (ax.ts) | `'above' \| 'below' \| 'bottom' \| 'bottom-center' \| 'center' \| 'top-start' \| 'viewport' \| 'sticky'` | |
| `Axes.placement` 필드 (ax.ts) | Axes 인터페이스에 `placement?: Placement` 추가 | |
| `prefixes.placement` (ax.ts) | `'pl'` prefix 등록 | |
| `.pl-*` CSS 클래스 (ax.css) | 7개 placement 값의 CSS 번들 | |
| `layout: 'sticky'` 제거 (ax.ts) | sticky를 placement로 이관, layout에서 삭제 | |
| `.ly-sticky` → `.pl-sticky` (ax.css) | CSS 클래스 이관 | |
| auto-relative (aria.tsx) | Aria 컨테이너에 `position: relative` 클래스 자동 부여 | |
| module.css position 제거 | 흡수된 position 선언을 module.css에서 삭제, TSX에서 ax() 사용으로 전환 | |

완성도: 🟢

## ③ 인터페이스

> 이 기능은 UI 인터랙션이 아닌 디자인 시스템 축 추가이므로, 인터페이스 = ax() API + CSS 출력.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `ax({ placement: 'above' })` | — | className `pl-above` 반환 | 부모 위로 펼치는 의도. bottom:100%로 부모 상단에 붙고, left/right:0으로 폭 맞춤 | `position:absolute; bottom:100%; left:0; right:0` | |
| `ax({ placement: 'below' })` | — | className `pl-below` 반환 | 부모 아래로 펼치는 의도. top:100%로 부모 하단에 붙고, left/right:0으로 폭 맞춤 | `position:absolute; top:100%; left:0; right:0` | |
| `ax({ placement: 'bottom' })` | — | className `pl-bottom` 반환 | 부모 하단 가장자리에 붙는 의도. bottom:0 + 좌우 stretch | `position:absolute; bottom:0; left:0; right:0` | |
| `ax({ placement: 'bottom-center' })` | — | className `pl-bottom-center` 반환 | 부모 하단 중앙에 떠있는 의도. "떠있는"이므로 edge에서 offset 내재 | `position:absolute; bottom:var(--space-md); left:50%; transform:translateX(-50%)` | |
| `ax({ placement: 'center' })` | — | className `pl-center` 반환 | 부모 정중앙에 떠있는 의도. 4면 inset:0 + margin:auto로 양방향 중앙 | `position:absolute; inset:0; margin:auto; width:fit-content; height:fit-content` | |
| `ax({ placement: 'top-start' })` | — | className `pl-top-start` 반환 | 부모 좌상단에 붙는 의도. 논리적 방향(start)으로 RTL 대응 | `position:absolute; top:0; inset-inline-start:0` | |
| `ax({ placement: 'viewport' })` | — | className `pl-viewport` 반환 | 뷰포트 전체를 덮는 의도. fixed + inset:0으로 스크롤 무관하게 전체 커버 | `position:fixed; inset:0` | |
| `ax({ placement: 'sticky' })` | — | className `pl-sticky` 반환 | layout에서 이관. 스크롤 시 상단 고정 의도 | `position:sticky; top:0; z-index:1` | |
| `ax({ placement: 'below', layout: 'column' })` | — | 두 축 결합 | placement는 position/inset, layout은 display/flex. 독립 축이므로 결합 가능 | 두 클래스 모두 적용 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| placement + 부모에 relative 없음 | 부모가 static | absolute는 가장 가까운 positioned ancestor 기준 — 부모가 static이면 의도와 다른 곳에 배치됨 | auto-relative가 Aria 컨테이너에 부여하므로 대부분 해소. 비-Aria 부모는 `relative` 유틸 클래스 수동 추가 | | |
| placement: 'viewport' + 부모 relative | 부모가 relative | fixed는 viewport 기준이므로 부모 position 무관 | 정상 동작. fixed는 containing block이 viewport | | |
| placement + layout: 'sticky' 동시 지정 | — | 두 값 모두 position을 지정 — 충돌 | sticky를 placement로 이관했으므로 불가능 (타입 레벨에서 하나만 선택) | 타입 에러 | |
| 기존 `layout: 'sticky'` 사용처 | TSX에서 사용 중 | 이관 후 타입 에러 발생 | 전부 `placement: 'sticky'`로 마이그레이션 | 동일 동작 | |
| z-index 필요 시 | placement만으로 z-index 부족 | placement는 position+inset만 번들. z-index는 컨텍스트마다 다름 | z-index는 module.css last-mile 또는 유틸 클래스로 별도 지정 | | |
| bottom-center의 offset | — | "떠있는" 의도에 offset이 내재 | `bottom: var(--space-md)` 기본 흡수. 'bottom'(flush)과 의미 분리 | | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 ���부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ax() 축은 의도/역할 기준 (feedback_ax_semantic_not_css) | ② placement 값 어휘 | ✅ 준수 | — | |
| 2 | surface 소유 속성에 module.css 금지 (feedback_surface_no_lastmile) | ② placement가 position 소유 | ✅ 준수 — placement 축이 position을 소유하면 module.css 금지 대상에 추가됨 | | |
| 3 | MECE 축 소유권 (project_ax_design_system) | ② sticky 이관 | ✅ 준수 — position은 placement 축 전속. layout에서 제거 | | |
| 4 | style={} 금지 (feedback_style_is_hatch) | ③ 인터페이스 | ✅ 준수 — ax()로만 표현 | | |
| 5 | 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ② auto-relative | ⚠️ 주의 — auto-relative가 "암묵적 주입"이면 선언 원칙과 긴장 | 명시적: Aria 컨테이너 className에 `relative` 포함 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `layout: 'sticky'` 사용처 전체 | 타입 에러 → 마이그레이션 필요 | 중 | 전수 `placement: 'sticky'`로 교체 | |
| 2 | ax.css의 `.ly-sticky` | 클래스 제거 → 미마이그레이션 시 스타일 깨짐 | 중 | `.ly-sticky` 삭제 + `.pl-sticky` 추가를 원자적 실행 | |
| 3 | module.css에서 position 사용하던 컴포넌트 | ax()로 전환 시 미세한 CSS 차이 가능 (specificity, 순서) | 낮 | 각 컴포넌트 시각 확인 | |
| 4 | Aria 컨테이너에 auto-relative 주입 | 이미 relative인 곳은 중복 (무해). relative가 없던 곳에 추가되면 자식 absolute의 기준점 변경 가능 | 낮 | 현재 Aria 컨테이너 대부분이 이미 relative이므로 영향 최소 | |
| 5 | guardCssAxes hook | position이 placement 소유가 되면 hook에 추가 필요 | 중 | hook 업데이트 포함 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | module.css에서 position 속성 사용 (pseudo-element 제외) | ⑤#2 surface_no_lastmile 확장 | placement 축이 position을 소유. 축 소유 속성은 module.css 금지 | |
| 2 | placement와 layout:'sticky' 병용 | ⑤#3 MECE 소유권 | sticky는 placement로 이관됨. layout에 잔류 불가 | |
| 3 | placement 값에 z-index 번들 (viewport/sticky 제외) | ④ z-index 경계 | z-index는 컨텍스트 의존. 일반 placement에 고정값 넣으면 충돌 | |
| 4 | bottom offset 등 커스텀 값을 ax() 축 값으로 추가 | ⑤#1 의미 기반 원칙 | `'bottom-center-md'` 같은 값은 조합 폭발. offset은 CSS 변수 또는 last-mile | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | `ax({ placement: 'below' })` 호출 | `'pl-below'` 문자열 반환 | |
| V2 | S3 | `ax({ placement: 'viewport' })` 호출 | `'pl-viewport'` 문자열 반환 | |
| V3 | S8 | `ax({ placement: 'sticky' })` 호출 | `'pl-sticky'` 문자열 반환 | |
| V4 | ④ sticky 충돌 | Axes 타입에 `layout: 'sticky'` 지정 | TypeScript 컴파일 에러 (sticky가 Layout에서 제거됨) | |
| V5 | S2 | `.pl-bottom-center` CSS 검증 | position:absolute + bottom:0 + left:50% + translateX(-50%) | |
| V6 | S6 | `.pl-above` CSS 검증 | position:absolute + bottom:100% + left:0 + right:0 | |
| V7 | ⑥#1 | 기존 `layout: 'sticky'` 사용처 전수 교체 | typecheck 통과 + 동일 시각 | |
| V8 | ⑥#5 | guardCssAxes hook에 position 추가 | module.css에 position 작성 시 hook 차단 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
