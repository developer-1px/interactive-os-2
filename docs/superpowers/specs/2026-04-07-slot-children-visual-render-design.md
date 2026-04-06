# Slot Children 시각적 렌더링 + Auto-drill

**Date:** 2026-04-07
**Status:** Approved

## Problem

CMS에서 2+ inline-editable 필드를 가진 노드(`cta`, `value-item`, `quote`, `article`, `showcase-item`, `stat-card`)의 slot children이 `sr-only`로 렌더되어:

1. **드릴다운 버그**: Enter로 slot 부모에서 slot child로 진입 시, focus가 시각적으로 보이지 않는 1x1px 요소로 이동 → 사용자에게 아무 일도 안 일어난 것처럼 보임
2. **선택 불가**: 개별 텍스트 필드(버튼, 제목, 설명 등)를 독립적으로 선택/편집할 수 없음
3. **의미없는 wrapper 선택**: slot 부모(cta 등) 자체는 의미 단위가 아닌데 선택 대상이 됨

## Solution

### 1. slotRender — slot별 시각적 렌더 함수

`NodePresentationDesc`에 `slotRender` 필드 추가:

```ts
slotRender?: (slotName: string, data: Record<string, unknown>, locale: Locale) => ReactNode
```

각 multi-field 노드 타입이 슬롯별 렌더를 정의. slot 부모의 `render`는 래핑 컨테이너 역할만 하고, 개별 슬롯이 시각적 내용을 담당.

**대상 노드 (6개):**

| Type | Slots | 슬롯별 렌더 |
|------|-------|-------------|
| `cta` | primary, secondary | 주 버튼(`<button>` + ArrowRight), 보조 버튼(`<button>` + ChevronRight) |
| `value-item` | title, desc | `<h3>`, `<p>` |
| `quote` | text, attribution | `<p>` (blockquote 내), `<cite>` |
| `article` | title, category | `<h3>`, `<span>` (meta) |
| `showcase-item` | label, desc | `<span>`, `<span>` |
| `stat-card` | value, label, desc | 3개 `<span>` (value는 non-locale) |

### 2. CmsCanvas — sr-only → 시각적 렌더 교체

현재:
```tsx
{slotKids.map(childId => (
  <div key={childId} {...slotRest} className="sr-only" />
))}
```

변경:
```tsx
{slotKids.map(childId => {
  const slotName = getSlotName(store, nodeId, childId)
  const presentation = nodeRegistry.get(type)
  const SlotTag = presentation?.slotRender ? /* slot에 맞는 tag */ : 'div'

  return (
    <SlotTag key={childId} {...slotProps}
      onClick={(e) => handleNodeClick(childId, e)}
    >
      <CmsInlineEditable nodeId={childId} data={parentData} locale={locale} ... />
    </SlotTag>
  )
})}
```

slot 부모의 `render`는 slot children을 감싸는 컨테이너 역할만:
- `cta`: `<div className={cmsHeroActions}>` (flex-row wrapper)
- `value-item`: `<div className={cmsValueItemContent}>` (flex-col)
- `quote`: `<blockquote>` + quote mark
- etc.

### 3. isSlotParent — auto-drill 판별

```ts
// cmsSchema.ts
export function isSlotParent(data: Record<string, unknown>): boolean {
  const type = data.type as string
  if (!type) return false
  const fields = fieldsOf(type)
  const inlineFields = fields.filter(f => !FORM_ONLY_FIELD_TYPES.has(f.fieldType))
  return inlineFields.length >= 2
}
```

### 4. Auto-drill 동작

**클릭**: slot 부모 영역 클릭 시, 첫 번째 slot child로 포커스 이동 (spatialClickNavigate에서 처리)

**키보드**:
- slot 부모에 도달하면 자동으로 Enter 없이 첫 slot child로 focus 이동 (ArrowUp/Down으로 section 내 탐색 시)
- 또는 slot 부모에서 Enter → 첫 slot child로 진입 (기존 드릴다운 로직이 이미 이렇게 동작, 시각적 렌더만 추가하면 해결)

**Escape**: slot child에서 Escape → slot 부모로 복귀 → 다시 Escape → section 레벨로

### 5. 인라인 편집

각 slot child는 `expandEntitySlots`에 의해 단일 텍스트 필드를 가진 entity로 변환됨. F2/Enter 시 `CmsInlineEditable`의 기존 rename 로직이 그대로 동작:

- slot child의 data에서 value 추출
- contentEditable span으로 편집
- confirmRename → 부모 entity의 해당 필드 업데이트

### 6. getSlotName 유틸리티

```ts
// cmsSchema.ts or createStore.ts
export function getSlotName(store: NormalizedData, parentId: string, childId: string): string | null {
  const slotMap = store.slots?.[parentId]
  if (!slotMap) return null
  for (const [name, id] of Object.entries(slotMap)) {
    if (id === childId) return name
  }
  return null
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/pages/cms/cmsNodePresentation.tsx` | 6개 타입에 `slotRender` 추가, `render`를 container 역할로 변경 |
| `src/pages/cms/CmsCanvas.tsx` | sr-only → slotRender 기반 시각적 렌더, auto-drill 클릭 처리 |
| `src/pages/cms/cmsSchema.ts` | `isSlotParent()` 추가 |
| `src/pages/cms/cmsRenderers.ts` | re-exports |
| `src/interactive-os/store/createStore.ts` | `getSlotName()` 추가 (optional) |

## Non-goals

- 데이터 모델 변경 (slot 시스템 그대로 유지)
- container childRules 변경 없음
- 새 노드 타입 추가 없음
