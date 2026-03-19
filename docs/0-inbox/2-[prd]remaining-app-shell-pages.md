# PRD: App Shell 빈 페이지 완성

> 작성일: 2026-03-17
> 목적: 랄프루프 자율 실행용 — 명확한 패턴, 검증 가능, 설계 결정 최소

---

## 배경

App Shell에 6개 placeholder 페이지 + 1개 미생성 레이어가 남아있다.
기존 25개 페이지의 패턴이 확립되어 있으므로, 동일 패턴을 따라 채운다.

## 범위

### 1. Components 레이어 (신규 — ActivityBar에 추가)

`/components` 라우트 그룹. interactive-os 라이브러리의 **사용법**을 보여주는 페이지.
기존 Navigation/Collection이 "무엇이 가능한가"를 보여준다면, Components는 "어떻게 쓰는가"를 보여준다.

| 페이지 | 경로 | 내용 |
|--------|------|------|
| **Aria** | `/components/aria` | `<Aria>` + `<Aria.Item>` compound component 사용법. 최소 예제: behavior + data + plugins를 넣으면 키보드 인터랙션이 자동 작동. `renderItem` 콜백의 `NodeState` 필드들 소개. |
| **Cell** | `/components/cell` | `<Aria.Cell>` 멀티 컬럼 지원. Grid/TreeGrid에서 셀 단위 포커스가 어떻게 작동하는지 데모. |
| **Hooks** | `/components/hooks` | `useAria()`, `useControlledAria()`, `useKeyboard()` — 각 훅의 용도와 escape hatch 패턴. 외부 store 연동 예시. |

**구현 가이드:**
- ActivityBar에 `Components` 그룹 추가 (icon: `Box` from lucide-react)
- 기존 `routeConfig`에 새 그룹 등록
- 각 페이지는 기존 데모 페이지와 동일 구조: `page-header` + `page-keys` + `card` + 설명 섹션
- **코드 예시는 `<pre><code>` 블록**으로 보여준다 (Shiki 불필요, 정적 문자열)
- 각 페이지에 인터랙티브 데모 최소 1개 포함

### 2. Store Explorer (P1)

| 페이지 | 경로 | 내용 |
|--------|------|------|
| **Explorer** | `/store/explorer` | NormalizedData의 entities + relationships를 **자기 자신(TreeGrid)으로** 시각화. 메타 엔티티(`__focus__`, `__selection__` 등)도 표시. |
| **Operations** | `/store/operations` | Store 함수들(`addEntity`, `removeEntity`, `updateEntity`, `moveNode`) 데모. 버튼/키보드로 조작하면 결과가 Explorer와 동일한 뷰로 표시. |

**구현 가이드:**
- Explorer: `createStore()`로 샘플 데이터 생성 → TreeGrid로 렌더링. entities는 leaf, relationships는 parent-child 구조로 매핑.
- Operations: ListBox로 조작 목록 표시 + 오른쪽에 결과 store 상태 표시 (split layout).
- 핵심 원칙: **라이브러리가 자기 자신을 보여준다** (meta showcase). TreeGrid 컴포넌트로 store 구조를 탐색하는 것 자체가 라이브러리의 실용성 증명.

### 3. Engine Pipeline (P1)

| 페이지 | 경로 | 내용 |
|--------|------|------|
| **Pipeline** | `/engine/pipeline` | Command dispatch 흐름을 단계별로 보여준다. 사용자가 키보드로 조작하면, 각 단계(keyMap lookup → Command 생성 → middleware → execute → store update)가 하이라이트. |
| **History** | `/engine/history` | Undo/Redo 스택 시각화. 조작할 때마다 스택이 쌓이고, undo하면 스택에서 빠지는 것을 실시간으로 표시. |

**구현 가이드:**
- Pipeline: ListBox로 단계 목록, 각 단계에 설명. 인터랙티브 데모에서 실제 command를 dispatch하고 `onChange`에서 로그를 캡처하여 표시.
- History: 상단에 ListBox 데모 (조작용), 하단에 히스토리 스택 표시. `history()` 플러그인의 내부 상태를 `onChange` 콜백에서 읽어 표시.
- 복잡한 시각화 불필요 — 텍스트 기반 로그/리스트로 충분.

### 4. Vision Architecture (P1)

| 페이지 | 경로 | 내용 |
|--------|------|------|
| **Architecture** | `/vision/architecture` | `docs/0-inbox/1-[vision]interactive-os-architecture-vision.md`의 mermaid 다이어그램들을 렌더링. |

**구현 가이드:**
- 이미 Viewer에서 mermaid 렌더링 인프라가 있다면 재사용.
- 없으면 `mermaid` 패키지 사용하여 런타임 렌더링. `useEffect`에서 `mermaid.render()` 호출.
- 비전 문서의 7개 섹션을 순서대로 렌더링. 각 섹션은 제목 + mermaid 차트.
- 정적 콘텐츠이므로 store/plugin 불필요.

---

## 실행 순서 (의존성 기준)

1. **Components 레이어** — ActivityBar 수정 + 3 페이지 (다른 작업과 독립)
2. **Vision Architecture** — 1 페이지 (정적, 가장 단순)
3. **Store Explorer + Operations** — 2 페이지 (store 이해 필요)
4. **Engine Pipeline + History** — 2 페이지 (engine + history 플러그인 이해 필요)

## 검증 기준

각 단계 완료 후:
- `pnpm lint` — 0 errors
- `pnpm test` — 기존 테스트 통과 (새 테스트 추가 선택적)
- `pnpm dev` — 모든 페이지 렌더링 확인 (placeholder 0개 = 완료)
- `docs/PROGRESS.md` 업데이트

## 완료 조건

- ActivityBar의 모든 "soon" 뱃지가 사라짐
- 6개 레이어 그룹 모두 실제 콘텐츠 보유
- PROGRESS.md의 P1 항목들이 체크됨

## 제약

- 새 npm 의존성 최소화 (mermaid만 허용, 필요시)
- 기존 CSS 클래스/패턴 재사용 — 새 CSS 파일 생성하지 않음
- 기존 UI 컴포넌트(TreeGrid, ListBox 등)를 데모에서 적극 활용
- Viewer의 mermaid 렌더링이 이미 있으면 그것을 재사용
