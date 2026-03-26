# Icon Refinement — PRD

> Discussion: 서비스 디자인이 세련되지 못한 근본 원인 — 아이콘 사이즈 스케일 부재, strokeWidth 혼재, 파일 컬러 토큰 밖 하드코딩

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 아이콘 사이즈가 10/11/12/13/14/15/16/24px 총 8종으로 산재 | 새 컴포넌트에 아이콘을 넣을 때 | 기존 사이즈 중 아무거나 골라서 넣음 → 화면마다 미세하게 다른 밀도감 |  |
| M2 | strokeWidth가 1, 1.5, 2 세 가지로 혼재 | 같은 페이지에서 12px/strokeWidth=2 아이콘과 12px/strokeWidth=1.5 아이콘이 공존 | 선 굵기가 달라서 시각적 무게가 불균일 |  |
| M3 | 파일 타입 아이콘 색상 9개가 하드코딩(`#D4A843`, `#3178C6` 등) | 라이트 테마로 전환할 때 | 파일 아이콘만 테마 무시하고 고정 색상 유지 → 부조화 |  |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `tokens.css` — 아이콘 토큰 추가 | `--icon-xs: 10px`, `--icon-sm: 12px`, `--icon-md: 16px`, `--icon-lg: 24px`, `--icon-stroke: 1.5` | `tokens.css::--icon-xs/sm/md/lg/stroke` (값: 12/14/16/24/1.5) |
| `tokens.css` — 파일 컬러 토큰 추가 | `--file-folder`, `--file-ts`, `--file-js`, `--file-json`, `--file-md`, `--file-css`, `--file-sh`, `--file-img`, `--file-config` (다크/라이트 블록 모두) | `tokens.css::--file-*` (9종, dark+light) |
| 전체 TSX — 아이콘 사이즈 마이그레이션 | 모든 `size={N}` → 4단계 스케일 중 가장 가까운 값으로 라운딩 | (완료 — `strokeWidth` prop 0건, 비표준 size 0건) |
| 전체 TSX — strokeWidth 통일 | 모든 `strokeWidth={N}` → `1.5` 단일값 (명시적 prop 제거, 글로벌 기본값 활용) | (완료 — `strokeWidth` prop 0건) |
| `PageViewer.module.css` — raw color 제거 | `.vw-icon--*` 셀렉터에서 하드코딩 hex → `var(--file-*)` | `FileIcon.module.css::var(--file-*)` (FileIcon으로 이관) |

완성도: 🟢

## ③ 인터페이스

