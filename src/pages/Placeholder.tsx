function Placeholder({ group, label }: { group: string; label: string }) {
  return (
    <div className="wip-placeholder">
      <div style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        {group}
      </div>
      <div style={{ fontSize: 16, marginBottom: 12 }}>{label}</div>
      <div>Coming soon</div>
    </div>
  )
}

export default Placeholder
