# followFocus Activation — PRD

> Discussion: ActivityBar가 Aria(tablist) + 별도 button으로 Tab stop 2개. 하나의 toolbar로 통합하되, 아이템별로 "포커스=활성화"와 "명시적 활성화"를 혼용할 수 있어야 한다. os 수준에서 followFocus + onActivate를 제공.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | toolbar 안에 네비게이션 아이템과 유틸리티 버튼이 섞여 있다 | 사용자가 ↑↓로 네비게이션 아이템에 포커스를 옮긴다 | 즉시 해당 페이지로 라우트가 변경된다 (followFocus) |
| 2 | toolbar 안에 theme 토글 같은 유틸리티 버튼이 있다 | 사용자가 ↑↓로 유틸리티 버튼에 포커스를 옮긴다 | 포커스만 이동하고 아무 행위도 발생하지 않는다 |
| 3 | 유틸리티 버튼에 포커스가 있다 | 사용자가 Enter/Space를 누른다 | 해당 버튼의 액션이 실행된다 (테마 토글 등) |
| 4 | os를 사용하는 소비자가 있다 | tabs처럼 포커스=활성화가 필요한 패턴을 만든다 | behavior의 followFocus 기본값으로 별도 설정 없이 동작한다 |
| 5 | os를 사용하는 소비자가 있다 | 같은 컨테이너에서 일부 아이템만 followFocus를 끄고 싶다 | entity data로 아이템별 override가 가능하다 |

상태: 🟢

## 2. 인터페이스

### os 레벨 (라이브러리)

| 입력 | 조건 | 결과 |
|------|------|------|
| ↑↓ 포커스 이동 | behavior.followFocus=true, entity.data.followFocus≠false | 포커스 변경 후 `onActivate(nodeId)` 자동 호출 |
| ↑↓ 포커스 이동 | behavior.followFocus=true, entity.data.followFocus=false | 포커스만 변경, onActivate 호출 안 함 |
| ↑↓ 포커스 이동 | behavior.followFocus=false 또는 미설정 | 포커스만 변경, onActivate 호출 안 함 |
| Enter/Space | onActivate가 등록되어 있다 | `onActivate(focusedId)` 호출 |
| Enter/Space | onActivate가 없다 | 기존 activate() 동작 (expand/select) |
| 클릭 | activateOnClick=true, onActivate 있다 | `onActivate(nodeId)` 호출 |
| 클릭 | activateOnClick=true, onActivate 없다 | 기존 activate() 동작 |

### 인터페이스 체크리스트

- [x] ↑ 키: 포커스 이전 아이템 + followFocus 판정
- [x] ↓ 키: 포커스 다음 아이템 + followFocus 판정
- [x] ← 키: N/A (vertical toolbar)
- [x] → 키: N/A (vertical toolbar)
- [x] Enter: onActivate(focusedId) 호출
- [x] Escape: N/A
- [x] Space: onActivate(focusedId) 호출
- [x] Tab: 컨테이너 밖으로 포커스 이동 (roving-tabindex 표준)
- [x] Home/End: 첫/끝 아이템 포커스 + followFocus 판정
- [x] Cmd/Ctrl 조합: N/A
- [x] 클릭: activateOnClick 시 onActivate 호출
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: N/A (단층 구조)

상태: 🟢

## 3. 산출물

### os 변경

- `behaviors/types.ts` — `AriaBehavior`에 `followFocus?: boolean` 필드 추가
- `components/aria.tsx` — `AriaProps`에 `onActivate?: (nodeId: string) => void` 콜백 추가
- `hooks/useAria.ts` — onActivate 전달, followFocus 판정 로직 삽입
  - 포커스 변경 감지 시: behavior.followFocus=true이고 entity.data.followFocus≠false이면 onActivate 호출
  - Enter/Space (activate 실행 시): onActivate가 있으면 기존 activate() 대신 onActivate 호출
- 기존 behavior 프리셋 — followFocus 기본값 설정:
  - `tabs`: followFocus=true (포커스=활성화가 표준)
  - `toolbar`: followFocus=false (명시적 활성화가 표준)
  - 나머지: followFocus 미설정 (=false)

### App 변경

- `App.tsx` — ActivityBar를 toolbar behavior로 변경, theme 버튼을 store에 포함, onActivate 콜백으로 라우트/테마 분기

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| onActivate 미등록 + followFocus=true | followFocus 무시, 기존 activate() 동작 유지 (expand/select) |
| store에 아이템 1개만 존재 | ↑↓ 이동 없음, followFocus 발화 안 함 |
| followFocus 아이템 → non-followFocus 아이템으로 포커스 이동 | non-followFocus 아이템이므로 onActivate 안 함 |
| non-followFocus 아이템에서 Enter/Space | onActivate(해당 id) 호출 |
| 프로그래밍적 포커스 변경 (engine.dispatch) | followFocus 판정 적용됨 — 포커스 원인 불문, onActivate 호출 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | onChange 콜백에서 followFocus 판정하지 않는다 | onChange는 모든 store 변경에 발화. 포커스 외 변경(selection, expand)에도 onActivate가 호출되면 안 됨 |
| 2 | activate()의 기존 동작(expand/select)을 제거하지 않는다 | onActivate가 없는 기존 소비자에게 breaking change |
| 3 | entity.data.followFocus를 os 내부 타입으로 강제하지 않는다 | entity data는 소비자 자유 영역. 컨벤션으로 제공 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | toolbar + followFocus=true + onActivate, ↓ 키 | onActivate(다음 아이템 id) 호출 |
| 2 | toolbar + followFocus=true + entity.data.followFocus=false인 아이템에 ↓ 키 | onActivate 호출 안 함 |
| 3 | 위 아이템에서 Enter | onActivate(해당 id) 호출 |
| 4 | tabs + followFocus=true (기본), ↓ 키 | onActivate(다음 탭 id) 호출 — 기존 tabs 동작과 호환 |
| 5 | toolbar + onActivate 미등록, Enter | 기존 activate() 동작 (expand/select) |
| 6 | ActivityBar: 레이어 아이콘에 ↓ | 라우트 변경 |
| 7 | ActivityBar: theme 버튼에 ↓ 도달 | 포커스만 이동, 라우트/테마 변경 없음 |
| 8 | ActivityBar: theme 버튼에서 Enter | 테마 토글 |
| 9 | ActivityBar: Tab 키 | 컨테이너 밖으로 이동 (Tab stop 1개 확인) |

상태: 🟢

---

**전체 상태:** 🟢 6/6
