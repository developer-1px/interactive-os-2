import { TestRunnerPanel } from '../devtools/testRunner/TestRunnerPanel'

export default function PageListbox() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Listbox</h2>
        <p className="page-desc">Keyboard integration tests running in real browser</p>
      </div>
      <TestRunnerPanel
        testPath="src/interactive-os/__tests__/listbox-keyboard.integration.test"
        label="ListBox Keyboard Integration"
      />
    </div>
  )
}
