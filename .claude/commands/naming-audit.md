---
description: "Audit naming consistency — synonym drift, format mismatch, semantic overloading"
---

# Naming Consistency Audit

You are performing a naming audit of the codebase. The purpose is to ensure every identifier tells the same story — the same concept always uses the same word, and the same word always refers to the same concept.

## Why this matters

Naming inconsistency is invisible technical debt. When `create`, `build`, and `make` all mean "instantiate a new thing" in different parts of the codebase, readers must hold three mental mappings instead of one.

## The Audit Process

### Step 0: Check for dictionary cache

Check if `.claude/naming-dictionary.md` exists.

- **If exists**: Read it, extract `last_commit` from frontmatter. Run `git merge-base --is-ancestor {last_commit} HEAD` to verify it's still valid.
  - **If valid**: Go to **Step 1a (incremental mode)**.
  - **If invalid** (force push, rebase, etc.): Go to **Step 1b (full mode)**.
- **If not exists**: Go to **Step 1b (full mode)**.

### Step 1a: Incremental mode (dictionary exists)

1. Run `git diff {last_commit}..HEAD --name-only -- 'src/'` to get changed files.
2. If no src/ files changed → report "No naming changes since last audit" and **stop**.
3. Scan only changed files for identifiers (exported symbols, file names, property keys).
4. Compare new/modified/deleted identifiers against the dictionary's Key Pool.
5. Go to **Step 4** (detect inconsistencies) with scope limited to the delta.
6. After reporting, go to **Step 6** (update dictionary).

### Step 1b: Full mode (no dictionary)

Scan `src/` for all meaningful identifiers (skip `node_modules`, `dist`, test files):

- **File names**: `create-behavior-context.ts`, `command-engine.ts`
- **Exported functions/classes**: `createStore`, `getChildren`, `focusCommands`
- **Exported types/interfaces**: `AriaBehavior`, `BehaviorContext`, `NodeState`
- **Constants**: `ROOT_ID`, `FOCUS_ID`, `SELECTION_ID`
- **Object property keys**: `focusNext`, `focusPrev`, `selectRange`
- **Directory names**: `behaviors/`, `plugins/`, `hooks/`

Use Grep and Glob to collect these. Then go to **Step 2**.

### Step 2: Tokenize into fragments

Split every identifier into atomic word fragments:

| Identifier | Fragments |
|---|---|
| `createBehaviorContext` | `create`, `behavior`, `context` |
| `create-behavior-context` | `create`, `behavior`, `context` |
| `SELECTION_ANCHOR_ID` | `selection`, `anchor`, `id` |

### Step 3: Build the Key Pool

Group fragments by role:

**Verbs**: `create`, `get`, `set`, `add`, `remove`, `update`, `find`, `dispatch`, `focus`, `select`, `expand`, `collapse`, `toggle`, `clear`, `reset`, `move`, `insert`, `delete`...

**Nouns**: `store`, `entity`, `node`, `command`, `engine`, `behavior`, `context`, `plugin`, `middleware`, `children`, `parent`, `focus`, `selection`, `anchor`, `state`...

**Adjectives**: `normalized`, `visible`, `focused`, `selected`, `expanded`, `previous`, `current`, `internal`, `controlled`, `batch`...

Build a frequency table: how many times each fragment appears and in which identifiers.

### Step 4: Detect inconsistencies

#### A. Synonym Drift (different words, same concept)

Common synonym clusters to check:
- `create` / `build` / `make` / `new`
- `get` / `find` / `fetch` / `retrieve` / `query`
- `remove` / `delete` / `destroy` / `clear`
- `update` / `set` / `modify` / `change` / `patch`
- `children` / `items` / `nodes` / `entries`
- `id` / `key` / `identifier`
- `callback` / `handler` / `listener` / `hook`
- `opts` / `options` / `config` / `settings` / `params`

#### B. Format Mismatch (same words, different format)

- `create-skill` (kebab) vs `createSkill` (camel) in the same layer
- `listbox` (one word) vs `list-box` (hyphenated)
- Cross-boundary conventions are normal (file=kebab, export=Pascal) — NOT an error

#### C. Semantic Overloading (same word, different concepts)

Flag only when the bare word is used ambiguously in the same scope or adjacent files. Qualified names that disambiguate (e.g., `BehaviorContext` vs `AriaInternalContext`) are fine.

### Step 5: Report

```
## Naming Audit Report

### Mode
{Incremental (N files changed since {last_commit}) | Full scan}

### Key Pool Summary
- Verbs: N unique (top 5: ...)
- Nouns: N unique (top 5: ...)
- Total identifiers scanned: N

### Findings

#### Synonym Drift
1. **create vs build** — `createStore` (core), `buildChart` (ui) — recommend: standardize on `create`

#### Format Mismatch
1. **listbox vs list-box** — `listbox.ts` (behavior) but `list-box.tsx` (ui) — recommend: pick one

#### Semantic Overloading
(none found — or list)

### Verdict
{CLEAN | N issues found}
```

### Step 6: Update dictionary

After the audit completes, update `.claude/naming-dictionary.md`:

- **Incremental mode**: Merge new/modified identifiers into existing dictionary. Remove deleted identifiers. Update `last_commit` to current HEAD.
- **Full mode**: Write the complete dictionary from scratch.

Dictionary format:

```markdown
---
last_commit: {HEAD hash}
last_updated: {YYYY-MM-DD}
---

## Verbs
| fragment | count | identifiers |
|----------|-------|-------------|
| create | 5 | createStore, createCommandEngine, ... |

## Nouns
| fragment | count | identifiers |
|----------|-------|-------------|
| store | 3 | createStore, NormalizedData, ... |

## Adjectives
| fragment | count | identifiers |
|----------|-------|-------------|
| normalized | 1 | NormalizedData |

## Synonym Map
| canonical | known synonyms | notes |
|-----------|---------------|-------|
| create | — | sole factory verb |
| remove | delete (command type only) | removeEntity (store API), crud:delete (command type) |
```

## Important Guidelines

- **Standard terminology wins.** ARIA roles, DOM API, React API names are never flagged.
- **Cross-boundary conventions are normal.** Files=kebab, exports=PascalCase/camelCase, constants=SCREAMING_SNAKE.
- **Focus on the delta.** In incremental mode, only report issues in changed identifiers.
- **Be specific.** Say exactly which identifiers conflict, in which files, and recommend which to keep.
- **Don't over-flag.** A codebase with 3 issues is healthy. Report only genuine inconsistencies.
