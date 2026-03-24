- `docs/PROGRESS.md`는 concept map이다. 모듈 추가/삭제 시 행을 갱신하고, Maturity와 Gaps는 /retrospect 시 반영한다
- discuss 시작 시 메모리를 로드한다
- 파일명 = 주 export 식별자 (예: `useAria.ts` → `export function useAria`, `TreeGrid.tsx` → `export function TreeGrid`). multi-export 파일은 모듈명 camelCase (예: `keymapHelpers.ts`). kebab-case 파일명 금지. rename 시 반드시 `git mv` 사용.
- 테스트 원칙: **계산은 unit, 인터랙션은 통합(userEvent → DOM/ARIA 상태 검증)**. mock 호출 검증(`toHaveBeenCalled` 등) 금지 — 테스트를 위한 테스트가 된다. 통합테스트는 `user.keyboard()` → DOM 결과로 검증.
- 커밋 전 `/simplify` 필수. `/go` 경로든 직접 구현이든 경로 무관.
- CSS 작성 시 `/design-implement` 필수. DESIGN.md 5개 번들(surface/shape/type/tone/motion)을 세트로 사용. `frontend-design` 스킬 사용 금지 — 항상 디자인 시스템 기반으로 작업.
- 테스트 실패 시 원복 정책:
  1. `bash scripts/activeSessions.sh $SESSION_ID`로 동시 작업 여부 확인
  2. 동시 작업 중(exit 1): `.claude/agent-ops/{session_id}.ndjson`에서 내 수정 파일 목록을 추출하고, 실패 테스트와 무관하면 무시하고 진행
  3. 나만 작업 중(exit 0): 모든 실패에 책임, 수정 진행
  4. **어떤 경우든 `git stash`로 전체 원복 금지** — 필요 시 `git checkout -- [내 파일만]`
