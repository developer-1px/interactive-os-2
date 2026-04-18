var e=`// ⑦ /do UI — detailed renderer for a single Principle (6-section card)
import type { NormalizedData } from '@os/store/types'
import { ax } from '@styles/ax'
import { Badge } from '@os/ui/Badge'
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

  const surface: 'action' | 'display' | 'placeholder' =
    state === 'core' ? 'action'
    : state === 'absent' ? 'placeholder'
    : 'display'

  return (
    <div
      className={ax({
        role: 'item',
        surface,
        tone,
        border: state === 'absent' ? undefined : 'default',
        padding: 'sm',
        shape: 'sm',
        layout: 'stack',
        gap: 'xs',
        content: 'text',
      })}
    >
      <span className={ax({ textStyle: 'overline', text: 'muted' })}>{layer}</span>
      <span className={ax({ textStyle: 'caption', text: state === 'absent' ? 'muted' : 'primary' })}>
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
        surface: 'display',
        border: 'default',
        shape: 'md',
        padding: 'md',
        layout: 'stack',
        gap: 'sm',
      })}
    >
      <h3 className={ax({ textStyle: 'overline', text: 'muted' })}>{title}</h3>
      <div className={ax({ layout: 'stack', gap: 'sm' })}>{children}</div>
    </section>
  )
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className={ax({ textStyle: 'body', text: 'primary', width: 'prose' })}>{children}</p>
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
        interactive: 'button',
        surface: 'ghost',
        text: 'primary',
        content: 'text',
        textStyle: 'body',
        padding: 'none',
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

  return (
    <div className={ax({ layout: 'fill' })}>
      {/* Header */}
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'sm' })}>
          <StatusIndicator tone={statusIndicatorTone(principle.status)} />
          <span className={ax({ textStyle: 'section', text: 'primary' })}>
            {principle.id} {principle.name}
          </span>
        </span>
        <span className={ax({ layout: 'bar', gap: 'xs' })}>
          <Badge tone={statusTone(principle.status)} variant="outline">{principle.status}</Badge>
          {principle.priority && (
            <Badge tone="accent" variant="outline">{principle.priority}</Badge>
          )}
          {principle.tags.map((t) => (
            <Badge key={t} tone="neutral" variant="outline">{t}</Badge>
          ))}
        </span>
      </PanelHeader>

      {/* Scrollable body */}
      <div className={ax({ layout: 'scroll', padding: 'md', gap: 'md' })}>
        {/* Summary + Definition */}
        <DetailSection title="원리 / 정의">
          <Paragraph>{principle.summary}</Paragraph>
          <pre
            className={ax({
              textStyle: 'code',
              text: 'secondary',
              surface: 'sunken',
              padding: 'sm',
              shape: 'sm',
              clamp: 'pre',
            })}
          >
            {principle.definition}
          </pre>
        </DetailSection>

        {/* Industry Evidence */}
        {principle.industryEvidence.length > 0 && (
          <DetailSection title="업계 증거">
            <ul className={ax({ layout: 'stack', gap: 'sm' })}>
              {principle.industryEvidence.map((ev, i) => (
                <li
                  key={i}
                  className={ax({ layout: 'stack', gap: 'xs' })}
                >
                  <ExternalLink href={ev.url}>{ev.source}</ExternalLink>
                  {ev.quote && (
                    <span className={ax({ textStyle: 'caption', text: 'muted', width: 'prose' })}>
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
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>매핑 없음</span>
          ) : (
            <div className={ax({ layout: 'stack', gap: 'sm' })}>
              {mappings.map((m) => (
                <div
                  key={m.id}
                  className={ax({
                    layout: 'stack',
                    gap: 'xs',
                    surface: 'sunken',
                    padding: 'sm',
                    shape: 'sm',
                  })}
                >
                  <div className={ax({ layout: 'spread', gap: 'sm' })}>
                    <span className={ax({ layout: 'bar', gap: 'xs' })}>
                      {axes.length > 0 ? (
                        axes.map((a) => (
                          <Badge key={a.id} tone="accent-dim" variant="outline">{a.name}</Badge>
                        ))
                      ) : (
                        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
                          (축 매핑 없음)
                        </span>
                      )}
                    </span>
                    <Badge tone={statusTone(m.state)} variant="outline">{m.state}</Badge>
                  </div>
                  {m.note && (
                    <span className={ax({ textStyle: 'caption', text: 'secondary', width: 'prose' })}>
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
          <div className={ax({ layout: 'grid-7', gap: 'sm' })}>
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
          <div className={ax({ layout: 'stack', gap: 'sm' })}>
            {principle.examples.good.length > 0 && (
              <div className={ax({ layout: 'stack', gap: 'xs' })}>
                <span className={ax({ textStyle: 'overline', text: 'muted' })}>Good</span>
                <ul className={ax({ layout: 'stack', gap: 'xs' })}>
                  {principle.examples.good.map((g, i) => (
                    <li
                      key={i}
                      className={ax({
                        surface: 'display',
                        border: 'default',
                        tone: 'success',
                        padding: 'sm',
                        shape: 'sm',
                        textStyle: 'code',
                        text: 'primary',
                      })}
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {principle.examples.bad.length > 0 && (
              <div className={ax({ layout: 'stack', gap: 'xs' })}>
                <span className={ax({ textStyle: 'overline', text: 'muted' })}>Bad</span>
                <ul className={ax({ layout: 'stack', gap: 'xs' })}>
                  {principle.examples.bad.map((b, i) => (
                    <li
                      key={i}
                      className={ax({
                        surface: 'display',
                        border: 'default',
                        tone: 'danger',
                        padding: 'sm',
                        shape: 'sm',
                        textStyle: 'code',
                        text: 'primary',
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
      </div>
    </div>
  )
}
`;export{e as default};