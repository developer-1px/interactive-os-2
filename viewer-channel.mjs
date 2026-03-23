import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import http from 'node:http'

const mcp = new Server(
  { name: 'viewer-channel', version: '0.0.1' },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },
    },
    instructions: 'Messages from <channel source="viewer-channel"> are user input from the web viewer. Treat them as normal user messages and respond accordingly.',
  },
)

await mcp.connect(new StdioServerTransport())

// HTTP server — receives POST from viewer, pushes to Claude session
const PORT = 8788
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks).toString('utf-8')

  if (!body.trim()) { res.writeHead(400); res.end('empty'); return }

  await mcp.notification({
    method: 'notifications/claude/channel',
    params: { content: body },
  })

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('ok')
}).listen(PORT, '127.0.0.1', () => {
  // stderr so it doesn't interfere with stdio transport
  console.error(`[viewer-channel] listening on http://127.0.0.1:${PORT}`)
})
