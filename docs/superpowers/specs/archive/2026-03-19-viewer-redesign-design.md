# Viewer Redesign — Design Spec

> Discussion: VS Code 에디터 스타일에서 가독성 좋은 docs viewer로 전환

## 1. Purpose

- **풀려는 문제:** 현재 Viewer가 VS Code file explorer처럼 생겨서 "코드 에디터"로 인식됨. 실제 목적은 프로젝트 문서를 **읽기 좋게** 보여주는 것
- **대상 사용자:** interactive-os를 평가하는 개발자. 코드보다 문서(md)를 주로 읽음
- **사용 맥락:** 프로젝트 랜딩(default route)에서 진입. 첫인상을 결정하는 화면

상태: 🟢

## 2. Tone

> 하나의 극단을 선택한다. "적당히"는 금지.

- **선택된 방향:** refined-documentation — 좌측 TOC + 넓은 본문, 타이포 강조, 코드 블록 명확 구분
- **레퍼런스:** Stripe docs, Tailwind docs, MDN
- **안티 레퍼런스 (이렇게는 안 됨):** VS Code (에디터 느낌), GitHub raw file view (밋밋)
- **다른 세계관과의 관계:** Visual CMS Landing은 별개 (마케팅). Viewer는 도구 내 문서 읽기 경험.

상태: 🟢

## 3. Constraints

- **프레임워크:** React + CSS (기존 App.css 토큰 시스템)
- **기존 디자인 시스템:** dark-first 테마 시스템 ([data-theme] CSS variables), Manrope + SF Mono
- **성능 제약:** Shiki 코드 하이라이팅 유지, Markdown 렌더링 (react-markdown + remark-gfm)
- **접근성 요구:** 키보드 트리 네비게이션 유지 (treegrid behavior), Quick Open (Cmd+P)

상태: 🟢

## 4. Differentiation

> 이 인터페이스를 본 사람이 딱 하나 기억하는 것

- **기억점:** 타이포그래피 퀄리티 — 본문이 압도적으로 읽기 좋아서 "이 docs viewer 뭐지?" 하게 만드는 것

상태: 🟢

## 5. Typography

- **Display 글꼴:** Manrope 유지 — heading에서 800 weight의 geometric 캐릭터가 잘 작동
- **Body 글꼴:** Manrope 유지 — size/weight/spacing 조정으로 해결
- **Mono 글꼴:** SF Mono / JetBrains Mono (현재 유지)
- **Size scale (Viewer markdown):**
  - body: 15px (현재 11px → 36% 증가)
  - h1: 28px, h2: 20px, h3: 16px, h4: 14px
  - code inline: 13px
  - code block: 13px
  - tree sidebar: 13px (현재 12px)
- **Weight 체계:**
  - body: 450 (dark bg에서 400은 가늘어 보임 → 살짝 굵게)
  - heading: 700-800
  - code: 400
- **Line-height:** body 1.75 (현재 1.7 → 약간 더 여유)
- **Letter-spacing:** body 0.01em (Manrope는 기본이 tight, 살짝 벌려서 시원하게)
- **핵심 원칙:** 매크로 여백은 넉넉하게(섹션 간), 마이크로 밀도는 촘촘하게(섹션 내부)

상태: 🟢

## 6. Color & Theme

- **지배색:** zinc scale 유지 — 변경 불필요
- **악센트:** indigo-500 #5B5BD6 유지
- **다크/라이트 정책:** dark-first 유지, [data-theme] toggle 유지
- **CSS 변수 체계:** 기존 Tier 1 + Tier 2 유지
- **의미색:** 유지
- **Viewer 특이사항:** markdown 본문의 link color를 accent보다 밝게 (가독성). blockquote는 accent-dim 배경 유지.

상태: 🟢

## 7. Motion

- **전략:** minimal-functional — 문서 읽기에 방해되지 않는 수준. 파일 전환 시에만 미세한 전환 효과.
- **고임팩트 모먼트:** 파일 선택 시 content fade-in (opacity 0→1, 0.15s). 과하지 않게.
- **Hover/Focus 반응:** tree item hover 0.08s, focus ring 기존 유지
- **라이브러리:** CSS only (transition/animation)

상태: 🟢

## 8. Spatial Composition

- **밀도:** comfortable — 매크로 여백 넉넉, 마이크로 정보 촘촘
- **레이아웃:**
  - tree sidebar: 200px (현재 230px → 축소)
  - content: max-width 720px, 중앙 정렬 (prose column)
  - content padding: 32px 48px (현재 0 16px → 3배)
- **여백 전략:**
  - 섹션 간(h2 사이): 2.5em margin-top
  - 문단 간: 1em
  - 코드 블록: 1.5em margin-y, 내부 padding 16px 20px
- **status bar:** 유지하되 높이 32px(현재 28px), 약간 더 여유
- **breadcrumb + meta:** content header 영역에 padding 증가

상태: 🟢

## 9. Backgrounds & Visual Details

- **배경 처리:** surface tokens 유지. Viewer content 영역만 surface-2 (약간 띄움)
- **텍스처/패턴:** 없음 — refined-documentation은 텍스처보다 타이포로 승부
- **그림자 체계:** tree와 content 사이 구분은 border 대신 subtle shadow 고려 (?)
- **장식 요소:**
  - 코드 블록: 좌측 accent bar (3px) + 라운드 코너 8px (현재 6px)
  - blockquote: 좌측 accent bar (현재 유지)
  - h1 하단: 1px border 유지
- **tree-content 구분:** 현재 1px border → subtle elevation shadow로 교체하면 더 refined

상태: 🟢

---

**전체 상태:** 🟢 9/9
