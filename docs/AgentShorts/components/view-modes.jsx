// Unified view — one component that shifts layout based on how many agents are selected.
// 1 → feed (phone), 2–4 → split (large tiles), 5+ → grid (many small tiles).

function UnifiedView({ sessions, selectedIds, setSelectedIds, autoplay, metaDensity }) {
  const chosen = sessions.filter(s => selectedIds.includes(s.id));
  const n = chosen.length;
  const mode = n <= 1 ? 'feed' : n <= 4 ? 'split' : 'grid';

  return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:18 }}>
      <AgentPicker sessions={sessions} selectedIds={selectedIds} setSelectedIds={setSelectedIds} mode={mode} n={n}/>
      {n === 0 && <EmptyState />}
      {mode === 'feed' && <FeedMode session={chosen[0]} autoplay={autoplay} metaDensity={metaDensity}/>}
      {mode === 'split' && <SplitMode sessions={chosen}/>}
      {mode === 'grid' && <GridMode sessions={chosen} onFocus={(id) => setSelectedIds([id])}/>}
    </div>
  );
}

function AgentPicker({ sessions, selectedIds, setSelectedIds, mode, n }) {
  const toggle = (id) => {
    setSelectedIds(selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]);
  };
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
      maxWidth: 960,
    }}>
      <span style={{
        fontFamily:'JetBrains Mono, monospace', fontSize:11,
        color:'var(--ink-3)', letterSpacing:'0.08em',
      }}>{n} selected · {mode}</span>
      <span style={{ width:1, height:14, background:'var(--line)' }}/>
      {sessions.map(s => {
        const on = selectedIds.includes(s.id);
        return (
          <button key={s.id} onClick={() => toggle(s.id)} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'5px 10px 5px 5px', borderRadius:99,
            background: on ? '#0b0b0d' : '#fff',
            color: on ? '#fff' : 'var(--ink-2)',
            border: on ? '1px solid #0b0b0d' : '1px solid var(--line)',
            fontSize:11.5, cursor:'pointer', fontFamily:'"Inter", system-ui',
          }}>
            <span style={{
              width:18, height:18, borderRadius:'50%',
              background:`oklch(0.65 0.17 ${s.agent.hue})`,
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              fontSize:9, color:'#0b0b0d', fontWeight:700,
              fontFamily:'JetBrains Mono, monospace',
            }}>{s.agent.avatar}</span>
            @{s.agent.name}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding:64, textAlign:'center',
      background:'#fff', border:'1px dashed var(--line)', borderRadius:14,
      color:'var(--ink-3)', fontSize:13, width:'100%', maxWidth:500,
    }}>Pick an agent to watch.</div>
  );
}

function FeedMode({ session, autoplay, metaDensity }) {
  return (
    <>
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="status-bar">
            <span className="time">9:41</span>
            <span className="status-icons">
              <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="3" height="4" fill="#fff"/><rect x="4" y="5" width="3" height="6" fill="#fff"/><rect x="8" y="2.5" width="3" height="8.5" fill="#fff"/><rect x="12" y="0" width="3" height="11" fill="#fff"/></svg>
              <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="19" height="10" rx="3" fill="none" stroke="#fff" strokeOpacity="0.4"/><rect x="2" y="2" width="16" height="7" rx="1.5" fill="#fff"/><rect x="20" y="3" width="1.5" height="5" rx="0.5" fill="#fff" fillOpacity="0.4"/></svg>
            </span>
          </div>
          <ShortsFeed sessions={[session]} autoplay={autoplay} metaDensity={metaDensity}/>
        </div>
      </div>
      <div className="hint">
        <span>tap to pause</span>
      </div>
    </>
  );
}

function SplitMode({ sessions }) {
  const cols = sessions.length === 2 ? 2 : sessions.length === 3 ? 3 : 2;
  return (
    <div style={{
      display:'grid', gap:14, width:'100%', maxWidth:1200,
      gridTemplateColumns:`repeat(${cols}, 1fr)`,
    }}>
      {sessions.map(s => <GridTile key={s.id} session={s} size="lg"/>)}
    </div>
  );
}

function GridMode({ sessions, onFocus }) {
  return (
    <div style={{
      display:'grid', gap:10, width:'100%', maxWidth:1280,
      gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
    }}>
      {sessions.map(s => <GridTile key={s.id} session={s} onClick={() => onFocus(s.id)}/>)}
    </div>
  );
}

// Shared tile (auto-playing)
function GridTile({ session, onClick, size = 'md' }) {
  const [beatIdx, setBeatIdx] = React.useState(0);
  const [t, setT] = React.useState(0);
  const durations = { thinking: 6000, terminal: 5500, diff: 5000, filetree: 4500, preview: 4000, commit: 5000 };

  React.useEffect(() => {
    let raf, start = performance.now();
    const tick = (now) => {
      const beat = session.beats[beatIdx];
      const dur = durations[beat.kind] || 5000;
      const p = (now - start) / dur;
      if (p >= 1) { setBeatIdx((beatIdx + 1) % session.beats.length); start = now; setT(0); }
      else setT(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beatIdx, session.id]);

  const h = size === 'lg' ? 440 : 240;
  return (
    <div onClick={onClick} style={{
      height:h, borderRadius:14, overflow:'hidden', position:'relative',
      background:'#000', cursor: onClick ? 'pointer' : 'default',
      border:'1px solid rgba(0,0,0,0.08)', transition:'transform 0.15s',
    }}
    onMouseEnter={(e)=>{ if (onClick) e.currentTarget.style.transform='translateY(-2px)'; }}
    onMouseLeave={(e)=>e.currentTarget.style.transform='translateY(0)'}>
      <BeatRenderer session={session} beat={session.beats[beatIdx]} progress={t}/>
      <div style={{ position:'absolute', top:6, left:8, right:8, display:'flex', gap:2, zIndex:3 }}>
        {session.beats.map((_, i) => (
          <div key={i} style={{ flex:1, height:2, background:'rgba(255,255,255,0.2)', borderRadius:1 }}>
            <div style={{
              height:'100%', background:'#fff', borderRadius:1,
              width: i < beatIdx ? '100%' : i === beatIdx ? `${t*100}%` : '0%',
            }}/>
          </div>
        ))}
      </div>
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:3,
        padding:'20px 12px 10px',
        background:'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, fontFamily:'"Inter", system-ui' }}>
          <div style={{
            width:16, height:16, borderRadius:'50%',
            background:`oklch(0.65 0.17 ${session.agent.hue})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:9, color:'#0b0b0d', fontWeight:700,
            fontFamily:'JetBrains Mono, monospace',
          }}>{session.agent.avatar}</div>
          <span style={{ color:'#fff', fontSize:11, fontWeight:600 }}>@{session.agent.name}</span>
        </div>
        <div style={{
          color:'#fff', fontSize:12, lineHeight:1.3, fontWeight:500,
          fontFamily:'"Inter", system-ui',
          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
        }}>{session.title}</div>
      </div>
    </div>
  );
}

Object.assign(window, { UnifiedView });