> 비-UI 변경 (토큰 + 리팩터링). 키보드/마우스 인터랙션 변경 없음.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 개발자가 아이콘 추가 | 사이즈 스케일 없음 | `--icon-sm` 등 토큰 참조 | 4단계 스케일이 유일한 선택지이므로 즉흥적 수치 불가 | 일관된 사이즈 | |
| 테마 전환 (다크↔라이트) | 파일 아이콘 색상 고정 | `--file-*` 토큰이 테마별 값 제공 | 시맨틱 토큰이므로 `[data-theme="light"]` 블록에서 재정의됨 | 파일 아이콘도 테마 반응 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 10px 아이콘(Breadcrumb 구분자)을 12px로 올리면? | `size={10}` | 10→12는 20% 증가로 구분자가 시각적으로 튀어보일 수 있음 | `--icon-xs: 10px` 유지. Breadcrumb 구분자는 xs 스케일 | 현행 유지 | |
| 11px 아이콘(Menu chevron, TreeGrid chevron)을 12px로? | `size={11}` | 1px 차이는 인지 불가, sm으로 통일이 정돈됨 | 12px(`--icon-sm`)으로 라운딩 | 11→12 변경 | |
| 13px 아이콘(Accordion/Disclosure chevron, 테마 토글)을 12 또는 16으로? | `size={13}` | 13px는 텍스트와 같은 크기(--text-md). 인라인 아이콘은 텍스트와 동급이 자연스러움 → 12px(sm)으로 | 12px(`--icon-sm`)으로 라운딩 | 13→12 변경 | |
| 14px 아이콘(SharedTreeComponents, CMS toolbar)을 12 또는 16으로? | `size={14}` | 트리 아이콘/툴바 아이콘은 아이템(32px) 안에서 적당한 비율. 16은 과대, 12는 과소 → 상황별 판단 | 트리 파일아이콘: 12px(sm), 툴바 버튼 아이콘: 16px(md) | 14→12 또는 16 | |
| 15px 아이콘(CMS 햄버거)을 16px로? | `size={15}` | 1px 차이 인지 불가, md로 통일 | 16px(`--icon-md`)으로 라운딩 | 15→16 변경 | |
| strokeWidth=2인 12px 아이콘 → 1.5로 내리면 너무 얇아 보이지 않나? | 12px + strokeWidth=2 | 12px에서 2는 뭉개짐 현상 발생, 1.5가 lucide 기본값이자 최적 | 전체 1.5 통일 | 선 굵기 균일화 | |
| strokeWidth=1인 24px empty state 아이콘 → 1.5로 올리면? | 24px + strokeWidth=1 | empty state는 의도적으로 가벼운 느낌(장식). 1.5로 올려도 24px에서는 미세한 차이 | 1.5 통일 적용 | 미세하게 무거워지나 허용 범위 | |
| 파일 컬러 라이트 테마 값을 어떻게 정하나? | 다크 전용 하드코딩 | 라이트 배경에서 같은 채도면 눈이 아프다. 채도↓ 명도↓ 조정 필요 | 라이트 블록에 별도 값 정의 (채도 낮춘 버전) | 테마별 최적 대비 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | raw color 직접 사용 금지 (tokens.css 주석, surface token PRD) | M3, 산출물5 | 현재 위반 중 → 이 PRD가 수정 | 파일 컬러 토큰화로 해소 | |
| P2 | 투명도(rgba) 금지, shadow/backdrop만 예외 (tokens.css 주석) | PageViewer.module.css `opacity: 0.7` | 현재 위반 중 | 파일 컬러 토큰에 opacity 없는 실색 사용 | |
| P3 | 파일명 = 주 export 식별자 (CLAUDE.md) | FileIcon.tsx, SharedTreeComponents.tsx | 위반 없음 | — | |
| P4 | CMS에서 디자인 변경 불가 (memory) | CMS 아이콘 사이즈 변경 | 위반 없음 — 토큰 변경이지 CMS 사용자 변경 아님 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | 11→12px 변경 (Menu chevron, TreeGrid chevron) | 아이템 내 정렬 미세 변화 가능 | 낮 | 변경 후 시각 확인 | |
| S2 | 13→12px 변경 (Accordion/Disclosure chevron) | chevron이 약간 작아짐 | 낮 | 12px이 텍스트(13px)보다 1px 작지만 시각적으로 균형 | |
| S3 | 14→12px 변경 (트리 파일아이콘) | 파일 아이콘이 현재보다 2px 작아짐 | 중 | SharedTreeComponents의 iconSize도 12로 통일, 파일명 텍스트와 비율 확인 | |
| S4 | 14→16px 변경 (CMS 툴바 아이콘) | 툴바 버튼이 약간 커짐 | 낮 | 32px 버튼 안에서 16px은 적정 비율(50%) | |
| S5 | strokeWidth 2→1.5 (chevron 계열) | chevron이 약간 가늘어짐 | 낮 | lucide 기본값과 일치하므로 자연스러움 | |
| S6 | 파일 컬러 opacity 제거 | opacity 없이 실색만 쓰면 색이 진해보일 수 있음 | 중 | 토큰 값 자체를 현재 opacity 적용된 결과값에 가깝게 설정 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | 아이콘 사이즈에 매직넘버 사용 | P1 (raw 사용 금지 원칙 확장) | 스케일 도입 후 다시 즉흥 수치를 넣으면 무의미 | |
| X2 | 파일 컬러 토큰에 opacity/rgba 사용 | P2 (투명도 금지) | 실색 원칙 유지 | |
| X3 | 5번째 아이콘 스케일 추가 | — | 4단계(xs/sm/md/lg)로 충분. 추가 시 다시 파편화 | |
| X4 | strokeWidth를 아이콘별로 다르게 지정 | M2 (통일이 목적) | 전체 1.5 단일값이 핵심 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | 전체 TSX에서 `size={` grep → 4가지 값(10,12,16,24)만 존재 | 8종→4종 확인 | (grep 검증 — 비표준 size 0건) |
| V2 | M2 | 전체 TSX에서 `strokeWidth` grep → 결과 0건 (기본값 1.5 사용) | strokeWidth prop 제거 확인 | (grep 검증 — strokeWidth 0건) |
| V3 | M3 | PageViewer.module.css에서 `#[hex]` grep → `.vw-icon--*`에 0건 | raw color 제거 확인 | (grep 검증 — FileIcon.module.css에서 var(--file-*) 사용) |
| V4 | 경계8 | 다크/라이트 테마 전환 → 파일 아이콘 색상이 테마에 맞게 변경됨 | 시각 확인 | (시각 확인 — tokens.css dark/light 양쪽 정의) |
| V5 | M1 | tokens.css에 `--icon-xs`, `--icon-sm`, `--icon-md`, `--icon-lg`, `--icon-stroke` 존재 | 토큰 정의 확인 | `tokens.css::--icon-xs/sm/md/lg/stroke` |
| V6 | S3 | SharedTreeComponents 트리 아이콘 12px 변경 후 텍스트와 수직 정렬 유지 | 시각 확인 | (시각 확인) |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
