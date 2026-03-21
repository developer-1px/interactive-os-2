# CMS Tab Container — PRD

> Discussion: CMS 렌더링 프리미티브(텍스트/속성/조건부/배열) 중 조건부 렌더링+배열+중첩을 탭 컨테이너로 동시 검증. 탭 라벨=배열, 패널 전환=조건부 렌더링, 패널 내용=nested section.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS 관리자가 다양한 홈페이지를 만들고 싶다 | 탭으로 콘텐츠를 구분해야 하는 페이지를 만들 때 | 탭 컨테이너를 추가하고, 각 탭 패널에 section 기반 콘텐츠를 자유롭게 배치할 수 있다 | |
| M2 | CMS에 조건부 렌더링 프리미티브가 없다 | 선택 상태에 따라 특정 콘텐츠만 보여줘야 할 때 | 탭 선택으로 해당 패널만 표시하는 가시성 전환이 동작한다 | |
| M3 | 현재 section은 모든 자식을 동시에 렌더링한다 | 배열+조건부+중첩 조합이 필요할 때 | 탭 목록(배열) × 패널 전환(조건부) × 패널 내 section(중첩) 조합이 동작한다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `tab-group` 노드 타입 | 탭 컨테이너. 자식으로 `tab-item`만 허용. root의 직접 자식으로 배치 (section과 동급) | |
| `tab-item` 노드 타입 | 탭 라벨 + 패널 쌍. `label: LocaleMap` 필드. 자식으로 `tab-panel` 1개만 허용 | |
| `tab-panel` 노드 타입 | 패널 컨테이너. 자식으로 `section`만 허용. 선택된 tab-item의 패널만 표시 | |
| `cms-schema.ts` 변경 | nodeSchemas에 3개 타입 추가. childRules에 tab-group→tab-item, tab-item→tab-panel, tab-panel→section 추가. root(section 자리)에 tab-group 허용 | |
| `cms-renderers.tsx` 변경 | tab-group/tab-item/tab-panel의 className, tag, NodeContent 추가 | |
| `CmsCanvas.tsx` 변경 | tab-group 렌더링 분기: tablist(라벨 나열) + 선택된 패널 렌더링. interactive-os tabs behavior 연동 | |
| `cms-templates.ts` 변경 | `createTabGroup()` 템플릿 팩토리 — 기본 2개 탭 + 빈 section | |

**트리 구조:**
```
root
├── section (기존)
├── tab-group            ← NEW (root 직접 자식)
│   ├── tab-item         ← label: LocaleMap
│   │   └── tab-panel
│   │       ├── section (variant: features)
│   │       └── section (variant: stats)
│   ├── tab-item
│   │   └── tab-panel
│   │       └── section (variant: hero)
│   └── ...
└── section (기존)
```

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑ | tab-group에 포커스 | 이전 root 형제로 이동 | tab-group은 root 자식 — spatial nav 세로 이동 | 이전 section/tab-group 포커스 | |
| ↓ | tab-group에 포커스 | 다음 root 형제로 이동 | tab-group은 root 자식 — spatial nav 세로 이동 | 다음 section/tab-group 포커스 | |
| Enter | tab-group에 포커스 | tablist(탭 라벨 목록)로 깊이 진입 | spatial depth nav — Enter=enterChild | 첫 번째 tab-item 포커스, 해당 패널 표시 | |
| ← | tab-item에 포커스 (tablist 안) | 이전 탭으로 이동 + 패널 전환 | tabs behavior — navigate(horizontal) + followFocus로 선택 연동 | 이전 tab-item 포커스 + 해당 패널 표시 | |
| → | tab-item에 포커스 (tablist 안) | 다음 탭으로 이동 + 패널 전환 | tabs behavior — navigate(horizontal) + followFocus로 선택 연동 | 다음 tab-item 포커스 + 해당 패널 표시 | |
| Home | tab-item에 포커스 | 첫 번째 탭으로 이동 | tabs behavior — navigate에 Home 포함 | 첫 tab-item 포커스 + 패널 전환 | |
| End | tab-item에 포커스 | 마지막 탭으로 이동 | tabs behavior — navigate에 End 포함 | 마지막 tab-item 포커스 + 패널 전환 | |
| Enter | tab-item에 포커스 | 선택된 탭의 패널로 깊이 진입 | spatial depth nav — 패널 내 section이 자식 | tab-panel 내 첫 section 포커스 | |
| Escape | tab-panel 내 section에 포커스 | 탭 목록으로 복귀 | spatial depth nav — exitToParent | 해당 tab-item 포커스 | |
| Escape | tab-item에 포커스 | tab-group으로 복귀 | spatial depth nav — exitToParent | tab-group 포커스 | |
| ↑↓ | tab-panel 내 section에 포커스 | section 간 세로 이동 | 패널 안은 기존 CMS spatial nav 그대로 | 다른 section 포커스 | |
| Delete | tab-item에 포커스 | 탭+패널 삭제 | 기존 CRUD — tab-item 삭제 시 tab-panel 자식 트리도 함께 삭제 | 인접 탭 포커스, 최소 1개 탭 가드 | |
| Mod+D | tab-item에 포커스 | 탭+패널 복제 | 기존 CRUD duplicate — 서브트리 복사 | 복제된 tab-item 추가 | |
| Mod+↑ | tab-item에 포커스 | 탭 순서 앞으로 | 기존 DnD moveUp | 탭 순서 변경 | |
| Mod+↓ | tab-item에 포커스 | 탭 순서 뒤로 | 기존 DnD moveDown | 탭 순서 변경 | |
| F2 | tab-item에 포커스 | 탭 라벨 인라인 편집 | 기존 rename plugin | 인라인 편집 모드 | |
| 클릭 | tab-item 라벨 | 해당 탭 선택 + 패널 전환 | tabs behavior — activate(onClick) | 클릭한 탭 선택, 패널 표시 | |
| 클릭 | 패널 내 노드 | 해당 노드 depth로 점프 + 포커스 | 기존 handleNodeClick 동작 | 노드 포커스 | |

