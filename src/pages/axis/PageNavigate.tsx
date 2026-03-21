import NavigateDemo from './NavigateDemo'

export default function PageNavigate() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navigate()</h2>
        <p className="page-desc">
          Focus movement axis. Controls how arrow keys move focus between items.
          Toggle options below to see how behavior changes.
        </p>
      </div>
      <NavigateDemo />
      <div className="page-section">
        <h3 className="page-section-title">About navigate()</h3>
        <p className="page-desc">
          The <code>navigate()</code> axis controls focus movement. Options: <code>orientation</code> (vertical/horizontal/both),
          <code>wrap</code> (circular navigation), <code>grid</code> (2D with column tracking).
          It also sets <code>focusStrategy: roving-tabindex</code> in the pattern config.
        </p>
      </div>
    </div>
  )
}
