# Design System — interactive-os

> Reference: claude.ai (2026-03-24 실측)
> 이 문서는 토큰 값이 아니라 **조합 규칙**을 정의한다.
> 토큰은 tokens.css가 SSOT. 여기는 "왜 그 값인지"와 "어떻게 조합하는지".

## 0. 번들 체계

디자인 토큰은 단독이 아니라 **번들로 함께 움직이는 축**이 있다.

| 번들 | 축 | 레벨 | 설명 |
|---|---|---|---|
| **surface** | bg + border + shadow | 6개 (base~outlined) | 시각적 계층/높이 |
| **shape** | radius + padding | 5개 (xs~xl) | 요소 형태. radius와 padding 비례 |
| **type** | fontSize + weight + family + lineHeight | 5개 (caption~hero) | 글자 계층. size↑ → serif + lighter |
| **tone** | base + hover + dim + foreground | 5개 (primary~neutral) | 의미 색상. 모든 tone이 동일 4축 구조 |

독립 축 (번들에 속하지 않음): **color** (text-bright~muted), **border** (subtle~strong), **interactive** (hover/active)

## 1. 레퍼런스 수치 (claude.ai 실측)

### Color

| claude.ai 토큰 | 실측값 | 용도 |
|---|---|---|
| bg-base | #FAF9F5 `rgb(250,249,245)` | 페이지/사이드바 배경 |
| bg-surface | #FFFFFF | 입력 컨테이너, 카드 |
| bg-muted | #F0EEE6 `rgb(240,238,230)` | 선택 탭, 호버 |
| bg-emphasis | #E8E6DC `rgb(232,230,220)` | 강한 구분 |
| text-primary | #141413 `rgb(20,20,19)` | 본문 |
| text-secondary | #3D3D3A `rgb(61,61,58)` | 인사 제목, 부제 |
| text-tertiary | #73726C `rgb(115,114,108)` | 사이드바 섹션, 설명문 |
| border-default | `rgba(31,30,29,0.15)` | 입력 필드 테두리 |
| border-emphasis | `rgba(31,30,29,0.25)` | 호버/포커스 |
| accent | #2C84DB `rgb(44,132,219)` | Switch ON — 유일한 채도색 |

### Type 번들 (fontSize + fontWeight + fontFamily + lineHeight)

size가 바뀌면 weight·family·lineHeight가 함께 바뀐다. color는 독립 축.

| 세트 | Size | Weight | Family | Line-height | 용도 |
|---|---|---|---|---|---|
| `--type-hero` | 40px | 330 | Serif | 1.5 | 인사, 랜딩 제목 — 페이지당 1개 |
| `--type-page` | 24px | 500 | Serif | 1.3 | 페이지 제목 ("설정") |
| `--type-section` | 16px | 600 | Sans | 1.4 | 섹션 제목 ("프로필", "알림") |
| `--type-body` | 14px | 430 | Sans | 1.4 | 본문, 버튼, 라벨 — 범용 |
| `--type-caption` | 12px | 430 | Sans | 1.33 | 사이드바, 단축키, 보조 |

**Size ratio:** 40 → 24 → 16 → 14 → 12
**Hero:Body = 2.86×**
**핵심 전환:** 16px 이하 = Sans + book/semi, 24px 이상 = Serif + lighter weight

### Component Specs

| Component | Height | Padding | Radius | Border |
|---|---|---|---|---|
| Input | 44px | 0 12px | 10px | 1px rgba(31,30,29,0.15) |
| Composer | 122px | — | 20px | shadow only |
| Sidebar item | 32px | 6px 16px | 6px | none |
| Switch | 36×20px | — | pill | — |
| Sidebar width | 288px | — | — | — |

### Shadow

| 레벨 | 값 |
|---|---|
| composer | `rgba(0,0,0,0.035) 0px 4px 20px` |

### Border Radius Scale

6px → 10px → 20px → 9999px

---

## 2. 토큰 매핑 (claude.ai → tokens.css)

### Color: 웜톤 전환

현재 tokens.css는 zinc(blue-gray). claude.ai는 warm neutral.

| tokens.css (현재) | claude.ai 대응 | 변환 방향 |
|---|---|---|
| `--zinc-50: #FAFAFA` | #FAF9F5 | cool → warm (살짝 yellow) |
| `--zinc-100: #F4F4F5` | #F0EEE6 | cool → warm |
| `--zinc-200: #E4E4E7` | #E8E6DC | cool → warm |
| `--zinc-500: #71717A` | #73726C | cool → warm |
| `--zinc-800: #27272A` | #3D3D3A | lighter, warmer |
| `--zinc-900: #18181B` | #141413 | warmer |
| `--indigo-500` (accent) | #2C84DB (blue) | indigo → blue 전환 검토 |

**결정 필요:** palette를 zinc에서 warm neutral로 전환할 것인가?
- warm으로 가면 claude.ai 미감에 가까워짐
- 현재 dark theme 기준이므로 light theme에서 먼저 적용 후 dark는 별도 조정

### Typography: scale 재조정

| tokens.css (현재) | claude.ai 대응 | 갭 |
|---|---|---|
| `--text-xs: 11px` | — | 유지 |
| `--text-sm: 13px` | 12px | 13→12 검토 |
| `--text-md: 15px` | 14px | 15→14 검토 |
| `--text-lg: 18px` | 16px | 18→16 검토 |
| `--text-xl: 22px` | 24px | 22→24 검토 |
| `--text-2xl: 26px` | — | 유지 또는 제거 |
| `--text-3xl: 32px` | 40px | 32→40 검토 |

