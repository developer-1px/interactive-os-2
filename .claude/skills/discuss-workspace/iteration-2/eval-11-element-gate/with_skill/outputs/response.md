# CMS ContextMenu(우클릭 메뉴) 추가 — 전환 제안

## 이해도 테이블

| 요소 | 내용 | 이해도 |
|------|------|--------|
| ① 목적 | CMS 캔버스에서 우클릭으로 컨텍스트 메뉴를 제공하여, 마우스 사용자의 기능 접근성 확보 | 🟢 95% |
| ② 배경 | 현재 키보드 단축키만 존재, 마우스 우클릭 시 브라우저 기본 메뉴가 뜸 — 기능이 있는데 경로가 없는 상태 | 🟢 95% |
| ③ 이상적 결과 | 우클릭 시 노드 맥락 메뉴(복사/붙여넣기/삭제/이름변경) 표시. 입력: contextmenu 이벤트 또는 Shift+F10 → 출력: 클릭 좌표에 MenuList 팝업 | 🟢 90% |
| ④ 현실 | MenuList UI 완성품 있음, popover API 사용 가능. 우클릭 이벤트→engine 연결 경로 없음 | 🟢 90% |
| ⑤ 문제 | 마우스 사용자에게 기능 접근성 부족 — 키보드는 단축키로 접근 가능하지만, 마우스는 브라우저 기본 메뉴만 뜸 | 🟢 95% |
| ⑥ 원인 | contextmenu 이벤트→engine 연결 경로가 없음. 이벤트 수신 지점도, 이를 MenuList로 전달하는 메커니즘도 부재 | 🟢 90% |
| ⑦ 제약 | engine을 우회하면 안 됨(설계 원칙), 키보드 메뉴(Shift+F10)도 동일 동작해야 함(하나의 트리거→하나의 UI) | 🟢 95% |
| ⑧ 목표 | contextmenu 이벤트→MenuList 팝업 연결, Shift+F10도 동일 트리거로 동작 | 🟢 90% |
| ⑨ 해결 | ContextMenu UI 완성품 = MenuList + popover + 우클릭/Shift+F10 트리거. engine을 경유하는 단일 경로 | 🟢 90% |
| ⑩ 부작용 | popover 겹침 가능성(다른 popover가 열려 있을 때), 기존 브라우저 메뉴 차단(개발자 도구 접근 등) | 🟡 70% |
| ⑪ 장애물 | MenuList와 popover API의 위치 계산 연결이 아직 없음. contextmenu 이벤트 클릭 좌표→popover 위치 변환 로직 필요 | 🟡 75% |

---

## 10요소 역검증 (FRT)

### 1. ⑨→⑤ 해소: 이 해결이 문제(갭)를 실제로 해소하는가?

ContextMenu UI 완성품이 contextmenu 이벤트와 Shift+F10 양쪽에서 MenuList를 띄우므로, 마우스 사용자도 키보드 사용자와 동일하게 노드 맥락 명령(복사/붙여넣기/삭제/이름변경)에 접근할 수 있다. 갭("마우스 사용자 기능 접근성 부족")이 직접 해소된다.

### 2. ⑨→⑥ 원인 제거: 어떤 원인이 제거되는가?

"contextmenu 이벤트→engine 연결 경로 없음"이 원인이었다. ContextMenu 완성품이 이 이벤트를 수신하여 engine 경유로 MenuList에 전달하는 경로를 만들므로, 원인이 직접 제거된다.

### 3. ⑨→⑦ 제약 준수: 제약을 위반하지 않는 근거

- **engine 우회 금지**: ContextMenu는 engine을 경유하는 UI 완성품이다. contextmenu 이벤트를 직접 DOM 조작으로 처리하지 않고, engine의 이벤트 흐름을 통과한다.
- **Shift+F10 동일 동작**: 트리거만 다르고(마우스 좌표 vs 포커스된 노드 위치) MenuList 표시 로직은 동일하다. 하나의 완성품이 두 트리거를 통합한다.

### 4. ⑨→⑩ 부작용 수용: 부작용이 문제보다 작은 근거

- **popover 겹침**: popover API의 light-dismiss 특성으로, ContextMenu가 열리면 기존 popover가 자동으로 닫힌다. 겹침 자체가 발생하기 어렵고, 발생해도 API 레벨에서 해결된다.
- **브라우저 기본 메뉴 차단**: `preventDefault()`로 차단하되, 개발자 도구 접근은 F12/Cmd+Option+I로 여전히 가능하다. 일반 사용자에게는 커스텀 메뉴가 브라우저 메뉴보다 유용하므로, 트레이드오프가 수용 가능하다.

두 부작용 모두 "마우스 사용자의 기능 접근성 부족"이라는 원래 문제보다 영향이 작다.

### 5. ⑧ 기각 대안: 검토했으나 선택하지 않은 방향과 이유

- **A) 기존 MenuList를 직접 contextmenu 이벤트에 연결 (engine 우회)**: engine을 거치지 않으므로 ⑦ 제약 위반. 기각.
- **B) 우클릭 시 키보드 단축키 안내 tooltip만 표시**: 문제(마우스 접근성 부족)를 해결하지 않고 우회할 뿐. 갭이 남으므로 기각.
- **C) 브라우저 확장으로 커스텀 메뉴 주입**: 외부 의존, 설치 필요, engine 경유 불가. 기각.

---

## 액션 플랜

⑪ 장애물("MenuList와 popover API의 위치 계산 연결 부재", "클릭 좌표→popover 위치 변환")을 선행 조건으로 반영한 실행 순서:

1. **popover 좌표 배치 유틸 구현**: contextmenu 이벤트의 `clientX/clientY`를 받아 popover의 `style`(`left`, `top`)으로 변환하는 함수. Shift+F10일 때는 포커스된 노드의 `getBoundingClientRect()`에서 좌표를 산출한다. (⑪ 장애물 해소)
2. **ContextMenu UI 완성품 작성**: MenuList + popover + 트리거(contextmenu 이벤트, Shift+F10)를 조합. 위 좌표 유틸을 사용하여 popover 위치를 결정한다.
3. **engine 이벤트 경로 연결**: CMS 캔버스에서 contextmenu 이벤트를 engine 경유로 ContextMenu에 전달하는 경로를 추가한다.
4. **통합 테스트**: userEvent로 우클릭→MenuList 표시, Shift+F10→동일 MenuList 표시를 DOM/ARIA 상태로 검증한다.

---

핵심 요소 전부 🟢, 후행 요소(⑩⑪) 🟡 이상.

**제 판단: `/prd`로 진행.** 이유: ContextMenu는 새 UI 완성품이고, engine 이벤트 경로 연결과 좌표 계산이라는 인터페이스 경계가 명확하므로, 구현 전에 인터페이스/경계/검증 명세를 PRD로 확정하는 게 적합하다. 바로 `/go`로 가기엔 popover 좌표 배치의 edge case(뷰포트 경계, 스크롤 오프셋)가 명세 없이 흩어질 위험이 있다.

진행할까요?
