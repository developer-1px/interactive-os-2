// Kanban board with 5 columns; each card is a mini live preview.

const COLUMNS = [
  { id: 'queued',    label: 'Queued',    hint: 'waiting to start' },
  { id: 'thinking',  label: 'Thinking',  hint: 'planning' },
  { id: 'running',   label: 'Running',   hint: 'actively executing' },
  { id: 'needsme',   label: 'Needs me',  hint: 'blocked on decision' },
  { id: 'done',      label: 'Done',      hint: 'finished' },
];

function Board({ agents, onOpen, onSpawn }) {
  const byCol = {};
  COLUMNS.forEach(c => byCol[c.id] = []);
  agents.forEach(a => { if (byCol[a.status]) byCol[a.status].push(a); });

  return (
    <div className="board">
      {COLUMNS.map(col => (
        <div className={`col col-${col.id}`} key={col.id}>
          <div className="col-head">
            <div className="col-title">
              <span className={`col-dot col-dot-${col.id}`}></span>
              <span className="col-label">{col.label}</span>
              <span className="col-count">{byCol[col.id].length}</span>
            </div>
            <div className="col-hint">{col.hint}</div>
          </div>
          <div className="col-body">
            {col.id === 'done' ? (
              <DoneList agents={byCol.done} onOpen={onOpen}/>
            ) : (
              <>
                {byCol[col.id].map(a => (
                  <AgentCard key={a.id} agent={a} onClick={() => onOpen(a.id)}/>
                ))}
                {col.id === 'queued' && (
                  <button className="col-spawn" onClick={onSpawn}>
                    <span>+</span> new agent
                  </button>
                )}
                {byCol[col.id].length === 0 && col.id !== 'queued' && (
                  <div className="col-empty">—</div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentCard({ agent, onClick }) {
  const [beatIdx, setBeatIdx] = React.useState(0);
  const [t, setT] = React.useState(0);
  const session = agent.session;
  const beats = session?.beats || [];
  const curBeat = beats[beatIdx] || null;
  const isLive = agent.status === 'running' || agent.status === 'thinking';

  React.useEffect(() => {
    if (!isLive || !curBeat) return;
    const dur = { thinking: 6000, terminal: 5500, diff: 5000, filetree: 4500, preview: 4000, commit: 5000 }[curBeat.kind] || 5000;
    let raf, start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p >= 1) { setBeatIdx((beatIdx + 1) % beats.length); start = now; setT(0); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beatIdx, isLive, curBeat?.kind]);

  return (
    <div className={`card card-${agent.status}`} onClick={onClick}>
      <div className="card-top">
        <div className="card-agent">
          <span className="avatar" style={{ background: `oklch(0.68 0.17 ${agent.hue})` }}>
            {agent.avatar}
          </span>
          <div className="card-agent-text">
            <div className="card-agent-name">@{agent.name}</div>
            <div className="card-agent-repo">{agent.repo}</div>
          </div>
        </div>
        <StatusBadge agent={agent}/>
      </div>

      <div className="card-title">{agent.title}</div>

      {/* Mini live preview */}
      {curBeat && (
        <div className={`card-preview card-preview-${curBeat.kind}`}>
          <MiniBeat beat={curBeat} progress={t}/>
        </div>
      )}

      {/* Footer: elapsed + last action */}
      <div className="card-foot">
        <span className="card-elapsed">
          {isLive && <span className="pulse"></span>}
          {agent.elapsed}
        </span>
        {agent.status === 'needsme' && (
          <button className="card-answer" onClick={(e)=>{e.stopPropagation(); onClick();}}>answer →</button>
        )}
        {agent.status === 'done' && <span className="card-done">{agent.doneReason}</span>}
      </div>
    </div>
  );
}

// Compact, ledger-style list for Done — not cards. Keeps column calm.
function DoneList({ agents, onOpen }) {
  if (agents.length === 0) {
    return <div className="col-empty">—</div>;
  }
  return (
    <div className="done-list">
      {agents.map(a => (
        <div key={a.id} className={`done-row ${a.doneReason === 'failed' ? 'done-row-failed' : ''}`} onClick={() => onOpen(a.id)}>
          <span className="done-mark">{a.doneReason === 'failed' ? '✕' : '✓'}</span>
          <span className="done-time">{a.elapsed}</span>
          <span className="done-agent">@{a.name}</span>
          <span className="done-title">{a.title}</span>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ agent }) {
  const map = {
    queued:   { label: 'queued', cls: 'badge-queued' },
    thinking: { label: 'thinking', cls: 'badge-thinking' },
    running:  { label: 'running', cls: 'badge-running' },
    needsme:  { label: 'waiting for you', cls: 'badge-needsme' },
    done:     { label: agent.doneReason === 'failed' ? 'failed' : 'done', cls: agent.doneReason === 'failed' ? 'badge-failed' : 'badge-done' },
  };
  const b = map[agent.status];
  return <span className={`badge ${b.cls}`}>{b.label}</span>;
}

// Small inline beat preview — reuses the kind info but in compact form.
function MiniBeat({ beat, progress }) {
  if (beat.kind === 'thinking') {
    const words = beat.text.split(' ');
    const show = Math.max(8, Math.floor(words.length * Math.min(1, progress * 1.5)));
    return (
      <div className="mini mini-thinking">
        <div className="mini-thinking-ico">
          <span/><span/><span/>
        </div>
        <div className="mini-thinking-text">{words.slice(0, show).join(' ')}{show < words.length && '…'}</div>
      </div>
    );
  }
  if (beat.kind === 'terminal') {
    const show = Math.ceil(beat.lines.length * Math.min(1, progress * 1.2));
    return (
      <div className="mini mini-terminal">
        {beat.lines.slice(-show - 2).slice(0, 5).map((l, i) => (
          <div key={i} className={`mini-tline mini-tline-${l.t}`}>
            {l.t === 'cmd' && <span className="prompt">$</span>}
            <span>{l.v.replace(/^\$\s/, '')}</span>
          </div>
        ))}
      </div>
    );
  }
  if (beat.kind === 'diff') {
    const show = Math.ceil(beat.lines.length * Math.min(1, progress * 1.3));
    return (
      <div className="mini mini-diff">
        <div className="mini-diff-file">{beat.file}</div>
        {beat.lines.slice(0, show).slice(0, 6).map((l, i) => (
          <div key={i} className={`mini-dline mini-dline-${l.t}`}>
            <span className="sign">{l.t === 'add' ? '+' : l.t === 'del' ? '−' : ' '}</span>
            <span>{l.v}</span>
          </div>
        ))}
      </div>
    );
  }
  if (beat.kind === 'filetree') {
    return (
      <div className="mini mini-tree">
        {(progress < 0.5 ? beat.before : beat.after).slice(0, 5).map((n, i) => (
          <div key={i} className={`mini-tnode ${n.hl ? 'mini-t-' + n.hl : ''}`}>
            {n.type === 'dir' ? '▸ ' : '· '}{n.name.trim()}
          </div>
        ))}
      </div>
    );
  }
  if (beat.kind === 'preview') {
    return (
      <div className="mini mini-preview">
        <div className="mini-preview-url">{beat.url}</div>
        <div className="mini-preview-title">{beat.title}</div>
        <div className="mini-preview-sub">{beat.sub}</div>
      </div>
    );
  }
  if (beat.kind === 'commit') {
    return (
      <div className="mini mini-commit">
        <div className="mini-commit-head">
          <span className="hash">{beat.hash}</span>
          <span className="branch">{beat.branch}</span>
        </div>
        <div className="mini-commit-msg">{beat.message}</div>
        <div className="mini-commit-stats">
          <span className="add">+{beat.additions}</span>
          <span className="del">−{beat.deletions}</span>
          <span>{beat.files} files</span>
        </div>
      </div>
    );
  }
  return null;
}

Object.assign(window, { Board });
