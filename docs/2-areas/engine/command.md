# Command

Every user action is a Command with execute() and undo(). Middleware intercepts every dispatch. Try CRUD operations and watch the log.

```tsx render
<EngineCommandDemo />
```

## Command

```ts
interface Command {
  type: string
  payload: unknown
  execute(store: NormalizedData): NormalizedData
  undo(store: NormalizedData): NormalizedData
}

// Every command is reversible.
// BatchCommand composes multiple commands into one atomic operation.
// execute = reduce left, undo = reduce right (reversed).
```

## Middleware

```ts
type Middleware = (next: (cmd: Command) => void) => (cmd: Command) => void

// Composed right-to-left, executed left-to-right (outside-in).
// history()       → captures snapshots before execute
// focusRecovery() → validates focus after execute
// zodSchema()     → rejects invalid mutations before execute
```