**현재 ratio:** 11→13→15→18→22→26→32 (≈1.18 균일)
**claude.ai ratio:** 12→14→16→24→40 (body 구간 균일, hero 점프)

**핵심 차이:** claude.ai는 body 구간(12~16)이 좁고, hero(40)로 **급격히 점프**한다. 우리는 균일하게 증가 → 위계 대비가 약함.

### Weight: 다양화

| tokens.css (현재) | claude.ai |
|---|---|
| 400, 500, 600, 700, 800 | 330, 400, 430, 500, 600 |

**갭:** claude.ai는 330(극세)~600 범위. 우리는 400~800. claude.ai의 430(body default)이 핵심 — 400보다 살짝 무거워서 가독성 확보.

### Font: 서체 혼합

| tokens.css (현재) | claude.ai |
|---|---|
| `--sans: Manrope` | Anthropic Sans (body) + Anthropic Serif (hero/title) |
| `--mono: SF Mono` | — |

**갭:** 우리는 sans 단일. claude.ai는 serif+sans 혼합으로 제목의 인간적 느낌을 만듦.
**검토:** hero/page-title에 serif 도입? (e.g., `--serif: 'Newsreader', Georgia, serif`)

### Shape: radius + padding 번들

radius와 padding은 독립이 아니라 비례 관계. 세트로 사용한다.

| 세트 | radius | padding-y | padding-x | 용도 |
|---|---|---|---|---|
| `--shape-xs` | 6px | 6px | 12px | 뱃지, 태그 |
| `--shape-sm` | 6px | 6px | 16px | 사이드바 아이템, 네비 |
| `--shape-md` | 10px | 0 | 12px | Input, Textarea, Select |
| `--shape-lg` | 12px | 20px | 20px | 카드 |
| `--shape-xl` | 20px | — | — | Composer, 대형 컨테이너 |

비율: radius ≈ 요소 height × 0.2, padding-y ≈ radius

### Spacing: 이미 일치

tokens.css 4→8→12→16→24→32→40은 충분. claude.ai도 비슷한 scale 사용.

---

## 3. 조합 규칙 (Composition Rules)

토큰으로 해결 안 되는, "어떻게 조합하는가"의 규칙.

### Rule 1: 면으로 구분, 선으로 구분 안 함

```
❌ border: 1px solid var(--border-default)  ← 영역 구분용
✅ background: var(--surface-sunken)         ← 배경색 차이로 구분
```

border는 **입력 필드, 카드 윤곽**에만 사용. 영역 분리(사이드바↔콘텐츠, 섹션↔섹션)는 배경색 차이로.

### Rule 2: 화면당 주인공 1개

```
페이지 = 1 hero element + N supporting elements
hero:   --text-3xl, weight 330(light), serif
others: --text-md 이하, weight 400~600, sans
```

하나의 요소만 시각적으로 압도. 나머지는 후퇴. "모든 게 중요하면 아무것도 중요하지 않다."

### Rule 3: 위계 점프

```
body 구간: 12 → 14 → 16  (차이 2px — 균일, 조용)
hero 점프: 16 → 40         (차이 24px — 극적)
```

body 내에서는 미세한 차이. body→hero는 2.5배 이상 점프. 중간 단계(22, 26)를 건너뜀.

### Rule 4: 조연의 후퇴

```
사이드바 항목:   font-size 12px, color --text-tertiary
사이드바 섹션명: font-size 12px, weight 400, color --text-tertiary
콘텐츠 본문:    font-size 14px, color --text-primary
```

네비게이션/보조 요소는 **본문보다 작고, 연한 색**. 콘텐츠와 시선 경쟁하지 않음.

### Rule 5: 입력은 넉넉하게

```
Input height: 44px (본문 14px 대비 3.1배)
Input padding: 0 12px
Input radius: 10px (body radius보다 큼)
```

입력 필드는 시각적으로 "여유"를 줌. 답답한 input = 저급한 느낌.

### Rule 6: 포인트 컬러는 1개

```
전체 palette: warm neutral (무채색)
유일한 채도: accent (#2C84DB) — Switch ON, focus ring
나머지: 전부 gray 계열
```

색이 많으면 산만. 하나의 색만 의미를 가짐.

### Rule 7: 설명문은 항상 있되, 후퇴

```
라벨:   --text-sm, weight 500, color --text-primary
설명문: --text-sm, weight 400, color --text-tertiary
```

모든 설정/필드에 "왜 필요한지" 설명. 하지만 색이 연해서 라벨과 경쟁 안 함.

### Rule 8: 카드형 선택

```
❌ <input type="radio"> + 텍스트 라벨
✅ 비주얼 카드 (미리보기 + 라벨) — 선택 시 border 강조
```

선택지가 시각적일 때는 카드로. 텍스트 라디오보다 직관적.

### Rule 9: 액션은 오른쪽 끝

```
[라벨 + 설명 ........................... Switch/Button]
```

설명은 왼쪽에서 흐르고, 액션은 오른쪽 끝에 정렬. 시선 흐름: 읽기(좌→우) → 행동(우측).

---

## 4. 적용 우선순위

1. **Color palette warm 전환** — zinc → warm neutral (light theme 먼저)
2. **Typography scale 재조정** — body 구간 압축 + hero 점프
3. **Serif 도입** — hero/page-title용
4. **Radius scale 조정** — 최소 6px, input 10px
5. **Component specs** — Input 44px, Sidebar item 32px 등
6. **Composition rules** — 위 9개 규칙을 컴포넌트 작성 시 참조
