# ax() padding 축 리팩토링 — cs/pd/content 재설계

## 배경

controlSize(cs)가 padding-inline을 소유하고 있어 아이콘-only 버튼이 48×36 직사각형으로 렌더링됨.
padding-inline:block 2:1 비율은 텍스트 콘텐츠에서만 유효한 전략 (M3, optical balance 근거).

## 설계 결정 (discussion 합의)

1. **cs에서 padding-inline 제거, min-width = min-height 추가**
   - cs의 역할 = 세로 고정 (+ 정사각 최소 크기)
   - `min-height: Xpx; min-width: Xpx; border-radius; font-size;`

2. **pd 축을 calc 기반으로 변경**
   - `padding-block: var(--space-*); padding-inline: calc(var(--space-*) * var(--pd-ratio, 1));`
   - 기본 ratio=1 (균등), content:'text' 시 ratio=2

3. **content 축 신설**
   - `type Content = 'text'` → `.ct-text { --pd-ratio: 2; }`
   - 확장 가능: 'code', 'vertical' 등 미래 값

4. **소급 적용**
   - 텍스트 버튼: cs에서 padding 빠지므로 `padding` + `content: 'text'` 추가
   - 아이콘 버튼: cs만으로 정사각, padding/content 불필요

## 액션 플랜

1. ax.ts — Content 타입 추가, Axes 인터페이스 확장, prefixes 추가
2. ax.css — cs-* 재작성, pd-* calc 변환, ct-* 추가
3. 소급 적용 — controlSize 사용처 전수 검색 → 텍스트/아이콘 분류 → 축 추가/제거
4. 테스트 실행 + typecheck
