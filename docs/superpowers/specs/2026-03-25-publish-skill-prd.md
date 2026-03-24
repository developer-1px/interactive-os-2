# /publish 스킬 — PRD

> Discussion: area/demo-coverage/improve + 역PRD→문서 이식을 하나로 통합하는 Living Documentation 오케스트레이터

## ① 동기

### WHY

- **Impact**: PRD 32개+ 소비 후 "ListBox feature는 완전한가?"에 답할 수 없다. 역PRD의 인터페이스·경계 스펙이 retro 보고서에서 죽고, Area MD로 이식되지 않는다. 5개 갭(registry, ShowcaseDemo, APG표, 라우트, 핸드오프)이 어느 스킬에도 배정 안 됨.
- **Forces**: area는 구조 기록만, demo-coverage는 코드 분기만, improve는 점수 개선만 — 각각 한 조각. 연결하는 책임이 없음. 기존 파이프라인(/go→/retro→/close→/area)은 유지해야 함.
- **Decision**: /publish = Living Documentation 오케스트레이터. Martraire 4원칙 + Complete(5번째). MDN처럼 "module을 찾아가면 설명+데모+API+키보드 표가 다 있는 상태"를 만든다. 기각: "각 스킬에 누락 책임 추가" — 분산되면 또 갭이 생김.
- **Non-Goals**: UI 컴포넌트 자체 구현, 기존 스킬(area/demo-coverage/improve)의 내부 로직 변경, MD 구조(7섹션) 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | /retro 완료 후 역PRD가 있는 상태 | `/publish listbox` 실행 | ListBox.md의 7섹션 완전성 감사 → 빈 섹션 감지 → 역PRD에서 이식 → 데모/registry 확인 → 완전성 리포트 출력 | |
| S2 | 새 UI 완성품(NavList) 추가 직후 | `/publish navlist` 실행 | MD 파일 없으면 생성 + 7섹션 스캐폴드 + registry 엔트리 확인 + 데모 블록 삽입 | |
| S3 | layer 단위 감사 | `/publish ui` 실행 | docs/2-areas/ui/ 전체를 순회하여 각 module의 완전성 점수 → layer 리포트 | |
| S4 | /close에서 자동 호출 | /close Step 4에서 `/publish` 위임 | area 단독 호출 대신 publish가 area를 포함한 전체 파이프라인 실행 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `.claude/skills/publish/SKILL.md` | /publish 스킬 파일. 5 Step 오케스트레이터 | |
| `.claude/skills/close/SKILL.md` 수정 | Step 4에서 /area 대신 /publish 호출로 변경 | |
| 7섹션 체크리스트 (스킬 내 정의) | Description, Demo, Usage, Props, Keyboard, Accessibility, Internals — 각 섹션의 존재+내용 판정 기준 | |

완성도: 🟡

## ③ 인터페이스

