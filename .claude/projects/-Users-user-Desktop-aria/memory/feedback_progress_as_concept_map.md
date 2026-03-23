---
name: feedback_progress_as_concept_map
description: PROGRESS.md는 task tracker가 아닌 concept map + maturity tracker. 행 추가/삭제는 즉시, Maturity·Gaps는 /retro 시 갱신.
type: feedback
---

PROGRESS.md = concept map + maturity tracker, task checklist가 아님.

**Why:** 체크리스트는 매 커밋 append-only로 비대화되고, 완료 항목은 git log와 중복. LLM에게 가치 있는 건 "뭐가 있고 뭐가 없는가"(구조)와 "얼마나 됐는가"(성숙도).

**How to apply:**
- 새 모듈 추가/삭제 시 → 해당 섹션에 행 추가/삭제 (즉시)
- Maturity 단계 전환, Gaps 해결/발견 → /retro 시 갱신
- 버그 수정, 테스트 추가, 리팩토링 → 업데이트 안 함
- Maturity 5단계: Concept → Prototype → Validated → Integrated → Production (TRL 기반)
