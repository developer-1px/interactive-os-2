# UI SDK 카탈로그 장기 플랜 — 2026-03-23

## 배경

interactive-os v1이 과도한 추상화로 실패한 교훈을 바탕으로, v2에서는 "실제 용도에서 추출한 완성품"을 하나씩 만들어가는 전략. NavList(첫 번째 완성품) + FileIcon/CodeBlock/Breadcrumb(뷰어 부품 분리)를 완료한 시점에서, 전체 카탈로그를 정리하고 장기 플랜으로 관리한다.

## 내용

### 원칙
1. 같은 behavior라도 용도가 다르면 별개 완성품
2. 분류 기준 = 실제 앱의 표준 UI 어휘 (ARIA spec도 아니고 프로젝트 전용도 아님)
3. hook-first: 용도별 hook + 편의 컴포넌트
4. 쇼케이스 → 완성품 승격은 제품에서 실제로 쓸 때 진행
5. v1 교훈: 범용 추상화 금지, 적절한 컴포넌트를 발견하려는 노력 필수

### 위계 (3층)

```
Composition (조립)    — Element + Pattern을 조립한 더 큰 완성품
Pattern (인터랙션)    — os behavior 기반. 키보드/포커스/ARIA
Element (시각)        — behavior 없음. 데이터 → 표시
```

| 레이어 | 정의 | 특징 |
|--------|------|------|
| **Element** | 인터랙션 없음. 데이터 → 표시 | props in → JSX out |
| **Pattern** | os behavior 기반 (또는 향후 지원할 축) | hook-first (useX + `<X>`) |
| **Composition** | Element + Pattern 조립 | 여러 하위 완성품 조합 |

SplitPane/Popover는 위계상 Pattern이지만 os 미지원 축(drag/resize, anchor/position)으로 현재 자체 구현. 향후 behavior 전환 대상.

상세: docs/0-inbox/28-[vision]ui-component-hierarchy.md

### Element (8개)

- [x] FileIcon (2026-03-23)
- [x] CodeBlock (2026-03-23)
- [x] Breadcrumb (2026-03-23)
- [ ] MarkdownViewer — viewer/에서 분리 필요
- [ ] Avatar
- [ ] Badge
- [ ] Progress
- [ ] Skeleton

### Pattern — 🟡 쇼케이스 → 완성품 승격 (17개)

제품에서 실제로 쓸 때 hook-first로 전환. NavList 패턴 반복.

- [x] TreeView — Viewer 사이드바, AreaSidebar에서 사용 중 (2026-03-23)
- [ ] Tabs — CMS tab-group, 에디터 탭
- [ ] DataGrid (Grid) — CMS I18n Sheet에서 사용 중
- [ ] Toolbar — CMS FloatingToolbar, ActivityBar
- [ ] ListBox — 셀렉션 용도 (NavList와 별개)
- [ ] Combobox — QuickOpen 내부, 태그 선택
- [ ] MenuList — 드롭다운 메뉴
- [ ] Dialog — 모달
- [ ] AlertDialog — 확인 모달
- [ ] Toaster — 알림
- [ ] Accordion — FAQ, 설정 패널
- [ ] DisclosureGroup — 독립 접기/펼치기
- [ ] RadioGroup — 단일 선택
- [ ] Checkbox — 다중 선택
- [ ] Switch — 온/오프 토글
- [ ] Slider — 값 조절
- [ ] Spinbutton — 숫자 입력
- [ ] Toggle / ToggleGroup — 모드 전환
- [ ] Kanban — 보드 뷰

### Pattern — 🔴 새로 만들어야 할 것

- [ ] **SplitPane** — 3개 제품 전부. drag/resize 축 (os 갭)
- [ ] **Popover** — 툴팁 확장, 인포 패널. anchor/position 축 (os 갭)

### Composition (5개)

- [x] FileViewerModal — Dialog + CodeBlock + Breadcrumb + FileIcon + MarkdownViewer (2026-03-23)
- [ ] **CommandPalette** — Combobox + 검색 엔진 + 결과 리스트
- [ ] **ContextMenu** — MenuList + Popover + 트리거
- [ ] **Timeline** — VirtualList + MarkdownViewer + 이벤트 그루핑
- [ ] Kanban — ListBox(열) + ListBox(카드) + DnD (🟡 쇼케이스)

### ✅ 완성품 (완료)

**Element:** FileIcon, CodeBlock, Breadcrumb
**Pattern:** NavList (hook-first 패턴 확립), TreeView
**Composition:** FileViewerModal (Inspector 연동)

## 검증

- 각 완성품 완료 시 이 문서에서 체크 (`- [x]`)
- 쇼케이스 승격 시 hook-first 전환 + 제품 교체로 검증
- 전체 진행률: ✅ 6/32

## 출처

- UI SDK discussion + NavList 구현 세션 (2026-03-23)
- 카탈로그 발견 테이블: docs/0-inbox/27-[vision]ui-catalog.md
