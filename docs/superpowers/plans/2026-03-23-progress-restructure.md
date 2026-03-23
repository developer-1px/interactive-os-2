# PROGRESS.md Concept Map 전환 — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PROGRESS.md를 task checklist에서 concept map + maturity tracker로 전환한다.

**Architecture:** 기존 파일 아카이브 → 새 파일 작성(샘플 기반) → [P1]/[P2] 항목 BACKLOGS.md 이전 → CLAUDE.md 규칙 갱신 → retro 스킬에 PROGRESS.md 갱신 단계 추가.

---

### Task 1: 기존 PROGRESS.md 아카이브 + [P1]/[P2] 이전

**Files:**
- Move: `docs/PROGRESS.md` → `docs/PROGRESS-ARCHIVE.md`
- Modify: `docs/BACKLOGS.md`

- [ ] **Step 1: 기존 PROGRESS.md에서 [P1]/[P2] 미완료 항목 추출**

기존 파일에서 `[ ]` + `[P` 패턴을 검색하여 미완료 항목 목록 작성.

- [ ] **Step 2: BACKLOGS.md에 미완료 항목 이전**

각 항목을 BACKLOGS.md에 추가. 출처: "PROGRESS.md 전환 (2026-03-23)"

- [ ] **Step 3: 기존 파일을 PROGRESS-ARCHIVE.md로 이동**

```bash
git mv docs/PROGRESS.md docs/PROGRESS-ARCHIVE.md
```

- [ ] **Step 4: 커밋**

```bash
git commit -m "chore: archive PROGRESS.md, migrate [P1]/[P2] to BACKLOGS.md"
```

---

### Task 2: 새 PROGRESS.md 작성

**Files:**
- Create: `docs/PROGRESS.md`
- Reference: `docs/0-inbox/23-[sample]progress-v2.md`

- [ ] **Step 1: 샘플을 기반으로 PROGRESS.md 작성**

샘플(`23-[sample]progress-v2.md`)의 구조를 따르되, 다음을 보강:
- 각 모듈의 Maturity 레벨을 정직하게 재평가
- Gaps 열을 코드베이스 현실에 맞게 채우기
- 미구현 모듈(이탤릭)은 BACKLOGS.md에도 있는 항목과 일치 확인

헤더에 관리 규칙을 명시:
```markdown
# interactive-os — Architecture Map

> Concept Map + Maturity Tracker. Task list가 아님.
> **갱신 시점:** 모듈 추가/삭제 시 행 갱신. Maturity·Gaps는 /retro 시 반영.
> **Maturity:** Concept → Prototype → Validated → Integrated → Production
```

- [ ] **Step 2: 커밋**

```bash
git commit -m "docs: restructure PROGRESS.md as concept map + maturity tracker"
```

---

### Task 3: CLAUDE.md 규칙 갱신

**Files:**
- Modify: `/Users/user/Desktop/aria/.claude/CLAUDE.md`

- [ ] **Step 1: 기존 규칙 교체**

```diff
- 기능 완료 및 커밋 시 `docs/PROGRESS.md` 체크리스트를 업데이트한다
+ `docs/PROGRESS.md`는 concept map이다. 모듈 추가/삭제 시 행을 갱신하고, Maturity와 Gaps는 /retro 시 반영한다
```

- [ ] **Step 2: 커밋**

```bash
git commit -m "docs: update CLAUDE.md — PROGRESS.md management rule"
```

---

### Task 4: 검증

- [ ] **Step 1: PROGRESS.md < 100줄 확인**
- [ ] **Step 2: BACKLOGS.md에 이전된 [P1]/[P2] 항목 확인**
- [ ] **Step 3: CLAUDE.md 규칙 확인**
- [ ] **Step 4: PROGRESS-ARCHIVE.md 존재 확인**
