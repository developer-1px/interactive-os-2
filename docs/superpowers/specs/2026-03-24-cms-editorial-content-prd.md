# CMS Editorial Content & Section Redesign — PRD

> Discussion: CMS 랜딩의 근본 문제는 디자인이 아니라 콘텐츠와 섹션 종류. 6개 SaaS variant(hero→stats→features→workflow→patterns→footer)를 Why→What→Proof→Action 서사 구조의 9개 editorial 섹션으로 전면 재설계. 이미지 대신 lucide 아이콘 적극 활용.
> Design Spec: `docs/superpowers/specs/2026-03-24-cms-editorial-landing-design.md`
> Reference: Aetherfield (sustainability SaaS — editorial storytelling 구조)

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | editorial 디자인 스펙(serif, 비대칭, ultra-spacious)이 완성됨 | 섹션 variant가 hero/stats/features/workflow/patterns/footer — 전형적 SaaS 보일러플레이트 | 서체를 바꿔도 "AI가 만든 랜딩" 느낌이 빠지지 않음. 옷만 갈아입힌 SaaS | |
| M2 | 콘텐츠가 "14 APG Patterns", "365+ Tests", "0 Runtime Deps" 등 기능 스펙 나열 | 사용자가 랜딩을 스크롤 | 무엇을 하는지는 보이지만 왜 써야 하는지, 누가 어떻게 쓰는지 전달 안 됨 | |
| M3 | 섹션 종류가 manifesto, case study, journal, testimonial 같은 서사적 포맷을 지원하지 않음 | editorial 톤의 콘텐츠를 넣으려 해도 | 담을 그릇이 없어서 결국 기능 나열에 갇힘 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

**SectionVariant 변경:**

| 현재 | 변경 | 서사 역할 |
|------|------|----------|
| `hero` | `hero` (콘텐츠 교체) | Why — 문제 제기 |
| `stats` | 삭제 | — |
| `features` | `features` (콘텐츠 교체) | What — 핵심 역량 |
| `workflow` | 삭제 | — |
| `patterns` | `patterns` (콘텐츠 교체) | What — APG 커버리지 |
| — | `manifesto` 신규 | Why — 철학/가치 |
| — | `showcase` 신규 | Proof — 자체 증명 |
| — | `journal` 신규 | Depth — 문서/가이드 |
| — | `testimonial` 신규 | Voice — 철학 인용 |
| — | `cta` 신규 | Action — 최종 전환 |
| `footer` | `footer` (브랜드 강화) | 마무리 |

**섹션 순서 (ROOT relationships):**
`hero → manifesto → features → patterns → showcase → journal → testimonial → cta → footer`

**신규 노드 타입:**

| 노드 타입 | 용도 | 필드 |
|----------|------|------|
| `value-item` | manifesto 가치 카드 | icon: string, title: LocaleMap, desc: LocaleMap |
| `quote` | testimonial 인용문 | text: LocaleMap, attribution: LocaleMap |
| `article` | journal 아티클 링크 | icon: string, title: LocaleMap, category: LocaleMap, readTime: string |
| `showcase-item` | showcase 기능 항목 | icon: string, label: LocaleMap, desc: LocaleMap |

**재사용 노드 타입:** `section`, `section-label`, `section-title`, `section-desc`, `text`, `cta`, `badge`, `pattern`, `brand`, `links`, `link`

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `cms-templates.ts` 전면 교체 | SectionVariant 9개. createHero~createFooter 재작성. createStats/createWorkflow 삭제, createManifesto/createShowcase/createJournal/createTestimonial/createCta 신규 | |
| `cms-store.ts` 전면 교체 | 초기 store 데이터를 9개 섹션 콘텐츠로 교체 | |
| `cms-schema.ts` 확장 | nodeSchemas에 value-item, quote, article, showcase-item 추가. childRules 갱신 | |
| `cms-renderers.tsx` 확장 | NodeContent에 신규 타입 렌더러, getNodeClassName/getNodeTag 확장, getSectionClassName 갱신 | |
| `CmsLanding.module.css` 확장 | manifesto/showcase/journal/testimonial/cta 섹션 스타일 추가. stats/workflow 스타일 삭제 | |
| `cms-types.ts` | SectionVariant 타입 갱신 | |
| `cmsIcons.ts` | 필요한 아이콘 추가 (Quote, BookOpen, Newspaper, Eye, Undo2, Scissors, Languages, Compass 등) | |

**섹션별 콘텐츠 (실제 문구):**

### hero

