// @useState-hatch
import { useState, useMemo, useRef, useCallback } from 'react'
import { ax } from '@styles/ax'
import { A2UISurface } from '@os/ui/A2UISurface'
import type { A2UIPayload } from '@os/ui/a2uiAdapter'
import { categories } from './a2uiPresets'
import type { A2UIv09Envelope } from './a2uiPresets'
import styles from './PageA2UI.module.css'

// ── Envelope → A2UIPayload adapter ──

function envelopeToPayload(json: string): { payload: A2UIPayload | null; error: string | null } {
  try {
    const parsed = JSON.parse(json)
    const components = parsed?.updateComponents?.components ?? parsed?.components
    if (!Array.isArray(components)) {
      return { payload: null, error: 'Missing components array' }
    }
    const dataModel = parsed?.dataModel ?? parsed?.updateComponents?.dataModel
    return { payload: { components, ...(dataModel ? { dataModel } : {}) }, error: null }
  } catch (e) {
    return { payload: null, error: (e as Error).message }
  }
}

// ── Stream simulation (component-by-component) — @useState-hatch ──

interface StreamState {
  streaming: boolean
  progress: number
  partialPayload: A2UIPayload | null
}

function useComponentStream(onJsonUpdate: (text: string) => void) {
  // @useState-hatch
  const [state, setState] = useState<StreamState>({ streaming: false, progress: 0, partialPayload: null })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const componentsRef = useRef<A2UIv09Envelope['updateComponents']['components']>([])
  const indexRef = useRef(0)

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setState(s => ({ ...s, streaming: false }))
  }, [])

  const start = useCallback((envelope: A2UIv09Envelope) => {
    stop()
    const allComponents = envelope.updateComponents.components
    componentsRef.current = []
    indexRef.current = 0
    setState({ streaming: true, progress: 0, partialPayload: null })
    onJsonUpdate('')

    function tick() {
      const comp = allComponents[indexRef.current]
      indexRef.current++
      componentsRef.current = [...componentsRef.current, comp]

      const partialEnvelope: A2UIv09Envelope = {
        ...envelope,
        updateComponents: { ...envelope.updateComponents, components: componentsRef.current },
      }
      const progress = Math.round((indexRef.current / allComponents.length) * 100)
      onJsonUpdate(JSON.stringify(partialEnvelope, null, 2))

      const partialPayload: A2UIPayload = {
        components: componentsRef.current,
        ...(envelope.dataModel ? { dataModel: envelope.dataModel } : {}),
      }

      if (indexRef.current < allComponents.length) {
        setState({ streaming: true, progress, partialPayload })
        timerRef.current = setTimeout(tick, 150 + Math.random() * 200)
      } else {
        setState({ streaming: false, progress: 100, partialPayload })
      }
    }

    timerRef.current = setTimeout(tick, 300)
  }, [onJsonUpdate, stop])

  return { ...state, start, stop }
}

// ── Page ──

