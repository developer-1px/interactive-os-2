#!/usr/bin/env node
import { createServer } from 'http'
import { execSync } from 'child_process'
import { readRegistry, cleanStale } from '../.claude/hooks/worktreeRegistry.mjs'

const DASH_PORT = Number(process.env.WT_DASH_PORT ?? 4000)
const GATEWAY_PORT = Number(process.env.WT_GATEWAY_PORT ?? 4100)

function sh(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim() } catch { return '' }
}

function gitInfo(worktreePath) {
  const q = JSON.stringify(worktreePath)
  const headLine = sh(`git -C ${q} log -1 "--format=%h|%s|%ar"`)
  const [sha = '-', subject = '-', when = '-'] = headLine.split('|')
  const statLines = sh(`git -C ${q} diff --stat main...HEAD`).split('\n').filter(Boolean)
  const diffStat = statLines.at(-1) ?? ''
  const dirty = sh(`git -C ${q} status --porcelain`).split('\n').filter(Boolean).length
  return { sha, subject, when, diffStat, dirty }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function render(entries) {
  const rows = entries.map((e) => {
    const g = gitInfo(e.path)
    const gatewayHref = `http://${e.name}.localhost:${GATEWAY_PORT}/`
    const directHref = `http://localhost:${e.port}/`
    return `<tr>
        <td><a href="${gatewayHref}" target="_blank"><strong>${escapeHtml(e.name)}</strong></a></td>
        <td><code>${escapeHtml(e.branch)}</code></td>
        <td><a href="${directHref}" target="_blank">:${e.port}</a></td>
        <td>${e.dev_pid ?? '—'}</td>
        <td><code>${g.sha}</code> ${escapeHtml(g.subject)}</td>
        <td>${escapeHtml(g.when)}</td>
        <td>${escapeHtml(g.diffStat || '—')}</td>
        <td>${g.dirty ? `<span class="dirty">${g.dirty} dirty</span>` : 'clean'}</td>
      </tr>`
  }).join('')
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Worktree Dashboard</title>
<meta http-equiv="refresh" content="10">
<style>
  body{font:14px/1.5 ui-monospace,SFMono-Regular,monospace;background:#0b0d10;color:#d4d4d4;margin:0;padding:24px}
  h1{font-size:16px;margin:0 0 16px;color:#9ca3af;font-weight:500}
  table{border-collapse:collapse;width:100%}
  th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #1f2328;vertical-align:top}
  th{color:#6b7280;font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:0.05em}
  tr:hover{background:#12151a}
  a{color:#60a5fa;text-decoration:none}
  a:hover{text-decoration:underline}
  code{color:#a78bfa;font-size:12px}
  .dirty{color:#f59e0b}
  .empty{color:#6b7280;padding:32px;text-align:center}
  .meta{color:#6b7280;font-size:12px;margin-top:16px}
</style></head><body>
<h1>Worktree Dashboard · gateway :${GATEWAY_PORT}</h1>
${entries.length === 0 ? '<div class="empty">(no worktrees registered — pnpm wt:list)</div>' : `
<table>
  <thead><tr><th>Name</th><th>Branch</th><th>Port</th><th>PID</th><th>HEAD</th><th>When</th><th>Diff vs main</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`}
<div class="meta">auto-refresh 10s · click name → gateway route · click port → direct</div>
</body></html>`
}

const server = createServer((req, res) => {
  cleanStale()
  const entries = readRegistry()
  if (req.url === '/api/worktrees') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(entries.map((e) => ({ ...e, git: gitInfo(e.path) })), null, 2))
    return
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(render(entries))
})

server.listen(DASH_PORT, () => {
  process.stdout.write(`worktree dashboard: http://localhost:${DASH_PORT}  (gateway: http://wt.localhost:${GATEWAY_PORT})\n`)
})
