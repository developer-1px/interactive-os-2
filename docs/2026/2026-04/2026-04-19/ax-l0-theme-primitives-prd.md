---
title: ax L0 Theme Primitives 공식화 — tokens.css 7-bundle 재편
type: prd
layer: styles
project: ax
status: draft
created: 2026-04-19
tags: [ax, design-system, tokens, theme, refactor]
---

# ax L0 Theme Primitives — PRD (draft)

> **선행**: ax-textstyle-ssot-prd (L1 Band Zone 구축 완료)
> **Discussion**: DESIGN.md §5 Token Hierarchy 4계층 모델 채택 세션
> **산출물 유형**: 리팩토링 (tokens.css 재편 + 주석 구조, 실제 값 그대로)
> **규모 추정**: 수정 1~2 파일 (tokens.css 중심), 로직 변경 0

## §0 요구사항

- **해결책**: tokens.css에 평면 나열된 루트 토큰을 **7개 번들**로 그룹화. 주석·섹션 헤더로 명시. 값은 보존 (CSS 동작 0 변경).
- **제약**:
  - 실제 값 변경 금지 (회귀 리스크 차단)
  - `@layer tokens` 구조 유지
  - 기존 `[data-theme="lifted"]` override 그대로
- **보유 자산**: 현재 tokens.css, DESIGN.md §5 4계층 모델
- **목표**: "theme 교체 단위"를 tokens.css 구조로 가시화 → Dark/Cream/Brand theme 추가 시 정확히 어느 번들을 교체할지 명확

## §1 책임 분해 (draft — 후속 세션에서 확정)

| # | 책임 | 파일 | 번들 |
|---|------|------|------|
| 1 | Palette 번들 명시 — tone-primary/destructive/success/warning/neutral 계열 묶음 | `tokens.css` | Color |
| 2 | Type Scale 번들 명시 — type-hero/display/.../overline 9단 × size/weight/family/line-height/letter-spacing | `tokens.css` | Typography |
| 3 | Depth Ladder 번들 명시 — surface-sunken/base/raised/overlay + depth-*-hover/active/sel | `tokens.css` | Depth |
| 4 | Radius Language 번들 — shape-2xs/.../pill/island | `tokens.css` | Radius |
| 5 | Motion Profile 번들 — motion-enter-duration/easing | `tokens.css` | Motion |
| 6 | Space Scale 번들 — space-xs/sm/md/lg/xl/2xl | `tokens.css` | Space |
| 7 | Family 번들 — sans/serif + weight alias | `tokens.css` | Family |
| 8 | DESIGN.md §5 Token Studio 대응 섹션 실제 토큰 이름 매핑 추가 | DESIGN.md | docs |

## §2 Contract

### tokens.css 구조 (제안)

```css
@layer tokens {
  :root {
    /* ═══════════════════════════════════════════
     * L0 Theme Primitive: Color Palette
     * 교체 단위 = 이 블록 전체.
     * ═══════════════════════════════════════════ */
    --tone-primary-base: ...;
    --tone-primary-foreground: ...;
    /* ... 5개 tone 계열 × 5 속성 */

    /* ═══════════════════════════════════════════
     * L0 Theme Primitive: Type Scale
     * 9단 × (size/weight/family/line-height/letter-spacing)
     * ═══════════════════════════════════════════ */
    --type-hero-size: ...;
    /* ... 9단 × 5 속성 */

    /* ... 나머지 5개 번들 */
  }

  [data-theme="lifted"] {
    /* Color Palette override */
    /* Depth Ladder override */
  }
}
```

**불변식**:
- 토큰 값 변경 0건
- 번들 헤더 주석 7개 존재
- 각 번들 내부 토큰은 동일 prefix 유지 (`--tone-*`, `--type-*`, `--surface-*`/`--depth-*`, `--shape-*`, `--motion-*`, `--space-*`, `--sans`/`--serif`)

## §3 WHY

L0 Theme Primitives 공식화 없이는:
1. 새 theme 추가 시 어느 토큰을 override할지 불분명 (현재 flat 리스트에서 검색)
2. "palette만 교체" / "density만 전환" 같은 부분 theme가 구조적으로 불가
3. Token Studio export/Figma 연동 시 매핑이 수작업

**feedback 원칙 정렬**:
- `feedback_auto_derivation_is_system` — 번들 명시로 파생 경로 가시화
- `feedback_enforcement_multilayer` — 주석 헤더가 구조 enforcement 1차 방어

## §4 HOW

Mermaid:
```
tokens.css
  ├── 7 Bundle Headers (주석으로 명시)
  └── [data-theme="X"] overrides
           ↓
       CSS cascade to all consumers
```

## §5 WHAT

후속 세션에서 구체 코드 작성. 현재 PRD는 **범위 선언 + 구조 합의**까지만.

---

## §6 후속 세션 — 연계 PRD 후보

- **L0 Density 축** — compact/comfortable/spacious 전환 (--density-multiplier)
- **ax.theme() API** — 앱 루트 단일 호출로 theme+density+accent 결정
- **Radix-style size prop 호환** — `<Button size="2">` 같은 외부 생태계 alias

---

**상태**: draft. 본 세션에서는 범위 선언까지. 실행은 별도 세션 `/prd` → `/go`.