export default function PageA2UI() {
  // @useState-hatch
  const [catIndex, setCatIndex] = useState(0)
  const [presetKey, setPresetKey] = useState(() => Object.keys(categories[0].presets)[0])
  const [jsonText, setJsonText] = useState(() => JSON.stringify(Object.values(categories[0].presets)[0], null, 2))

  const { payload: editPayload, error } = useMemo(() => envelopeToPayload(jsonText), [jsonText])

  const setJsonTextCb = useCallback((text: string) => setJsonText(text), [])
  const { streaming, progress, partialPayload, start: startStream, stop: stopStream } = useComponentStream(setJsonTextCb)

  const payload = streaming ? partialPayload : editPayload
  const cat = categories[catIndex]
  const presetNames = Object.keys(cat.presets)

  function selectCategory(i: number) {
    if (streaming) stopStream()
    setCatIndex(i)
    const firstKey = Object.keys(categories[i].presets)[0]
    setPresetKey(firstKey)
    setJsonText(JSON.stringify(categories[i].presets[firstKey], null, 2))
  }

  function selectPreset(key: string) {
    if (streaming) stopStream()
    setPresetKey(key)
    setJsonText(JSON.stringify(cat.presets[key], null, 2))
  }

  function simulateStream() {
    startStream(cat.presets[presetKey])
  }

  return (
    <div className={ax({ layout: 'fill', padding: 'lg', gap: 'md' })}>
      {/* Header */}
      <div className={ax({ layout: 'stack', gap: 'xs', flex: 'none' })}>
        <h1 className={ax({ textStyle: 'page', text: 'bright' })}>A2UI Playground</h1>
        <p className={ax({ textStyle: 'caption', text: 'secondary' })}>
          Google A2UI v0.9 — 15 components, keyboard/ARIA accessible, streaming progressive render
        </p>
      </div>

      {/* Category tabs */}
      <div className={ax({ layout: 'row', gap: 'xs', flex: 'none' })}>
        {categories.map((c, i) => (
          <button
            key={c.label}
            onClick={() => selectCategory(i)}
            className={ax({
              interactive: 'tab',
              layout: 'row',
              text: 'muted',
              surface: i === catIndex ? 'action' : 'ghost',
              controlSize: 'sm',
              padding: 'sm',
              content: 'text',
              tone: i === catIndex ? 'accent' : undefined,
            })}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Preset selector within category + stream button */}
      <div className={ax({ layout: 'row', gap: 'sm', flex: 'none' })}>
        {presetNames.map((name) => (
          <button
            key={name}
            onClick={() => selectPreset(name)}
            className={ax({
              surface: name === presetKey ? 'action' : 'ghost',
              controlSize: 'sm',
              padding: 'sm',
              content: 'text',
              tone: name === presetKey ? 'accent-dim' : undefined,
            })}
          >
            {name}
          </button>
        ))}
        <span className={ax({ flex: '1' })} />
        {streaming ? (
          <button
            onClick={stopStream}
            className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', tone: 'danger' })}
          >
            Stop ({progress}%)
          </button>
        ) : (
          <button
            onClick={simulateStream}
            className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', tone: 'accent' })}
          >
            Simulate Stream
          </button>
        )}
      </div>

      {/* Split pane: editor | preview */}
      <div className={ax({ layout: 'row', gap: 'lg', flex: '1', scroll: 'hidden' })}>
        {/* JSON Editor */}
        <div className={ax({ flex: '1', layout: 'stack', gap: 'xs', scroll: 'hidden' })}>
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={ax({ textStyle: 'label', text: 'secondary' })}>A2UI v0.9 Envelope</span>
            {streaming && (
              <span className={ax({ textStyle: 'caption', tone: 'accent', text: 'primary' })}>
                Streaming... {progress}%
              </span>
            )}
            {!streaming && error && (
              <span className={ax({ textStyle: 'caption', tone: 'danger', text: 'primary' })}>
                {error}
              </span>
            )}
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            readOnly={streaming}
            spellCheck={false}
            className={`${ax({ surface: 'sunken', padding: 'md', shape: 'sm', textStyle: 'code', flex: '1', scroll: 'y' })} ${styles.editor}`}
          />
        </div>

        {/* Render Preview */}
        <div className={ax({ flex: '1', layout: 'stack', gap: 'xs', scroll: 'hidden' })}>
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={ax({ textStyle: 'label', text: 'secondary' })}>Rendered UI</span>
            {streaming && (
              <span className={ax({ textStyle: 'caption', tone: 'accent', text: 'primary' })}>
                {partialPayload ? `${partialPayload.components.length} components` : 'Starting...'}
              </span>
            )}
          </div>
          <div className={ax({ surface: 'display', padding: 'lg', shape: 'md', flex: '1', scroll: 'y' })}>
            {payload ? (
              <A2UISurface payload={payload} />
            ) : (
              <div className={ax({ textStyle: 'body', text: 'muted', layout: 'center', flex: '1' })}>
                {error ? 'Fix JSON to see preview' : 'No components'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
