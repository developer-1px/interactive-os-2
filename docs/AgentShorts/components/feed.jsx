// Feed — the vertical scroll-snap container that holds all ShortCards.
// Plus the ShortsFeedShell which wraps a feed in dark vignette + controls (matches mobile frame).

function ShortsFeed({ sessions, autoplay, metaDensity, onActiveChange }) {
  const [active, setActive] = React.useState(0);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    onActiveChange && onActiveChange(active);
  }, [active]);

  // scroll-snap observation
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / CARD_H);
    if (i !== active && i >= 0 && i < sessions.length) setActive(i);
  };

  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(sessions.length - 1, i));
    scrollRef.current?.scrollTo({ top: clamped * CARD_H, behavior: 'smooth' });
  };

  // keyboard
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); goTo(active + 1); }
      if (e.key === 'ArrowUp'   || e.key === 'k') { e.preventDefault(); goTo(active - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      style={{
        width: CARD_W, height: CARD_H,
        overflowY: 'scroll', scrollSnapType: 'y mandatory',
        borderRadius: 20, scrollbarWidth: 'none',
        position: 'relative',
      }}
    >
      <style>{`
        .shorts-feed::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="shorts-feed" style={{ scrollbarWidth: 'none' }}>
        {sessions.map((s, i) => (
          <div key={s.id} style={{
            scrollSnapAlign: 'start', scrollSnapStop: 'always',
            width: CARD_W, height: CARD_H,
          }}>
            <ShortCard
              session={s}
              active={i === active}
              autoplay={autoplay}
              metaDensity={metaDensity}
              onNext={() => goTo(i + 1)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ShortsFeed });
