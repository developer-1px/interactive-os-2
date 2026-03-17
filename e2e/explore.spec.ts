/**
 * Exploratory browser testing for interactive-os.
 *
 * This is NOT a pass/fail test suite. It's a tool for the LLM to:
 * 1. Open a real browser
 * 2. Interact with the page (click, keyboard)
 * 3. Capture a recording via the devtools recorder
 * 4. Analyze the recording for anomalies
 *
 * Run: pnpm exec playwright test e2e/explore.spec.ts
 */
import { test, expect } from '@playwright/test'

interface RawEvent {
  ts: number
  type: string
  key?: string
  target: string
  targetNodeId: string | null
  activeElement: string
  activeNodeId: string | null
}

interface Recording {
  meta: { url: string; startedAt: string; duration: number; eventCount: number }
  events: RawEvent[]
}

// --- Anomaly detection ---

interface Anomaly {
  type: string
  description: string
  eventIndex: number
  event: RawEvent
}

function detectAnomalies(recording: Recording): Anomaly[] {
  const anomalies: Anomaly[] = []
  const events = recording.events

  for (let i = 0; i < events.length; i++) {
    const e = events[i]!

    // Focus went to body unexpectedly (not from a click on non-interactive element)
    if (e.type === 'blur' && e.activeNodeId === null) {
      const next = events[i + 1]
      // If next event is NOT a focus on a node, focus was lost
      if (!next || next.type !== 'focus' || next.targetNodeId === null) {
        anomalies.push({
          type: 'focus-lost-to-body',
          description: `Focus lost to body after ${e.target}. No recovery.`,
          eventIndex: i,
          event: e,
        })
      }
    }

    // Keydown on body (no node focused)
    if (e.type === 'keydown' && e.activeNodeId === null) {
      anomalies.push({
        type: 'keydown-on-body',
        description: `${e.key} fired on body — no node was focused`,
        eventIndex: i,
        event: e,
      })
    }

    // Keydown that didn't change focus (possible no-op)
    if (e.type === 'keydown' && e.key?.includes('Arrow')) {
      const nextFocus = events.slice(i + 1, i + 4).find(ev => ev.type === 'focus')
      if (!nextFocus || nextFocus.activeNodeId === e.activeNodeId) {
        // ArrowRight/Left on leaf or already collapsed/expanded is expected
        // But ArrowDown/Up should always move (unless at boundary)
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          anomalies.push({
            type: 'arrow-no-move',
            description: `${e.key} on ${e.activeNodeId} didn't move focus`,
            eventIndex: i,
            event: e,
          })
        }
      }
    }
  }

  return anomalies
}

// --- Helpers ---

async function startRecorder(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    // @ts-expect-error — recorder is on window in dev
    window.__recorder = window.__recorderFactory()
    // @ts-expect-error
    window.__recorder.start()
  })
}

async function stopRecorder(page: import('@playwright/test').Page): Promise<Recording> {
  return page.evaluate(() => {
    // @ts-expect-error
    return window.__recorder.stop()
  })
}

// --- Exploratory tests ---

test.describe('exploratory browser testing', () => {

  test('viewer: file tree keyboard navigation', async ({ page }) => {
    await page.goto('/viewer')
    await page.waitForSelector('[data-node-id]', { timeout: 5000 })

    // Inject recorder factory into page
    await page.evaluate(() => {
      // Inline a minimal recorder since we can't import modules
      // @ts-expect-error
      window.__recorderFactory = () => {
        const events: unknown[] = []
        let startTime = 0
        let active = false
        let rafId = 0
        let lastActiveDesc = ''

        function desc(el: Element | null): string {
          if (!el) return 'null'
          const tag = el.tagName.toLowerCase()
          const role = el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : ''
          const nid = el.closest('[data-node-id]')?.getAttribute('data-node-id')
          return `${tag}${role}${nid ? `[data-node-id="${nid}"]` : ''}`.slice(0, 120)
        }
        function nid(el: Element | null): string | null {
          return el?.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null
        }
        function snap(type: string, e: Event, key?: string) {
          const t = e.target as Element
          return { ts: Math.round(performance.now() - startTime), type, key, target: desc(t), targetNodeId: nid(t), activeElement: desc(document.activeElement), activeNodeId: nid(document.activeElement) }
        }
        function onKey(e: KeyboardEvent) { if (active) events.push(snap('keydown', e, e.key === ' ' ? 'Space' : e.key)) }
        function onClick(e: MouseEvent) { if (active) events.push(snap('click', e)) }
        function onFocus(e: FocusEvent) { if (active) events.push(snap('focus', e)) }
        function onBlur(e: FocusEvent) { if (active) events.push(snap('blur', e)) }
        function poll() {
          if (!active) return
          const d = desc(document.activeElement)
          if (d !== lastActiveDesc) { events.push({ ts: Math.round(performance.now() - startTime), type: 'focus', target: d, targetNodeId: nid(document.activeElement), activeElement: d, activeNodeId: nid(document.activeElement), key: '(polled)' }); lastActiveDesc = d }
          rafId = requestAnimationFrame(poll)
        }
        return {
          start() { events.length = 0; startTime = performance.now(); active = true; lastActiveDesc = desc(document.activeElement); window.addEventListener('keydown', onKey, true); window.addEventListener('click', onClick, true); window.addEventListener('focus', onFocus, true); window.addEventListener('blur', onBlur, true); rafId = requestAnimationFrame(poll) },
          stop() { active = false; window.removeEventListener('keydown', onKey, true); window.removeEventListener('click', onClick, true); window.removeEventListener('focus', onFocus, true); window.removeEventListener('blur', onBlur, true); cancelAnimationFrame(rafId); return { meta: { url: location.pathname, startedAt: new Date().toISOString(), duration: Math.round(performance.now() - startTime), eventCount: events.length }, events } }
        }
      }
    })

    await startRecorder(page)

    // --- Exploratory interaction ---
    // Click first visible node
    const firstNode = page.locator('[data-node-id]').first()
    await firstNode.click()
    await page.waitForTimeout(100)

    // Try all arrow keys
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(50)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(50)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(50)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(50)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(50)

    // Expand a directory
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)

    // Navigate into children
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(50)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(50)

    // Collapse back
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(50)
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(50)

    // Home / End
    await page.keyboard.press('Home')
    await page.waitForTimeout(50)
    await page.keyboard.press('End')
    await page.waitForTimeout(50)

    const recording = await stopRecorder(page)

    // --- Analysis ---
    const anomalies = detectAnomalies(recording)

    console.log(`\n=== Recording: ${recording.meta.eventCount} events, ${recording.meta.duration}ms ===`)
    console.log(`Anomalies found: ${anomalies.length}`)
    for (const a of anomalies) {
      console.log(`  [${a.type}] #${a.eventIndex}: ${a.description}`)
    }

    // Print full event log for LLM analysis
    console.log('\n=== Event Log ===')
    for (const e of recording.events) {
      const nodeId = e.targetNodeId ? e.targetNodeId.split('/').pop() : '(none)'
      const active = e.activeNodeId ? e.activeNodeId.split('/').pop() : 'body'
      const key = e.key ? ` key=${e.key}` : ''
      console.log(`  ${String(e.ts).padStart(5)}ms ${e.type.padEnd(8)}${key} target=${nodeId} active=${active}`)
    }

    // Soft assertion — report anomalies but don't fail
    if (anomalies.length > 0) {
      console.log('\n⚠️  Anomalies detected — review above for potential bugs')
    } else {
      console.log('\n✅ No anomalies detected')
    }
  })
})