**이벤트 버블링 주의:**
- tab-group 내부 tablist와 spatial nav의 Arrow 키가 충돌할 수 있음
- tablist 깊이에서는 tabs behavior의 ←→가 우선, spatial nav의 ↑↓는 N/A
- tab-panel 깊이에서는 기존 spatial nav 그대로 — tablist 키맵 비활성

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 탭 1개만 남았을 때 Delete | tab-group에 tab-item 1개 | 빈 tab-group은 의미 없음, 최소 1개 보장 | Delete 무시 (기존 section 최소 1개 가드와 동일 패턴) | 변화 없음 | |
| 빈 tab-panel (section 0개) | tab-item 선택됨, 패널에 자식 없음 | 새 탭 생성 직후 자연스러운 상태 | 빈 패널 영역 표시, section 추가 가능 | 빈 패널 렌더링 | |
| tab-group에 tab-item 추가 | tab-group 존재 | 탭 추가 시 빈 패널도 함께 생성되어야 함 | tab-item + tab-panel 쌍으로 생성 (template) | 새 탭+패널 추가 | |
| tab-group 자체 삭제 | root에서 tab-group 포커스 후 Delete | tab-group은 root 자식 — section과 동일 삭제 규칙 | root 자식 최소 1개 가드 적용 후 삭제 | tab-group 통째 삭제 | |
| 중첩 tab-group (탭 안에 탭) | tab-panel의 자식이 section만 | section만 허용이므로 원천 차단 | canAccept가 tab-group을 거부 | 붙여넣기/추가 불가 | |
| tab-item 순서 변경 후 선택 상태 | 2번째 탭 선택 상태에서 Mod+↑ | 선택은 ID 기반, 순서와 무관 | 순서만 변경, 선택 유지 | 동일 탭 선택 유지 | |
| 프레젠트 모드에서 탭 | 읽기 전용 뷰 | CRUD 불필요, 탭 전환만 동작 | 클릭/키보드로 탭 전환만, 편집 불가 | 프레젠트 탭 전환 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | CMS에서 디자인 변경 불가 (feedback_no_design_in_cms) | ③ 전체 | ✅ 준수 | — | |
| P2 | Visual CMS는 보편적 도구 — DOM 위치 기반 보편 규칙 (feedback_visual_cms_universal_tool) | ② 트리 구조 | ✅ 준수 — tab-group/tab-item/tab-panel은 보편 컨테이너, 특정 디자인 종속 없음 | — | |
| P3 | CMS는 interactive-os의 이용자 — OS에 없는 기능은 OS에 먼저 (feedback_visual_cms_universal_tool) | ③ tabs behavior | ✅ 준수 — tabs behavior 이미 존재 | — | |
| P4 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ② 스키마 | ✅ 준수 — 기존 CMS store에 통합 | — | |
| P5 | Plain text만, rich text 기각 (feedback_no_richtext) | ③ F2 인라인 편집 | ✅ 준수 — tab-item label은 plain text (rename plugin) | — | |
| P6 | 중첩 렌더링에서 이벤트 버블링 가드 필수 (feedback_nested_event_bubbling) | ③ 이벤트 버블링 | ⚠️ 주의 필요 — tablist ↔ spatial nav 키맵 충돌 가능 | ③에 명시: tablist 깊이에서는 tabs behavior 우선, defaultPrevented로 격리 | |
| P7 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ④ 탭 삭제 | ✅ 준수 — 기존 CRUD remove + focusRecovery 동작 | — | |
| P8 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ③ keyMap | ✅ 준수 — tabs behavior가 keyMap 포함 | — | |
| P9 | 설계 원칙 > 사용자 요구 충족 (feedback_design_over_request) | 전체 | ✅ 준수 — engine 우회 없음 | — | |
| P10 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② 산출물 | ✅ 준수 — 기존 파일 수정, 새 파일 없음 | — | |
| P11 | defaultPrevented가 target 가드보다 범용적 (feedback_nested_bubbling_guard) | ③ 이벤트 버블링 | ✅ — defaultPrevented 메커니즘 사용 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `cms-schema.ts` — nodeSchemas, childRules | root의 canAccept에 tab-group 추가 필요. 기존 section-only 로직이 있으면 깨짐 | 중 | cmsCanAccept의 root 분기(line 65)가 `nodeSchemas.section.safeParse`만 체크 → tab-group도 허용하도록 수정 | |
| S2 | `CmsCanvas.tsx` — renderNode | tab-group 분기 추가. 기존 section/card/leaf 분기에 영향 없음 (additive) | 낮 | 허용 | |
| S3 | `CmsCanvas.tsx` — cmsKeyMap Delete 가드 | root 자식 최소 1개 가드가 section만 가정할 수 있음 | 낮 | 가드는 rootChildren.length 기반 — 타입 무관하므로 영향 없음 | |
| S4 | `cms-renderers.tsx` — getNodeTag, getNodeClassName | 새 타입에 대한 매핑 누락 시 fallback(div) | 낮 | 3개 타입의 tag/class 매핑 추가 | |
| S5 | `cms-templates.ts` — TEMPLATE_VARIANTS | 새 template variant 추가 시 사이드바 UI에 표시 | 낮 | tab-group을 TEMPLATE_VARIANTS에 추가 | |
| S6 | `collectEditableGroups` — 2레벨 깊이 가정 | tab-group→tab-item→tab-panel→section→children = 4레벨. Detail Panel이 3레벨 이상을 못 보여줄 수 있음 | 중 | tab-item 포커스 시: tab-item의 label 필드만 표시. section 포커스 시: 기존 로직 그대로 (section 기준 그루핑). tab-group/tab-panel 포커스 시: 자식으로 drill-down 유도 | |
| S7 | spatial nav depth model | tab-group 내부에 tablist 키맵이 spatial과 공존 | 중 | ③에서 정의한 깊이별 키맵 분리로 해결. tab-item 깊이에서는 별도 keyMap 사용 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | tab-panel에 section 외의 자식 허용 | ② 설계 결정 | section이 범용 컨테이너 역할. 다른 타입 허용 시 childRules 폭발 | |
| N2 | 탭 선택 상태를 CMS 데이터(entity.data)에 저장 | 제약 (로컬 상태 원칙) | 선택은 뷰 상태, 콘텐츠 아님. store의 behavior state로 관리 | |
| N3 | tab-group 안에 tab-group 중첩 | ④ 경계 | tab-panel→section만 허용으로 원천 차단. 복잡도 폭발 방지 | |
| N4 | tablist에서 ↑↓ 키로 spatial nav 동작 | ⑥ S7 | tablist 깊이에서 ↑↓는 의미 없음 (가로 배치). tabs behavior의 ←→만 동작 | |
| N5 | tab-item 없이 tab-panel 단독 존재 | ② 구조 | tab-item:tab-panel = 1:1 필수. 탭 추가 시 template으로 쌍 생성 | |
| N6 | 프레젠트 모드에서 탭 CRUD | ④ 경계 | 프레젠트는 읽기 전용. 탭 전환(클릭/키보드)만 허용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | tab-group 추가 후 탭 라벨 편집 (F2) | 인라인 편집 모드 진입, 확인 시 label 업데이트 | |
| V2 | ①M2 | 3개 탭 중 2번째 탭 클릭 | 2번째 패널만 표시, 나머지 숨김 | |
| V3 | ①M2 | tablist에서 Arrow Right로 탭 전환 | 다음 탭 선택 + 패널 즉시 전환 (followFocus) | |
| V4 | ①M3 | 탭 패널 안에 section 추가 → section 안에 card 추가 | 3레벨 중첩 동작: tab-panel > section > card | |
| V5 | ④경계1 | 탭 1개만 남은 상태에서 Delete | 삭제 거부, 변화 없음 | |
| V6 | ④경계2 | 새 탭 추가 직후 패널 진입 | 빈 패널 표시, section 추가 가능 | |
| V7 | ④경계3 | 탭 추가 시 | tab-item + tab-panel 쌍으로 생성 | |
| V8 | ④경계4 | tab-group 자체를 Delete | root 자식 최소 1개 가드 후 삭제 | |
| V9 | ④경계5 | tab-panel에 tab-group 붙여넣기 시도 | canAccept 거부 | |
| V10 | ④경계6 | 2번째 탭 선택 상태에서 Mod+↑ | 탭 순서 변경, 선택 유지 | |
| V11 | ③ | tab-group → Enter → tablist → Enter → panel → section | 3단계 깊이 진입 동작 | |
| V12 | ③ | panel 내 section에서 Escape → Escape | section→tablist→tab-group 복귀 | |
| V13 | ⑥S1 | root에 tab-group 추가 (CRUD/템플릿) | canAccept 통과, 정상 삽입 | |
| V14 | ⑥S6 | tab-item 포커스 시 Detail Panel | label 필드만 표시 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