```
badge: "Open Source"
title: "Accessibility shouldn't be the thing you add last."
subtitle: "키보드 인터랙션, ARIA 역할, 포커스 관리 — 이 모든 것이 설계의 첫 번째 결정이 되는 엔진."
cta: "Get Started" / "View on GitHub"
```

하단에 16개 APG 패턴 아이콘 strip (기존 pattern 데이터 재활용, hero 내부에 배치)

### manifesto

```
section-title: "Built for keyboards. Designed for everyone."

value-item 1:
  icon: keyboard
  title: "Keyboard-first, not keyboard-also"
  desc: "모든 인터랙션이 키보드에서 시작한다. 마우스는 편의, 키보드는 기본값."

value-item 2:
  icon: shield
  title: "Accessible by default"
  desc: "ARIA 역할과 상태가 자동으로 바인딩된다. 접근성은 추가 작업이 아니라 기본 동작."

value-item 3:
  icon: layers
  title: "Headless, not styleless"
  desc: "렌더링은 당신의 것. 상태와 인터랙션은 엔진의 것. 어떤 컴포넌트 라이브러리 위에서든 동작한다."
```

### features

```
section-label: "Core"
section-title: "Everything you need to build accessible interfaces"
section-desc: "네 개의 독립 레이어. 각각 테스트 가능. 조합하면 어떤 UI 패턴이든."

card 1: icon=database, "Normalized Store", "엔티티와 관계를 정규화 트리로 관리. O(1) 조회, 불변 업데이트, 부모-자식 순회."
card 2: icon=cog, "Command Engine", "모든 변경은 커맨드. 미들웨어 파이프라인으로 유효성 검증, 로깅, undo/redo."
card 3: icon=shield, "16 ARIA Behaviors", "Treegrid, listbox, tabs, combobox — 프리셋 하나로 역할, 상태, 키 바인딩 완성."
card 4: icon=keyboard, "Keyboard Interaction", "로빙 탭인덱스, 방향키 탐색, 공간 내비게이션, 플랫폼 인식 단축키."
```

### patterns

```
section-label: "Coverage"
section-title: "16 APG patterns. Zero guesswork."
section-desc: "W3C ARIA Authoring Practices Guide의 모든 복합 위젯. 키보드 인터랙션 테이블 완비."

16개 pattern: treegrid, listbox, tabs, combobox, grid, menu, dialog, accordion, treeview, toolbar, disclosure, switch, radiogroup, alertdialog, slider, spinbutton
```

### showcase

```
section-label: "Proof"
section-title: "Built with interactive-os"
section-desc: "이 페이지가 증거다. 지금 보고 있는 랜딩 페이지는 interactive-os 위에서 동작하는 Visual CMS로 편집되고 있다."

showcase-item 1: icon=database, "Store", "42개 엔티티, 정규화 트리"
showcase-item 2: icon=compass, "Navigation", "방향키로 모든 섹션 탐색"
showcase-item 3: icon=click, "Selection", "Shift+Click 다중 선택"
showcase-item 4: icon=scissors, "Clipboard", "Cut/Copy/Paste + canAccept"
showcase-item 5: icon=undo2(?), "History", "Undo/Redo 전체 이력"
showcase-item 6: icon=globe, "i18n", "3개 언어 동시 편집"
```

### journal

```
section-title: "From the docs"

article 1: icon=file, "Getting Started", category="Guides", readTime="5 min"
article 2: icon=layers, "Core Concepts", category="Architecture", readTime="10 min"
article 3: icon=keyboard, "Keyboard Interaction Tables", category="Reference", readTime="—"

cta: "모든 문서 보기 →"
```

### testimonial

```
quote:
  text: "The cost of accessibility has been hiding its value. When the cost is zero, every interface is accessible."
  attribution: "interactive-os"
```

### cta

```
section-title: "Start building accessible interfaces."
cta: "Get Started" / "View on GitHub"
```

### footer

```
brand: "interactive-os", license="MIT"
links: Documentation, GitHub, npm
```
footer 하단에 거대 브랜드 타이포 (CSS 처리, 별도 노드 불필요)

완성도: 🟡 (사용자 확인 전)

## ③ 인터페이스

