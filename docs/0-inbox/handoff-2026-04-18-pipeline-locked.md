---
created_at: 2026-04-18
session_id: chat-redesign-cmux-pipeline
---

# Handoff: 개발 파이프라인 5단계 + 게이트 + 엔티티 레이어 고정 + cmux식 /chat 재설계 시작

> 이 세션에서 **앞으로 모든 개발의 표준 순서**가 확정됐다. 5단계 파이프라인 + 3축 훅 게이트 + 도메인 엔티티 분리. 동시에 그 파이프라인을 적용해 `/chat` 의 cmux식 재설계 1차 (entities/chat + 디버그 뷰어) 를 완료. 다음 세션은 이 SSOT 위에서 SessionCard 구현부터 시작.

## ★ 개발 SSOT — 이걸 읽으면 다음 세션은 이 순서를 그대로 따름

### 단계 (Stages)

```
1. Requirement   — 자연어 스펙          docs/research/pipeline/{sample}/1-requirement.md
2. Data          — NormalizedData JSON   docs/research/pipeline/{sample}/2-data.json
                                          + entity 라면 src/entities/{도메인}/chatSchema.ts (Zod)
3. Components    — ui/ 부품 + domain_items 선언  3-components.json
4. Layout        — definePage + 정적 fixture     src/pages/{sample}/{Domain}DefinePage.ts
                                                  + Page{Domain}.tsx + {domain}Widgets.tsx
                                                  → puppeteer 4-layout.{png,dom.html}
5. Assembly      — store + commands + 인터랙션   src/pages/{sample}/{domain}Store.ts
                                                  + {domain}Context.ts
                                                  → puppeteer 5-assembly.{png,dom.html,check.md}
```

각 stage 완료 시 commit (4 commits per sample).

### 도메인 엔티티 (필수 분리)

```
src/entities/{domain}/
├── {domain}Schema.ts       Zod schema (z.object)
├── {domain}Types.ts        z.infer 타입 + ID 상수
├── {domain}Fixtures.ts     예시 데이터 (테스트/디버그/스토리)
├── {domain}Commands.ts     defineCommands (CRUD + state + UI)
├── {domain}Selectors.ts    derive 함수 (selectXxx)
├── {domain}Plugin.ts       definePlugin (engine 합성용)
├── index.ts                barrel — `import { ... } from '@entities/{domain}'`
└── ui/{Name}.tsx           도메인 아이템/셀 (취소선·상태 스타일 등 도메인 특화)
```

참고 구현: `src/entities/chat/`, `src/entities/deck/`, `src/entities/block/`.

### 정적 게이트 (자동 차단)

**`scripts/pipelineCheck.mjs {sample}` — 4축 검증**:

| 축 | 무엇을 검증 | 위반 사례 |
|----|-------------|-----------|
| **A** | `3-components.json` 의 모든 부품이 `src/pages/{sample}/*.tsx` 에 import 됨 | "PanelHeader 쓰겠다고 선언했는데 안 씀" |
| **B** | 수동 ARIA role 0건 (`role="list\|listitem\|tab\|row\|...`) | 직접 `<div role="list">` 작성 |
| **C** | `.map() + role="..."` 우회 패턴 0건 | NormalizedData 추출 → 수동 JSX |
| **D** | `domain_items[]` 선언이 entities/ 파일 존재 + import + `renderItem={Name}` 사용 | 도메인 item 선언만 하고 미구현 |

`scripts/pipelineSnapshot.mjs {sample} 5` 실행 시 자동 호출. 실패 시 exit 1.

### 훅 (Write/Edit 시점 차단) — `.claude/hooks/guardOsPatterns.mjs`

| Rule | 차단 | 대안 |
|------|------|------|
| 1 | pages/ 에서 primitives 직접 import | ui/ 완성품 |
| 2 | pages/ 에서 useAria/useAriaZone | 동상 |
| 6 | 수동 ARIA role (list/listitem/tab/row/cell/...) | 대응 ui/ 컴포넌트 |
| 9 | .tsx 에서 useState | engine, axis, 또는 uncontrolled form |
| 11 | renderItem 인라인 함수 | PascalCase 식별자 (ui/items/ 또는 entities/{domain}/ui/) |
| 29 | ax({ padding/gap/text/border/... }) Private/Removed 축 | role + surface 프리셋이 자동 주입 |

