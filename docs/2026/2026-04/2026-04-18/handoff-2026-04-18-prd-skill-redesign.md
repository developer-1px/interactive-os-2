---
id: prdSkillRedesign
type: handoff
slug: prdSkillRedesign
title: 'Handoff: PRD 스킬 책임 분해 중심 재설계'
tags: [untagged]
created: 2026-04-19
updated: 2026-04-18
---
# Handoff: PRD 스킬 책임 분해 중심 재설계

> /prd 스킬의 본질을 재정의하고 재작성. 6 에이전트 6 섹션 → 사고 흐름(요구사항 → 책임 분해 → Contract → WHY → HOW → WHAT). 책임 분해 SSOT를 CLAUDE.md에 신설. liquid-glass 케이스 시뮬레이션으로 새 스킬의 우위를 정성 검증.

## 완료

| 커밋 | repo | 내용 |
|------|------|------|
| `fb253a15` | aria/`pipeline-ssot-handoff` | docs(claude.md): FE 책임 맵 섹션 추가 — PRD 책임 분해 SSOT |
| `3cb5754` | plugin-repo/`main` | feat(prd): 책임 분해 중심으로 재작성 — 6 에이전트→사고 흐름 |

memory 갱신: `feedback_prd_interface_convergence` 책임 분해 중심으로 본문 재작성, MEMORY.md 인덱스 한 줄 갱신.

## 남은 것

### 미완료 (이어가도 되는 항목)

1. **main 브랜치에 FE 책임 맵 가져오기 결정** — 내 commit `fb253a15`는 `pipeline-ssot-handoff`에만 존재. main에 cherry-pick 또는 PR 머지가 필요한지 사용자 판단 필요. 다른 세션이 main에서 활성 작업 중이었음

### 이후 (backlog)

- **PRD 새 스킬의 실측 검증** — 다음 실제 작업에서 새 /prd 스킬을 한 번 돌리고 결과 평가. 사용자가 "써보면서 판단" 의사 표명. 별도 backlog 파일 불필요 — 다음 PRD 작성 시 자연 검증
- **자동 채점 스크립트(옵션 C)** — 메트릭(책임 행 수 ÷ 변경 파일 수, placeholder 잔존 건수 등)으로 기존 6 PRD 일괄 채점. 새 스킬 정착 후 데이터가 쌓이면 가치 있음. 지금은 보류

## 컨텍스트

- **변경 스킬**: `.claude/skills/prd/SKILL.md` (= plugin-repo/skills/prd/SKILL.md, symlink)
- **CLAUDE.md 신설**: `## FE 책임 맵 (PRD 책임 분해 SSOT)` 섹션 — 19개 책임 카테고리 × 파일명 규칙 × 레이어 표
- **검증 데이터**: liquid-glass(`docs/2-areas/styles/prds/ax-liquid-glass-prd.md`)는 §2까지만 채워지고 중도 포기한 케이스. 새 스킬에선 책임 분해 10행 + placeholder 강제 검출로 처리 가능

### 핵심 원리 (다음 세션 AI가 놓치면 안 되는 것)

1. **PRD = 책임별 파일 분리** — interface 정의가 아니라 "기성 FE 책임 맵에 요구사항을 투사하여 작은 파일로 미리 분리"가 본질
2. **§1 책임 분해 표가 심장** — §2~§6은 §1 행에 채워넣는 부속물. §1 없으면 병렬 dispatch 불가
3. **placeholder 금지** — `(?)`, "TBD" 등은 §1 책임 행으로 escalate. liquid-glass의 4건 잔존이 실패 원인 중 하나
4. **이관은 /go만** — 이전 /do 분기는 제거됨

## 이어받는 법

세션 교체 후 `/handoff`로 이 파일을 집어가면, 다음 첫 행동:

**main 브랜치에 FE 책임 맵 commit을 어떻게 가져올지 사용자에게 확인.** 옵션:
- A) `git cherry-pick fb253a15` from main
- B) `pipeline-ssot-handoff` PR 생성하여 main 머지
- C) 그대로 두고 다른 세션 작업과 자연 머지 대기

#kind/handoff
