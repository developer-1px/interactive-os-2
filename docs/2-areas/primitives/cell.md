# \<Aria.Cell\>

Multi-column grid support. Each row can contain multiple cells with independent focus via Arrow Left/Right.

```tsx render
<CellGridDemo />
```

## Usage

```tsx
import { Aria } from 'interactive-os/primitives/aria'
import { grid } from 'interactive-os/pattern/grid'

// grid({ columns: 3 }) creates a behavior with colCount=3
<Aria behavior={grid({ columns: 3 })} ...>
  <Aria.Item render={(node, state) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
      <Aria.Cell index={0}><span>{node.data.name}</span></Aria.Cell>
      <Aria.Cell index={1}><span>{node.data.role}</span></Aria.Cell>
      <Aria.Cell index={2}><span>{node.data.ok}</span></Aria.Cell>
    </div>
  )} />
</Aria>
```

## How it works

`<Aria.Cell index={n}>` reads the grid column focus state from the store (`__grid_col__` meta entity). The focused cell gets `tabIndex=0`, others get `tabIndex=-1`. Arrow Left/Right move between cells; Up/Down move between rows.
