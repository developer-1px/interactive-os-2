---
name: design-implement
description: DESIGN.md 번들 체계 안에서 CSS를 작성한다. 컴포넌트 스타일링, UI 구현, CSS 수정 시 5개 번들(surface/shape/type/tone/motion) 준수를 강제한다. "컴포넌트 만들어줘", "CSS 작성", "스타일링", "UI 구현", "/design-implement" 등 디자인 시스템이 있는 프로젝트에서 CSS를 작성할 때 사용. 디자인 토큰을 개별 사용하는 것을 방지하고 번들 단위 사용을 보장한다.
---

# Design Implement — 디자인 결정 + 번들 기반 CSS 작성

## 왜 이 스킬이 필요한가

AI는 CSS 앞에 서면 바로 코드를 쓰려 한다. 데이터를 보지 않고, 역할을 구분하지 않고, 그룹핑을 고민하지 않는다. 토큰이 있어도 **선택 기준(문법)**이 없으면 무작위 조합이 된다.

이 스킬은 두 가지를 강제한다:
1. **디자인 결정** — CSS 작성 전에 "뭘 왜 이렇게 보여주는가"를 사고한다
2. **번들 준수** — 결정된 디자인을 5개 번들 세트로 구현한다

## 전제

- DESIGN.md가 프로젝트 루트에 존재해야 한다
- tokens.css에 번들 토큰이 정의되어 있어야 한다
- `src/interactive-os/ui/`에 기존 완성품 컴포넌트가 있다

---

## Phase 0: 경로 판단

CSS 작업 시작 시 **스크린샷을 먼저 찍는다.** 현재 상태를 보고 경로를 분기한다.

| 상황 | 경로 |
|------|------|
| 전체 디자인을 해달라는 요청 / 새 컴포넌트·페이지 | → **Phase 1 풀 실행** |
| 기존 컴포넌트 부분 수정 (토큰 교체, 간격 조정 등) | → **Phase 2로 직행** |

판단 기준: "역할 구분과 그룹핑을 새로 해야 하는가?" YES → Phase 1, NO → Phase 2.

---

## Phase 1: 디자인 결정 (CSS 작성 전 필수)

**빈 캔버스에서 시작하지 않는다.** 기존 컴포넌트에 골격이 있다.

각 Step의 결과를 텍스트로 출력한다 — 생각을 텍스트로 강제하면 건너뛰는 것을 방지한다.

### Step 1. 데이터 나열

실제 데이터 또는 샘플 데이터를 **텍스트로 쭉 적는다.**

```
예: 인시던트 상세
- 제목: "API 응답 지연 500ms 초과"
- 상태: Resolved
- 심각도: SEV-2
- 담당자: 김철수
- 시작: 2026-03-27 14:00
- 해결: 2026-03-27 15:30
- 타임라인: [14:00 감지 → 14:05 알림 → 14:20 원인 파악 → 15:30 해결]
- 영향: 주문 처리 32% 실패
```

### Step 2. 역할 구분

데이터 안에서 **역할이 다른 것들을 식별**한다.

```
예:
- 식별: 제목, 상태, 심각도 → "한눈에 뭔지"
- 메타: 담당자, 시간 → "누가 언제"
- 내러티브: 타임라인 → "어떻게 흘러갔는가"
- 임팩트: 영향 수치 → "얼마나 심각했는가"
```

### Step 3. 그룹핑 + 위계

같은 역할끼리 묶고, 그룹 간 **위계**를 매긴다.

위계가 간격을 결정한다 — 기계적 매핑:

| 관계 | 규칙 | 예시 |
|------|------|------|
| 가까울수록 | 작은 간격 | 항목 내 요소 → `--space-xs` |
| 멀수록 | 큰 간격 | 섹션 간 → `--space-3xl` |
| 같은 위계 | 같은 간격 | 동급 그룹 → 동일 토큰 |

간격 토큰 스케일 (위계와 1:1 대응):

```
--space-xs(4) → sm(8) → md(12) → lg(16) → xl(24) → 2xl(32) → 3xl(40)
```

### Step 4. 배치

나열 방향은 **스크롤 여부**로 결정한다.

```
항목이 뷰포트에 다 들어가는가?
  → YES: 자유 (보통 가로가 공간 효율적)
  → NO:  스크롤 방향 = 나열 방향
```

### Step 5. 시각 도구 선택

**모든 시각 변화는 기능이 있을 때만 쓴다. 기능 없는 시각 변화 = 장식 = 금지.**

```
"이 시각 변화의 기능은 뭔가?"
  → 위계 표현?  → 간격
  → 영역 구분?  → 면
  → 역할 구분?  → 폰트
  → 강조?      → 색
  → 없음?      → 쓰지 마라
```

