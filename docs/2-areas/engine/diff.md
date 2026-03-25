# Diff

computeStoreDiff detects what changed. applyDelta reverses or replays any diff. Modify the list and inspect each change.

```tsx render
<EngineDiffDemo />
```

## StoreDiff

```ts
interface StoreDiff {
  path: string
  kind: 'added' | 'removed' | 'changed'
  before?: unknown
  after?: unknown
}

// computeStoreDiff(prev, next) → StoreDiff[]
// applyDelta(store, diffs, 'forward' | 'reverse') → NormalizedData
// Meta-entities (__focus__, __selection__) are tracked field-by-field.
```
