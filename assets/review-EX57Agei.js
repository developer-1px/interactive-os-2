import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`# Miller Columns — Design Review

## 요약

- 리뷰 일시: 2026-04-08
- 라우트: /docs
- 시나리오: 6개 (5개 실행, 1개 데이터 부재로 skip)
- 독립 채점자: sonnet
- **평균 점수: 4.5/10**

## 시나리오별 결과

### default: 기본 상태
- **점수: 8/10**
- P0 위반: #7 hover 피드백 없음 (-1)
- P1 위반: #11 텍스트 위계 없음 (-1)

### folder-selected: 1-projects 선택
- **점수: 7/10**
- P0 위반: #7 hover 없음 (-1), #9 WCAG 대비 미달 (-2)

### deep-drill: 4단계 drill-in
- **점수: 3/10**
- P0 위반: #6 ancestor 경로 표시 없음 (-2), #7 hover 없음 (-1), #8 빈 공간 과다 (-2), #9 WCAG 대비 (-2)

### file-preview: .md 파일 프리뷰
- **점수: 4/10**
- P0 위반: #6 ancestor 없음 (-2), #7 hover 없음 (-1), #9 WCAG 대비 (-2)
- P1 위반: #12 컬럼-프리뷰 경계 불명확 (-1)

### many-items: 0-inbox (20+ 파일)
- **점수: 2/10**
- P0 위반: #6 ancestor 없음 (-2), #7 hover 없음 (-1), #8 빈 공간 (-2), #9 WCAG 대비 (-2)
- P1 위반: #11 텍스트 위계 없음 (-1)

### empty-folder: 빈 폴더
- **점수: 3/10**
- P0 위반: #6 빈 폴더 표시 없음 (-2), #7 hover 없음 (-1), #8 빈 공간 (-2), #9 WCAG 대비 (-2)

## 검토 항목 대조 (2-design.md)

### 정보 밀도
- [ ] 아이콘 구분 -- 폴더는 chevron만, 파일은 아이콘 전혀 없음
- [ ] 메타 정보 -- 파일 크기/날짜/타입 표시 없음 (단, 현재 스펙에 없으므로 감점 대상은 아님)
- [x] 텍스트 표시 -- 파일명은 clamp:1로 잘 표시됨

### 시각 계층
- [ ] 선택 상태 -- ancestor 배경색 없음 (P0-6, 전 시나리오 위반)
- [ ] 포커스 상태 -- outline만 있고 배경색 변화 없음 (P0-9)
- [ ] 호버 상태 -- hover 피드백 전혀 없음 (P0-7, 전 시나리오 위반)

### 레이아웃/비율
- [x] 컬럼 너비 -- min 180px, 적정
- [x] 프리뷰 비율 -- min 40%, 파일 선택 시 적정
- [ ] 빈 공간 -- deep drill/many-items 시 우측 50%+ 비어있음 (P0-8)
- [ ] 빈 폴더 -- EmptyState 표시 없음

### 전체 톤
- [x] 색상 -- 다크 테마 일관
- [x] 타이포 -- body 통일
- [ ] 간격 -- 컬럼 간 border-dim만, surface 구분 약함 (P1-12)
- [ ] 폴더/파일 구분 -- 동일 텍스트 스타일, 위계 없음 (P1-11)

## 수정 우선순위

| 순위 | 이슈 | 시나리오 | 총 감점 | 수정 방향 |
|------|------|----------|---------|-----------|
| 1 | ancestor 경로 강조 없음 | 2~6 전체 | -10 | ancestor path 아이템에 neutral bg 표시 |
| 2 | WCAG 선택 대비 미달 | 2~6 전체 | -10 | interactive: 'item' 축의 selected 배경 강화 |
| 3 | hover 피드백 없음 | 1~6 전체 | -6 | interactive: 'item' 축 hover 동작 확인/수정 |
| 4 | 빈 공간/empty state | 3, 5, 6 | -6 | empty folder: EmptyState 표시. 비선택 시 안내 |
| 5 | 텍스트 위계 없음 | 1, 5 | -2 | 폴더=medium weight, 파일=regular. 확장자=muted |
| 6 | 컬럼-프리뷰 경계 | 4 | -1 | surface 배경 명도 차이 강화 |

## 다음 단계

- [ ] /improve-design 루프 진입 (평균 4.5/10 < 9/10)
- [ ] 우선순위 1~3 수정 후 재리뷰
`;export{t};