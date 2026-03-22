# Aria.Item ids prop — PRD

> Discussion: Toolbar 그룹 구분을 hack 없이 해결. 11개 후보 비교 → Aria.Item에 `ids` prop 1개 추가가 오컴의 면도날. flat store 유지, navigate 변경 없음.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| D1 | Activity bar에 App 그룹(cms, viewer, agent)과 OS 그룹(store, engine, ...)이 있다 | 그룹 사이에 시각적 구분선을 넣고 싶다 | 하나의 Aria toolbar 안에서 그룹별로 렌더링하고 사이에 separator div를 넣을 수 있다 | |
| D2 | Toolbar에 theme 버튼이 있다 | theme을 하단에 고정하고 싶다 | consumer JSX에서 layout(margin-top: auto)을 자유롭게 제어할 수 있다 | |
| D3 | 기존 Aria.Item은 항상 ROOT_ID에서 전체 트리를 렌더링한다 | flat collection에서 특정 아이템들만 골라서 렌더링하고 싶다 | `Aria.Item ids={[...]}` 로 지정된 아이템만 렌더링한다 | |
| D4 | interactive-os를 사용하는 LLM/개발자가 있다 | 그룹이 있는 toolbar/menu/listbox를 만든다 | 새 개념 없이 flat store + ids prop으로 해결한다 | |
| D5 | 아이템이 동적으로 보이거나 사라질 수 있다 | store에서 entity가 제거됨 | ids에 있어도 store에 없으면 렌더링 안 됨. navigate도 자동 제외 (flat store이므로) | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `Aria.Item` ids prop | `ids?: string[]` — 렌더링할 entity id 목록. 미지정 시 기존 동작(ROOT에서 재귀). ids 지정 시 해당 id만 flat 렌더링 | |
| Activity bar JSX 변경 | ids로 그룹별 아이템 지정, `role="group"` div + separator div + theme에 margin-top: auto | |
| CSS hack 제거 | `activity-bar__group-start`, `::after` 관련 CSS/클래스 삭제 | |

> Store 구조 변경 없음 — flat 유지

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑ | OS 그룹 첫 아이템(store)에 포커스 | 포커스가 App 그룹 마지막(agent)으로 이동 | store는 flat — navigate가 전체 아이템을 순서대로 순회. group은 JSX 레이아웃일 뿐 navigate와 무관 | agent 포커스 | |
| ↓ | App 그룹 마지막(agent)에 포커스 | 포커스가 OS 그룹 첫 아이템(store)으로 이동 | 위와 동일 — flat 순회 | store 포커스 | |
| ↑ | App 그룹 첫 아이템(cms)에 포커스 | 포커스가 util 그룹 마지막(theme)으로 이동 | toolbar wrapping — 처음에서 끝으로 순환 | theme 포커스 | |
| ↓ | util 그룹 마지막(theme)에 포커스 | 포커스가 App 그룹 첫 아이템(cms)으로 이동 | toolbar wrapping — 끝에서 처음으로 순환 | cms 포커스 | |
| ←→ | 아무 아이템에 포커스 | N/A | vertical toolbar이므로 좌우키 미사용 | 변화 없음 | |
| Enter | 아무 아이템에 포커스 | 해당 아이템의 onActivate 호출 | toolbar activate 축 | 페이지 이동 또는 테마 토글 | |
| Space | 아무 아이템에 포커스 | Enter와 동일 | activate fallback | 동일 | |
| Tab | toolbar 안에 포커스 | toolbar 밖으로 포커스 이동 | toolbar은 하나의 탭 정지점 (roving tabindex) | toolbar 외부 포커스 | |
| Escape | — | N/A | toolbar에 trap 없음 | — | |
| Home | 아무 아이템에 포커스 | 첫 아이템(cms)으로 이동 | toolbar navigate Home | cms 포커스 | |
| End | 아무 아이템에 포커스 | 마지막 아이템(theme)으로 이동 | toolbar navigate End | theme 포커스 | |
| 클릭 | separator 영역 클릭 | 아무 일도 안 일어남 | separator는 일반 div, entity 아님 | 변화 없음 | |
| 클릭 | group 영역(아이템 아닌 빈 공간) 클릭 | 아무 일도 안 일어남 | group container는 일반 div | 변화 없음 | |

### 인터페이스 체크리스트