| 도구 | 기능 | 사용 조건 |
|------|------|-----------|
| **간격** | 위계 표현 | 항상. 위계 → space 토큰 기계적 매핑 |
| **면** | 영역 구분 | 맥락이 바뀔 때만. **bg + padding + border-radius 필수** (셋 중 하나라도 빠지면 면이 아니다) |
| **폰트** | 역할 구분 | 역할이 다를 때만. 기본(body) 유지가 원칙 |
| **색** | 강조 | 강조 목적만. 그 외 무채색 |
| **선** | 최후 수단 | 간격 + 면으로 부족할 때만 |

우선순위: **간격 → 면 → 선** 순서로 시도. 앞 단계로 충분하면 뒤 단계를 쓰지 않는다.

### Step 6. 컴포넌트 선택

```
이 UI에 해당하는 기존 컴포넌트가 있는가? (src/interactive-os/ui/)
  → YES: 그 컴포넌트를 쓴다 (조립)
  → NO:  범용 컴포넌트를 ui/에 먼저 만든다
         이때도 비슷한 역할의 기존 컴포넌트에서 골격을 가져온다
```

---

## Phase 2: 번들 기반 CSS 작성

CSS를 작성하거나 수정하기 전에 DESIGN.md를 읽고, 아래 5개 번들을 하나씩 확인한다.

### 1. Surface — 이 요소의 인터랙션 모드는?

```
질문: 이 요소가 action/input/display/overlay 중 어디인가?
```

| 모드 | 언제 | border | shadow | 상태 (interactive.css) |
|------|------|--------|--------|---------------------|
| action | Button, Toggle, Link | none | none | hover→bg, active→bg, focus→ring, disabled |
| input | TextInput, Select, Textarea | border-default | none | focus→border, invalid→border, disabled |
| display | Card, Badge, 정보 표시 | optional (variant) | optional (variant) | 없음 |
| overlay | Dialog, Dropdown, Tooltip | border-default | shadow-lg | enter motion |

```css
/* ✅ data-surface로 선언 — 상태가 자동 제공 */
<button data-surface="action" className={styles.accent}>

/* ❌ module.css에 :hover/:focus 직접 작성 */
.accent:hover { background: ... }
```

bg(배경)는 surface가 아니라 **variant의 --_bg**가 결정한다. depth는 variant의 책임.

### 2. Shape — 이 요소의 크기급은?

```
질문: 이 요소가 xs/sm/md/lg/xl 중 어디인가?
```

| 레벨 | radius | padding-y | padding-x | 용도 |
|---|---|---|---|---|
| xs | 6px | 6px | 12px | 뱃지, 태그 |
| sm | 6px | 6px | 16px | 사이드바, 네비 |
| md | 10px | 0 | 12px | Input, Select |
| lg | 12px | 20px | 20px | 카드 |
| xl | 20px | — | — | 대형 컨테이너 |

```css
/* ✅ 세트로 사용 */
border-radius: var(--shape-md-r);
padding: var(--shape-md-py) var(--shape-md-px);

/* ❌ radius와 padding을 다른 레벨에서 가져오지 않는다 */
border-radius: var(--shape-lg-r);  /* lg */
padding: var(--shape-sm-py) var(--shape-sm-px);  /* sm — 불일치! */
```

### 3. Type — 이 텍스트의 역할은?

```
질문: caption/body/section/page/hero 중 어디인가?
```

| 레벨 | size | weight | family | lh |
|---|---|---|---|---|
| caption | 12px | 430 | Sans | 1.33 |
| body | 14px | 430 | Sans | 1.4 |
| section | 16px | 600 | Sans | 1.4 |
| page | 24px | 500 | Serif | 1.3 |
| hero | 40px | 330 | Serif | 1.5 |

```css
/* ✅ 4축을 함께 적용 */
font-size: var(--type-section-size);
font-weight: var(--type-section-weight);
font-family: var(--type-section-family);
line-height: var(--type-section-lh);

/* ❌ size만 바꾸고 weight/family를 안 바꾸면 안 된다 */
font-size: var(--type-page-size);  /* 24px — page급 */
font-weight: var(--weight-semi);    /* 600 — section급 weight — 불일치! */
```

핵심 전환: **16px 이하 = Sans**, **24px 이상 = Serif + lighter weight**. 이 경계를 넘으면 family와 weight가 반드시 함께 전환된다.

### 4. Tone — 이 색상의 의미는?

```
질문: primary/destructive/success/warning/neutral 중 어디인가?
```

모든 tone은 동일한 4축 구조:

```css
/* ✅ 같은 tone 안에서 4축 사용 */
background: var(--tone-destructive);
color: var(--tone-destructive-foreground);

/* hover 상태 */
background: var(--tone-destructive-hover);

/* 약한 배경 (뱃지 등) */
background: var(--tone-destructive-dim);
color: var(--tone-destructive);

/* ❌ 다른 tone의 축을 섞지 않는다 */
background: var(--tone-primary-dim);
color: var(--tone-destructive);  /* 의미 충돌! */
```

