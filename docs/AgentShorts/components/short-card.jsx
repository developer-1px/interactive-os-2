// The Short card — a vertical 9:16 card with meta overlay, action bar, beat content, progress bar.

const CARD_W = 380;
const CARD_H = 676; // ~9:16

function ShortCard({ session, active, autoplay, metaDensity, onNext }) {
  const [beatIdx, setBeatIdx] = React.useState(0);
  const [t, setT] = React.useState(0); // 0..1 within current beat
  const [paused, setPaused] = React.useState(false);

  const beats = session.beats;
  const beat = beats[beatIdx];

  // durations per kind (ms)
  const durations = { thinking: 6000, terminal: 5500, diff: 5000, filetree: 4500, preview: 4000, commit: 5000 };
  const dur = durations[beat.kind] || 5000;

  // reset when becoming active
  React.useEffect(() => {
    if (active) { setBeatIdx(0); setT(0); }
  }, [active, session.id]);

  // timeline
  React.useEffect(() => {
    if (!active || !autoplay || paused) return;
    let raf, start = performance.now() - t * dur;
    const tick = (now) => {
      const progress = (now - start) / dur;
      if (progress >= 1) {
        if (beatIdx + 1 < beats.length) {
          setBeatIdx(beatIdx + 1); setT(0);
        } else {
          setT(1);
          // loop to next short after a brief pause
          setTimeout(() => onNext && onNext(), 900);
        }
        return;
      }
      setT(progress);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, autoplay, paused, beatIdx, session.id]);

  const statusColor = ({
    merged: 'oklch(0.70 0.17 280)',
    'open PR': 'oklch(0.78 0.17 100)',
    'fix deployed': 'oklch(0.78 0.15 150)',
    'preview live': 'oklch(0.75 0.17 200)',
  })[session.status] || 'rgba(255,255,255,0.7)';

  return (
    <div
      onClick={() => setPaused(p => !p)}
      style={{
        width: CARD_W, height: CARD_H, borderRadius: 20,
        overflow: 'hidden', position: 'relative',
        background: '#000', flexShrink: 0,
        boxShadow: active
          ? '0 30px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)'
          : '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.3s',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {/* Beat content — fills the card */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <BeatRenderer session={session} beat={beat} progress={t} />
      </div>

      {/* top: segmented progress (one segment per beat) */}
      <div style={{
        position: 'absolute', top: 10, left: 12, right: 12,
        display: 'flex', gap: 4, zIndex: 5,
      }}>
        {beats.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2.5, borderRadius: 2,
            background: 'rgba(255,255,255,0.18)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: i < beatIdx ? '100%' : i === beatIdx ? `${t * 100}%` : '0%',
              background: '#fff', borderRadius: 2,
            }} />
          </div>
        ))}
      </div>

      {/* top-left: repo + agent chip */}
      <div style={{
        position: 'absolute', top: 24, left: 14, zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: `oklch(0.65 0.17 ${session.agent.hue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#0b0b0d', fontWeight: 700,
          fontFamily: 'ui-monospace, monospace',
        }}>{session.agent.avatar}</div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{
            color: '#fff', fontSize: 12, fontWeight: 600,
            fontFamily: '"Inter", system-ui',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}>@{session.agent.name}</div>
          <div style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 10,
            fontFamily: 'ui-monospace, monospace',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}>{session.repo}</div>
        </div>
      </div>

      {/* pause glyph */}
      {paused && active && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.25)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="22" viewBox="0 0 20 22">
              <rect x="2" y="2" width="5.5" height="18" rx="1" fill="#000"/>
              <rect x="12.5" y="2" width="5.5" height="18" rx="1" fill="#000"/>
            </svg>
          </div>
        </div>
      )}

      {/* bottom overlay: title + meta */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 64, zIndex: 5,
        padding: '32px 16px 18px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
        fontFamily: '"Inter", system-ui',
      }}>
        <div style={{
          color: '#fff', fontSize: 15, fontWeight: 600, lineHeight: 1.3,
          letterSpacing: '-0.01em', textWrap: 'pretty',
        }}>{session.title}</div>

        {metaDensity !== 'minimal' && (
          <div style={{
            marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6,
            fontSize: 10.5, fontFamily: 'ui-monospace, monospace',
          }}>
            <MetaChip>{session.lang}</MetaChip>
            <MetaChip mono>{session.file}</MetaChip>
            <MetaChip color={statusColor} dot>{session.status}</MetaChip>
          </div>
        )}

        {metaDensity === 'rich' && (
          <div style={{
            marginTop: 8, display: 'flex', gap: 12,
            fontSize: 10, fontFamily: 'ui-monospace, monospace',
            color: 'rgba(255,255,255,0.6)',
          }}>
            <span>⏱ {session.elapsed}</span>
            <span>◇ {session.tokens} tok</span>
          </div>
        )}
      </div>

      {/* right action bar */}
      <div style={{
        position: 'absolute', right: 8, bottom: 22, zIndex: 6,
        display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
      }}>
        <ActionBtn icon="♥" label={session.stats.likes} />
        <ActionBtn icon="✎" label={session.stats.comments} />
        <ActionBtn icon="↗" label={session.stats.shares} />
        <ActionBtn icon="⌘" label="copy" tooltip="copy diff" />
        <ActionBtn icon="▶" label="follow" />
      </div>
    </div>
  );
}

function MetaChip({ children, mono, color, dot }) {
  return (
    <div style={{
      padding: '3px 7px', borderRadius: 4,
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(6px)',
      color: color || '#fff', display: 'inline-flex', alignItems: 'center', gap: 4,
      border: '1px solid rgba(255,255,255,0.1)',
      fontFamily: mono ? 'ui-monospace, monospace' : 'ui-monospace, monospace',
      letterSpacing: 0,
    }}>
      {dot && <span style={{
        width: 5, height: 5, borderRadius: '50%', background: color,
        boxShadow: `0 0 6px ${color}`,
      }} />}
      {children}
    </div>
  );
}

function ActionBtn({ icon, label, tooltip }) {
  const [hot, setHot] = React.useState(false);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); setHot(h => !h); }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, color: hot ? 'oklch(0.75 0.2 20)' : '#fff',
        transition: 'all 0.2s', transform: hot ? 'scale(1.08)' : 'scale(1)',
      }}>{icon}</div>
      <div style={{
        fontSize: 9.5, color: '#fff', fontWeight: 600,
        fontFamily: 'ui-monospace, monospace',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }}>{label}</div>
    </div>
  );
}

Object.assign(window, { ShortCard, CARD_W, CARD_H });
