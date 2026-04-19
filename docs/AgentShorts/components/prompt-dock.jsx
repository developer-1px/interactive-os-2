// Global bottom dock — always visible on board view.
// Spawns a new agent into Queued.

function PromptDock({ onSpawn }) {
  const [msg, setMsg] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  const templates = [
    { icon: '⇅', label: 'explore', prompt: 'Poke around this codebase and tell me what looks fragile.' },
    { icon: '⚡', label: 'fix', prompt: 'Fix the failing tests.' },
    { icon: '+', label: 'feature', prompt: 'Add…' },
    { icon: '✎', label: 'refactor', prompt: 'Refactor…' },
    { icon: '◈', label: 'test', prompt: 'Write tests for…' },
  ];

  const submit = () => {
    if (!msg.trim()) return;
    onSpawn(msg.trim());
    setMsg('');
  };

  return (
    <div className={`pdock ${focused ? 'pdock-focused' : ''}`}>
      <div className="pdock-inner">
        <div className="pdock-templates">
          {templates.map(t => (
            <button key={t.label} className="pdock-tmpl" onClick={() => setMsg(t.prompt)}>
              <span className="pdock-tmpl-ico">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="pdock-sep"/>
        <div className="pdock-input-row">
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="what do you want built?"
            rows={focused ? 2 : 1}
          />
          <div className="pdock-right">
            <button className="pdock-repo" title="pick repo">acme/payments-api ▾</button>
            <button className="pdock-send" onClick={submit} disabled={!msg.trim()}>
              spawn ⏎
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PromptDock });
