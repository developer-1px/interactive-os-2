/**
 * Reproduce: ArrowDown stops working after file content loads in viewer.
 *
 * Scenario: Click a file node → wait for content panel to update → then press ArrowDown.
 * This simulates what the user actually does (click, read the code, then navigate).
 */
import { test } from '@playwright/test'

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

interface Anomaly {
  type: string
  description: string
  eventIndex: number
}

function detectAnomalies(recording: Recording): Anomaly[] {
  const anomalies: Anomaly[] = []
  const events = recording.events

  for (let i = 0; i < events.length; i++) {
    const e = events[i]!
    if (e.type === 'keydown' && e.activeNodeId === null) {
      anomalies.push({ type: 'keydown-on-body', description: `${e.key} on body`, eventIndex: i })
    }
    if (e.type === 'keydown' && e.key?.includes('Arrow') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      const nextFocus = events.slice(i + 1, i + 4).find(ev => ev.type === 'focus')
      if (!nextFocus || nextFocus.activeNodeId === e.activeNodeId) {
        anomalies.push({ type: 'arrow-no-move', description: `${e.key} on ${e.activeNodeId?.split('/').pop()} didn't move`, eventIndex: i })
      }
    }
  }
  return anomalies
}

const RECORDER_SCRIPT = `
window.__recorderFactory = () => {
  const events = []
  let startTime = 0, active = false, rafId = 0, lastActiveDesc = ''
  function desc(el) { if (!el) return 'null'; const t=el.tagName.toLowerCase(), r=el.getAttribute('role')?'[role="'+el.getAttribute('role')+'"]':'', n=el.closest('[data-node-id]')?.getAttribute('data-node-id'); return (t+r+(n?'[data-node-id="'+n+'"]':'')).slice(0,120) }
  function nid(el) { return el?.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null }
  function snap(type, e, key) { const t=e.target; return { ts:Math.round(performance.now()-startTime), type, key, target:desc(t), targetNodeId:nid(t), activeElement:desc(document.activeElement), activeNodeId:nid(document.activeElement) } }
  function onKey(e) { if(active) events.push(snap('keydown',e,e.key===' '?'Space':e.key)) }
  function onClick(e) { if(active) events.push(snap('click',e)) }
  function onFocus(e) { if(active) events.push(snap('focus',e)) }
  function onBlur(e) { if(active) events.push(snap('blur',e)) }
  function poll() { if(!active)return; const d=desc(document.activeElement); if(d!==lastActiveDesc){events.push({ts:Math.round(performance.now()-startTime),type:'focus',target:d,targetNodeId:nid(document.activeElement),activeElement:d,activeNodeId:nid(document.activeElement),key:'(polled)'}); lastActiveDesc=d} rafId=requestAnimationFrame(poll) }
  return {
    start() { events.length=0; startTime=performance.now(); active=true; lastActiveDesc=desc(document.activeElement); window.addEventListener('keydown',onKey,true); window.addEventListener('click',onClick,true); window.addEventListener('focus',onFocus,true); window.addEventListener('blur',onBlur,true); rafId=requestAnimationFrame(poll) },
    stop() { active=false; window.removeEventListener('keydown',onKey,true); window.removeEventListener('click',onClick,true); window.removeEventListener('focus',onFocus,true); window.removeEventListener('blur',onBlur,true); cancelAnimationFrame(rafId); return { meta:{url:location.pathname, startedAt:new Date().toISOString(), duration:Math.round(performance.now()-startTime), eventCount:events.length}, events } }
  }
}
`

test.describe('viewer: ArrowDown after file load', () => {

  test('click file → wait for content load → ArrowDown', async ({ page }) => {
    await page.goto('/viewer')
    await page.waitForSelector('[data-node-id]', { timeout: 5000 })
    await page.evaluate(RECORDER_SCRIPT)

    // Expand a directory first
    const firstDir = page.locator('[data-node-id]').first()
    await firstDir.click()
    await page.keyboard.press('ArrowRight') // expand
    await page.waitForTimeout(200)

    // Start recording
    await page.evaluate(() => {
      // @ts-expect-error
      window.__recorder = window.__recorderFactory()
      // @ts-expect-error
      window.__recorder.start()
    })

    // Click on a FILE (not directory) — this triggers onChange → file content load
    const fileNodes = page.locator('[role="row"]')
    const count = await fileNodes.count()
    let fileNode = null
    for (let i = 0; i < count; i++) {
      const nodeId = await fileNodes.nth(i).getAttribute('data-node-id')
      if (nodeId && (nodeId.endsWith('.ts') || nodeId.endsWith('.tsx') || nodeId.endsWith('.css'))) {
        fileNode = fileNodes.nth(i)
        break
      }
    }

    if (!fileNode) {
      console.log('No file node found, skipping')
      return
    }

    await fileNode.click()
    console.log('Clicked file node, waiting for content to load...')

    // CRITICAL: Wait for content to actually load (simulates user reading the code)
    await page.waitForTimeout(1500)

    // Now check where focus is BEFORE pressing ArrowDown
    const focusBefore = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tag: el?.tagName,
        nodeId: el?.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null,
      }
    })
    console.log('Focus before ArrowDown:', JSON.stringify(focusBefore))

    // Press ArrowDown
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(100)

    const recording: Recording = await page.evaluate(() => {
      // @ts-expect-error
      return window.__recorder.stop()
    })

    const anomalies = detectAnomalies(recording)

    console.log(`\n=== Recording: ${recording.meta.eventCount} events, ${recording.meta.duration}ms ===`)
    console.log(`Anomalies: ${anomalies.length}`)
    for (const a of anomalies) {
      console.log(`  ⚠️  [${a.type}] #${a.eventIndex}: ${a.description}`)
    }

    console.log('\n=== Event Log ===')
    for (const e of recording.events) {
      const nodeId = e.targetNodeId ? e.targetNodeId.split('/').pop() : '(none)'
      const active = e.activeNodeId ? e.activeNodeId.split('/').pop() : 'body'
      const key = e.key ? ` key=${e.key}` : ''
      console.log(`  ${String(e.ts).padStart(5)}ms ${e.type.padEnd(8)}${key} target=${nodeId} active=${active}`)
    }

    if (anomalies.length > 0) {
      console.log('\n⚠️  BUG REPRODUCED — focus lost after file content load')
    } else {
      console.log('\n✅ No anomalies — ArrowDown works after file load')
    }
  })
})
