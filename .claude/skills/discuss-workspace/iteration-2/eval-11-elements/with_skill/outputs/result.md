# Eval: 11개 요소 업데이트 검증

| # | Check | Pass/Fail | Evidence |
|---|-------|-----------|----------|
| 1 | 11 elements table (11 rows, element 11 = 장애물) | **PASS** | Line 27: `11 \| **장애물** \| 해결 실행 전 넘어야 할 것은? \| ... \| PRT` |
| 2 | TOC column mapping (④⑤⑥=CRT, ⑦⑧=EC, ⑨=FRT, ⑩=NBR, ⑪=PRT) | **PASS** | Lines 20-27: 모든 매핑 정확 |
| 3 | Core 1-9, trailing 10-11 | **PASS** | Line 125: "핵심 요소 (1~9)", Line 126: "후행 요소 (10~11): 부작용, 장애물" |
| 4 | Transition condition references "후행 요소(10~11)" | **PASS** | Line 131: "후행 요소(10~11)는 🟡 이상이면 전환 가능" |
| 5 | FRT gate has 5 reverse-verification questions | **PASS** | Lines 141-145: ⑨→⑤, ⑨→⑥, ⑨→⑦, ⑨→⑩, ⑧기각 — 5개 모두 존재 |
| 6 | Action plan mentions "⑪ 장애물을 반영한 실행 순서" | **PASS** | Line 29: "⑪ 장애물을 반영한 실행 순서로" |
| 7 | Section header says "### 11개 요소" | **PASS** | Line 11: `### 11개 요소` |
| 8 | No leftover "10개 요소" references (FRT gate name 제외) | **FAIL** | 3곳 잔존 — 아래 상세 |

## Check 8 상세: 잔존하는 "10개" 참조

| Line | 내용 | 문제 |
|------|------|------|
| 32 | "목적: 10개 요소를 **인과 순서대로 채우면서**" | "11개 요소"여야 함 |
| 47 | `for element in elements[1..10]:` | `elements[1..11]`이어야 함 (장애물도 이해도 추적 대상) |
| 123 | "10개 요소를 역할에 따라 나눈다:" | "11개 요소"여야 함 (바로 아래에서 1-9 + 10-11로 나누므로) |

Lines 135, 153의 "10요소 역검증 (Future Reality Tree)"은 FRT gate 고유 이름이므로 허용 범위.

## 종합

- **7/8 PASS**, **1 FAIL** (consistency)
- 요소 테이블, TOC 매핑, core/trailing 구분, 전환 조건, FRT gate, 액션 플랜, 섹션 헤더는 모두 정확하게 반영됨
- "10개 요소" → "11개 요소" 텍스트 치환이 3곳에서 누락됨