> 이 PRD는 콘텐츠/데이터 구조 변경. 키보드 인터랙션 모델은 기존 CMS spatial nav 그대로 유지. 인터페이스 = "섹션별 렌더링 입출력"

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 앱 로드 | cms-store.ts의 초기 데이터 | 9개 섹션이 순서대로 렌더링 | store relationships[ROOT_ID]가 순서 결정 | hero→manifesto→features→patterns→showcase→journal→testimonial→cta→footer 순서로 캔버스 표시 | |
| CMS 캔버스에서 노드 포커스 | 임의 노드 선택 상태 | value-item/quote/article/showcase-item에 포커스 가능 | 신규 노드 타입도 기존 spatial nav이 순회하는 엔티티 | 포커스 outline 표시, detail panel에 편집 필드 표시 | |
| Detail Panel에서 value-item 편집 | value-item 노드 선택 | icon/title/desc 3개 필드가 그룹으로 표시 | getEditableFields가 schema의 .describe() 있는 필드 추출 | icon picker + short-text + long-text 편집 가능 | |
| TemplatePicker에서 섹션 추가 | 사용자가 + 버튼 클릭 | manifesto/showcase/journal/testimonial/cta가 선택지에 표시 | TEMPLATE_VARIANTS에 신규 variant 추가 | 선택한 variant의 template이 store에 삽입 | |
| 프레젠트 모드 진입 | CMS 편집 상태 | 9개 섹션이 editorial 스타일로 풀스크린 렌더링 | CmsLanding.module.css의 variant별 스타일 적용 | editorial 톤의 완성된 랜딩 페이지 표시 | |

