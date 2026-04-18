---
id: 2-areas/ui/prds/lightbox-prd
type: prd
slug: lightbox
title: 'Lightbox — PRD'
tags: [untagged]
created: 2026-04-08
updated: 2026-04-08
summary: 'Discussion: MarkdownViewer 내 이미지/머메이드 클릭 → 100vw×100vh 풀스크린 modal. OS 기반, dispatch-only Context 디커플링.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Lightbox — PRD

> Discussion: MarkdownViewer 내 이미지/머메이드 클릭 → 100vw×100vh 풀스크린 modal. OS 기반, dispatch-only Context 디커플링.

## ① 동기

### WHY

- **Impact**: docs 문서를 읽다가 머메이드 다이어그램이나 이미지의 디테일을 확인하고 싶을 때, 현재는 인라인 크기 그대로만 볼 수 있어 작은 텍스트나 복잡한 다이어그램을 해독하기 어렵다.
- **Forces**: OS 커맨드 패러다임(발신자가 수신자를 모른다) vs 변경 범위 한정. /conflict 결과: dispatch-only Context로 양립 — Lightbox가 자체 engine 소유, dispatch 함수만 Context로 노출.
- **Decision**: 글로벌 커맨드 버스(과잉 — OS 전체 아키텍처 변경), FileViewerModal 재활용(책임 혼재 — breadcrumb/메타데이터 장식), 네이티브 dialog 직접 사용(OS 우회) 기각. → Lightbox를 ui/에 dialog 패턴 기반으로 신규 구축.
- **Non-Goals**: 이미지 갤러리(이전/다음 네비게이션), 줌/팬, 이미지 다운로드, 편집 기능. Lightbox는 "하나의 콘텐츠를 풀스크린으로 보여주고 닫기"만.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 문서에 인라인 이미지가 있다 | 이미지를 클릭한다 | 100vw×100vh modal에 이미지가 중앙 배치되어 표시된다 | |
| S2 | 문서에 머메이드 다이어그램이 있다 | 다이어그램을 클릭한다 | 100vw×100vh modal에 SVG가 중앙 배치되어 표시된다 | |
| S3 | Lightbox가 열려있다 | ESC를 누른다 | Lightbox가 닫히고, 클릭했던 요소로 포커스가 복귀한다 | |
| S4 | Lightbox가 열려있다 | backdrop(콘텐츠 바깥 어두운 영역)을 클릭한다 | Lightbox가 닫힌다 | |
| S5 | 이미지가 `<a>` 태그로 감싸져 있다 | 이미지를 클릭한다 | 링크 네비게이션이 실행된다 (Lightbox가 열리지 않는다) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/ui/Lightbox.tsx` | ui/ 완성품. dialog 패턴 기반 풀스크린 뷰어. LightboxProvider(engine 소유 + Context) + Lightbox(렌더링) 내보냄 | |
| `src/interactive-os/ui/Lightbox.css` | @layer component 래핑. 100vw×100vh, 콘텐츠 중앙 배치, backdrop. ax()로 커버 안 되는 last-mile만 | |
| `src/interactive-os/ui/MarkdownViewer.tsx` (수정) | img 커스텀 렌더러 추가 + MermaidBlock에 onClick 전달. LightboxProvider 내부 래핑 | |
| `src/pages/showcase/MermaidBlock.tsx` (수정) | onClick prop 추가. 클릭 시 SVG HTML을 콜백에 전달 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 이미지 클릭 | Lightbox 닫힘 | `dispatch(lightbox.open)` | img에 onClick → Context의 dispatch 호출. Lightbox engine이 popup.open 커맨드 처리 → POPUP_ID.isOpen=true | Lightbox 열림, 이미지 표시 | |
| 머메이드 클릭 | Lightbox 닫힘 | `dispatch(lightbox.open)` | MermaidBlock의 div onClick → ref.current.innerHTML(SVG)을 payload에 담아 dispatch | Lightbox 열림, SVG 표시 | |
| ESC 키 | Lightbox 열림 | dialog 패턴 keyMap → `popup.close` | dialog 패턴이 Escape를 popup.close에 매핑. close 핸들러가 POPUP_ID.isOpen=false + focusCommands.setFocus(triggerId) | Lightbox 닫힘, 트리거 요소로 포커스 복귀 | |
| backdrop 클릭 | Lightbox 열림 | `e.target === e.currentTarget` 가드 → close | 콘텐츠 영역 밖 클릭만 감지. 콘텐츠 내부 클릭은 버블링 가드로 무시 | Lightbox 닫힘 | |
| `<a>` 안의 이미지 클릭 | — | 링크 네비게이션 | img 렌더러가 부모 `<a>` 존재 여부를 확인. 있으면 onClick 부착 안 함 | 링크로 이동 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 매우 큰 이미지 (5000×5000) | Lightbox 열림 | 뷰포트보다 큰 이미지는 잘리면 안 됨. object-fit: contain으로 비율 유지하며 뷰포트에 맞춤 | 이미지가 뷰포트 안에 비율 유지하며 표시 | 정상 표시 | |
| 매우 작은 이미지 (50×50) | Lightbox 열림 | 작은 이미지를 억지로 확대하면 픽셀화. 원본 크기 유지가 자연스러움 | 원본 크기로 중앙에 표시 (확대 안 함) | 정상 표시 | |
| SVG (벡터) | Lightbox 열림 | SVG는 해상도 무관 확대 가능. 뷰포트에 맞춰 확대해도 품질 손실 없음 | 뷰포트에 맞춰 확대 표시 | 정상 표시 | |
| 이미지 로딩 실패 | Lightbox 열림 | 깨진 이미지를 풀스크린으로 보여줄 이유 없음 | alt 텍스트 표시 또는 Lightbox 안 열림 | 에러 표시 | |
| Lightbox 열린 상태에서 Tab | Lightbox 열림 | dialog 패턴의 fallbackKey trap이 미매핑 키를 차단. RouteModal inert로 외부 DOM 불활성화 | Tab이 Lightbox 내부에 갇힘 | 포커스 트랩 유지 | |
| 중첩 — FileViewerModal 내 MarkdownViewer의 이미지 클릭 | FileViewerModal 열림 | Lightbox는 자체 LightboxProvider 스코프에서 동작. z-index stacking은 후순위 dialog가 위에 오는 것이 브라우저 기본 동작 | Lightbox가 FileViewerModal 위에 표시 | 정상 | |
| chat 블록(prose=false) 내 이미지 | 채팅 화면 | MarkdownViewer 내부에 LightboxProvider가 있으므로 모든 MarkdownViewer에서 동작. 채팅에서도 이미지 확대는 유용 | Lightbox 동작 | 정상 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 화면을 가리면 modal 취급, popup 축 사용 필수 (feedback_overlay_is_modal) | ② Lightbox | ✅ 준수 | dialog 패턴 사용 | |
| 2 | 모든 OS 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | ③ open/close 상태 | ✅ 준수 | POPUP_ID 메타엔티티로 관리, useState 아님 | |
| 3 | ui/ 완성품만 노출, primitives 직접 사용 금지 (feedback_ui_over_primitives) | ② Lightbox.tsx | ✅ 준수 | ui/에 완성품으로 제공 | |
| 4 | Composite = ui/ 조합 (feedback_composite_is_ui_combination) | ② 산출물 | ✅ 준수 | Lightbox 자체가 단일 ui/ 컴포넌트 | |
| 5 | @layer component 래핑 필수, unlayered 금지 (feedback_css_layer_lock) | ② CSS | ✅ 준수 | Lightbox.css를 @layer component로 래핑 | |
| 6 | surface 소유 속성에 module.css last-mile 금지 (feedback_surface_no_lastmile) | ② CSS | ✅ 준수 | surface: 'overlay'로 bg/shadow 처리 | |
| 7 | style={} 금지, ax() only (feedback_style_is_hatch) | ② 렌더링 | ✅ 준수 | ax()로 레이아웃/surface 처리 | |
| 8 | 키바인딩 → KeyMap 선언, addEventListener 금지 (CLAUDE.md) | ③ ESC | ✅ 준수 | dialog 패턴 keyMap이 ESC 소유 | |
| 9 | 이벤트 버블링 가드 필수 (feedback_nested_event_bubbling) | ③ backdrop 클릭 | ✅ 준수 | e.target === e.currentTarget 가드 | |
| 10 | 아이콘 → ui/indicators/ 사용 (CLAUDE.md) | 해당 없음 | — | 닫기 버튼 없음 (ESC/backdrop만) | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | MarkdownViewer — 11개 파일에서 사용 | LightboxProvider가 내부에 추가되므로 모든 사용처에서 이미지 클릭 시 Lightbox 동작 | 낮음 | 의도된 동작. 모든 MarkdownViewer에서 동작하는 것이 discuss에서 확정됨 | |
| 2 | MermaidBlock — onClick prop 추가 | 기존 MermaidBlock 사용처(MarkdownViewer, MdPage)에 영향 없음. optional prop | 없음 | — | |
| 3 | chat 블록 내 이미지 | prose=false MarkdownViewer에서도 Lightbox 동작 | 낮음 | 채팅에서도 이미지 확대는 유용. 허용 | |
| 4 | FileViewerModal 내 MarkdownViewer | 중첩 모달 가능 | 낮음 | 브라우저 dialog stacking 순서가 후순위를 위에 표시. 허용 | |
| 5 | MarkdownViewer memo + useMemo deps | LightboxProvider 추가로 렌더 트리 변경 | 낮음 | Provider는 상태 변경 시만 리렌더. 기본 상태(닫힘)에서 추가 비용 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | `useState`로 Lightbox open/close 관리 | ⑤-2 | OS 상태는 NormalizedData+Command. useState는 engine 우회 | |
| 2 | `addEventListener('keydown')` 으로 ESC 처리 | ⑤-8 | KeyMap 선언만 허용. 직접 이벤트 바인딩은 OS 우회 | |
| 3 | `style={{}}` 인라인 스타일 | ⑤-7 | ax()만 사용. last-mile만 module.css | |
| 4 | Lightbox 컴포넌트를 pages/에 구현 | ⑤-3 | ui/에 완성품으로 먼저 만들고 사용 | |
| 5 | `<a>` 안의 이미지에 Lightbox 트리거 부착 | ①-S5 | 링크 네비게이션이 우선 | |
| 6 | 이미지를 뷰포트보다 크게 확대 | ④ 큰 이미지 경계 | object-fit: contain으로 비율 유지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | 문서 내 이미지 클릭 | Lightbox 열림, 이미지가 뷰포트 중앙에 비율 유지하며 표시 | |
| V2 | S2 동기 | 머메이드 다이어그램 클릭 | Lightbox 열림, SVG가 뷰포트에 맞춰 표시 | |
| V3 | S3 동기 | Lightbox 열린 상태에서 ESC | Lightbox 닫힘, 트리거 요소로 포커스 복귀 | |
| V4 | S4 동기 | backdrop 클릭 | Lightbox 닫힘 | |
| V5 | S5 동기 | `<a>` 안의 이미지 클릭 | Lightbox 안 열림, 링크 동작 | |
| V6 | ④ 큰 이미지 | 5000×5000 이미지 클릭 | object-fit: contain으로 뷰포트 안에 표시 | |
| V7 | ④ 작은 이미지 | 50×50 이미지 클릭 | 원본 크기로 중앙 표시 (확대 안 함) | |
| V8 | ④ Tab 트랩 | Lightbox 열린 상태에서 Tab 반복 | 포커스가 Lightbox 외부로 나가지 않음 | |
| V9 | ④ 중첩 | FileViewerModal 내 이미지 클릭 | Lightbox가 FileViewerModal 위에 표시 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
