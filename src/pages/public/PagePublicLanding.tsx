import { Link } from 'react-router-dom'
import { ax } from '@styles/ax'

const CARDS = [
  {
    to: '/ax-principles',
    title: 'ax Principles',
    desc: '현대 UI 디자인 메타 원리 20개. 카드별 정의·증거·수학근거·반증조건·ax축 매핑',
  },
  {
    to: '/ui',
    title: 'UI Showcase',
    desc: 'Keyboard-first ARIA UI 컴포넌트 쇼케이스 (ListBox · TreeGrid · Combobox · Workspace 등)',
  },
  {
    to: '/catalog',
    title: 'Component Catalog',
    desc: '100+ 완성품 부품 카탈로그. 카테고리별 demo + props + 사용처',
  },
  {
    to: '/showcase/gmail',
    title: 'Gmail Mockup',
    desc: 'FlatLayout definePage로 설계한 Gmail 레이아웃 목업',
  },
]

export default function PagePublicLanding() {
  return (
    <div
      className={ax({ layout: 'stack', gap: 'xl', padding: 'xl', width: 'xl' })}
      style={{ margin: '0 auto', flex: 1 }}
    >
      <header className={ax({ layout: 'stack', gap: 'md' })} style={{ paddingBlock: 'var(--space-2xl)' }}>
        <h1
          className={ax({ textStyle: 'hero' })}
          style={{
            fontFamily: 'Newsreader, serif',
            fontWeight: 400,
            lineHeight: 1.1,
            color: 'var(--text-bright)',
            margin: 0,
          }}
        >
          Keyboard-first ARIA UI<br />as a design system.
        </h1>
        <p
          className={ax({ textStyle: 'body', width: 'prose' })}
          style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.125rem', lineHeight: 1.6 }}
        >
          aria는 현대 UI 디자인의 메타 원리를 좌표계(25축)로 형상화한 디자인 시스템.
          측정 가능한 원리만 공식화하고, Ratcheting Convergence Loop로 점진 개선을 보장한다.
        </p>
      </header>

      <section
        className={ax({ layout: 'grid-3', gap: 'lg' })}
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={ax({
              surface: 'display',
              padding: 'lg',
              layout: 'stack',
              gap: 'sm',
              interactive: 'item',
            })}
            style={{
              textDecoration: 'none',
              borderRadius: 'var(--shape-md-radius)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className={ax({ textStyle: 'section' })}
              style={{ color: 'var(--text-bright)', fontWeight: 500 }}
            >
              {c.title}
            </div>
            <div className={ax({ textStyle: 'body' })} style={{ color: 'var(--text-secondary)' }}>
              {c.desc}
            </div>
          </Link>
        ))}
      </section>

      <footer
        className={ax({ layout: 'row', gap: 'md', padding: 'md' })}
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          justifyContent: 'space-between',
        }}
      >
        <span className={ax({ textStyle: 'caption' })}>
          focus-apca 22/22 · text-apca 88/88 · ratchet-locked
        </span>
        <a
          href="https://github.com/developer-1px/interactive-os-2"
          target="_blank"
          rel="noreferrer"
          className={ax({ textStyle: 'caption' })}
          style={{ color: 'var(--text-secondary)' }}
        >
          GitHub →
        </a>
      </footer>
    </div>
  )
}
