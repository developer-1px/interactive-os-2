// Agent roster — 5 kanban columns, live-feeling progression.
// Each agent has a session (reused from SESSIONS) and a status.

const AGENTS = [
  {
    id: 'a1', name: 'nova-agent', avatar: '◆', hue: 265,
    status: 'running',
    title: 'Fix: auth token refresh race condition',
    repo: 'acme/payments-api',
    elapsed: '2:34',
    session: window.SESSIONS[0],
  },
  {
    id: 'a2', name: 'atlas', avatar: '▲', hue: 160,
    status: 'running',
    title: 'Refactor: extract <DataTable/> into its own package',
    repo: 'acme/design-system',
    elapsed: '11:07',
    session: window.SESSIONS[1],
  },
  {
    id: 'a3', name: 'nova-agent', avatar: '◆', hue: 265,
    status: 'thinking',
    title: 'Feat: build landing page from Figma spec',
    repo: 'acme/marketing-site',
    elapsed: '0:42',
    session: window.SESSIONS[2],
  },
  {
    id: 'a4', name: 'sable', avatar: '●', hue: 20,
    status: 'needsme',
    title: 'Debug: checkout 500s only in prod',
    repo: 'acme/commerce',
    elapsed: '8:51',
    question: 'This fix changes the rounding behavior for JPY (no subunit). Ship anyway, or split into two PRs?',
    session: window.SESSIONS[3],
  },
  {
    id: 'a5', name: 'atlas', avatar: '▲', hue: 160,
    status: 'done',
    title: 'Add: integration tests for rate limiter',
    repo: 'acme/gateway',
    elapsed: '2:14',
    doneReason: 'merged',
    session: window.SESSIONS[4],
  },
  {
    id: 'a6', name: 'ember', avatar: '★', hue: 40,
    status: 'queued',
    title: 'Migrate: switch logger to pino',
    repo: 'acme/payments-api',
    elapsed: 'queued 12s ago',
    session: window.SESSIONS[0],
  },
  {
    id: 'a7', name: 'linden', avatar: '■', hue: 200,
    status: 'queued',
    title: 'Write: README for the new table package',
    repo: 'acme/design-system',
    elapsed: 'queued 4s ago',
    session: window.SESSIONS[1],
  },
  {
    id: 'a8', name: 'sable', avatar: '●', hue: 20,
    status: 'done',
    title: 'Bump: TypeScript to 5.5',
    repo: 'acme/gateway',
    elapsed: '4:02',
    doneReason: 'failed',
    session: window.SESSIONS[4],
  },
];

window.AGENTS = AGENTS;
