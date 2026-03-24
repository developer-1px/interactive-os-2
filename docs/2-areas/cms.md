# CMS (Visual CMS)

> 최종 갱신: 2026-03-24 (retro: cms-landing-design-system)

## 현재 구조

CMS는 interactive-os 엔진 위에 구축된 콘텐츠 관리 도구.

**데이터 모델**: `cms-schema.ts` (Zod) — 단일 소스
- 15+ 노드 타입 (badge, text, cta, link, section, card, tab-group 등)
- `childRules` — 부모-자식 허용 규칙 (collection vs slot)
- `.describe()` — editable 필드 판정
- `.meta({ fieldType })` — 필드 타입 선언 (Zod v4 globalRegistry)
- 파생물: canAccept, canDelete, fieldsOf, localeFieldsOf, collectEditableGroups

**필드 타입 시스템**: `FieldType = 'short-text' | 'long-text' | 'url'`
- `short-text` — `<input type="text">`, Enter=커밋, blur=커밋 (기본값)
- `long-text` — `<textarea>`, Enter=줄바꿈, blur=커밋. 정의: 줄바꿈 허용
- `url` — `<input type="url">`, 유효성 시각 피드백 (저장은 항상 허용)
- `useFieldCommit<T>` 제네릭 훅으로 커밋 로직 공유

**콘텐츠 디자인 시스템** (앱 UI와 완전 독립):
- `landingTokens.css` — `--landing-*` 토큰 62개 (dark/light). 앱 토큰 참조 0.
- `CmsLanding.module.css` — 섹션 스타일. landing 토큰만 참조.
- 토큰 값 교체만으로 전체 톤 전환 가능
- Apple 스타일 카드 베리에이션: features(1+2), stats(2fr+1fr×3), patterns(3-col+span)

**렌더링**:
- `cms-renderers.tsx` — NodeContent, getNodeClassName, getNodeTag
- `CmsDetailPanel.tsx` — 우측 Form Panel, fieldType 기반 렌더러 분기
- `CmsInlineEditable.tsx` — 캔버스 인라인 편집 (항상 short-text)
- `CmsCanvas.tsx` — spatial behavior 기반 캔버스

**적용 매핑** (2026-03-24):
- `section-desc.value` → `long-text` (white-space: pre-line)
- `link.href` → `url`
- 나머지 → `short-text` (기본값)

## 핵심 규칙

1. **디자인 변경 불가** — 관리자는 콘텐츠만 편집. 색상/폰트/레이아웃 변경 UI 금지
2. **Rich text 기각** — plain text + 줄바꿈만. bold/italic 없음
3. **스키마 = 단일 소스** — 새 노드 타입은 nodeSchemas에만 추가
4. **rename plugin 경로** — 모든 필드 편집은 renameCommands.confirmRename 경유
5. **long-text = 줄바꿈 허용** — fieldType의 유일한 구분 기준

## 관련 경험

- #27 cms/schema-meta — Zod v4 .meta()는 globalRegistry 경유 필수
- #28 prd/산출물이름 — PRD 산출물명과 구현 네이밍 차이는 역할 매칭이면 갭 아님
