# Viewer App — Design Spec (전체 통일)

> Discussion: Viewer는 하나의 앱이다. 본문만 올리고 주변 UI를 안 건드리면 안 어울린다. tree, status bar, breadcrumb, Quick Open까지 통일.

> 이전 spec: [viewer-redesign-design.md](2026-03-19-viewer-redesign-design.md) — markdown prose만 다룸. 이 spec이 확장판.

## 1. Purpose

- **풀려는 문제:** Viewer 내부에서 본문(15px/1.75)과 주변 UI(tree/statusbar/breadcrumb)의 미감 레벨이 다름. 하나의 앱 안에서 두 세대가 공존.
- **대상 사용자:** interactive-os를 평가하는 개발자
- **사용 맥락:** default landing. Viewer = 첫인상.
- **범위:** Viewer 내부 전체. Activity Bar는 별개 영역(shell)이므로 제외.

상태: 🟢

## 2. Tone

- **선택된 방향:** refined-documentation (이전 spec에서 확정)
- **레퍼런스:** Stripe docs, Tailwind docs, MDN
- **안티 레퍼런스:** VS Code (에디터 느낌), GitHub raw file view (밋밋)
- **밀도 원칙:** 네비게이션(tree)은 compact-comfortable, 본문(prose)은 comfortable. 같은 앱이되 역할별 밀도 차등.

상태: 🟢

## 3. Constraints

- **프레임워크:** React + CSS, 기존 App.css 토큰 시스템
- **기존 디자인 시스템:** dark-first [data-theme], Manrope + SF Mono
- **접근성:** treegrid 키보드 네비게이션 유지, Quick Open (Cmd+P) 유지
- **주의:** tree sidebar 글씨를 키우면 파일명이 잘림. tree는 compact density 유지하되 padding/gap으로 숨 쉴 공간 확보.

상태: 🟢

## 4. Differentiation

- **기억점:** 타이포그래피 퀄리티 — 본문뿐 아니라 tree/breadcrumb/Quick Open까지 전부 "이건 다른 수준이다" 느낌 (이전 spec에서 확정)

상태: 🟢

## 5. Typography

### 영역별 size scale

| 영역 | 현재 | 제안 | 근거 |
|------|------|------|------|
| **Markdown body** | 15px/450wt/1.75 | 유지 | 이전 spec에서 확정 |
| **Markdown h1** | 28px/800 | 유지 | 확정 |
| **Markdown h2** | 20px/700 | 유지 | 확정 |
| **Markdown code** | 13px | 유지 | 확정 |
| **Tree item** | 13px/regular | — | 갭: compact이되 시원하게 |
| **Status bar title** | 11px/600 upper | — | 갭: 본문 대비 너무 작나? |
| **Breadcrumb** | 11px/regular | — | 갭: 본문 대비 작음 |
| **Content header meta** | 10px | — | 갭: 너무 작음 |
| **Quick Open input** | 13px/mono | — | 현재도 괜찮을 수 있음 |
| **Quick Open item** | 13px | — | 현재도 괜찮을 수 있음 |
| **Code block (source)** | 13px | 유지 | 확정 |
| **Code line number** | 12px | — | 현재도 괜찮을 수 있음 |

### 확정 수치

| 영역 | Size | Weight | 비고 |
|------|------|--------|------|
| Tree item | 13px | regular | compact nav, 유지 |
| Status bar title | 12px | 600 | 11→12, upper |
| Breadcrumb | 12px | regular/500 | 11→12 |
| Content meta | 11px | regular | 10→11 |
| QO input | 13px mono | regular | 유지 |
| QO item | 13px | 500 | 유지 |

상태: 🟢

## 6. Color & Theme

- 이전 spec에서 전부 유지로 확정. 변경 없음.

상태: 🟢

## 7. Motion

- 이전 spec에서 확정: minimal-functional, 파일 전환 시 fade-in 0.15s.

상태: 🟢

## 8. Spatial Composition

### 영역별 spacing

| 영역 | 현재 | 제안 | 근거 |
|------|------|------|------|
| **Tree sidebar 폭** | 200px | — | 갭 |
| **Tree item padding** | 2px 10px 2px 0 | — | 갭: 너무 빽빽 |
| **Tree item gap** | 3px | — | 갭 |
| **Status bar 높이** | 32px | — | 갭 |
| **Status bar padding** | 0 12px | — | 갭 |
| **Content header padding** | 8px 48px | — | 갭 |
| **Content body padding** | 32px 48px | 유지 | 확정 |
| **Content max-width** | 720px | 유지 | 확정 |
| **Quick Open dialog** | 480px | — | 현재도 괜찮을 수 있음 |
| **Quick Open padding** | 12px 16px | — | 갭 |

### 확정 수치

| 영역 | 현재 | 확정 |
|------|------|------|
| Tree 폭 | 200px | 220px |
| Tree item padding | 2px 10px 2px 0 | 4px 12px 4px 0 |
| Tree item gap | 3px | 4px |
| Tree padding | 6px 0 | 8px 0 |
| Status bar 높이 | 32px | 36px |
| Status bar padding | 0 12px | 0 16px |
| Content header padding | 8px 48px | 10px 48px |
| QO input padding | 12px 16px | 14px 18px |
| QO item padding | 6px 16px | 8px 18px |

상태: 🟢

## 9. Backgrounds & Visual Details

- 이전 spec에서 확정: surface tokens 유지, tree-content 구분은 subtle shadow, 코드 블록 accent bar.

상태: 🟢

---

**전체 상태:** 🟢 9/9