이 훅들을 우회하려 들지 말고 따르기. 우회가 필요하다면 그것 자체가 새 안티패턴.

### Public ax() 축 13개만 사용 (axPublic.ts)

`role | surface | cs | tone | textStyle | content | layout | placement | width | flex | clamp | aspect | interactive`

❌ 금지: padding, gap, border, text, scroll, weight, state, opacity (Private — role+surface 프리셋이 주입)
❌ `layout: 'column'` 없음 → `layout: 'stack'` 사용
✓ surface subset 매칭 필수: `role:'item'` → `'ghost' | 'display'` / `role:'control-group'` → `'sunken' | 'base' | 'raised' | 'ghost'`

### 검증된 워크플로우

이 세션에서 **3회 반복**으로 검증:
- v0 (Claude 직접): 부품 4/9, ARIA 위반 2건, 우회 1건 → 게이트 FAIL
- v1 (fresh agent + 훅+게이트 A/B/C): 부품 8/8, 위반 0건, **취소선 빠뜨림** (도메인 item 단계 누락)
- v2 (fresh agent + 훅+게이트 A/B/C/D + Rule 11 축소): **PASS** + 취소선 완성

→ "맥락 없는 fresh agent 도 이 SSOT만 따르면 같은 결과로 수렴" 확인됨.

---

## 완료 (이 세션 30+ 커밋, 시간순 그룹)

### A. Gemma 프롬프트 튜닝 루프 (보류)
| 커밋 | 내용 |
|------|------|
| (이전) c58d9510~ | Phase 1-a 관측 복구 + vP-1~vP-5 프롬프트 진화. **Iter 4에서 사용자 지시로 PAUSED** — 축 교체마다 새 결함이 생기는 한계로 단계별 관측 루프로 전환 |

### B. Todo 모바일 파이프라인 baseline 확립
| 커밋 | 내용 |
|------|------|
| `d2e6eaa0`~`d0980f6f` | v0 — Claude 직접 5단계 (실패: 4/9 부품, 위반 多) |
| `c4bcc3d8` | /todo/pipeline 뷰어 + GH Pages 배포 인프라 |
| `a859dcc3` | SPA 404.html fallback |
| `5d8d2c59` | **antipattern Rule 6 확장** — role="list/listitem/tab/row/..." 차단 |
| `4c6c5730` | **pipelineCheck.mjs 신규** — Stage 3↔5 정적 게이트 (A/B/C) |
| `2693146d` | reset — 1-requirement만 보존, fresh agent v1 진입 |
| `f9e55bda`~`3f2a56e5` | v1 (fresh agent): 4 stages PASS — 부품 8/8, 위반 0, 취소선 빠짐 |
| `aa85b834` | **Rule 11 축소** + **게이트 D축** (domain_items) 추가 |
| `6c6066e4` | reset v2 |
| `8a5885da`~`ace61c3d` | **v2 (fresh agent): A/B/C/D 모두 PASS + 취소선** |

### C. cmux식 /chat 재설계 1차
| 커밋 | 내용 |
|------|------|
| `157c7d42` | **@entities alias** + Rule 29 (Private 축 차단) |
| `fa3502e0` | **`src/entities/chat/` 7파일** — Schema/Types/Fixtures/Commands/Selectors/Plugin/Index. ChatSession 에 cmux 카드용 필드 7개 (cwd/branch/title/createdAt/lastUpdatedAt/unreadCount/lastReadAt) |
| `1a94b5b9` | /chat/entities 신규 — TreeView 로 fixture 출력 |
| `0b390f89` | TreeGrid 2열 (Key\|Value) + 라이브 chatStore 구독 |
| `cd6150e0` | **Zod introspection** — Schema 뷰어 (Field\|Type) |
| `158b5eb2` | **Schema + Value 두 단** |
| `fdd2d310` | **Commands 섹션 추가 — 3단** |
| `9206a852` | Commands 한 줄 5 컬럼 (Name\|Type\|Create\|Handler\|Meta) + `defineCommand` 에 `.create`/`.meta` 노출 |
| `df667fdc` | scripts/quickShot.mjs 도구 |