**포인트 컬러 규칙:** 한 화면에서 채도 있는 tone은 최소화한다. neutral(무채색)이 기본.

### 5. Motion — 이 전환의 속도감은?

```
질문: instant/normal/enter 중 어디인가?
```

| 레벨 | duration | easing | 용도 |
|---|---|---|---|
| instant | 0.075s | cubic-bezier(0.165, 0.85, 0.45, 1) | 호버 피드백 |
| normal | 0.15s | cubic-bezier(0.4, 0, 0.2, 1) | 일반 전환 |
| enter | 0.15s | cubic-bezier(0, 0, 0.2, 1) | 진입 애니메이션 |

```css
/* ✅ duration + easing 세트 */
transition: background var(--motion-instant-duration) var(--motion-instant-easing);

/* ❌ duration과 easing을 다른 레벨에서 가져오지 않는다 */
transition: color var(--motion-instant-duration) var(--motion-normal-easing);
```

## Composition Rules

번들 외에, DESIGN.md의 조합 규칙도 반드시 확인한다:

1. **면 = 영역 구분** — bg + padding + radius 필수 (셋 중 하나라도 빠지면 면이 아니다). 선은 최후 수단
2. **화면당 주인공 1개** — hero 1개 + 나머지 후퇴
3. **위계 점프** — body 구간(12~16) 균일, hero(40) 급격 점프
4. **조연의 후퇴** — 네비/보조 요소는 본문보다 작고 연한 색
5. **입력은 넉넉하게** — Input height 44px, 충분한 padding
6. **포인트 컬러 1개** — 유일한 채도색 = accent
7. **설명문은 항상 있되, 후퇴** — 라벨과 경쟁하지 않는 연한 색
8. **카드형 선택** — 라디오보다 비주얼 카드
9. **액션은 오른쪽 끝** — 라벨 좌측, 버튼/스위치 우측
10. **Gap = 위계** — 가까울수록 작은 간격, 멀수록 큰 간격, 같은 위계는 같은 간격. space 토큰 스케일로 기계적 매핑

## module.css 3블록 레시피

독립 컴포넌트의 module.css는 3블록 순서로 작성한다:

| 블록 | 내용 | 규칙 |
|------|------|------|
| **Block 1: base** (.root) | 공유 형태 + `background: var(--_bg); color: var(--_fg);` | 번들 세트로. 상태 없음 |
| **Block 2: variant** | `--_bg`, `--_bg-hover`, `--_fg` 등 --_ 값만 | background/color 직접 금지 |
| **Block 3: size** | shape+type 번들 override | 번들 세트로 교체 |

```css
/* Block 1 */
.root { background: var(--_bg); color: var(--_fg); border-radius: var(--shape-md-radius); ... }
/* Block 2 */
.accent { --_bg: var(--tone-primary-base); --_bg-hover: var(--tone-primary-hover); --_fg: var(--tone-primary-foreground); }
/* Block 3 */
.sm { border-radius: var(--shape-xs-radius); padding: var(--shape-xs-py) var(--shape-xs-px); }
```

## Phase 3: 검증

1. **raw 값 점검** — px, hex 등 raw 값 → 토큰으로 교체
2. **번들 불일치 점검** — 위반 감지 패턴 테이블 확인
3. **Composition rules 점검** — 위 규칙 준수 확인
4. **스크린샷 검증** — 브라우저에서 실제 렌더링 확인

## 위반 감지 패턴

작성한 CSS에서 다음을 발견하면 번들 위반이다:

| 패턴 | 위반 | 교정 |
|---|---|---|
| `font-size: 24px` + `font-weight: 600` | type 번들: 24px은 page급, weight는 500이어야 함 | `--type-page-*` 사용 |
| `border-radius: 20px` + `padding: 6px 12px` | shape 번들: xl radius + xs padding 불일치 | 같은 레벨 사용 |
| `background: var(--tone-primary)` + `color: var(--text-primary)` | tone: primary tone이면 foreground도 primary에서 | `--tone-primary-foreground` |
| `transition: 0.15s ease` | motion: ease가 아니라 specific cubic-bezier 사용 | `--motion-normal-*` |
| `background: #FAF9F5` | raw 색상값 | `var(--surface-base)` 또는 palette 토큰 |
| `.accent:hover { background: ... }` | module.css에 상태 스타일 | data-surface가 상태 제공. --_bg-hover로 값만 선언 |
| `background: var(--tone-primary-base)` in variant | variant에 bg 직접 작성 | `--_bg: var(--tone-primary-base)` |
| `--space-sm` for padding with `--shape-md-radius` | shape 번들 불일치 | 같은 레벨의 --shape-*-py/px 사용 |