**키보드 인터랙션:** 변경 없음. 기존 CMS spatial behavior(treegrid preset) 그대로. 신규 노드 타입은 기존 엔티티와 동일하게 순회됨.

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| quote 노드의 text가 300자 이상 | testimonial 섹션 렌더링 | editorial은 긴 인용문도 허용해야 — 매거진의 풀페이지 인용 | 줄바꿈 허용(long-text), 폰트 크기 자동 조절은 안 함 (CSS clamp 고려) | 긴 인용문이 여러 줄로 표시 | |
| 사용자가 section 순서를 DnD로 변경 | 기본 9개 순서 | CMS는 편집 도구 — 순서 변경은 사용자 자유 | 스토리 흐름이 깨져도 허용 | 변경된 순서로 렌더링 | |
| manifesto에 value-item을 4개 이상 추가 | 기본 3개 | section은 collection이므로 자식 추가 허용 | 그리드가 4+개를 수용할 수 있는 CSS | 4열 이상은 wrap | |
| journal에 article을 0개로 삭제 | 기본 3개 | 빈 섹션 허용 (CMS 편집 중 일시적 빈 상태) | 빈 섹션 표시 (header만 남음) | |
| tab-group 내에서 신규 variant 사용 | tab-panel → section | tab-panel의 자식은 section이고, section은 variant 속성 | 모든 variant가 tab 내에서도 동작 | 신규 variant의 스타일이 tab 내에서도 적용 | |
| 기존 저장 데이터(stats/workflow variant) 로드 | 전면 교체 후 | cms-store.ts가 초기 데이터를 완전 교체. 영속 저장 없음 (메모리 only) | 항상 새 초기 데이터로 시작 | 호환성 문제 없음 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 디자인 변경 불가 — 관리자는 콘텐츠만 (feedback: no_design_in_cms) | ② 전체 | ✅ 준수 | — | |
| P2 | Rich text 기각 — plain text + 줄바꿈만 (feedback: no_richtext) | ② quote 노드 | ✅ 준수 — quote.text는 plain text (long-text fieldType) | — | |
| P3 | 스키마 = 단일 소스 (cms area) | ② nodeSchemas 확장 | ✅ 준수 — 신규 타입도 nodeSchemas에만 추가 | — | |
| P4 | 파일명 = 주 export 식별자 (feedback) | ② 파일 변경 | ✅ 준수 — 기존 파일 수정, 새 파일 생성 없음 | — | |
| P5 | ARIA 표준 용어 우선 (feedback: naming_convention) | ② 노드 타입명 | ✅ 준수 — value-item, quote, article, showcase-item은 콘텐츠 도메인 용어 (ARIA 무관) | — | |
| P6 | 정규화 트리 순회로 UI 패턴 해결 (feedback: normalization_solves_ui) | ③ 렌더링 | ✅ 준수 — 모든 신규 섹션도 store 순회로 렌더링 | — | |
| P7 | long-text = 줄바꿈 허용 (feedback: longtext_means_linebreak) | ② quote.text, section-desc | ✅ 준수 | — | |
| P8 | CMS에서 디자인 변경 불가 = 핵심 가치 (feedback: no_design_in_cms) | ② 전체 | ✅ 준수 — variant는 코드에서 정의, CMS 사용자는 콘텐츠만 편집 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `cms-store.ts` 초기 데이터 전면 교체 | 기존 엔티티 ID가 사라짐. 하드코딩 ID 참조가 있으면 깨짐 | 낮 | 영속 저장 없으므로 무관. ID 하드코딩 없음 확인 필요 | |
| S2 | `SectionVariant` 타입 변경 | stats/workflow를 참조하는 코드 컴파일 에러 | 중 | getSectionClassName, getChildrenContainerClassName, TemplatePicker에서 stats/workflow 분기 삭제 | |
| S3 | `TEMPLATE_VARIANTS` 배열 변경 | TemplatePicker UI 자동 반영 (데이터 드리븐) | 낮 | 자동 반영됨, 아이콘만 적절히 매핑 | |
| S4 | `childRules` 확장 | 신규 노드 타입의 paste/delete 동작 | 중 | value-item/article/showcase-item → section의 collection 자식. quote → section의 collection 자식. childRules에 추가 | |
| S5 | `CmsLanding.module.css` 스타일 추가 | CSS 파일 크기 증가 | 낮 | stats/workflow 스타일 삭제로 상쇄 | |
| S6 | `collectEditableGroups` | 신규 컨테이너 타입(value-item, showcase-item)의 detail panel 그룹핑 | 중 | 기존 로직이 schema .describe()로 자동 파생하므로 추가 코드 불필요. 테스트로 확인 | |
| S7 | tab-group 내 section variant | tab 내에서 manifesto/showcase 등 신규 variant 사용 시 스타일 적용 | 낮 | 기존 tab CSS 구조가 section variant에 무관하게 동작 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | 신규 노드 타입을 nodeSchemas 밖에서 정의 | P3 (스키마 단일 소스) | canAccept/fieldsOf 파생이 깨짐 | |
| F2 | quote에 rich text 마크업 허용 | P2 (rich text 기각) | plain text + 줄바꿈만 | |
| F3 | variant를 CMS UI에서 사용자가 변경 가능하게 | P1/P8 (디자인 변경 불가) | variant = 디자인 결정, 콘텐츠 아님 | |
| F4 | stats/workflow의 렌더러/스타일을 잔류 | S2 (타입 변경) | dead code 방지 | |
| F5 | 신규 노드 타입의 childRules 누락 | S4 (paste 동작) | clipboard paste가 예측 불가하게 동작 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 (SaaS 탈피) | 프레젠트 모드에서 9개 섹션이 editorial 스타일로 렌더링 | hero→manifesto→...→footer 순서. 각 섹션 고유 레이아웃. SaaS 반복 패턴 없음 | |
| V2 | M2 (Why 전달) | hero의 title이 문제 제기("shouldn't be the thing you add last"), manifesto가 철학 전달 | 기능 나열이 아닌 서사 흐름 | |
| V3 | M3 (서사 섹션 지원) | TemplatePicker에서 manifesto/showcase/journal/testimonial/cta 선택 가능 | 5개 신규 variant가 목록에 표시되고, 삽입 시 올바른 자식 노드 생성 | |
| V4 | ④ value-item 4개+ | manifesto에 value-item 4개 추가 | 그리드가 wrap하여 표시. 레이아웃 깨지지 않음 | |
| V5 | ④ quote 300자+ | testimonial의 quote.text에 긴 텍스트 입력 | 여러 줄로 표시. overflow 없음 | |
| V6 | ④ journal 0개 article | journal에서 article 전부 삭제 | header만 남은 빈 섹션 표시. 에러 없음 | |
| V7 | S4 (childRules) | showcase-item을 복사 → manifesto 섹션에 paste | canAccept가 false 반환 (타입 불일치). 같은 showcase 섹션에는 insert 허용 | |
| V8 | S6 (detail panel) | value-item 노드 선택 | Detail Panel에 Icon/Title/Description 3개 필드 그룹 표시 | |
| V9 | M1+M2 전체 | 초기 로드 시 아이콘이 모든 섹션에서 적절히 표시 | hero 패턴 strip, manifesto 가치 아이콘, features 카드 아이콘, showcase 항목 아이콘, journal 아티클 아이콘 — 이미지 없이 시각적 풍부함 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (사용자 확인 대기)

**교차 검증:**
1. 동기 ↔ 검증: M1→V1,V9 / M2→V2 / M3→V3 ✅ 전체 커버
2. 인터페이스 ↔ 산출물: 9개 variant → 렌더러/스타일 1:1 ✅
3. 경계 ↔ 검증: 4개+ value-item→V4 / 300자+ quote→V5 / 0 article→V6 ✅
4. 금지 ↔ 출처: F1←P3 / F2←P2 / F3←P1,P8 / F4←S2 / F5←S4 ✅ 전체 추적 가능
5. 원칙 대조 ↔ 전체: 위반 0건 ✅
