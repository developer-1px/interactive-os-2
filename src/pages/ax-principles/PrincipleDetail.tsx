// ⑦ /do UI — detailed renderer for a single Principle (6-section card)
import type { NormalizedData } from '@os/store/types'
import { ax } from '@styles/ax'
import { Badge } from '@os/ui/Badge'
import { Panel } from '@os/ui/panels/Panel'
import { PanelHeader } from '@os/ui/PanelHeader'
import { StatusIndicator } from '@os/ui/indicators/StatusIndicator'
import type {
  Principle, EnforcementLayer, EnforcementState, PrincipleStatus,
} from './axPrincipleSchema'
import { selectMappingsByPrinciple, selectAxesForPrinciple } from './axPrinciplesState'

// ── Tone mappers ───────────────────────────────────────

function statusTone(s: PrincipleStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (s) {
    case 'Locked': return 'success'
    case 'Exposed': return 'warning'
    case 'Missing': return 'danger'
    case 'Conflicts': return 'danger'
    case 'N/A': return 'neutral'
  }
}

function statusIndicatorTone(s: PrincipleStatus): 'success' | 'warning' | 'error' | 'info' {
  switch (s) {
    case 'Locked': return 'success'
    case 'Exposed': return 'warning'
    case 'Missing': return 'error'
    case 'Conflicts': return 'error'
    case 'N/A': return 'info'
  }
}

// ── Enforcement layers ─────────────────────────────────

const ENFORCEMENT_LAYERS: EnforcementLayer[] = [
  'prompt', 'skill', 'agent', 'hook', 'type', 'lint', 'auto-verify',
]

function enforcementLabel(s: EnforcementState): string {
  switch (s) {
    case 'core': return 'core'
    case 'support': return 'support'
    case 'weak': return 'weak'
    case 'absent': return 'absent'
  }
}

function EnforcementCell({ layer, state }: { layer: EnforcementLayer; state: EnforcementState }) {
  const tone: 'success' | 'accent-dim' | 'warning' | 'neutral' =
    state === 'core' ? 'success'
    : state === 'support' ? 'accent-dim'
    : state === 'weak' ? 'warning'
    : 'neutral'

  const surface: 'display' | 'ghost' = state === 'absent' ? 'ghost' : 'display'

  return (
    <div
      className={ax({
        role: 'cell',
        surface,
        tone,
        layout: 'stack',
        content: 'text',
      })}
    >
      <span className={ax({ textStyle: 'overline' })}>{layer}</span>
      <span className={ax({ textStyle: 'caption' })}>
        {enforcementLabel(state)}
      </span>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className={ax({
        role: 'cell',
        surface: 'display',
        layout: 'stack'
      })}
    >
      <h3 className={ax({ textStyle: 'overline' })}>{title}</h3>
      <div className={ax({ layout: 'stack' })}>{children}</div>
    </section>
  )
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className={ax({ textStyle: 'body', width: 'prose' })}>{children}</p>
  )
}

// ── External link (plain <a>, not Aria Link which is for pattern items) ──

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={ax({
        role: 'control',
        interactive: 'button',
        surface: 'ghost',
        content: 'text',
        textStyle: 'body'
      })}
    >
      {children}
    </a>
  )
}

// ── Main component ─────────────────────────────────────

export interface PrincipleDetailProps {
  principle: Principle
  store: NormalizedData
}

