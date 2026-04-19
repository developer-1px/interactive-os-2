// Fullscreen takeover when you click an agent card.
// Shows the beat timeline in the phone frame + intervene dock on the right.

function AgentStream({ agent, onClose, onPrev, onNext }) {
  const session = agent.session;
  const [beatIdx, setBeatIdx] = React.useState(0);
  const [t, setT] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const beats = session?.beats || [];
  const curBeat = beats[beatIdx] || null;
  const isLive = agent.status === 'running' || agent.status === 'thinking';

  React.useEffect(() => {
    if (paused || !curBeat) return;
    const dur = { thinking: 7000, terminal: 6500, diff: 6000, filetree: 5500, preview: 5000, commit: 5500 }[curBeat.kind] || 6000;
    let raf, start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p >= 1) { setBeatIdx((beatIdx + 1) % beats.length); start = now; setT(0); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beatIdx, paused, curBeat?.kind]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="stream">
      <div className="stream-topbar">
        <button className="stream-close" onClick={onClose}>← board</button>
        <div className="stream-agent">
          <span className="avatar" style={{ background: `oklch(0.68 0.17 ${agent.hue})` }}>{agent.avatar}</span>
          <div>
            <div className="stream-agent-name">@{agent.name}</div>
            <div className="stream-agent-repo">{agent.repo}</div>
          </div>
        </div>
        <div className="stream-nav">
          <button onClick={onPrev} title="prev (←)">↑</button>
          <button onClick={onNext} title="next (→)">↓</button>
        </div>
      </div>

      <div className="stream-body">
        <div className="stream-phone-wrap">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="status-bar">
                <span className="time">9:41</span>
                <span className="status-icons">
                  <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="3" height="4" fill="#fff"/><rect x="4" y="5" width="3" height="6" fill="#fff"/><rect x="8" y="2.5" width="3" height="8.5" fill="#fff"/><rect x="12" y="0" width="3" height="11" fill="#fff"/></svg>
                  <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="19" height="10" rx="3" fill="none" stroke="#fff" strokeOpacity="0.4"/><rect x="2" y="2" width="16" height="7" rx="1.5" fill="#fff"/><rect x="20" y="3" width="1.5" height="5" rx="0.5" fill="#fff" fillOpacity="0.4"/></svg>
                </span>
              </div>

              {/* Live overlay: top of screen */}
              <div className="stream-overlay-top">
                <div className="stream-title-row">
                  {isLive && <span className="live-badge"><span className="dot"/>LIVE</span>}
                  <span className="stream-elapsed">{agent.elapsed}</span>
                </div>
                <div className="stream-title">{agent.title}</div>
                <div className="beat-progress">
                  {beats.map((_, i) => (
                    <div key={i} className="beat-track">
                      <div className="beat-fill" style={{
                        width: i < beatIdx ? '100%' : i === beatIdx ? `${t*100}%` : '0%',
                      }}/>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stream-beat" onClick={() => setPaused(p => !p)}>
                {curBeat && <BeatRenderer session={session} beat={curBeat} progress={t}/>}
                {paused && <div className="paused-chip">paused</div>}
              </div>
            </div>
          </div>
        </div>

        <InterveneDock agent={agent} curBeat={curBeat} beatIdx={beatIdx}/>
      </div>
    </div>
  );
}

function InterveneDock({ agent, curBeat, beatIdx }) {
  const [msg, setMsg] = React.useState('');
  const [sent, setSent] = React.useState([]);
  const needs = agent.status === 'needsme';

  const quick = [
    'keep going',
    'show me the diff',
    'stop and summarize',
    'try a different approach',
  ];

  const send = () => {
    if (!msg.trim()) return;
    setSent([...sent, msg.trim()]);
    setMsg('');
  };

  return (
    <div className="dock">
      <div className="dock-title">
        <span className="dock-title-label">intervene</span>
        <span className="dock-title-sub">talk to @{agent.name}</span>
      </div>

      {needs && (
        <div className="dock-needs">
          <div className="dock-needs-label">Agent is waiting on you</div>
          <div className="dock-needs-q">{agent.question}</div>
          <div className="dock-needs-actions">
            <button className="btn btn-primary">Ship it</button>
            <button className="btn">Split PR</button>
            <button className="btn btn-ghost">Let me think</button>
          </div>
        </div>
      )}

      <div className="dock-context">
        <div className="dock-context-label">now executing</div>
        <div className="dock-context-row">
          <span className={`beat-chip beat-chip-${curBeat?.kind}`}>{curBeat?.kind}</span>
          <span className="dock-context-sub">beat {beatIdx + 1} of {agent.session.beats.length}</span>
        </div>
      </div>

      <div className="dock-sent">
        {sent.map((s, i) => (
          <div key={i} className="dock-sent-msg">→ {s}</div>
        ))}
      </div>

      <div className="dock-input-wrap">
        <div className="dock-quick">
          {quick.map(q => (
            <button key={q} className="quick-chip" onClick={() => setMsg(q)}>{q}</button>
          ))}
        </div>
        <div className="dock-input-row">
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            placeholder={`tell @${agent.name} what to do next…`}
            rows={3}
          />
          <button className="dock-send" onClick={send} disabled={!msg.trim()}>send ⏎</button>
        </div>
      </div>

      <div className="dock-actions">
        <button className="btn btn-ghost">pause</button>
        <button className="btn btn-ghost">fork here</button>
        <button className="btn btn-ghost btn-danger">stop</button>
      </div>
    </div>
  );
}

Object.assign(window, { AgentStream });
