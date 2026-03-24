## 이해도 테이블

| # | 요소 | 내용 | 이해도 |
|---|------|------|--------|
| 1 | 목적 | CMS 캔버스에서 우클릭으로 컨텍스트 메뉴 제공 — 마우스 사용자의 기능 접근성 확보 | 🟢 95% |
| 2 | 배경 | 현재 키보드 단축키만 존재, 마우스 우클릭 시 브라우저 기본 메뉴가 뜸 | 🟢 95% |
| 3 | 이상적 결과 | 우클릭 시 노드 맥락에 맞는 메뉴(복사/붙여넣기/삭제/이름변경) 표시. 입력: contextmenu 이벤트 + 현재 선택 노드 → 출력: MenuList 팝업 with 해당 노드에 유효한 명령 목록 | 🟢 92% |
| 4 | 현실 | MenuList UI 완성품 있음, popover API 사용 가능, 우클릭 이벤트는 engine에 미연결 | 🟢 90% |
| 5 | 문제 | 마우스 사용자에게 기능 접근성 부족 — 키보드 사용자만 단축키로 접근 가능한 비대칭 | 🟢 92% |
| 6 | 원인 | 우클릭(contextmenu) 이벤트 → engine 연결 경로가 없음. 이벤트 핸들링 레이어에서 contextmenu를 처리하는 축/플러그인이 부재 | 🟢 90% |
| 7 | 제약 | (a) engine을 우회하면 안 됨 — DOM 직접 조작 금지, engine 모델 경유 필수. (b) 키보드 메뉴(Shift+F10)도 동일 동작해야 함 — 트리거만 다르고 결과는 동일 | 🟢 95% |
| 8 | 목표 | contextmenu 이벤트 → MenuList 팝업 연결. Shift+F10도 동일 트리거로 동작. engine의 commands를 메뉴 항목으로 매핑 | 🟢 90% |
| 9 | 해결 | ContextMenu UI 완성품 = MenuList + popover + 우클릭/Shift+F10 트리거. engine commands에서 현재 노드에 유효한 명령을 필터링하여 메뉴 구성 | 🟢 90% |
| 10 | 부작용 | popover 겹침 가능성(다른 팝오버와 동시 오픈), 기존 브라우저 메뉴 차단(preventDefault)으로 개발자 도구 접근 불편 가능 | 🟡 70% |

---

핵심 요소 전부 🟢, 부작용 🟡 이상

10요소 역검증 (FRT):
1. ⑨→⑤ 해소: ContextMenu UI 완성품이 우클릭/Shift+F10 양쪽 트리거를 제공하므로, 마우스 사용자도 키보드 사용자와 동등하게 명령에 접근할 수 있다. 기능 접근성 비대칭이 해소된다.
2. ⑨→⑥ 원인 제거: contextmenu 이벤트를 engine commands와 연결하는 경로를 ContextMenu 완성품이 담당한다. "연결 경로 없음"이라는 원인이 직접 제거된다.
3. ⑨→⑦ 제약 준수: (a) ContextMenu는 engine commands를 통해 동작하므로 engine 우회 없음. DOM 직접 조작이 아니라 engine 모델 경유. (b) 우클릭과 Shift+F10이 동일한 ContextMenu 완성품을 트리거하므로 동일 동작 보장.
4. ⑨→⑩ 부작용 수용: popover 겹침은 popover API의 기본 동작(light dismiss)으로 이전 팝오버가 자동 닫히므로 관리 가능. 브라우저 메뉴 차단은 Shift 키 조합 등으로 우회 경로를 남길 수 있어, 원래 문제(기능 접근성 부족)보다 명백히 작다.
5. ⑧ 기각 대안: (a) 툴바에 "더보기" 버튼 추가 — 우클릭의 맥락성(클릭한 노드 기준)을 제공하지 못하고, 추가 클릭이 필요하여 기각. (b) 브라우저 기본 메뉴에 커스텀 항목 주입 — 표준 API 미지원으로 기각. (c) engine 밖에서 직접 DOM 이벤트 처리 — 제약 (a) 위반으로 기각.

---

### 액션 플랜

1. ContextMenu UI 완성품 생성: MenuList + popover 조합, contextmenu 이벤트와 Shift+F10 키바인딩을 트리거로 등록
2. engine commands → 메뉴 항목 매핑: 현재 선택 노드에 유효한 commands를 필터링하여 MenuList에 전달
3. CMS 캔버스에 ContextMenu 연결: 캔버스 영역의 contextmenu 이벤트 핸들러 등록
4. popover 겹침 처리: light dismiss 동작 확인, 다른 팝오버와의 상호작용 테스트
5. 통합 테스트: 우클릭 → 메뉴 표시 → 명령 실행, Shift+F10 → 동일 동작 검증

---

**제 판단: `/prd`로 전환.** 이유: UI 완성품 신규 생성이므로 인터페이스(ContextMenu props, 트리거 API)와 경계(engine commands 매핑, popover 충돌 처리)를 명세화한 뒤 구현에 진입하는 것이 안전하다. 특히 engine 우회 금지 제약과 Shift+F10 동일 동작 요구사항을 PRD에서 검증 기준으로 확정해야 한다.
진행할까요?
