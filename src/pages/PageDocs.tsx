import styles from './PageDocs.module.css'

const INSTALL_CODE = `npm install interactive-os`

const QUICK_START = `import { ListBox } from 'interactive-os/ui/ListBox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    apple:  { id: 'apple',  data: { label: 'Apple' } },
    banana: { id: 'banana', data: { label: 'Banana' } },
    cherry: { id: 'cherry', data: { label: 'Cherry' } },
  },
  relationships: { __root__: ['apple', 'banana', 'cherry'] },
})

function App() {
  const [store, setStore] = useState(data)
  return <ListBox data={store} onChange={setStore} />
}`

const CONCEPTS = [
  {
    title: 'NormalizedData',
    desc: 'Flat entity map + relationship adjacency list. One shape for every UI pattern — trees, lists, grids, tabs.',
  },
  {
    title: 'Engine',
    desc: 'Command dispatch + middleware pipeline. Every state mutation is a command that flows through plugins.',
  },
  {
    title: 'Behavior',
    desc: '5 composable axes (navigate, select, activate, expand, trap) that combine into ARIA-compliant presets.',
  },
  {
    title: 'Plugin',
    desc: 'CRUD, clipboard, history, DnD, rename, typeahead — each owns its keyMap and intercepts.',
  },
  {
    title: 'UI Component',
    desc: 'Finished products that compose Behavior + Plugins. <ListBox>, <TreeGrid>, <Kanban> — just pass data.',
  },
]

export default function PageDocs() {
  return (
    <main className={styles.docs}>
      <article className={styles.article}>
        <h1 className={styles.title}>Getting Started</h1>
        <p className={styles.lead}>
          interactive-os is a keyboard-first UI engine. You give it normalized data, it gives you
          fully accessible components with ARIA roles, keyboard navigation, and state management built in.
        </p>

        <section className={styles.section}>
          <h2 className={styles.heading}>Install</h2>
          <pre className={styles.code}><code>{INSTALL_CODE}</code></pre>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Quick Start</h2>
          <p className={styles.text}>
            Every component takes a <code className={styles.inlineCode}>NormalizedData</code> store
            and an <code className={styles.inlineCode}>onChange</code> callback. That&apos;s the entire API surface.
          </p>
          <pre className={styles.code}><code>{QUICK_START}</code></pre>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Core Concepts</h2>
          <div className={styles.conceptGrid}>
            {CONCEPTS.map((c) => (
              <div key={c.title} className={styles.conceptCard}>
                <h3 className={styles.conceptTitle}>{c.title}</h3>
                <p className={styles.conceptDesc}>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Architecture</h2>
          <div className={styles.layers}>
            {['L7 UI Components', 'L6 React Hooks', 'L5 Zone', 'L4 Behavior', 'L3 Plugins', 'L2 Engine', 'L1 Store'].map((layer, i) => (
              <div key={layer} className={styles.layer} style={{ opacity: 1 - i * 0.08 }}>
                <span className={styles.layerLabel}>{layer}</span>
              </div>
            ))}
          </div>
          <p className={styles.caption}>
            L1–L4 are renderer-independent. L5–L7 are React bindings.
          </p>
        </section>
      </article>
    </main>
  )
}
