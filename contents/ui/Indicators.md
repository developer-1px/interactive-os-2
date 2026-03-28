# Indicators

> Non-interactive visual elements that visualize state inside UI finished products. Always consumed by a parent component — never used standalone.

## Demo

```tsx render
<IndicatorsDemo />
```

## Location

`interactive-os/ui/indicators/`

## ExpandIndicator

Chevron that rotates to show expand/collapse state.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| expanded | boolean | undefined | 확장 상태 |
| hasChildren | boolean | true | 자식 존재 여부. false이면 빈 공간 |
| variant | 'expand' \| 'tree' | 'expand' | CSS 너비 변형 |
| className | string | — | 추가 CSS 클래스 |

### Used by

TreeView, TreeGrid, DisclosureGroup, Accordion, MenuList

---

## CheckIndicator

Checkmark SVG inside a checkbox container.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| checked | boolean | undefined | 체크 상태 |
| className | string | — | 추가 CSS 클래스 |

### Used by

Checkbox

---

## RadioIndicator

Circle with inner dot, driven by ARIA parent state.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| className | string | — | 추가 CSS 클래스 |

### Used by

RadioGroup

---

## SwitchIndicator

Track with sliding thumb, driven by ARIA parent state.

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| className | string | — | 추가 CSS 클래스 |

### Used by

SwitchGroup

---

## SeparatorIndicator

Visual divider line (horizontal or vertical).

### Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | 방향 |
| className | string | — | 추가 CSS 클래스 |

### Used by

Breadcrumb, Menu, Toolbar
