// Beat components — each one is a stage that plays inside a Short card.
// Everything is designed for a ~9:16 vertical card, dark developer-tool aesthetic.

const beatStyles = {
  frame: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    boxSizing: 'border-box',
    fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
  },
  label: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 10, letterSpacing: '0.14em',
    color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
    marginBottom: 10,
  },
};

// ────────────────────────────────────────────
// Thinking beat — agent's reasoning as a speech bubble
// ────────────────────────────────────────────
function ThinkingBeat({ session, progress }) {
  // progress 0..1 — reveal characters
  const text = session.beats.find(b => b.kind === 'thinking').text;
  const cut = Math.min(text.length, Math.floor(text.length * Math.min(1, progress * 1.1)));
  const shown = text.slice(0, cut);

  return (
    <div style={{
      ...beatStyles.frame, padding: '28px 24px',
      background: `
        radial-gradient(circle at 20% 0%, oklch(0.32 0.08 ${session.agent.hue}) 0%, transparent 55%),
        radial-gradient(circle at 100% 100%, oklch(0.28 0.06 ${(session.agent.hue + 60) % 360}) 0%, transparent 50%),
        #0b0b0d
      `,
      justifyContent: 'center', alignItems: 'flex-start', gap: 18,
    }}>
      <div style={beatStyles.label}>THINKING</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `oklch(0.65 0.17 ${session.agent.hue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#0b0b0d', fontWeight: 700,
          fontFamily: 'ui-monospace, monospace',
        }}>{session.agent.avatar}</div>
        <div style={{
          color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500,
        }}>{session.agent.name}</div>
        <ThinkingDots />
      </div>

      <div style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 22, lineHeight: 1.45, color: '#fff',
        fontWeight: 500, letterSpacing: '-0.01em',
        textWrap: 'pretty',
      }}>
        {shown}
        <span style={{
          display: 'inline-block', width: 2, height: '1.1em',
          background: `oklch(0.75 0.15 ${session.agent.hue})`,
          verticalAlign: '-0.15em', marginLeft: 3,
          animation: 'blink 1s step-end infinite',
        }} />
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
          animation: `thinkingPulse 1.2s ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────
// Terminal beat
// ────────────────────────────────────────────
function TerminalBeat({ session, progress }) {
  const beat = session.beats.find(b => b.kind === 'terminal');
  const totalChars = beat.lines.reduce((n, l) => n + l.v.length + 1, 0);
  const reveal = Math.floor(totalChars * Math.min(1, progress * 1.05));

  let remaining = reveal;
  const rendered = [];
  for (const line of beat.lines) {
    if (remaining <= 0) break;
    const take = Math.min(line.v.length, remaining);
    rendered.push({ ...line, v: line.v.slice(0, take), done: take >= line.v.length });
    remaining -= take + 1;
  }

  const colorFor = (t) => ({
    cmd: '#fff',
    out: 'rgba(255,255,255,0.72)',
    ok:  'oklch(0.82 0.15 150)',
    err: 'oklch(0.72 0.20 25)',
  }[t] || '#fff');

  return (
    <div style={{
      ...beatStyles.frame, background: '#0a0a0b', padding: '18px 0 0',
    }}>
      <TerminalChrome title={`${session.agent.name} — ${session.repo}`} />
      <div style={{
        flex: 1, padding: '14px 18px', overflow: 'hidden',
        fontSize: 13.5, lineHeight: 1.55, color: '#fff',
      }}>
        {rendered.map((l, i) => (
          <div key={i} style={{ color: colorFor(l.t), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {l.t === 'cmd' && <span style={{ color: 'oklch(0.8 0.12 200)', marginRight: 6 }}>›</span>}
            {l.t === 'ok'  && <span style={{ color: 'oklch(0.82 0.15 150)' }}>{l.v.startsWith(' ') ? '' : ''}</span>}
            {l.v}
            {i === rendered.length - 1 && !l.done && <Caret />}
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalChrome({ title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
        {title}
      </div>
    </div>
  );
}

function Caret() {
  return <span style={{
    display: 'inline-block', width: 7, height: '1.05em',
    background: 'rgba(255,255,255,0.85)', verticalAlign: '-0.15em', marginLeft: 2,
    animation: 'blink 1s step-end infinite',
  }} />;
}

// ────────────────────────────────────────────
// Diff beat
// ────────────────────────────────────────────
function DiffBeat({ session, progress }) {
  const beat = session.beats.find(b => b.kind === 'diff');
  // reveal line-by-line
  const total = beat.lines.length;
  const shownCount = Math.floor(total * Math.min(1, progress * 1.1));

  const bg = { add: 'rgba(80, 200, 120, 0.12)', del: 'rgba(255, 90, 90, 0.12)', ctx: 'transparent' };
  const fg = { add: 'oklch(0.88 0.16 150)', del: 'oklch(0.80 0.20 25)', ctx: 'rgba(255,255,255,0.55)' };
  const sym = { add: '+', del: '−', ctx: ' ' };

  return (
    <div style={{ ...beatStyles.frame, background: '#0a0a0b' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={beatStyles.label}>DIFF</div>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 13,
          color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
          {beat.file}
        </div>
      </div>
      <div style={{
        flex: 1, padding: '10px 0', overflow: 'hidden',
        fontSize: 12.5, lineHeight: 1.65,
      }}>
        {beat.lines.slice(0, shownCount).map((l, i) => (
          <div key={i} style={{
            display: 'flex', background: bg[l.t],
            padding: '0 14px', color: fg[l.t],
            whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span style={{
              width: 16, color: l.t === 'add' ? fg.add : l.t === 'del' ? fg.del : 'rgba(255,255,255,0.2)',
              textAlign: 'center', flexShrink: 0,
            }}>{sym[l.t]}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// File tree beat — before/after with staggered reveal
// ────────────────────────────────────────────
function FileTreeBeat({ session, progress }) {
  const beat = session.beats.find(b => b.kind === 'filetree');
  // progress: 0..0.4 show before, 0.4..0.7 transition, 0.7..1 show after
  const phase = progress < 0.45 ? 'before' : progress < 0.55 ? 'trans' : 'after';

  const list = phase === 'before' ? beat.before : beat.after;

  return (
    <div style={{ ...beatStyles.frame, background: '#0a0a0b', padding: '24px 22px' }}>
      <div style={beatStyles.label}>FILE TREE · {phase === 'before' ? 'BEFORE' : 'AFTER'}</div>
      <div style={{
        marginTop: 12, fontSize: 14, lineHeight: 1.85,
        fontFamily: 'ui-monospace, monospace',
        opacity: phase === 'trans' ? 0.3 : 1,
        transition: 'opacity 0.3s',
      }}>
        {list.map((f, i) => {
          const isAdd = f.hl === 'add';
          const isDel = f.hl === 'del';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: isDel ? 'oklch(0.72 0.18 25)' :
                     isAdd ? 'oklch(0.85 0.16 150)' :
                     'rgba(255,255,255,0.75)',
              textDecoration: isDel ? 'line-through' : 'none',
              opacity: isDel ? 0.6 : 1,
              animation: phase === 'after' && isAdd ? `slideInLeft 0.4s ${i * 0.07}s both` : 'none',
            }}>
              <span style={{
                width: 14, textAlign: 'center',
                color: isAdd ? 'oklch(0.85 0.16 150)' : isDel ? 'oklch(0.72 0.18 25)' : 'rgba(255,255,255,0.3)',
              }}>
                {isAdd ? '+' : isDel ? '−' : f.type === 'dir' ? '▸' : '·'}
              </span>
              <span>{f.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Preview beat — renders a little mock landing page
// ────────────────────────────────────────────
function PreviewBeat({ session, progress }) {
  const beat = session.beats.find(b => b.kind === 'preview');
  const lit = progress > 0.3;

  return (
    <div style={{
      ...beatStyles.frame, background: '#0a0a0b',
      padding: '24px 18px', gap: 14,
    }}>
      <div style={beatStyles.label}>DEPLOY · PREVIEW</div>

      {/* url bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)', borderRadius: 8,
        padding: '8px 12px', fontSize: 11,
        fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: lit ? 'oklch(0.78 0.18 150)' : 'rgba(255,255,255,0.2)',
          boxShadow: lit ? '0 0 8px oklch(0.78 0.18 150)' : 'none',
          transition: 'all 0.4s',
        }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          https://{beat.url}
        </span>
      </div>

      {/* rendered page mockup */}
      <div style={{
        flex: 1, borderRadius: 10, overflow: 'hidden',
        background: '#fafaf7', position: 'relative',
        border: '1px solid rgba(255,255,255,0.06)',
        fontFamily: '"Inter", system-ui, sans-serif',
        padding: '40px 28px',
        display: 'flex', flexDirection: 'column', gap: 14,
        opacity: lit ? 1 : 0.3, transition: 'opacity 0.5s',
      }}>
        {/* nav */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>acme</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 10, color: '#555' }}>
            <span>Product</span><span>Pricing</span><span>Docs</span>
          </div>
        </div>

        {/* eyebrow tag */}
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          padding: '3px 9px', borderRadius: 99,
          border: '1px solid rgba(0,0,0,0.12)',
          fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
          color: '#333', background: 'rgba(0,0,0,0.03)',
        }}>{beat.eyebrow}</div>

        {/* headline */}
        <div style={{
          fontSize: 32, lineHeight: 1.05, fontWeight: 700,
          color: '#111', letterSpacing: '-0.02em',
        }}>{beat.title}</div>

        {/* sub */}
        <div style={{ fontSize: 12, color: '#555', maxWidth: '85%' }}>
          {beat.sub}
        </div>

        {/* cta cluster */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <div style={{
            padding: '8px 14px', borderRadius: 7, background: '#111',
            color: '#fff', fontSize: 11, fontWeight: 600,
          }}>Start free</div>
          <div style={{
            padding: '8px 14px', borderRadius: 7,
            border: '1px solid rgba(0,0,0,0.12)',
            color: '#111', fontSize: 11, fontWeight: 600,
          }}>Book a demo →</div>
        </div>

        {/* product shot placeholder */}
        <div style={{
          marginTop: 14, flex: 1, minHeight: 100, borderRadius: 8,
          background: `repeating-linear-gradient(135deg,
            rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 6px,
            rgba(0,0,0,0.07) 6px, rgba(0,0,0,0.07) 12px)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ui-monospace, monospace', fontSize: 10,
          color: 'rgba(0,0,0,0.4)',
        }}>product shot</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Commit beat — final "receipt" card
// ────────────────────────────────────────────
function CommitBeat({ session, progress }) {
  const beat = session.beats.find(b => b.kind === 'commit');
  return (
    <div style={{
      ...beatStyles.frame, background: '#0a0a0b',
      padding: '30px 26px', justifyContent: 'center', gap: 16,
    }}>
      <div style={beatStyles.label}>COMMIT · {session.status.toUpperCase()}</div>

      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
      }}>
        {beat.branch} · {beat.hash}
      </div>

      <div style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 22, lineHeight: 1.3, fontWeight: 600,
        color: '#fff', letterSpacing: '-0.01em',
      }}>
        {beat.message}
      </div>

      <div style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 13, lineHeight: 1.5,
        color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-line',
      }}>
        {beat.body}
      </div>

      {/* stats */}
      <div style={{
        display: 'flex', gap: 14, marginTop: 6,
        fontFamily: 'ui-monospace, monospace', fontSize: 12,
      }}>
        <Stat label="files"  value={beat.files} color="rgba(255,255,255,0.7)" />
        <Stat label="+"      value={beat.additions} color="oklch(0.85 0.16 150)" />
        <Stat label="−"      value={beat.deletions} color="oklch(0.78 0.20 25)" />
      </div>

      {/* mini additions graph */}
      <div style={{ display: 'flex', gap: 2, height: 6, marginTop: 4 }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const addRatio = beat.additions / (beat.additions + beat.deletions);
          const isAdd = i / 20 < addRatio;
          return (
            <div key={i} style={{
              flex: 1, borderRadius: 1,
              background: isAdd ? 'oklch(0.75 0.16 150)' : 'oklch(0.68 0.18 25)',
              opacity: progress > i / 20 ? 1 : 0.15,
              transition: 'opacity 0.2s',
            }} />
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{label}</span>
    </div>
  );
}

// Dispatcher — pick the right component for a beat kind
function BeatRenderer({ session, beat, progress }) {
  switch (beat.kind) {
    case 'thinking': return <ThinkingBeat session={session} progress={progress} />;
    case 'terminal': return <TerminalBeat session={session} progress={progress} />;
    case 'diff':     return <DiffBeat session={session} progress={progress} />;
    case 'filetree': return <FileTreeBeat session={session} progress={progress} />;
    case 'preview':  return <PreviewBeat session={session} progress={progress} />;
    case 'commit':   return <CommitBeat session={session} progress={progress} />;
    default: return null;
  }
}

Object.assign(window, {
  BeatRenderer,
  ThinkingBeat, TerminalBeat, DiffBeat, FileTreeBeat, PreviewBeat, CommitBeat,
});
