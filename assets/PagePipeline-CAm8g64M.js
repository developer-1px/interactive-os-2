const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/aestheticScoring-CtEpKEZr.js","assets/chunk-CFjPhJqf.js","assets/book-floating-chrome-task-CNjK6Ck1.js","assets/flatlayout-pull-transition-prd-BP6GzeCB.js","assets/hook-catalog-book-fixes-task-ZGalSnki.js","assets/chat-perf-prd-B88eX5sD.js","assets/composer-ghost-text-prd-yvFtqFw-.js","assets/md-writer-plan-3ayqKdIV.js","assets/md-writer-prd-BDgG0HhT.js","assets/streaming-text-block-prd-DLgTSGhn.js","assets/writer-analyze-task-C2MRSO9X.js","assets/writer-chat-prd-vp56DmS3.js","assets/writer-interaction-task-Dh9TT8xj.js","assets/writer-multiselect-clipboard-task-CsnEiDaG.js","assets/writer-tree-crud-prd-C2otahw4.js","assets/writer-xray-task-C7qb1SM2.js","assets/prd-CzdBja9i.js","assets/prd-Cj5-paTs.js","assets/strategy-BZFoLdDb.js","assets/cms-landing-completeness-prd-uQjDwHCW.js","assets/cms-landing-responsive-prd-JNbxCWSC.js","assets/linear-component-gap-task-GpmKiGcQ.js","assets/linear-tokens-task-DWrNnSGM.js","assets/meta-editable-ssot-prd-78J6GpLf.js","assets/miller-columns-task-BtlS-62B.js","assets/pipeline-dashboard-prd-Bqq5UHnT.js","assets/strategy-D1m7LWcR.js","assets/prd-TNb5ys_H.js","assets/stories-1UXa-1LM.js","assets/25-_design_llmEraUiParadigms-B_3NRtzT.js","assets/26-_design_generativeInteractiveUi-DyFK-HHM.js","assets/53-_decision_feAiUiLayerStrategy-uB2HHibH.js","assets/README-DBay_5kL.js","assets/README-oX_ZtAxN.js","assets/chat-module-H2zzoPYY.js","assets/flatlayout-engine-DqYhYzUD.js","assets/feature-mgmt-view-prd-mvOMJQz9.js","assets/visual-cms-BJwzEsQH.js","assets/finder-viewer-prd-BhIY0pNF.js","assets/list-xray-prd-D1hYJ-KH.js","assets/subagent-viewer-prd-CgO2-tI-.js","assets/0-discovery-BUEuvtdQ.js","assets/discuss-B6q6SVmC.js","assets/app-inspector-prd-CPO0cfVA.js","assets/inspector-aria-xray-prd-C2PYy4Tj.js","assets/inspector-improve-task-CxsjQTGX.js","assets/inspector-overview-task-D8vUhHFI.js","assets/inspector-redesign-prd-CLzM9zOi.js","assets/inspector-source-preview-prd-m2b3UKyX.js","assets/inspector-zone-keymap-prd-CPdR86Oj.js","assets/project-viewer-improve-task-B_NlAhdp.js","assets/project-viewer-redesign-task-BxInG3pT.js","assets/project-viewer-task-DgC32gRi.js","assets/1-strategy-BCJbVY6j.js","assets/2-design-CtUu15C-.js","assets/3-spec-BUarAQqi.js","assets/review-EX57Agei.js"])))=>i.map(i=>d[i]);
import{o as e}from"./chunk-CFjPhJqf.js";import{t}from"./react-nm2Ru1Pt.js";import{t as n}from"./preload-helper-cKk_7Cyp.js";import{t as r}from"./ax-DELUmbyI.js";import{t as i}from"./mdConfig-D8C6Wfcv.js";import{t as a}from"./types-CTMvwjV3.js";import{n as o}from"./createStore-CgMHIu6e.js";import{t as s}from"./jsx-runtime-BJXw1wCY.js";import{t as c}from"./browser-Djx4bE3a.js";import{t as l}from"./MarkdownViewer-CDI6kqTc.js";import{t as u}from"./FilePreview-C90US_wE.js";import{t as d}from"./PanelHeader-ByBalN-z.js";import{t as f}from"./SplitPane-CdFcPlfx.js";import{t as p}from"./useStore-PW_1Ub_X.js";import{t as m}from"./NavList-XQ68ddxs.js";import{t as h}from"./TabList-BwXZ9oXp.js";import{t as g}from"./ScrollArea-B42EwBos.js";import{t as _}from"./PipelineGrid-DtT_PCGB.js";import{t as v}from"./Panel-Cp6sUP4I.js";import{n as ee,t as y}from"./urlSync-EHXxB8Md.js";var b=e(t(),1),x=`project: Visual CMS
base: docs/1-projects/cms

stages:
  - key: discuss
    label: 논의
    artifact: discuss.md
    scope: [need, story, feature]
  - key: story
    label: 스토리
    artifact: stories.md
    scope: [project]
  - key: ia
    label: IA
    artifact: ia.md
    scope: [need]
  - key: wireframe
    label: 와이어프레임
    artifact: wireframe.md
    scope: [need, story]
  - key: prd
    label: PRD
    artifact: prd.md
    scope: [story, feature]
  - key: impl
    label: 구현
    artifact: sources.yaml
    scope: [feature]

needs:
  - id: content-editing
    title: 콘텐츠를 편집하기 원한다
    what: 관리자가 개발자 없이 텍스트/이미지를 교체
    stories:
      - id: page-selection
        title: 편집할 페이지를 선택할 수 있다
        what: 페이지 목록이 보이고, 선택하면 섹션 구성이 표시된다
        how: prds/cms-landing-completeness-prd.md
        features:
          - id: page-list
            title: 페이지 목록 표시 (썸네일 포함)
            what: 페이지 데이터(id, title, thumbnail, updatedAt)를 최근 수정순으로 표시. ListBox 사용.
            how: prds/cms-landing-completeness-prd.md
            detail:
              - src/pages/cms/CmsSidebar.tsx
              - src/pages/cms/cmsStore.ts
              - src/pages/cms/cmsSchema.ts
              - src/pages/cms/SectionThumbnail.tsx
          - id: section-load
            title: 페이지 선택 시 섹션 구성 로드
            what: 페이지 선택 시 우측 캔버스에 섹션 트리 로드. TreeGrid로 섹션 계층 표시.
            how: prds/cms-landing-completeness-prd.md
            detail:
              - src/pages/cms/CmsCanvas.tsx
              - src/pages/cms/cmsState.ts
              - src/pages/cms/cmsRenderers.tsx
              - src/pages/cms/collectSections.ts

      - id: text-replace
        title: 텍스트를 교체할 수 있다
        what: 텍스트 필드를 선택하고 내용 변경. plain text만, 서식 불가
        features:
          - id: text-select
            title: 텍스트 필드 선택 (클릭/키보드)
            what: 클릭 또는 키보드 네비게이션으로 텍스트 필드 선택. 포커스 링 표시.
            detail:
              - src/pages/cms/CmsCanvas.tsx
          - id: inline-edit
            title: 캔버스 인라인 편집
            what: Enter/F2로 편집 모드 진입. 캔버스에서 직접 텍스트 수정.
            detail:
              - src/pages/cms/CmsInlineEditable.tsx
              - src/pages/cms/CmsCanvas.tsx
          - id: panel-edit
            title: 상세 패널 텍스트 편집
            what: 폼 방식으로 우측 패널에서 편집. 긴 텍스트나 멀티라인에 적합.
            detail:
              - src/pages/cms/CmsDetailPanel.tsx

      - id: image-replace
        title: 이미지를 교체할 수 있다
        what: 이미지 필드를 선택하고 다른 이미지로 교체
        features:
          - id: icon-select
            title: 아이콘 필드 선택
            what: 캔버스에서 아이콘 필드를 클릭/키보드로 선택
            detail:
              - src/pages/cms/cmsIcons.ts
          - id: icon-replace
            title: 아이콘 선택 그리드에서 교체
            what: 아이콘 그리드에서 새 아이콘을 골라 교체
            detail:
              - src/pages/cms/CmsDetailPanel.tsx
              - src/pages/cms/cmsIcons.ts

  - id: page-structure
    title: 페이지 구조를 변경하기 원한다
    what: 관리자가 개발자 없이 섹션 추가/삭제/순서변경
    stories:
      - id: section-add
        title: 새 섹션을 골라 추가할 수 있다
        what: 템플릿 목록에서 선택, 원하는 위치에 삽입
        features:
          - id: add-button
            title: 섹션 추가 버튼
            what: "[+] 버튼으로 섹션 추가 시작"
            detail:
              - src/pages/cms/CmsSidebar.tsx
          - id: template-pick
            title: 템플릿 목록에서 유형 선택
            what: 등록된 템플릿 중 하나를 골라 삽입
            detail:
              - src/pages/cms/CmsTemplatePicker.tsx
              - src/pages/cms/cmsTemplates.ts
          - id: section-insert
            title: 선택한 위치에 새 섹션 삽입
            what: 사이드바/캔버스의 현재 위치에 삽입
            detail:
              - src/pages/cms/cmsStore.ts

      - id: section-delete
        title: 섹션을 삭제할 수 있다
        what: 선택한 섹션 제거, 최소 1개 유지
        features:
          - id: section-remove
            title: 섹션 삭제
            what: Delete 키 또는 플로팅 툴바로 섹션 삭제
            detail:
              - src/pages/cms/CmsFloatingToolbar.tsx
              - src/pages/cms/cmsStore.ts
          - id: min-section-guard
            title: 최소 1개 섹션 유지
            what: 마지막 섹션 삭제 시도 시 차단
            detail:
              - src/pages/cms/cmsStore.ts

      - id: section-reorder
        title: 섹션 순서를 변경할 수 있다
        what: 드래그 또는 키보드로 섹션 위치 이동
        features:
          - id: keyboard-reorder
            title: 키보드로 섹션 순서 변경
            what: Cmd+Up/Down으로 섹션 이동
            detail:
              - src/pages/cms/cmsStore.ts
          - id: toolbar-reorder
            title: 플로팅 툴바에서 순서 변경
            what: 툴바 Up/Down 버튼으로 이동
            detail:
              - src/pages/cms/CmsFloatingToolbar.tsx

  - id: preview-deploy
    title: 변경 결과를 확인하고 배포하기 원한다
    what: 프리뷰 확인 + 원클릭 라이브 배포
    stories:
      - id: preview
        title: 프리뷰로 확인할 수 있다
        what: 데스크톱/모바일 뷰포트 전환 가능
        how: prds/cms-landing-responsive-prd.md
        features:
          - id: viewport-switch
            title: 뷰포트 전환
            what: 모바일 375px / 태블릿 768px / 데스크톱 100%
            how: prds/cms-landing-responsive-prd.md
            detail:
              - src/pages/cms/CmsViewportBar.tsx
              - src/pages/cms/CmsViewportWrapper.tsx
          - id: present-mode
            title: 프레젠트 모드
            what: 크롬 숨기고 풀스크린 프리뷰
            detail:
              - src/pages/cms/CmsPresentMode.tsx

      - id: deploy
        title: 라이브에 배포할 수 있다
        what: 변경 전/후 diff 확인 후 원클릭 배포
        features:
          - id: diff-view
            title: 변경 diff 확인
            what: 변경 전/후 비교 화면
          - id: one-click-deploy
            title: 원클릭 배포
            what: 확인 후 한 번 클릭으로 라이브 반영

  - id: i18n
    title: 다국어 콘텐츠를 관리하기 원한다
    what: 개발자 없이 언어별 콘텐츠 전환
    stories:
      - id: language-switch
        title: 언어를 전환하여 편집할 수 있다
        what: 언어 드롭다운 선택 시 해당 언어 콘텐츠 표시 및 편집
        features:
          - id: language-dropdown
            title: 언어 드롭다운 전환
            what: 상단 툴바에서 언어 선택
          - id: language-content
            title: 전환된 언어로 콘텐츠 반영
            what: 선택 언어의 콘텐츠가 캔버스와 패널에 표시
            detail:
              - src/pages/cms/cmsI18nTransform.ts
          - id: translation-sheet
            title: 번역 시트
            what: 모든 필드의 다국어 값을 표로 관리
            detail:
              - src/pages/cms/CmsI18nSheet.tsx

  - id: templates
    title: 섹션 템플릿을 등록하기 원한다
    what: 디자이너가 만든 디자인을 관리자가 쓸 수 있게 등록
    stories:
      - id: template-register
        title: 섹션 디자인을 템플릿으로 등록할 수 있다
        what: 등록된 템플릿이 관리자의 목록에 나타남
        features:
          - id: template-define
            title: 섹션 템플릿 정의 및 등록
            what: 디자이너가 섹션 구조를 정의하고 템플릿으로 등록
            detail:
              - src/pages/cms/cmsTemplates.ts

  - id: design-guard
    title: 디자인이 그대로 유지되기 원한다
    what: 관리자가 디자인을 깨뜨리지 못하는 보장
    stories:
      - id: edit-constraint
        title: 편집 시 디자인이 변경되지 않는다
        what: 편집 가능 영역이 콘텐츠 필드로만 제한됨
        features:
          - id: editable-constraint
            title: 편집 가능 영역을 콘텐츠 필드로 제한
            what: 레이아웃/색상/폰트는 변경 불가. 텍스트/이미지만 편집 가능.
            detail:
              - src/pages/cms/cmsSchema.ts
              - src/pages/cms/cmsTypes.ts
          - id: slot-guard
            title: 슬롯 구조 보호
            what: 고정 자식의 삭제/추가/재배치 차단
            detail:
              - src/pages/cms/cmsStore.ts
              - src/pages/cms/cmsTypes.ts
`,S=`project: Viewer
base: docs/1-projects/viewer

stages:
  - key: discuss
    label: 논의
    artifact: discuss.md
    scope: [need, story, feature]
  - key: story
    label: 스토리
    artifact: stories.md
    scope: [project]
  - key: ia
    label: IA
    artifact: ia.md
    scope: [need]
  - key: wireframe
    label: 와이어프레임
    artifact: wireframe.md
    scope: [need, story]
  - key: prd
    label: PRD
    artifact: prd.md
    scope: [story, feature]
  - key: impl
    label: 구현
    artifact: sources.yaml
    scope: [feature]

needs:
  - id: doc-browsing
    title: 문서를 탐색하기 원한다
    what: docs/ 폴더의 문서를 Finder처럼 계층적으로 탐색하고 프리뷰
    stories:
      - id: miller-columns
        title: 폴더를 Miller Columns로 탐색할 수 있다
        what: 폴더 선택 시 하위 항목이 다음 컬럼에, 파일 선택 시 마크다운 프리뷰
        how: prds/project-viewer-task.md
        features:
          - id: file-tree
            title: 파일 트리 표시
            what: FileTreeView로 docs/ 구조 표시, 키보드 탐색
            detail:
              - src/pages/viewer/PageViewer.tsx
              - src/pages/viewer/viewerStore.ts
              - src/pages/viewer/treeTransform.ts
              - src/pages/viewer/fsClient.ts
          - id: file-preview
            title: 파일 선택 시 마크다운 프리뷰
            what: 선택한 .md 파일 내용을 우측 패널에 렌더링
            detail:
              - src/pages/viewer/widgets/FilePanel.tsx
              - src/pages/viewer/widgets/DocsPreview.tsx
          - id: quick-open
            title: QuickOpen으로 빠른 파일 탐색
            what: Cmd+K로 파일 검색 + 이동
            detail:
              - src/pages/viewer/PageViewer.tsx

      - id: doc-search
        title: 문서를 검색할 수 있다
        what: 제목/내용 기반 검색으로 원하는 문서 발견
        features:
          - id: title-search
            title: 제목 검색
            what: 파일 이름 기반 필터링


  - id: inspection
    title: 런타임 상태를 검사하기 원한다
    what: engine/ARIA/keyMap 등 런타임 상태를 devtools 수준으로 검사
    stories:
      - id: aria-inspector
        title: ARIA 트리를 검사할 수 있다
        what: 통합 ARIA 트리 + SplitPane + 3섹션 우측 패널
        how: prds/inspector-redesign-prd.md
        features:
          - id: aria-tree
            title: 통합 ARIA 트리 표시
            what: 모든 AriaRoute 인스턴스의 ARIA 트리 통합 뷰
            how: prds/inspector-redesign-prd.md
          - id: aria-xray
            title: 노드별 ARIA X-Ray
            what: 선택한 노드의 role, state, properties 상세 표시
            how: prds/inspector-aria-xray-prd.md
          - id: source-preview
            title: 소스코드 프리뷰
            what: inspector lock 상태에서 소스코드 즉시 확인
            how: prds/inspector-source-preview-prd.md
          - id: zone-keymap
            title: Zone 계층 KeyMap 노출
            what: AriaRoute별 Zone keyMap 계층 표시
            how: prds/inspector-zone-keymap-prd.md

      - id: app-inspector
        title: 앱 capability를 직렬화하여 볼 수 있다
        what: engine.inspect()로 keyMap, commands, schema, state 노출
        how: prds/app-inspector-prd.md
        features:
          - id: capability-export
            title: capability 직렬화 출력
            what: engine의 전체 capability를 JSON/텍스트로 export
            how: prds/app-inspector-prd.md
`,C=`title: 아이콘 선택 그리드에서 교체
what: 아이콘 그리드에서 새 아이콘을 골라 교체
tier: feature
`,w=`title: 아이콘 필드 선택
what: 캔버스에서 아이콘 필드를 클릭/키보드로 선택
tier: feature
`,T=`title: 이미지를 교체할 수 있다
what: 이미지 필드를 선택하고 다른 이미지로 교체
tier: story
`,te=`title: 콘텐츠를 편집하기 원한다
what: 관리자가 개발자 없이 텍스트/이미지를 교체
tier: need
`,ne=`title: 편집할 페이지를 선택할 수 있다
what: 페이지 목록이 보이고, 선택하면 섹션 구성이 표시된다
tier: story
`,re=`title: 페이지 목록 표시 (썸네일 포함)
what: 페이지 데이터를 최근 수정순으로 표시. ListBox 사용.
tier: feature
`,ie=`title: 페이지 선택 시 섹션 구성 로드
what: 페이지 선택 시 우측 캔버스에 섹션 트리 로드. TreeGrid 사용.
tier: feature
`,ae=`title: 캔버스 인라인 편집
what: Enter/F2로 편집 모드 진입. 캔버스에서 직접 텍스트 수정.
tier: feature
`,oe=`title: 텍스트를 교체할 수 있다
what: 텍스트 필드를 선택하고 내용 변경. plain text만, 서식 불가
tier: story
`,se=`title: 상세 패널 텍스트 편집
what: 폼 방식으로 우측 패널에서 편집. 긴 텍스트나 멀티라인에 적합.
tier: feature
`,ce=`title: 텍스트 필드 선택 (클릭/키보드)
what: 클릭 또는 키보드 네비게이션으로 텍스트 필드 선택. 포커스 링 표시.
tier: feature
`,le=`title: 편집 가능 영역을 콘텐츠 필드로 제한
what: 레이아웃/색상/폰트는 변경 불가. 텍스트/이미지만 편집 가능.
tier: feature
`,ue=`title: 편집 시 디자인이 변경되지 않는다
what: 편집 가능 영역이 콘텐츠 필드로만 제한됨
tier: story
`,de=`title: 슬롯 구조 보호
what: 고정 자식의 삭제/추가/재배치 차단
tier: feature
`,fe=`title: 디자인이 그대로 유지되기 원한다
what: 관리자가 디자인을 깨뜨리지 못하는 보장
tier: need
`,E=`title: 전환된 언어로 콘텐츠 반영
what: 선택 언어의 콘텐츠가 캔버스와 패널에 표시
tier: feature
`,D=`title: 언어 드롭다운 전환
what: 상단 툴바에서 언어 선택
tier: feature
`,O=`title: 언어를 전환하여 편집할 수 있다
what: 언어 드롭다운 선택 시 해당 언어 콘텐츠 표시 및 편집
tier: story
`,k=`title: 번역 시트
what: 모든 필드의 다국어 값을 표로 관리
tier: feature
`,A=`title: 다국어 콘텐츠를 관리하기 원한다
what: 개발자 없이 언어별 콘텐츠 전환
tier: need
`,j=`title: 페이지 구조를 변경하기 원한다
what: 관리자가 개발자 없이 섹션 추가/삭제/순서변경
tier: need
`,M=`title: 섹션 추가 버튼
what: "[+] 버튼으로 섹션 추가 시작"
tier: feature
`,N=`title: 새 섹션을 골라 추가할 수 있다
what: 템플릿 목록에서 선택, 원하는 위치에 삽입
tier: story
`,P=`title: 선택한 위치에 새 섹션 삽입
what: 사이드바/캔버스의 현재 위치에 삽입
tier: feature
`,F=`title: 템플릿 목록에서 유형 선택
what: 등록된 템플릿 중 하나를 골라 삽입
tier: feature
`,I=`title: 섹션을 삭제할 수 있다
what: 선택한 섹션 제거, 최소 1개 유지
tier: story
`,L=`title: 최소 1개 섹션 유지
what: 마지막 섹션 삭제 시도 시 차단
tier: feature
`,R=`title: 섹션 삭제
what: Delete 키 또는 플로팅 툴바로 섹션 삭제
tier: feature
`,z=`title: 키보드로 섹션 순서 변경
what: Cmd+Up/Down으로 섹션 이동
tier: feature
`,B=`title: 섹션 순서를 변경할 수 있다
what: 드래그 또는 키보드로 섹션 위치 이동
tier: story
`,V=`title: 플로팅 툴바에서 순서 변경
what: 툴바 Up/Down 버튼으로 이동
tier: feature
`,pe=`title: 변경 diff 확인
what: 변경 전/후 비교 화면
tier: feature
`,me=`title: 라이브에 배포할 수 있다
what: 변경 전/후 diff 확인 후 원클릭 배포
tier: story
`,he=`title: 원클릭 배포
what: 확인 후 한 번 클릭으로 라이브 반영
tier: feature
`,ge=`title: 변경 결과를 확인하고 배포하기 원한다
what: 프리뷰 확인 + 원클릭 라이브 배포
tier: need
`,_e=`title: 프리뷰로 확인할 수 있다
what: 데스크톱/모바일 뷰포트 전환 가능
tier: story
`,ve=`title: 프레젠트 모드
what: 크롬 숨기고 풀스크린 프리뷰
tier: feature
`,ye=`title: 뷰포트 전환
what: 모바일 375px / 태블릿 768px / 데스크톱 100%
tier: feature
`,be=`title: 섹션 템플릿을 등록하기 원한다
what: 디자이너가 만든 디자인을 관리자가 쓸 수 있게 등록
tier: need
`,xe=`title: 섹션 디자인을 템플릿으로 등록할 수 있다
what: 등록된 템플릿이 관리자의 목록에 나타남
tier: story
`,Se=`title: 섹션 템플릿 정의 및 등록
what: 디자이너가 섹션 구조를 정의하고 템플릿으로 등록
tier: feature
`,Ce=`tier: story
`,we=`tier: feature
`,Te=`tier: need
`,Ee=`tier: feature
`,De=`tier: feature
`,Oe=`tier: story
`,ke=`tier: feature
`,Ae=`tier: feature
`,je=`tier: story
`,Me=`tier: feature
`,Ne=`tier: feature
`,Pe=`tier: story
`,Fe=`tier: feature
`,Ie=`tier: feature
`,Le=`tier: need
`,Re=`- src/pages/cms/CmsSidebar.tsx
- src/pages/cms/cmsStore.ts
- src/pages/cms/cmsSchema.ts
- src/pages/cms/SectionThumbnail.tsx
`,ze=`- src/pages/cms/CmsCanvas.tsx
- src/pages/cms/cmsState.ts
- src/pages/cms/cmsRenderers.tsx
- src/pages/cms/collectSections.ts
`,Be=`- src/pages/cms/CmsInlineEditable.tsx
- src/pages/cms/CmsCanvas.tsx
`,H=`- src/pages/cms/CmsDetailPanel.tsx
`,Ve=`- src/pages/cms/CmsCanvas.tsx
`,He=`- src/pages/cms/cmsSchema.ts
- src/pages/cms/cmsTypes.ts
`,Ue=`- src/pages/cms/cmsStore.ts
- src/pages/cms/cmsTypes.ts
`,We=`- src/pages/cms/CmsI18nSheet.tsx
`,Ge=`- src/pages/cms/CmsSidebar.tsx
`,Ke=`- src/pages/cms/CmsTemplatePicker.tsx
- src/pages/cms/cmsTemplates.ts
`,qe=`- src/pages/cms/CmsFloatingToolbar.tsx
- src/pages/cms/cmsStore.ts
`,Je=`- src/pages/cms/CmsPresentMode.tsx
`,Ye=`- src/pages/cms/CmsViewportBar.tsx
- src/pages/cms/CmsViewportWrapper.tsx
`,Xe=`- src/pages/cms/cmsTemplates.ts
`,Ze=`- src/pages/viewer/widgets/FilePanel.tsx
- src/pages/viewer/widgets/DocsPreview.tsx
`,Qe=`- src/pages/viewer/PageViewer.tsx
- src/pages/viewer/viewerStore.ts
- src/pages/viewer/treeTransform.ts
- src/pages/viewer/fsClient.ts
`,$e=`- src/pages/viewer/PageViewer.tsx
`,et=`/interactive-os-2/assets/deep-drill-BsUo-Lrt.png`,tt=`/interactive-os-2/assets/deep-drill-BsUo-Lrt.png`,nt=`/interactive-os-2/assets/deep-drill-BsUo-Lrt.png`,rt=`/interactive-os-2/assets/file-preview-S3ADHeLP.png`,it=`/interactive-os-2/assets/deep-drill-BsUo-Lrt.png`,at=`/interactive-os-2/assets/many-items-BYpPc4__.png`,U=Object.assign({"/docs/1-projects/cms/pipeline.yaml":x,"/docs/1-projects/viewer/pipeline.yaml":S}),ot=Object.assign({"/docs/1-projects/cms/content-editing/image-replace/icon-replace/meta.yaml":C,"/docs/1-projects/cms/content-editing/image-replace/icon-select/meta.yaml":w,"/docs/1-projects/cms/content-editing/image-replace/meta.yaml":T,"/docs/1-projects/cms/content-editing/meta.yaml":te,"/docs/1-projects/cms/content-editing/page-selection/meta.yaml":ne,"/docs/1-projects/cms/content-editing/page-selection/page-list/meta.yaml":re,"/docs/1-projects/cms/content-editing/page-selection/section-load/meta.yaml":ie,"/docs/1-projects/cms/content-editing/text-replace/inline-edit/meta.yaml":ae,"/docs/1-projects/cms/content-editing/text-replace/meta.yaml":oe,"/docs/1-projects/cms/content-editing/text-replace/panel-edit/meta.yaml":se,"/docs/1-projects/cms/content-editing/text-replace/text-select/meta.yaml":ce,"/docs/1-projects/cms/design-guard/edit-constraint/editable-constraint/meta.yaml":le,"/docs/1-projects/cms/design-guard/edit-constraint/meta.yaml":ue,"/docs/1-projects/cms/design-guard/edit-constraint/slot-guard/meta.yaml":de,"/docs/1-projects/cms/design-guard/meta.yaml":fe,"/docs/1-projects/cms/i18n/language-switch/language-content/meta.yaml":E,"/docs/1-projects/cms/i18n/language-switch/language-dropdown/meta.yaml":D,"/docs/1-projects/cms/i18n/language-switch/meta.yaml":O,"/docs/1-projects/cms/i18n/language-switch/translation-sheet/meta.yaml":k,"/docs/1-projects/cms/i18n/meta.yaml":A,"/docs/1-projects/cms/page-structure/meta.yaml":j,"/docs/1-projects/cms/page-structure/section-add/add-button/meta.yaml":M,"/docs/1-projects/cms/page-structure/section-add/meta.yaml":N,"/docs/1-projects/cms/page-structure/section-add/section-insert/meta.yaml":P,"/docs/1-projects/cms/page-structure/section-add/template-pick/meta.yaml":F,"/docs/1-projects/cms/page-structure/section-delete/meta.yaml":I,"/docs/1-projects/cms/page-structure/section-delete/min-section-guard/meta.yaml":L,"/docs/1-projects/cms/page-structure/section-delete/section-remove/meta.yaml":R,"/docs/1-projects/cms/page-structure/section-reorder/keyboard-reorder/meta.yaml":z,"/docs/1-projects/cms/page-structure/section-reorder/meta.yaml":B,"/docs/1-projects/cms/page-structure/section-reorder/toolbar-reorder/meta.yaml":V,"/docs/1-projects/cms/preview-deploy/deploy/diff-view/meta.yaml":pe,"/docs/1-projects/cms/preview-deploy/deploy/meta.yaml":me,"/docs/1-projects/cms/preview-deploy/deploy/one-click-deploy/meta.yaml":he,"/docs/1-projects/cms/preview-deploy/meta.yaml":ge,"/docs/1-projects/cms/preview-deploy/preview/meta.yaml":_e,"/docs/1-projects/cms/preview-deploy/preview/present-mode/meta.yaml":ve,"/docs/1-projects/cms/preview-deploy/preview/viewport-switch/meta.yaml":ye,"/docs/1-projects/cms/templates/meta.yaml":be,"/docs/1-projects/cms/templates/template-register/meta.yaml":xe,"/docs/1-projects/cms/templates/template-register/template-define/meta.yaml":Se,"/docs/1-projects/viewer/doc-browsing/doc-search/meta.yaml":Ce,"/docs/1-projects/viewer/doc-browsing/doc-search/title-search/meta.yaml":we,"/docs/1-projects/viewer/doc-browsing/meta.yaml":Te,"/docs/1-projects/viewer/doc-browsing/miller-columns/file-preview/meta.yaml":Ee,"/docs/1-projects/viewer/doc-browsing/miller-columns/file-tree/meta.yaml":De,"/docs/1-projects/viewer/doc-browsing/miller-columns/meta.yaml":Oe,"/docs/1-projects/viewer/doc-browsing/miller-columns/quick-open/meta.yaml":ke,"/docs/1-projects/viewer/inspection/app-inspector/capability-export/meta.yaml":Ae,"/docs/1-projects/viewer/inspection/app-inspector/meta.yaml":je,"/docs/1-projects/viewer/inspection/aria-inspector/aria-tree/meta.yaml":Me,"/docs/1-projects/viewer/inspection/aria-inspector/aria-xray/meta.yaml":Ne,"/docs/1-projects/viewer/inspection/aria-inspector/meta.yaml":Pe,"/docs/1-projects/viewer/inspection/aria-inspector/source-preview/meta.yaml":Fe,"/docs/1-projects/viewer/inspection/aria-inspector/zone-keymap/meta.yaml":Ie,"/docs/1-projects/viewer/inspection/meta.yaml":Le}),W=Object.assign({"/docs/1-projects/aestheticScoring.md":()=>n(()=>import(`./aestheticScoring-CtEpKEZr.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([0,1])),"/docs/1-projects/book/prds/book-floating-chrome-task.md":()=>n(()=>import(`./book-floating-chrome-task-CNjK6Ck1.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([2,1])),"/docs/1-projects/book/prds/flatlayout-pull-transition-prd.md":()=>n(()=>import(`./flatlayout-pull-transition-prd-BP6GzeCB.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([3,1])),"/docs/1-projects/book/prds/hook-catalog-book-fixes-task.md":()=>n(()=>import(`./hook-catalog-book-fixes-task-ZGalSnki.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([4,1])),"/docs/1-projects/chat/prds/chat-perf-prd.md":()=>n(()=>import(`./chat-perf-prd-B88eX5sD.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([5,1])),"/docs/1-projects/chat/prds/composer-ghost-text-prd.md":()=>n(()=>import(`./composer-ghost-text-prd-yvFtqFw-.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([6,1])),"/docs/1-projects/chat/prds/md-writer-plan.md":()=>n(()=>import(`./md-writer-plan-3ayqKdIV.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([7,1])),"/docs/1-projects/chat/prds/md-writer-prd.md":()=>n(()=>import(`./md-writer-prd-BDgG0HhT.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([8,1])),"/docs/1-projects/chat/prds/streaming-text-block-prd.md":()=>n(()=>import(`./streaming-text-block-prd-DLgTSGhn.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([9,1])),"/docs/1-projects/chat/prds/writer-analyze-task.md":()=>n(()=>import(`./writer-analyze-task-C2MRSO9X.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([10,1])),"/docs/1-projects/chat/prds/writer-chat-prd.md":()=>n(()=>import(`./writer-chat-prd-vp56DmS3.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([11,1])),"/docs/1-projects/chat/prds/writer-interaction-task.md":()=>n(()=>import(`./writer-interaction-task-Dh9TT8xj.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([12,1])),"/docs/1-projects/chat/prds/writer-multiselect-clipboard-task.md":()=>n(()=>import(`./writer-multiselect-clipboard-task-CsnEiDaG.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([13,1])),"/docs/1-projects/chat/prds/writer-tree-crud-prd.md":()=>n(()=>import(`./writer-tree-crud-prd-C2otahw4.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([14,1])),"/docs/1-projects/chat/prds/writer-xray-task.md":()=>n(()=>import(`./writer-xray-task-C7qb1SM2.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([15,1])),"/docs/1-projects/cms/content-editing/page-selection/page-list/prd.md":()=>n(()=>import(`./prd-CzdBja9i.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([16,1])),"/docs/1-projects/cms/content-editing/page-selection/section-load/prd.md":()=>n(()=>import(`./prd-Cj5-paTs.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([17,1])),"/docs/1-projects/cms/content-editing/page-selection/strategy.md":()=>n(()=>import(`./strategy-BZFoLdDb.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([18,1])),"/docs/1-projects/cms/prds/cms-landing-completeness-prd.md":()=>n(()=>import(`./cms-landing-completeness-prd-uQjDwHCW.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([19,1])),"/docs/1-projects/cms/prds/cms-landing-responsive-prd.md":()=>n(()=>import(`./cms-landing-responsive-prd-JNbxCWSC.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([20,1])),"/docs/1-projects/cms/prds/linear-component-gap-task.md":()=>n(()=>import(`./linear-component-gap-task-GpmKiGcQ.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([21,1])),"/docs/1-projects/cms/prds/linear-tokens-task.md":()=>n(()=>import(`./linear-tokens-task-DWrNnSGM.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([22,1])),"/docs/1-projects/cms/prds/meta-editable-ssot-prd.md":()=>n(()=>import(`./meta-editable-ssot-prd-78J6GpLf.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([23,1])),"/docs/1-projects/cms/prds/miller-columns-task.md":()=>n(()=>import(`./miller-columns-task-BtlS-62B.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([24,1])),"/docs/1-projects/cms/prds/pipeline-dashboard-prd.md":()=>n(()=>import(`./pipeline-dashboard-prd-Bqq5UHnT.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([25,1])),"/docs/1-projects/cms/preview-deploy/preview/strategy.md":()=>n(()=>import(`./strategy-D1m7LWcR.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([26,1])),"/docs/1-projects/cms/preview-deploy/preview/viewport-switch/prd.md":()=>n(()=>import(`./prd-TNb5ys_H.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([27,1])),"/docs/1-projects/cms/stories.md":()=>n(()=>import(`./stories-1UXa-1LM.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([28,1])),"/docs/1-projects/feAiUiLayer/25-[design]llmEraUiParadigms.md":()=>n(()=>import(`./25-_design_llmEraUiParadigms-B_3NRtzT.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([29,1])),"/docs/1-projects/feAiUiLayer/26-[design]generativeInteractiveUi.md":()=>n(()=>import(`./26-_design_generativeInteractiveUi-DyFK-HHM.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([30,1])),"/docs/1-projects/feAiUiLayer/53-[decision]feAiUiLayerStrategy.md":()=>n(()=>import(`./53-_decision_feAiUiLayerStrategy-uB2HHibH.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([31,1])),"/docs/1-projects/feAiUiLayer/README.md":()=>n(()=>import(`./README-DBay_5kL.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([32,1])),"/docs/1-projects/features/README.md":()=>n(()=>import(`./README-oX_ZtAxN.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([33,1])),"/docs/1-projects/features/chat-module.md":()=>n(()=>import(`./chat-module-H2zzoPYY.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([34,1])),"/docs/1-projects/features/flatlayout-engine.md":()=>n(()=>import(`./flatlayout-engine-DqYhYzUD.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([35,1])),"/docs/1-projects/features/prds/feature-mgmt-view-prd.md":()=>n(()=>import(`./feature-mgmt-view-prd-mvOMJQz9.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([36,1])),"/docs/1-projects/features/visual-cms.md":()=>n(()=>import(`./visual-cms-BJwzEsQH.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([37,1])),"/docs/1-projects/finder-viewer/prds/finder-viewer-prd.md":()=>n(()=>import(`./finder-viewer-prd-BhIY0pNF.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([38,1])),"/docs/1-projects/finder-viewer/prds/list-xray-prd.md":()=>n(()=>import(`./list-xray-prd-D1hYJ-KH.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([39,1])),"/docs/1-projects/replay/prds/subagent-viewer-prd.md":()=>n(()=>import(`./subagent-viewer-prd-CgO2-tI-.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([40,1])),"/docs/1-projects/viewer/0-discovery.md":()=>n(()=>import(`./0-discovery-BUEuvtdQ.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([41,1])),"/docs/1-projects/viewer/doc-browsing/miller-columns/discuss.md":()=>n(()=>import(`./discuss-B6q6SVmC.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([42,1])),"/docs/1-projects/viewer/prds/app-inspector-prd.md":()=>n(()=>import(`./app-inspector-prd-CPO0cfVA.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([43,1])),"/docs/1-projects/viewer/prds/inspector-aria-xray-prd.md":()=>n(()=>import(`./inspector-aria-xray-prd-C2PYy4Tj.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([44,1])),"/docs/1-projects/viewer/prds/inspector-improve-task.md":()=>n(()=>import(`./inspector-improve-task-CxsjQTGX.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([45,1])),"/docs/1-projects/viewer/prds/inspector-overview-task.md":()=>n(()=>import(`./inspector-overview-task-D8vUhHFI.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([46,1])),"/docs/1-projects/viewer/prds/inspector-redesign-prd.md":()=>n(()=>import(`./inspector-redesign-prd-CLzM9zOi.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([47,1])),"/docs/1-projects/viewer/prds/inspector-source-preview-prd.md":()=>n(()=>import(`./inspector-source-preview-prd-m2b3UKyX.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([48,1])),"/docs/1-projects/viewer/prds/inspector-zone-keymap-prd.md":()=>n(()=>import(`./inspector-zone-keymap-prd-CPdR86Oj.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([49,1])),"/docs/1-projects/viewer/prds/project-viewer-improve-task.md":()=>n(()=>import(`./project-viewer-improve-task-B_NlAhdp.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([50,1])),"/docs/1-projects/viewer/prds/project-viewer-redesign-task.md":()=>n(()=>import(`./project-viewer-redesign-task-BxInG3pT.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([51,1])),"/docs/1-projects/viewer/prds/project-viewer-task.md":()=>n(()=>import(`./project-viewer-task-DgC32gRi.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([52,1])),"/docs/1-projects/viewer/stories/doc-browsing/1-strategy.md":()=>n(()=>import(`./1-strategy-BCJbVY6j.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([53,1])),"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/2-design.md":()=>n(()=>import(`./2-design-CtUu15C-.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([54,1])),"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/3-spec.md":()=>n(()=>import(`./3-spec-BUarAQqi.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([55,1])),"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/5-review/review.md":()=>n(()=>import(`./review-EX57Agei.js`).then(e=>e.t).then(e=>e.default),__vite__mapDeps([56,1]))}),G=Object.assign({"/docs/1-projects/cms/content-editing/page-selection/page-list/sources.yaml":Re,"/docs/1-projects/cms/content-editing/page-selection/section-load/sources.yaml":ze,"/docs/1-projects/cms/content-editing/text-replace/inline-edit/sources.yaml":Be,"/docs/1-projects/cms/content-editing/text-replace/panel-edit/sources.yaml":H,"/docs/1-projects/cms/content-editing/text-replace/text-select/sources.yaml":Ve,"/docs/1-projects/cms/design-guard/edit-constraint/editable-constraint/sources.yaml":He,"/docs/1-projects/cms/design-guard/edit-constraint/slot-guard/sources.yaml":Ue,"/docs/1-projects/cms/i18n/language-switch/translation-sheet/sources.yaml":We,"/docs/1-projects/cms/page-structure/section-add/add-button/sources.yaml":Ge,"/docs/1-projects/cms/page-structure/section-add/template-pick/sources.yaml":Ke,"/docs/1-projects/cms/page-structure/section-delete/section-remove/sources.yaml":qe,"/docs/1-projects/cms/preview-deploy/preview/present-mode/sources.yaml":Je,"/docs/1-projects/cms/preview-deploy/preview/viewport-switch/sources.yaml":Ye,"/docs/1-projects/cms/templates/template-register/template-define/sources.yaml":Xe,"/docs/1-projects/viewer/doc-browsing/miller-columns/file-preview/sources.yaml":Ze,"/docs/1-projects/viewer/doc-browsing/miller-columns/file-tree/sources.yaml":Qe,"/docs/1-projects/viewer/doc-browsing/miller-columns/quick-open/sources.yaml":$e}),K=Object.assign({"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/4-build/deep-drill.png":et,"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/4-build/default.png":tt,"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/4-build/empty-folder.png":nt,"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/4-build/file-preview.png":rt,"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/4-build/folder-selected.png":it,"/docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/4-build/many-items.png":at}),q=new Map;function st(e){if(q.has(e))return q.get(e);let t=G[e];if(!t)return[];let n=c.parse(t);return q.set(e,n),n}var J=Object.keys(U).map(e=>e.split(`/`).at(-2)??``).sort();function ct(e,t){let n=`/${e}/${t.join(`/`)}/`;for(let e of Object.keys(K))if(e.startsWith(n))return K[e];return null}function Y(e,t,n){let r=`/${e}/${t.join(`/`)}/${n}`;return r in W||r in G||`/${e}/${t.join(`/`)}/${n}`in ot?r.slice(1):null}function lt(e,t,n){for(let r=t.length-1;r>=1;r--){let i=Y(e,t.slice(0,r),n);if(i)return i}return null}function ut(e,t){let n=`/${e}/${t}`;return n in W||n in G?n.slice(1):null}function X(e){let t=U[`/docs/1-projects/${e}/pipeline.yaml`];if(!t)return{store:o({entities:{},relationships:{[a]:[]}}),columns:[{key:`feature`,header:`Feature`,width:`1fr`}],projectName:e};let n=c.parse(t),r=n.stages,i=n.base,s=[{key:`feature`,header:`Feature`,width:`1fr`},...r.map(e=>({key:e.key,header:e.label,width:`80px`}))],l={},u={[a]:[]},d={},f={},p={},m={};for(let e of n.needs){let t=e.id;if(u[a].push(t),f[t]=[t],p[t]=`need`,m[t]={title:e.title,what:e.what},d[t]=[],e.stories)for(let n of e.stories){let e=n.id;if(d[t].push(e),f[e]=[t,e],p[e]=`story`,m[e]={title:n.title,what:n.what,how:n.how},d[e]=[],n.features)for(let r of n.features){let n=r.id;d[e].push(n),f[n]=[t,e,n],p[n]=`feature`,m[n]={title:r.title,what:r.what,how:r.how,detail:r.detail},d[n]=[]}}}for(let[e,t]of Object.entries(d))t.length>0&&(u[e]=t);let h={},g=Object.keys(p);for(let e of g){let t=p[e],n=f[e],a={};for(let e of r){if(e.scope.includes(`project`)){let t=ut(i,e.artifact);t?a[e.key]={status:`propagated`,artifactPath:t}:a[e.key]={status:`missing`};continue}if(!e.scope.includes(t)){a[e.key]={status:null};continue}let r=Y(i,n,e.artifact);if(r){a[e.key]={status:`done`,artifactPath:r};continue}let o=lt(i,n,e.artifact);if(o){a[e.key]={status:`propagated`,artifactPath:o};continue}a[e.key]={status:`missing`}}h[e]=a}let _=new Map;function v(e,t){let n=`${e}:${t}`;if(_.has(n))return _.get(n);let r=d[e];if(r.length===0)return _.set(n,null),null;let i=[];for(let e of r){let n=h[e]?.[t];if(!(!n||n.status===null))if(d[e].length>0){let n=v(e,t);n!==null&&i.push(n)}else i.push(n.status===`propagated`?`done`:n.status)}let a=null;return i.length>0&&(a=i.every(e=>e===`done`)?`done`:i.every(e=>e===`missing`)?`missing`:`partial`),_.set(n,a),a}for(let e of g)if(d[e].length!==0)for(let t of r){let n=h[e][t.key];if(!n||n.status===null||n.status===`done`||n.status===`propagated`)continue;let r=v(e,t.key);r&&r!==`missing`&&(h[e][t.key]={status:r})}for(let e of g){let t=p[e],n=m[e],a=h[e],o=ct(i,f[e]),s=[{text:n.title,tier:t,subtitle:n.what,thumbnail:o},...r.map(e=>a[e.key]??{status:null})],c={feature:{type:`summary`,title:`${t===`need`?`Need`:t===`story`?`Story`:`Feature`}: ${n.title}`,body:n.what??``}};for(let e of r){let t=a[e.key];if(!(!t||t.status===null||!t.artifactPath)){if(t.artifactPath.endsWith(`.md`))c[e.key]={type:`markdown`,path:t.artifactPath,fallback:`(${e.label})`};else if(t.artifactPath.endsWith(`.yaml`)){let n=st(`/${t.artifactPath}`);n.length>0&&(c[e.key]={type:`fileList`,title:e.label,files:n.map(e=>({label:e.split(`/`).pop()??e,path:e}))})}}}n.how&&(c.prd={type:`markdown`,path:`${i}/${n.how}`,fallback:`(${n.how})`}),l[e]={id:e,data:{label:n.title,tier:t,subtitle:n.what,thumbnail:o??void 0,stages:a,cells:s,previews:c}}}return{store:o({entities:l,relationships:u}),columns:s,projectName:n.project}}function dt(e){return X(e)}var Z=X(`cms`);Z.store,Z.projectName,Z.columns;function ft(e,t,n){let r=e.entities[t];if(!r)return null;let i=r.data;return i?.previews?i.previews[n]??null:null}async function pt(e){let t=W[`/${e}`];return t?t():null}var Q=s(),mt=[.55,.45];function ht(){let e={};for(let t of J)e[t]={id:t,data:{label:t}};return o({entities:e,relationships:{[a]:J}})}var gt=ht(),_t=y()??J[0]??`cms`;function vt({src:e,caption:t}){return(0,Q.jsxs)(`div`,{className:r({layout:`stack`,gap:`sm`,padding:`md`}),children:[(0,Q.jsx)(u,{content:``,filename:`image.png`,src:e}),t&&(0,Q.jsx)(`span`,{className:r({textStyle:`caption`,text:`muted`}),children:t})]})}function yt({title:e,body:t}){return(0,Q.jsxs)(`div`,{className:r({layout:`stack`,gap:`sm`,padding:`md`}),children:[(0,Q.jsx)(`span`,{className:r({textStyle:`label`,weight:`semi`,text:`bright`}),children:e}),(0,Q.jsx)(l,{content:t,prose:!1,codePreset:`chat`,config:i})]})}function bt({title:e,files:t}){let n=(0,b.useMemo)(()=>{let e={},n=[];for(let r of t)e[r.path]={id:r.path,data:{label:r.label,description:r.path}},n.push(r.path);return o({entities:e,relationships:{[a]:n}})},[t]);return(0,Q.jsxs)(`div`,{className:r({layout:`stack`,gap:`sm`,padding:`md`}),children:[(0,Q.jsx)(`span`,{className:r({textStyle:`label`,weight:`semi`,text:`bright`}),children:e}),(0,Q.jsx)(m,{data:n,"aria-label":e})]})}function xt({path:e,fallback:t}){let[n,i]=(0,b.useState)(null);(0,b.useEffect)(()=>{let t=!1;return i(null),pt(e).then(e=>{e&&!t&&i(e)}),()=>{t=!0}},[e]);let a=e.split(`/`).pop()??e;return(0,Q.jsxs)(`div`,{className:r({layout:`stack`,gap:`sm`,padding:`md`}),children:[(0,Q.jsx)(`span`,{className:r({textStyle:`caption`,tone:`accent`}),children:e}),(0,Q.jsx)(u,{content:n??t,filename:a})]})}function $({message:e}){return(0,Q.jsx)(`div`,{className:r({padding:`lg`,text:`muted`,textStyle:`body`}),children:e})}function St({content:e}){if(!e)return(0,Q.jsx)($,{message:`Select a cell to preview`});switch(e.type){case`image`:return(0,Q.jsx)(vt,{src:e.src,caption:e.caption});case`summary`:return(0,Q.jsx)(yt,{title:e.title,body:e.body});case`fileList`:return(0,Q.jsx)(bt,{title:e.title,files:e.files});case`markdown`:return(0,Q.jsx)(xt,{path:e.path,fallback:e.fallback});case`empty`:return(0,Q.jsx)($,{message:e.message})}}function Ct(){let[e,t]=(0,b.useState)(_t),n=(0,b.useMemo)(()=>dt(e),[e]),[i,a]=p(n.store),o=n.columns;(0,b.useEffect)(()=>{a(n.store)},[n.store,a]);let[s,c]=(0,b.useState)(null),[l,u]=(0,b.useState)(mt),m=(0,b.useCallback)(e=>{t(e)},[]),y=(0,b.useCallback)(e=>{},[]),x=(0,b.useCallback)(e=>{c(e)},[]),S=s?ft(i,s.rowId,s.colKey):null,C=s?i.entities[s.rowId]?.data?.label??``:``,w=s?o.find(e=>e.key===s.colKey)?.header??s.colKey:``,T=s?`${C} / ${w}`:`Preview`;return(0,Q.jsxs)(`div`,{className:r({layout:`stack`,flex:`1`}),children:[(0,Q.jsxs)(d,{children:[(0,Q.jsx)(h,{data:gt,plugins:[ee()],onActivate:m,initialFocus:e,"aria-label":`Projects`}),(0,Q.jsx)(`span`,{className:r({flex:`1`})}),(0,Q.jsx)(`span`,{className:r({textStyle:`caption`,text:`muted`}),children:n.projectName})]}),(0,Q.jsxs)(f,{direction:`horizontal`,sizes:l,onResize:u,minRatio:.3,children:[(0,Q.jsx)(g,{className:r({flex:`1`}),children:(0,Q.jsx)(_,{data:i,columns:o,onChange:a,onActivate:y,onCellFocus:x,header:!0,"aria-label":`Project pipeline`})}),(0,Q.jsx)(v,{header:T,surface:`display`,children:(0,Q.jsx)(g,{className:r({flex:`1`}),children:(0,Q.jsx)(St,{content:S})})})]})]})}export{Ct as default};