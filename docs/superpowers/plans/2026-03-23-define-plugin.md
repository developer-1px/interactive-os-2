# definePlugin Plan

> PRD: docs/superpowers/specs/2026-03-23-define-plugin-prd.md

## Tasks

### Task 1: definePlugin 인프라 (독립)
- [ ] `src/interactive-os/core/definePlugin.ts` 생성
  - definePlugin(PluginConfig) → Plugin
  - requires의 middleware 합성 (reduceRight)
  - name, intercepts 메타 부착
- [ ] `src/interactive-os/core/types.ts` Plugin 인터페이스 확장
  - name?: string, intercepts?: readonly string[] 추가
- [ ] `src/interactive-os/core/createCommandEngine.ts` intercepts 검증 추가
  - plugins의 intercepts vs commands 교차 검증 → console.warn

### Task 2: clipboard 리팩토링 (Task 1 의존)
- [ ] TYPE 상수 export: PASTE, CUT, COPY
- [ ] command.type에 상수 사용
- [ ] module-level canAcceptFn/canDeleteFn 제거
- [ ] paste(targetId, canAccept?, canDelete?) 시그니처 확장
- [ ] findPasteTarget에 canAccept를 인자로 전달
- [ ] cut에 canDelete를 인자로 전달
- [ ] clipboard({ canAccept }) deprecated 경고 + 하위호환
- [ ] definePlugin 래핑

### Task 3: zodSchema 플러그인 (Task 2 의존)
- [ ] `src/interactive-os/plugins/zodSchema.ts` 생성
  - childRules → canAccept/canDelete 파생 (cms-schema.ts의 cmsCanAccept 로직 범용화)
  - middleware: PASTE/CUT command 가로채서 canAccept/canDelete 주입
  - intercepts: [PASTE, CUT] 선언

### Task 4: crud + focusRecovery 번들 (Task 1 의존)
- [ ] crud()에 requires: [focusRecovery(options)] 추가
- [ ] CrudOptions에 isReachable 전달
- [ ] definePlugin 래핑

### Task 5: 나머지 플러그인 definePlugin 전환 (Task 1 의존)
- [ ] core, dnd, rename, history, spatial, combobox, typeahead — definePlugin 래핑
- [ ] focusRecovery — definePlugin 래핑 (독립 export 유지)

### Task 6: CmsLayout + 테스트 업데이트 (Task 3 의존)
- [ ] CmsLayout: clipboard({ canAccept, canDelete }) → clipboard() + zodSchema(childRules)
- [ ] clipboard-overwrite.test.ts: zodSchema 경로 테스트 추가
- [ ] 기존 테스트 전부 통과 확인

## 실행 순서

Task 1 → Task 2 → Task 3, Task 4 (병렬) → Task 5 → Task 6
