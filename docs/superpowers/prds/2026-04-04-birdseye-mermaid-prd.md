# Birdseye Mermaid Viewer — PRD

> Discussion: 트리+칸반은 정돈+스크롤 구조라서 인지 지도가 안 됨. Mermaid flowchart 다중 레벨 정적 뷰어로 교체하여 "조감이 되는지" 검증.

## ① 동기

### WHY

- **Impact**: 개발자가 코드베이스 전체를 조감할 수 없다. 트리+칸반은 공간 고정성이 없어 인지 지도가 형성되지 않음
- **Forces**: 전체 펼치면 폭발(그래프), 정돈하면 ls의 예쁜 버전(칸반), 트리는 횡단 의존 표현 불가. Mermaid 이미 설치됨
- **Decision**: Mermaid flowchart 다중 레벨 정적 뷰어. 기각 — ReactFlow(비용 과다), Markmap(트리와 동일), 실시간 LLM(불필요)
- **Non-Goals**: 실시간 코드 뷰, 실시간 import 그래프 분석, 런타임 LLM 호출

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | /birdseye에 진입 | 페이지 로드 | L1 다이어그램(레이어 6~7개 + 의존선)이 한 화면에 렌더링 | |
| S2 | L1이 보이는 상태 | 레이어 노드(예: engine)를 클릭 | L2 다이어그램(engine 내부 모듈 + 횡단 의존)으로 전환 | |
| S3 | L2가 보이는 상태 | 뒤로가기 또는 breadcrumb 클릭 | L1으로 복귀 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `docs/birdseye/L1.mmd` | 레이어 전체 조감 flowchart (store→engine→axis→pattern→primitives→ui→pages) | |
| `docs/birdseye/L2-{layer}.mmd` | 레이어별 내부 모듈 flowchart (예: `L2-engine.mmd`) | |
| `PageBirdseye.tsx` | Mermaid 뷰어로 전면 교체. `.mmd` fetch → MermaidBlock 렌더링 + 노드 클릭 → L2 전환 | |
| `PageBirdseye.module.css` | 새 레이아웃에 맞게 교체 | |
| ~~`birdseyeTransform.ts`~~ | 삭제 (칸반 변환 불필요) | |
| ~~`BirdseyeOverlay.tsx`~~ | 삭제 (코드 뷰어 불필요) | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 클릭(레이어 노드) | L1 표시 중 | L2 다이어그램으로 전환 | 노드 ID → `L2-{layer}.mmd` fetch | L2 표시, breadcrumb에 레이어명 | |
| 클릭(breadcrumb "Overview") | L2 표시 중 | L1으로 복귀 | 상위 레벨 복귀 | L1 표시 | |
| 브라우저 뒤로가기 | L2 표시 중 | L1으로 복귀 | URL `?layer=engine` 동기화 → history.back 작동 | L1 표시 | |
| Escape | L2 표시 중 | L1으로 복귀 | 줌아웃 단축키 관용 | L1 표시 | |
| Tab | 어느 레벨 | breadcrumb 간 이동 | 표준 탭 순서 | breadcrumb 포커스 | |
| ↑↓←→/Enter/Space | 어느 레벨 | N/A | Mermaid SVG는 포커스 불가 요소 | — | |

노드 클릭 구현: SVG 렌더 후 `[data-id]` 노드에 이벤트 위임

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| `.mmd` 파일 미존재 (L2 미작성) | L1에서 노드 클릭 | 아직 L2를 안 만든 레이어 가능 | "다이어그램 없음" 메시지, L1 유지 | L1 그대로 | |
| `.mmd` 문법 오류 | fetch 성공, 파싱 실패 | 수동 작성이라 오타 가능 | MermaidBlock fallback으로 raw 코드 표시 | raw 텍스트 | |
| URL에 존재하지 않는 layer (`?layer=foo`) | 직접 URL 입력 | 잘못된 URL 방어 | L1으로 fallback | L1 표시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반: UI → ui/ 완성품 사용 | ② PageBirdseye | 비위반 — 순수 뷰어, AriaRoute만 | — | |
| 2 | 키바인딩 → KeyMap 선언 | ③ Escape | 비위반 — AriaRoute keyMap | — | |
| 3 | ax()만 사용, style={} 금지 | ② CSS | 비위반 — ax() + module.css last-mile | — | |
| 4 | 상태 → store command | ② 상태 | 비위반 — URL 파라미터로 관리, 뷰 전용 | — | |
| 5 | pages에서 useAria 직접 사용 금지 | ② PageBirdseye | 비위반 — 사용하지 않음 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `birdseyeTransform.ts` 삭제 | 기존 테스트 깨짐 | 낮 | 테스트도 함께 삭제 | |
| 2 | `BirdseyeOverlay.tsx` 삭제 | 외부 import 없음 | 없음 | — | |
| 3 | `route-birdseye.screen.test.tsx` | 칸반 기반 테스트 무효 | 낮 | 새 뷰어 기준 교체 | |
| 4 | ActivityBar/라우트 | 변경 없음 | 없음 | — | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | Mermaid SVG에 직접 DOM 스타일 주입 | ⑤-3 | 테마는 mermaid.initialize로 | |
| 2 | 런타임 LLM 호출로 .mmd 생성 | ① Non-Goals | 정적 파일만 | |
| 3 | 기존 칸반/트리맵 코드 부분 존치 | ⑥-1,2 | 미사용 코드 완전 삭제 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | /birdseye 진입 | L1 flowchart SVG 렌더링, 레이어 노드 6~7개 + 의존 화살표 | |
| V2 | ①S2 | L1에서 "engine" 노드 클릭 | L2-engine 다이어그램, breadcrumb "Overview > engine" | |
| V3 | ①S3 | L2에서 breadcrumb "Overview" 클릭 | L1 복귀 | |
| V4 | ①S3 | L2에서 Escape | L1 복귀 | |
| V5 | ④-1 | L2 파일 미존재 노드 클릭 | "다이어그램 없음" 메시지, L1 유지 | |
| V6 | ④-3 | `?layer=nonexistent`로 접속 | L1 fallback | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
