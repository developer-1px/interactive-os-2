/** @catalog Camera 데모 — interact / view 시퀀스 / imperative focus */
// ② camera-primitive-prd.md
import { useRef } from 'react'
import { ax } from '@styles/ax'
import { Camera, type CameraHandle, type Shot } from './Camera'
import { Button } from './Button'

// ── (a) interact 모드 — 휠/드래그 ─────────────────────────────────────────

export function CameraInteractDemo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <h3>Camera — interact 모드 (휠/ctrl+휠/드래그)</h3>
      <div style={{ width: 480, height: 320, border: '1px solid var(--color-border-subtle)' }}>
        <Camera mode="interact">
          <div style={{ width: 800, height: 600, padding: 24 }}>
            <div className={ax({ textStyle: 'display' })}>Pan & Zoom Canvas</div>
            <p>마우스 휠로 패닝, Ctrl+휠로 포인터 중심 줌, 드래그로 팬</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 150px)', gap: 16, marginTop: 40 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{
                  height: 100,
                  background: `hsl(${i * 30}, 60%, 70%)`,
                  display: 'grid',
                  placeItems: 'center',
                }}>Tile {i + 1}</div>
              ))}
            </div>
          </div>
        </Camera>
      </div>
    </div>
  )
}

// ── (b) view 모드 — time/end/hold 조합 시퀀스 ─────────────────────────────

const shots: Shot[] = [
  { target: '[data-shot="a"]', scale: 1.5, duration: 500, advance: 'time', at: 0 },
  { target: '[data-shot="b"]', scale: 2.0, duration: 500, hold: 800, advance: 'end' },
  { target: '[data-shot="c"]', scale: 1.2, duration: 500, hold: 800, advance: 'end' },
]

export function CameraSequenceDemo() {
  const ref = useRef<CameraHandle>(null)
  return (
    <div className={ax({ layout: 'stack' })}>
      <h3>Camera — view 모드 시퀀스 (time → end + hold 조합)</h3>
      <div className={ax({ layout: 'row' })}>
        <Button onClick={() => ref.current?.play()}>Play</Button>
        <Button onClick={() => ref.current?.pause()}>Pause</Button>
        <Button onClick={() => ref.current?.stop()}>Stop</Button>
        <Button onClick={() => ref.current?.reset()}>Reset</Button>
      </div>
      <div style={{ width: 480, height: 320, border: '1px solid var(--color-border-subtle)' }}>
        <Camera ref={ref} mode="view" shots={shots} autoplay={false}>
          <div style={{ width: 600, height: 400, position: 'relative' }}>
            <div data-shot="a" style={{ position: 'absolute', top: 20, left: 20, width: 120, height: 80, background: '#fcc', display: 'grid', placeItems: 'center' }}>Shot A</div>
            <div data-shot="b" style={{ position: 'absolute', top: 150, left: 220, width: 120, height: 80, background: '#cfc', display: 'grid', placeItems: 'center' }}>Shot B</div>
            <div data-shot="c" style={{ position: 'absolute', top: 280, left: 420, width: 120, height: 80, background: '#ccf', display: 'grid', placeItems: 'center' }}>Shot C</div>
          </div>
        </Camera>
      </div>
    </div>
  )
}

// ── (c) imperative focus 버튼 ────────────────────────────────────────────

export function CameraImperativeDemo() {
  const ref = useRef<CameraHandle>(null)
  return (
    <div className={ax({ layout: 'stack' })}>
      <h3>Camera — imperative focus</h3>
      <div className={ax({ layout: 'row' })}>
        <Button onClick={() => ref.current?.focus('[data-target="alpha"]', { scale: 2 })}>Focus Alpha</Button>
        <Button onClick={() => ref.current?.focus('[data-target="beta"]', { scale: 1.5 })}>Focus Beta</Button>
        <Button onClick={() => ref.current?.focus('[data-target="gamma"]', { scale: 3 })}>Focus Gamma</Button>
        <Button onClick={() => ref.current?.reset()}>Reset</Button>
      </div>
      <div style={{ width: 480, height: 320, border: '1px solid var(--color-border-subtle)' }}>
        <Camera ref={ref}>
          <div style={{ width: 600, height: 400, position: 'relative' }}>
            <div data-target="alpha" style={{ position: 'absolute', top: 10, left: 10, width: 80, height: 60, background: '#fdd' }}>α</div>
            <div data-target="beta" style={{ position: 'absolute', top: 170, left: 260, width: 80, height: 60, background: '#dfd' }}>β</div>
            <div data-target="gamma" style={{ position: 'absolute', top: 320, left: 500, width: 80, height: 60, background: '#ddf' }}>γ</div>
          </div>
        </Camera>
      </div>
    </div>
  )
}

export const Demo = CameraInteractDemo