> 비-UI 스킬. 인터페이스 = 스킬의 입력/단계/출력.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `/publish {slug}` | 특정 module의 MD가 존재할 수도, 없을 수도 | Step 1: 7섹션 감사 → Step 2: 역PRD 이식 → Step 3: 데모 완전성 → Step 4: 점수 → Step 5: area 갱신 | 각 단계가 이전 단계의 산출물을 소비하는 파이프라인 | MD 7섹션 완전 + registry 등록 + 데모 존재 + area 갱신 | |
| `/publish {layer}` (예: `ui`, `pattern`) | layer 내 N개 module의 각각 다른 완전성 | 전체 module 순회 → 개별 감사 → layer 리포트 | scope를 올리면 개별 감사의 집계가 됨 | layer 완전성 리포트 (module별 점수) | |
| `/publish` (인자 없음) | 최근 /retro 결과 또는 git diff 존재 | 변경된 module 자동 감지 → 해당 module만 publish | 변경하지 않은 module까지 감사하면 비용 대비 가치 없음 | 변경 module의 완전성 보장 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| MD 파일이 아예 없는 module | registry에 slug만 있음 | 새 컴포넌트 추가 직후 자주 발생 — 빈 MD가 있어야 채울 수 있음 | 7섹션 스캐폴드 MD 자동 생성 | docs/2-areas/ui/{Name}.md 생성됨 | |
| registry에 없는 module | MD는 있지만 registry에 slug 없음 | Tooltip처럼 engine 밖 독립 컴포넌트는 registry가 없을 수 있음 | 경고만, 강제 등록 안 함. ShowcaseDemo 블록은 registry 의존이므로 Demo 섹션을 ⚠️로 표시 | 리포트에 경고 | |
| 역PRD가 없는 상태에서 실행 | retro를 안 한 상태 | publish는 retro 없이도 독립 실행 가능해야 함 — 수동 문서 작성 시에도 완전성 감사가 필요 | Step 2(역PRD 이식) 건너뜀, 나머지 Step 정상 실행 | 이식 없는 감사 | |
| 7섹션 중 일부가 해당 없는 module | Tooltip은 APG 패턴이 없음 | 모든 module이 7섹션 전부를 필요로 하지는 않음 | Accessibility 섹션에 "pattern: 없음"이 명시되어 있으면 ✅ 판정. 아예 비어있으면 ❌ | "명시적 N/A" = 완전, "누락" = 불완전 | |
| /improve 스크립트가 없는 환경 | pnpm score:* 스크립트 미설정 | improve는 선택적 — 없으면 건너뜀 | Step 4 스킵, 경고 없음 | 나머지 Step 정상 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | PRD는 연료, Area는 건물 (memory: project_area_mdx_docs) | ② Step 2 역PRD→MD 이식 | ✅ 준수 — PRD 스펙을 영구 문서로 전환하는 것이 이 원칙의 구현 | — | |
| P2 | test = demo = showcase (GOAL.md) | ② Step 3 데모 완전성 | ✅ 준수 — ShowcaseDemo가 test runner를 포함 | — | |
| P3 | MD SSOT (방금 구현) | ② 전체 | ✅ 준수 — registry는 렌더 전용, 콘텐츠는 MD | — | |
| P4 | 하위 스킬 독립 호출 가능 (제약) | ② /area, /demo-coverage, /improve | ✅ 준수 — publish는 위임만, 하위 스킬 자체는 변경 안 함 | — | |
| P5 | 커밋 전 /simplify 필수 (CLAUDE.md) | ② 스킬 파일 변경 | ✅ — 스킬 파일은 코드가 아닌 문서, simplify 대상 아님 | — | |
| P6 | 설계 원칙 > 사용자 요구 (memory) | ③ 경계 — registry 없는 module | ✅ — engine 밖 독립 컴포넌트의 설계를 존중, 강제 등록 안 함 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | `/close` 스킬의 Step 4 | /area 직접 호출 → /publish 호출로 변경. /area를 독립 호출하던 사용자는 영향 없음 (publish가 area를 위임) | 낮 | /close 수정 시 "publish가 area를 포함"임을 명시 | |
| E2 | 기존 Area MD 파일 | publish가 빈 섹션을 자동 채우면 기존 수동 작성 내용과 충돌 가능 | 중 | 기존 내용이 있는 섹션은 건드리지 않음. 빈 섹션만 스캐폴드 | |
| E3 | /demo-coverage 호출 빈도 증가 | publish가 자동으로 demo-coverage를 호출하면 긴 실행 시간 | 중 | demo-coverage 호출은 "ShowcaseDemo 블록이 없을 때만". 이미 있으면 스킵 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| F1 | 기존 MD 내용 덮어쓰기 | ⑥ E2 | 수동 작성한 내용 유실 위험 | |
| F2 | 하위 스킬 내부 로직 변경 | Non-Goals | publish는 오케스트레이터, 하위 스킬의 관심사 침범 금지 | |
| F3 | 7섹션 외 새 섹션 추가 | ⑤ MD SSOT | 기존 MD 구조를 publish가 멋대로 확장하면 일관성 깨짐 | |
| F4 | registry 강제 등록 | ⑤ P6 | engine 밖 독립 컴포넌트(Tooltip 등)의 설계 존중 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | `/publish listbox` 실행 → 7섹션 감사 | 7/7 ✅ 리포트 (ListBox.md가 이미 완전) | |
| V2 | S2 | MD 없는 module에 `/publish` | 7섹션 스캐폴드 MD 생성됨 | |
| V3 | S3 | `/publish ui` layer 감사 | 23개 module 각각의 완전성 점수 + layer 평균 | |
| V4 | ④경계3 | 역PRD 없이 `/publish listbox` | Step 2 스킵, 나머지 정상, 리포트에 "역PRD 이식: N/A" | |
| V5 | ④경계4 | Tooltip처럼 pattern 없는 module | Accessibility에 "pattern: 없음" → ✅ 판정 | |
| V6 | ⑦F1 | 이미 내용이 있는 Props 섹션에 publish 실행 | 기존 내용 유지, 덮어쓰지 않음 | |
| V7 | S4 | /close에서 자동 호출 | close Step 4 → publish → area 포함 전체 파이프라인 실행 | |

완성도: 🟡

---

**전체 완성도:** 🟡 7/8 (사용자 확인 대기)