### D. 부수
| 커밋 | 내용 |
|------|------|
| `4c866d58` | (타 세션 — 사용자 직접) Liquid Glass / SurfacePanel 4단 |

## 남은 것

### 미완료 (다음 세션 첫 작업)

이 SSOT 적용해서 **/chat 의 cmux 식 재설계를 계속 진행**.

**1) cmux 식 SessionCard 구현 (현재 가장 가까운 다음 단계)**
- 위치: `src/entities/chat/ui/SessionCard.tsx` + `SessionCard.module.css`
- 패턴: TodoItem (취소선) 과 동일 — render function 으로 ListBox renderItem 에 전달
- 표시: 현재 fixture 의 SessionCardModel 필드들 — title / cwd / branch / preview / 메시지 카운트 / unread badge / 응답 대기 ring
- 게이트 D축 검증 가능 — `domain_items: [{ name: "SessionCard", path: "src/entities/chat/ui/SessionCard.tsx", consumed_by: "ListBox.renderItem" }]`
- ASCII 미리보기는 docs/research/cmux/...md 에 있는 것을 따름 (이 세션 대화 중에 그렸으나 별도 파일 미저장 — handoff 본문에 옮겨야 함)

```
╭───────────────────────────────╮
│ ◉   session a3f9              │  ← status dot (running/idle/waiting)
│ ─── ───────────────────────── │
│ ~/aria · main                 │  ← cwd · branch (caption)
│ ▸ "refactoring todoStore..."  │  ← latest message preview (clamp:1)
│ 47 msgs · 2m ago     ●3       │  ← stats + unread badge (right)
╰───────────────────────────────╯
```

**2) `/chat` 의 SessionsPanel 을 SessionCard 기반으로 교체**
- 현재 `src/pages/chat/chatWidgets.tsx` SessionsPanel 은 `id.slice(0, 8)` + 작은 dot. ListBox 의 renderItem 으로 SessionCard 주입
- chatStore (Map 기반) → entities/chat selectors 가 받을 수 있는 NormalizedData 어댑터 필요. 또는 chatStore 자체를 NormalizedData 기반으로 마이그레이션 (큰 작업 — 별도 PRD 권장)

### 이후 (backlog)

- **`docs/BACKLOGS.md`** 또는 `docs/5-backlogs/` 로 분리 추천 항목:
  - `cmux-empty-state-redesign` — 빈 상태 큰 CTA + 단축키 힌트 + Recent 섹션 (B축)
  - `cmux-attention-ring` — 응답 대기 시 파란 glow ring + 사이드바 뱃지 (C축)
  - `chat-store-normalized-migration` — chatStore Map → NormalizedData 전환 (큰 작업)
  - `chat-entity-extras-p0` — notifications / waitingFor / pendingPermission 필드 (cmux 핵심 기능)
  - `chat-entity-extras-p1` — listeningPorts / linkedPR / dirtyFiles / totals 누적 usage
  - `chat-message-entity` — ChatMessage 를 별도 NormalizedData entity 로 모델링
  - `gemma-prompt-tuning-resume` — 단계별 관측 루프 적용 후 평가자 역할 명확해지면 재개 (현재 vP-5 가 baseline)

### 검증 미수행 (sanity)
- `pnpm typecheck` 전체 통과 못함 (Bundle D-3 잔여 에러 다수, 내 변경 외) — 신규 파일들은 자체 typecheck 모두 통과 확인
- `pnpm test` 미수행
- `pnpm lint` 미수행
- 다음 세션은 SessionCard 구현 후 `pnpm typecheck 2>&1 | grep "entities/chat\|pages/chat"` 로 본인 영역만 검증하는 방식 권장

## 컨텍스트

### 핵심 파일

**개발 SSOT 인프라**:
- `.claude/hooks/guardOsPatterns.mjs` — Rule 6/11/29 핵심
- `scripts/pipelineCheck.mjs` — 4축 게이트
- `scripts/pipelineSnapshot.mjs` — 단계별 puppeteer + 자동 게이트
- `scripts/quickShot.mjs` — viewport 지정 단일 스크린샷
- `.claude/skills/antipattern/SKILL.md` — 안티패턴 → 훅 변환 절차 + 체크리스트 #9
- `vite.config.ts` + `tsconfig.app.json` — `@entities/*` alias

