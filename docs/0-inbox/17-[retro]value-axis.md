# Retro: Value Axis (6th axis) — 2026-03-21

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-21-value-axis-prd.md
- **Diff 범위:** db3a765..fcc3224
- **커밋 수:** 10
- **변경 파일:** 23

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | 🔀 | #4 "CRUD update" — 코드는 onChange만, CRUD 자동 연동 아님 | L2 |
| 2 | 인터페이스 | ❌ | slider 트랙 클릭 미구현 | L1 |
| 3 | 산출물 | ⚠️ | role:'none'+childRole:'slider' 패턴 PRD 미기재 | L2 |
| 4 | 경계 | ✅ | 전부 일치 | — |
| 5 | 금지 | ⚠️ | VALUE_ID 싱글턴 한계 PRD 미기재 | L2 |
| 6 | 검증 | ❌ | #10 axe-core 테스트 미작성 | L1 |

**일치율:** 3/6

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨
- **트랙 클릭 (인터페이스 #클릭):** Slider.tsx에 onClick 핸들러 없음. PRD에서 "UI 컴포넌트 레벨"로 명시했으나 구현 누락.
- **axe-core 검증 (#10):** PRD 검증 항목에 있지만 테스트 미작성.

### ⚠️ 구현됐는데 PRD에 없었음
- **role:'none', childRole:'slider':** 단일 노드 위젯에서 aria 속성이 item에 붙어야 하므로 childRole에 role을 넣은 패턴. 올바른 결정이나 PRD에서 예측 못함.
- **VALUE_ID 싱글턴 한계:** store 전역 단일 엔티티이므로 multi-slider (한 위젯에 여러 thumb) 시나리오 불가. PRD 경계에서 다루지 않음.

### 🔀 의도와 다르게 구현됨
- **CRUD 연동:** PRD #4 "CRUD update로 entity.data에 반영"은 자동 연동을 암시. 실제로는 onChange 콜백만 제공, CRUD 호출은 소비자 책임. rename 패턴(confirmRename → entity.data)과 다른 방식.

## 계층별 개선 제안

### L1 코드 — /backlog에 저장
- [ ] Slider.tsx에 트랙 클릭 → setValue 핸들러 추가
- [ ] axe-core 접근성 테스트 추가 (slider, spinbutton)

### L2 PRD 스킬
- 단일 노드 위젯에서 role/childRole 배치 패턴을 PRD 산출물에서 명시해야 했음
- "CRUD 연동"을 쓸 때 "누가 호출하는가"(자동 vs 소비자 책임)를 구분해야 했음
- 경계에서 "동일 타입 위젯 복수 배치" 시나리오를 다뤄야 했음

### L5 사용자 피드백
- 💬 "CRUD로 연동"이라는 표현이 "onChange → 소비자가 CRUD 호출"인지 "자동 CRUD dispatch"인지 모호했습니다. 다음에 연동 패턴을 명시해주시면 더 정확합니다.

## 다음 행동
- L1 → /backlog에 저장 (트랙 클릭, axe-core)
- L2 → 경험 DB에 기록
