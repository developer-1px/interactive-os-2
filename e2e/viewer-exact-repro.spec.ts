/**
 * Exact reproduction of user's sequence:
 * 1. Click interactive-os directory
 * 2. ArrowRight (expand)
 * 3. ArrowLeft (collapse)
 * 4. ArrowRight (expand again)
 * 5. ArrowDown — THIS is where it fails for the user
 */
import { test } from '@playwright/test'

const RECORDER_SCRIPT = `
window.__rec = (() => {
  const events = []
  let t0 = 0, on = false, raf = 0, last = ''
  const d = el => { if(!el)return'null'; const t=el.tagName.toLowerCase(),r=el.getAttribute('role')?'[role='+el.getAttribute('role')+']':'',n=el.closest('[data-node-id]')?.getAttribute('data-node-id'); return (t+r+(n?'[nid='+n.split('/').pop()+']':'')).slice(0,100) }
  const n = el => el?.closest('[data-node-id]')?.getAttribute('data-node-id')??null
  const s = (type,e,key) => ({ts:Math.round(performance.now()-t0),type,key,target:d(e.target),targetNodeId:n(e.target),activeElement:d(document.activeElement),activeNodeId:n(document.activeElement)})
  const poll = () => { if(!on)return; const dd=d(document.activeElement); if(dd!==last){events.push({ts:Math.round(performance.now()-t0),type:'focus',target:dd,targetNodeId:n(document.activeElement),activeElement:dd,activeNodeId:n(document.activeElement),key:'(polled)'}); last=dd} raf=requestAnimationFrame(poll) }
  return {
    start(){events.length=0;t0=performance.now();on=true;last=d(document.activeElement);window.addEventListener('keydown',e=>{if(on)events.push(s('keydown',e,e.key))},true);window.addEventListener('click',e=>{if(on)events.push(s('click',e))},true);window.addEventListener('focus',e=>{if(on)events.push(s('focus',e))},true);window.addEventListener('blur',e=>{if(on)events.push(s('blur',e))},true);raf=requestAnimationFrame(poll)},
    stop(){on=false;cancelAnimationFrame(raf);return{meta:{url:location.pathname,duration:Math.round(performance.now()-t0),eventCount:events.length},events}}
  }
})()`

test('exact user sequence: expand → collapse → expand → ArrowDown', async ({ page }) => {
  await page.goto('/viewer')
  await page.waitForSelector('[data-node-id]', { timeout: 5000 })

  // Find the interactive-os directory
  const iosNode = page.locator('[data-node-id$="/interactive-os"]').first()
  await page.evaluate(RECORDER_SCRIPT)

  // Start recording
  await page.evaluate(() => {
    // @ts-expect-error
    window.__rec.start()
  })

  // 1. Click interactive-os
  await iosNode.click()
  await page.waitForTimeout(200)

  // 2. ArrowRight (expand)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500) // Wait for children to render (large directory)

  // 3. ArrowLeft (collapse)
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(200)

  // 4. ArrowRight (expand again)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500) // Wait again for render

  // 5. NOW: Check focus state before ArrowDown
  const focusBefore = await page.evaluate(() => ({
    active: document.activeElement?.tagName,
    nodeId: document.activeElement?.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null,
    tabIndex: (document.activeElement as HTMLElement)?.tabIndex,
  }))
  console.log('Focus before ArrowDown:', JSON.stringify(focusBefore))

  // 6. ArrowDown
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)

  // 7. Check focus after
  const focusAfter = await page.evaluate(() => ({
    active: document.activeElement?.tagName,
    nodeId: document.activeElement?.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null,
  }))
  console.log('Focus after ArrowDown:', JSON.stringify(focusAfter))

  // 8. Try more arrows
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(100)
  await page.keyboard.press('ArrowUp')
  await page.waitForTimeout(100)

  const recording = await page.evaluate(() => {
    // @ts-expect-error
    return window.__rec.stop()
  })

  console.log(`\n=== ${recording.meta.eventCount} events, ${recording.meta.duration}ms ===`)
  for (const e of recording.events) {
    const nid = e.targetNodeId ? e.targetNodeId.split('/').pop() : '(none)'
    const act = e.activeNodeId ? e.activeNodeId.split('/').pop() : 'body'
    const key = e.key ? ` ${e.key}` : ''
    console.log(`  ${String(e.ts).padStart(5)}ms ${e.type.padEnd(8)}${key.padEnd(14)} node=${nid.padEnd(20)} active=${act}`)
  }

  // Check if ArrowDown moved focus
  const arrowDownEvents = recording.events.filter((e: { type: string; key?: string }) => e.type === 'keydown' && e.key === 'ArrowDown')
  console.log(`\nArrowDown keydowns captured: ${arrowDownEvents.length}`)

  if (focusBefore.nodeId && focusAfter.nodeId && focusBefore.nodeId !== focusAfter.nodeId) {
    console.log('✅ ArrowDown moved focus')
  } else {
    console.log('⚠️  ArrowDown did NOT move focus')
    console.log('  before:', focusBefore.nodeId?.split('/').pop())
    console.log('  after:', focusAfter.nodeId?.split('/').pop())
  }
})
