---
id: 4-archive/handoffs/handoff-2026-04-11-skill-diet
type: handoff
slug: skillDiet
title: 'Handoff: 스킬 다이어트 — discuss 12요소 + 34→19 구조 설계'
tags: [untagged]
created: 2026-04-11
updated: 2026-04-15
summary: '2026-04-11 세션에서 discuss 프레임 확장(⑧보유자산) + 스킬 다이어트 논의'
legacy:
  consumed_by: 2026-04-15-archived
  consumed_at: 2026-04-15
  status: archived
  kind: handoff
  topics: [4-archive]
  relates: []
  supersedes: []
---
# Handoff: 스킬 다이어트 — discuss 12요소 + 34→19 구조 설계

> 2026-04-11 세션에서 discuss 프레임 확장(⑧보유자산) + 스킬 다이어트 논의

## 완료

| 변경 | 내용 |
|------|------|
| `discuss/SKILL.md` | 11→12요소 재번호, ⑧보유자산 추가, 역검증 6개로 확장 |
| `prd/SKILL.md` | 12요소 반영, FRT 변환에 Assets 행 추가 |
| `use/SKILL.md` | 12요소 반영 |

> 주의: 스킬 파일은 `.claude/skills/`에 있어 git에 안 잡힘. 플러그인 레포(plugin-repo)에 커밋 필요.

## 남은 것

### 백로그: 스킬 다이어트 (34→19)

discuss에서 합의된 구조이나 아직 실행 안 함.

**새 파이프라인:**
```
/discuss → /groom → /prd → /plan → /go
```

**신규 스킬 2개 (만들어야 함):**
- `groom` — Definition 단계. R(기존 구조에 분류/매칭)이 기본, C(새 구조 설계)는 fallback. story/ia/wireframe 흡수.
- `plan` — Planning 단계. WBS + scheduling + staffing(cast) + briefing + acceptance criteria. cast/do 흡수. superpowers:writing-plans 대체.

**기존 스킬 합치기 (만들어야 함):**
- `review` — use/improve/improve-design/design-review/screen-test 흡수. 모드로 분기.
- `close` 확장 — area/publish/improve-skill 흡수.
- `inbox` 확장 — para 흡수.

**유지 (변경 없음, 19개):**
```
기획:     discuss, prd, go (groom/plan은 신규)
마무리:   close, handoff
횡단:     fix, explain, doubt, reframe, conflict
리팩토링: srp, ocp, refactor-collect, antipattern (각각 독립, 매뉴얼 필요)
유틸:     inbox, backlog
독립:     design-extract
보류:     demo-coverage (실험)
```

**삭제/흡수 (15개):**
- story, ia, wireframe → groom
- cast, do → plan, go
- use, improve, improve-design, design-review, screen-test → review
- area, publish, improve-skill → close
- para → inbox
- reframe-workspace → 삭제

**핵심 원칙 (discuss에서 합의):**
1. 한 칸반 단계 = 한 진입점 (스킬)
2. R(분류/매칭) > C(생성) — 이미 있는 것 먼저
3. 스킬(사용자 진입) vs 에이전트(자동 디스패치) 구분
4. 리팩토링 스킬은 합치면 안 됨 — 각 기법의 세부 매뉴얼 필요

## 컨텍스트

- **관련 memory**: `project_planning_pipeline`, `project_do_skill`, `feedback_ralph_pipeline`
- **주의**: planning_pipeline memory는 이 다이어트 결과로 업데이트 필요 (story→ia→wireframe→prd→do가 discuss→groom→prd→plan→go로 변경)
- **주의**: 스킬 파일은 플러그인 레포(plugin-repo)에 커밋해야 함

## 다음 행동 제안

1. 우선순위 높은 것부터: `/groom` 스킬 작성 → `/plan` 스킬 작성
2. 그 다음: `/review` 합치기 → `/close` 확장 → `/inbox` 확장
3. 마지막: 흡수된 스킬 삭제, memory 업데이트