**Chat 도메인**:
- `src/entities/chat/` — 7파일 (Schema/Types/Fixtures/Commands/Selectors/Plugin/Index)
- `src/pages/chat/PageChatEntities.tsx` — 3단 디버그 뷰어 (Schema/Value/Commands)
- `src/pages/chat/chatEntityTreeData.ts` — 변환기 (Zod introspection + value walker + commands flatten)
- `src/pages/chat/chatStore.ts` — 기존 Map 기반 store (마이그레이션 필요)
- `src/pages/chat/chatWidgets.tsx` — 기존 SessionsPanel (재설계 대상)
- `src/AppShell.tsx` — `MOBILE_ROUTES` 에 `/todo` 추가됨

**Engine 변경**:
- `src/interactive-os/engine/defineCommand.ts` — creator 에 `.create`, `.meta` read-only 노출 (디버그 introspection 용)

### 관련 memory

다음 세션에서 자동 로드되어 있을 것:
- `project_ax_public_private_split` — Public 13축/Private 7축 분리
- `feedback_ratchet_convergence` — baseline + 1~3 gap 수정
- `feedback_render_function_is_slot` — Slot=render function 정의

### 주의사항 (다음 세션이 놓치면 안 되는 것)

1. **타 세션 작업물 존재** — git status 의 `M src/interactive-os/ui/FilePreview.tsx` `M src/interactive-os/ui/MarkdownViewer.css` `M src/main.tsx` 등은 내 변경이 아님. `git checkout --` 로 되돌리지 말 것.
2. **`pnpm build` ≠ `pnpm exec vite build`** — 전자는 tsc 게이트가 코드베이스 기존 에러로 실패. Pages 배포는 후자만 사용 (`build:pages` 스크립트가 그렇게 정의됨).
3. **fresh agent 검증 패턴** — 이 SSOT 의 진정한 강도는 "맥락 없는 agent 도 같은 결과로 수렴하는가"로 측정. 큰 변경 후 reset → agent 재실행으로 검증하는 루틴 권장.
4. **Map vs NormalizedData 이중 store** — chatStore (Map) 와 entities/chat (NormalizedData spec) 가 공존. Phase 1 은 entities/chat 의 fixture 만 디버그 뷰어에서 시각화. Phase 2 (마이그레이션) 가 별도 PRD.
5. **ChatSession 이 chatStore.ts 와 entities/chat/chatTypes.ts 두 군데에 정의** — 다음 세션이 확장 시 어디를 SSOT 로 할지 명시 필요. 현재 entities/chat 이 더 풍부하지만 라이브 코드는 chatStore 사용.

## 이어받는 법 (다음 세션 AI가 읽을 지시문)

세션 시작 시:
1. 이 handoff 파일 (`docs/0-inbox/handoff-2026-04-18-pipeline-locked.md`) 을 읽는다
2. 위의 ★ 개발 SSOT 섹션을 첫 단계로 인지 — 이게 표준
3. **첫 행동**: `src/entities/chat/ui/SessionCard.tsx` 와 `SessionCard.module.css` 생성. 패턴은 `src/entities/todo/ui/TodoItem.tsx` (이 세션에서 fresh agent 가 만든 것) 과 동일. ListBox 의 renderItem 으로 전달 가능한 render function 형태. SessionCardModel 의 모든 필드 표시. ASCII 미리보기는 위 "남은 것 1)" 섹션 참조.
4. 만들고 나면 `/chat` 의 chatWidgets.tsx SessionsPanel 을 교체. chatStore Map → entities/chat NormalizedData 어댑터가 필요하면 별도 PRD 로 분리하고 본 작업은 fixture 기준으로 먼저 시각화 가능 화면만 구현.
5. 게이트 통과 확인: `node scripts/pipelineCheck.mjs chat` (실행 가능하려면 chat sample 에 1-requirement.md/2-data.json/3-components.json 이 필요. 없다면 게이트 적용은 P2 로 미루고 시각 검증만).

`/handoff` Step B 가 자동으로 이 파일을 집어가도록 frontmatter 의 `consumed_by` 는 비워둠.
