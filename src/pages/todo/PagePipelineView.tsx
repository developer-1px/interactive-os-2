// Pipeline viewer — 5단계 스샷 + 설명을 모바일에서 확인하는 gallery.
// Route: /todo/pipeline
import { ax } from '@styles/ax'
import styles from './PageTodo.module.css'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

interface Stage {
  n: number
  name: string
  kind: 'text' | 'json' | 'render'
  summary: string
  artifacts: string[]
  img?: string
}

const stages: Stage[] = [
  {
    n: 1,
    name: 'Requirement',
    kind: 'text',
    summary: '자연어 스펙 — 기능 5개(추가/완료/삭제/빈상태/진행요약), 375×812 모바일 뷰포트 고정, ax()만 사용, NormalizedData+Command.',
    artifacts: ['docs/research/pipeline/todo/1-requirement.md'],
  },
  {
    n: 2,
    name: 'Data',
    kind: 'json',
    summary: 'NormalizedData — entities 3(todo) + relationships(root→todos) + 3 commands(add/toggle/remove). 진행 요약은 derived.',
    artifacts: ['docs/research/pipeline/todo/2-data.json'],
  },
  {
    n: 3,
    name: 'Components',
    kind: 'json',
    summary: 'ui/ 부품 9개 선정: PanelHeader, ListBox, ListItem, Checkbox, Button×2, CloseIndicator, TextInput, EmptyState. 2 gap 기록.',
    artifacts: ['docs/research/pipeline/todo/3-components.json'],
  },
  {
    n: 4,
    name: 'Layout',
    kind: 'render',
    summary: 'definePage(split vertical [auto, flex, auto]). 정적 fixture 렌더. 관찰된 문제 2건: AppShell 내비 잔존, 입력바 overflow.',
    artifacts: ['src/pages/todo/todoDefinePage.ts', 'docs/research/pipeline/todo/4-layout.dom.html'],
    img: `${BASE}/pipeline/todo/4-layout.png`,
  },
  {
    n: 5,
    name: 'Assembly',
    kind: 'render',
    summary: 'Store + engine + context 연동. Enter/클릭으로 add/toggle/remove. AppShell 모바일 라우트 조건부 숨김 + TextInput flex 래핑으로 Stage 4 문제 해소.',
    artifacts: ['src/pages/todo/todoStore.ts', 'src/pages/todo/todoWidgets.tsx', 'docs/research/pipeline/todo/5-assembly.dom.html'],
    img: `${BASE}/pipeline/todo/5-assembly.png`,
  },
]

export default function PagePipelineView() {
  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      <div className={ax({ role: 'control-group', surface: 'raised', layout: 'row', width: 'full', flex: 'none' })}>
        <div className={ax({ textStyle: 'section', flex: '1' })}>Pipeline · Todo</div>
        <a href={`${BASE}/todo`} className={ax({ role: 'control', surface: 'ghost', interactive: 'button', textStyle: 'body' })}>
          앱 열기 →
        </a>
      </div>

      <div className={ax({ layout: 'stack', width: 'full' })}>
        {stages.map(stage => (
          <article key={stage.n} className={ax({ role: 'control-group', surface: 'base', layout: 'stack', width: 'full' })}>
            <header className={ax({ layout: 'row', width: 'full' })}>
              <span className={ax({ role: 'badge', surface: 'display', textStyle: 'label' })}>Stage {stage.n}</span>
              <span className={ax({ textStyle: 'section', flex: '1' })}>{stage.name}</span>
              <span className={ax({ textStyle: 'caption' })}>{stage.kind}</span>
            </header>

            <p className={ax({ textStyle: 'body' })}>{stage.summary}</p>

            {stage.img && (
              <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'center', width: 'full' })}>
                <img
                  src={stage.img}
                  alt={`Stage ${stage.n} — ${stage.name}`}
                  loading="lazy"
                  className={styles.stageImg}
                />
              </div>
            )}

            <ul className={ax({ layout: 'stack', width: 'full' })}>
              {stage.artifacts.map(a => (
                <li key={a} className={ax({ textStyle: 'code', clamp: '1' })}>
                  {a}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
