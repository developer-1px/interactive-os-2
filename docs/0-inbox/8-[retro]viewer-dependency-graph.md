# Retro: Viewer Dependency Graph — 2026-03-20

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-20-viewer-dependency-graph-prd.md
- **Diff 범위:** 33d03f7..27b96ea
- **커밋 수:** 1
- **변경 파일:** 3 (vite-plugin-fs.ts, PageViewer.tsx, PageViewer.css)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | ✅ | — | — |
| 2 | 인터페이스 | ✅ | — | — |
| 3 | 산출물 | ✅ | — | — |
| 4 | 경계 | 🔀 | import=0, importedBy=0일 때 PRD는 "현재 노드만 표시", 구현은 "그래프 미표시" | L1 |
| 5 | 금지 | ✅ | — | — |
| 6 | 검증 | 🔀 | 검증 #4가 경계 갭과 동일 원인 | L1 |

**일치율:** 4/6

## 갭 상세

### 🔀 의도와 다르게 구현됨

**경계 #1 + 검증 #4:** PRD에서 "import 0개 → 현재 파일 노드 + importedBy만 표시"라고 명시. 구현에서는 `imports.length + importedBy.length === 0`이면 그래프를 숨기므로, import=0이지만 importedBy>0인 경우에는 정상 동작한다. 하지만 import=0 + importedBy=0인 파일에서 PRD는 "현재 노드만이라도 표시"를 기대하는데 구현은 "미표시".

**판단:** 실용적으로 import도 importedBy도 없는 파일에서 노드 1개짜리 그래프를 보여줄 가치가 낮음. 이는 PRD가 과도했을 수 있음. 코드 수정보다 **PRD를 현실에 맞게 정정**하는 것이 적절.

## 계층별 개선 제안

### L1 코드 — 백로그
- [ ] PRD 경계 #1 정정: "import=0, importedBy=0 → 그래프 미표시"로 변경 (코드가 맞고 PRD가 과도)

### L2~L5
(해당 없음)

## 다음 행동
- L1: PRD 문구 정정만 필요 (코드 변경 없음)