export function PrincipleDetail({ principle, store }: PrincipleDetailProps) {
  const mappings = selectMappingsByPrinciple(store, principle.id)
  const axes = selectAxesForPrinciple(store, principle.id)

  // Panel이 header 고정 + body scroll을 소유 — pages는 scroll 선언 안 함.
  return (
    <Panel header={
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar' })}>
          <StatusIndicator tone={statusIndicatorTone(principle.status)} />
          <span className={ax({ textStyle: 'section' })}>
            {principle.id} {principle.name}
          </span>
        </span>
        <span className={ax({ layout: 'bar' })}>
          <Badge tone={statusTone(principle.status)} variant="outline">{principle.status}</Badge>
          {principle.priority && (
            <Badge tone="accent" variant="outline">{principle.priority}</Badge>
          )}
          {principle.tags.map((t) => (
            <Badge key={t} tone="neutral" variant="outline">{t}</Badge>
          ))}
        </span>
      </PanelHeader>
    }>
      <>
        {/* Summary + Definition */}
        <DetailSection title="원리 / 정의">
          <Paragraph>{principle.summary}</Paragraph>
          <pre
            className={ax({
              role: 'cell',
              surface: 'input',
              textStyle: 'code',
              clamp: 'pre',
            })}
          >
            {principle.definition}
          </pre>
        </DetailSection>

        {/* Industry Evidence */}
        {principle.industryEvidence.length > 0 && (
          <DetailSection title="업계 증거">
            <ul className={ax({ layout: 'stack' })}>
              {principle.industryEvidence.map((ev, i) => (
                <li
                  key={i}
                  className={ax({ layout: 'stack' })}
                >
                  <ExternalLink href={ev.url}>{ev.source}</ExternalLink>
                  {ev.quote && (
                    <span className={ax({ textStyle: 'caption', width: 'prose' })}>
                      “{ev.quote}”
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        {/* Math / Cognitive basis */}
        <DetailSection title="수학 · 인지 근거">
          <Paragraph>{principle.mathBasis}</Paragraph>
        </DetailSection>

        {/* Falsifier */}
        <DetailSection title="반증 조건">
          <Paragraph>{principle.falsifier}</Paragraph>
        </DetailSection>

        {/* ax Mapping */}
        <DetailSection title="ax 매핑">
          {mappings.length === 0 ? (
            <span className={ax({ textStyle: 'caption' })}>매핑 없음</span>
          ) : (
            <div className={ax({ layout: 'stack' })}>
              {mappings.map((m) => (
                <div
                  key={m.id}
                  className={ax({
                      role: 'control-group',
                    layout: 'stack',
                    surface: 'sunken'
                  })}
                >
                  <div className={ax({ layout: 'spread' })}>
                    <span className={ax({ layout: 'bar' })}>
                      {axes.length > 0 ? (
                        axes.map((a) => (
                          <Badge key={a.id} tone="accent-dim" variant="outline">{a.name}</Badge>
                        ))
                      ) : (
                        <span className={ax({ textStyle: 'caption' })}>
                          (축 매핑 없음)
                        </span>
                      )}
                    </span>
                    <Badge tone={statusTone(m.state)} variant="outline">{m.state}</Badge>
                  </div>
                  {m.note && (
                    <span className={ax({ textStyle: 'caption', width: 'prose' })}>
                      {m.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        {/* Enforcement 7 layer grid */}
        <DetailSection title="Enforcement Layers">
          <div className={ax({ layout: 'grid-7' })}>
            {ENFORCEMENT_LAYERS.map((layer) => (
              <EnforcementCell
                key={layer}
                layer={layer}
                state={principle.enforcementLayers[layer] ?? 'absent'}
              />
            ))}
          </div>
        </DetailSection>

        {/* Examples */}
        <DetailSection title="Examples">
          <div className={ax({ layout: 'stack' })}>
            {principle.examples.good.length > 0 && (
              <div className={ax({ layout: 'stack' })}>
                <span className={ax({ textStyle: 'overline' })}>Good</span>
                <ul className={ax({ layout: 'stack' })}>
                  {principle.examples.good.map((g, i) => (
                    <li
                      key={i}
                      className={ax({
                        role: 'cell',
                        surface: 'display',
                        tone: 'success',
                        textStyle: 'code'
                      })}
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {principle.examples.bad.length > 0 && (
              <div className={ax({ layout: 'stack' })}>
                <span className={ax({ textStyle: 'overline' })}>Bad</span>
                <ul className={ax({ layout: 'stack' })}>
                  {principle.examples.bad.map((b, i) => (
                    <li
                      key={i}
                      className={ax({
                        role: 'cell',
                        surface: 'display',
                        tone: 'danger',
                        textStyle: 'code'
                      })}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DetailSection>
      </>
    </Panel>
  )
}