- [x] ↑ 키: flat 순회, group 경계 무시
- [x] ↓ 키: flat 순회, group 경계 무시
- [x] ← 키: N/A (vertical toolbar)
- [x] → 키: N/A (vertical toolbar)
- [x] Enter: activate
- [x] Escape: N/A
- [x] Space: activate fallback
- [x] Tab: toolbar 밖으로
- [x] Home/End: 첫/마지막 아이템
- [x] 클릭: separator/group 빈 공간 무반응
- [x] 이벤트 버블링: group div에 이벤트 핸들러 없음 — 순수 wrapper. Aria 컨테이너의 이벤트 위임이 FocusScrollDiv까지 버블링으로 도달

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| ids 미지정 | 기존 Aria.Item 사용 코드 | 하위 호환 — 기존 코드가 깨지면 안 됨 | ROOT_ID에서 재귀, 기존과 동일 동작 | 변화 없음 | |
| ids에 store에 없는 id 포함 | entity가 동적으로 제거됨 | 에러보다 skip이 안전. 동적 show/hide 지원 | 해당 id 건너뜀, 나머지만 렌더링 | 빈 자리 없이 렌더링 | |
| ids가 빈 배열 | 그룹에 아이템 없음 | 빈 그룹은 consumer가 조건부로 숨기면 됨 | 아무것도 렌더링하지 않음 | 빈 영역 | |
| 같은 id가 여러 Aria.Item의 ids에 중복 | consumer 실수 | 에러를 낼 이유 없음, 중복 렌더링 | 같은 아이템이 두 번 렌더링. 포커스는 첫 번째에만 동작 | DOM 중복이나 크래시 없음 | |
| ids 순서가 store 순서와 다름 | consumer가 다른 순서로 ids 배열 구성 | ids 순서가 렌더링 순서를 결정해야 함 — consumer가 레이아웃을 제어하는 것이 ids의 목적 | ids 배열 순서대로 렌더링 | ids 순서 반영 | |
| theme의 followFocus: false | theme entity | 기존 동작 유지 | 기존과 동일 | 변화 없음 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | store = 구조의 단일 소스 (memory: feedback_one_app_one_store) | ② store 구조 | ✅ 준수 — store는 아이템과 상태를 소유. 그룹 소속은 정적 레이아웃이므로 JSX가 담당 | — | |
| P2 | 정규화 트리 순회로 UI 패턴 해결 (memory: feedback_normalization_solves_ui) | ③ navigate | ✅ 준수 — flat store를 그대로 순회. 타입별 분기 없음 | — | |
| P3 | ARIA 표준 용어 우선 (memory: feedback_naming_convention) | ② prop 이름 | ✅ 준수 — `ids`는 명확한 의미 | — | |
| P4 | 최소 구현 수렴 (memory: feedback_minimum_impl_is_good) | ② 산출물 범위 | ✅ 준수 — prop 1개 추가, navigate 변경 없음 | — | |
| P5 | 중첩 렌더링에서 이벤트 버블링 가드 (memory: feedback_nested_event_bubbling) | ③ group div | ✅ 준수 — group div에 이벤트 핸들러 없음, 순수 wrapper | — | |
| P6 | 테스트 원칙: 인터랙션은 통합(userEvent→DOM) (CLAUDE.md) | ⑧ 검증 | ✅ 준수 — keyboard 순회 테스트 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `AriaItem` 컴포넌트 (aria.tsx) | ids prop 추가. 기존 코드는 ids 미지정 → ROOT 재귀 → 하위 호환 | 낮 | 허용 | |
| S2 | `AriaItem` renderNodes 로직 | ids 지정 시 재귀 대신 flat 렌더링. ids 미지정 시 기존 로직 유지. 분기 1개 추가 | 낮 | 허용 — 분기가 renderNodes 진입부에만 존재, 기존 경로 불변 | |
| S3 | Activity bar JSX | group div, separator div 추가. CSS hack 제거 | 낮 | ② 산출물에 포함 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | separator를 entity로 넣지 않는다 | ⑤ P2 | CRUD 오염, navigate 오염 | |
| F2 | group div에 이벤트 핸들러를 붙이지 않는다 | ⑤ P5 | Aria의 이벤트 위임을 방해 | |
| F3 | Aria.Item render 시그니처를 변경하지 않는다 | ⑤ P4 | 기존 API 호환성 파괴 | |
| F4 | ids 지정 시 재귀 렌더링하지 않는다 | ⑤ P4 | ids는 flat collection 전용. 재귀가 필요하면 기존 모드(ids 미지정) 사용 | |
| F5 | store 구조를 parent-child로 바꾸지 않는다 | ⑥ S2 | navigate의 getVisibleNodes가 parent를 순회 대상에 포함하는 문제 회피 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①D3 | `Aria.Item ids={['cms','viewer','agent']}` 렌더링 | 3개 아이템만 렌더링 | |
| V2 | ①D3 | `Aria.Item` ids 미지정 | ROOT에서 전체 재귀 렌더링 (하위 호환) | |
| V3 | ①D1 | Activity bar에서 ↑↓로 그룹 경계 넘어 순회 | flat store 순서대로 모든 아이템 순회. separator/group div 무시 | |
| V4 | ①D2 | theme 버튼 위치 확인 | 하단에 고정 (margin-top: auto) | |
| V5 | ④ 경계 | ids에 store에 없는 id 포함 | 해당 id 건너뜀, 에러 없음 | |
| V6 | ④ 경계 | ids 빈 배열 | 아무것도 렌더링 안 됨 | |
| V7 | ③ 인터페이스 | separator 영역 클릭 | 아무 반응 없음 | |
| V8 | ③ 인터페이스 | Home → 첫 아이템, End → 마지막 아이템 | cms / theme | |
| V9 | ①D5 | store에서 viewer entity 제거 후 렌더링 | ids에 viewer가 있어도 렌더링 안 됨. navigate도 viewer 건너뜀 | |
| V10 | ④ 경계 | ids 순서가 store 순서와 다름 | ids 순서대로 렌더링됨 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## Usage

```tsx
const APP_IDS = ['cms', 'viewer', 'agent']
const OS_IDS = ['store', 'engine', 'axis', 'pattern', 'plugin', 'collection', 'components', 'area']
const UTIL_IDS = ['theme']

<Aria behavior={verticalToolbar} data={store} plugins={[core()]}>
  <div role="group" aria-label="App">
    <Aria.Item ids={APP_IDS} render={renderIcon} />
  </div>
  <div role="separator" className="activity-bar__separator" />
  <div role="group" aria-label="OS">
    <Aria.Item ids={OS_IDS} render={renderIcon} />
  </div>
  <div role="group" aria-label="Util" style={{ marginTop: 'auto' }}>
    <Aria.Item ids={UTIL_IDS} render={renderIcon} />
  </div>
</Aria>
```
