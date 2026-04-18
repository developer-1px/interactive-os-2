var e=`/**
 * ax Principles Zod Schema — single source of truth for the ax meta-principles data model.
 *
 * Three entity types live in one NormalizedData store:
 *   - Principle: the 20 meta-principle cards (P-01 ~ P-21, P-18 skipped)
 *   - Axis:      the 25 ax axes (14 Public + 11 Private)
 *   - Mapping:   the principle ↔ axis link rows from 03-ax-mapping.md §2 matrix
 *
 * Source of truth:
 *   - docs/research/ax/02-principles.md (principle cards)
 *   - docs/research/ax/03-ax-mapping.md (matrix + state)
 *   - docs/research/ax/04-gap-plan.md   (enforcement layers + priority)
 */
import { z } from 'zod'

// ── Enums ────────────────────────────────────────────────

export const PrincipleStatus = z.enum(['Locked', 'Exposed', 'Missing', 'Conflicts', 'N/A'])
export type PrincipleStatus = z.infer<typeof PrincipleStatus>

export const PrincipleTag = z.enum(['locked', 'quantitative', 'adjusted', 'new', 'candidate', 'conditional'])
export type PrincipleTag = z.infer<typeof PrincipleTag>

export const PrinciplePriority = z.enum(['P0', 'P1', 'P2', 'P3'])
export type PrinciplePriority = z.infer<typeof PrinciplePriority>

export const EnforcementLayer = z.enum([
  'prompt', 'skill', 'agent', 'hook', 'type', 'lint', 'auto-verify',
])
export type EnforcementLayer = z.infer<typeof EnforcementLayer>

export const EnforcementState = z.enum(['core', 'support', 'weak', 'absent'])
export type EnforcementState = z.infer<typeof EnforcementState>

export const AxisTier = z.enum(['public', 'private'])
export type AxisTier = z.infer<typeof AxisTier>

// ── Entity schemas ───────────────────────────────────────

const IndustryEvidenceSchema = z.object({
  source: z.string(),
  url: z.string(),
  quote: z.string().optional(),
})
export type IndustryEvidence = z.infer<typeof IndustryEvidenceSchema>

/** Partial enforcement map — only the layers that have a status are listed.
 *  Missing keys are implicitly 'absent'. */
export type EnforcementMap = Partial<Record<EnforcementLayer, EnforcementState>>

const EnforcementMapSchema: z.ZodType<EnforcementMap> = z.record(EnforcementLayer, EnforcementState)

export const PrincipleSchema = z.object({
  id: z.string(),
  type: z.literal('principle'),
  name: z.string(),
  summary: z.string(),
  definition: z.string(),
  industryEvidence: z.array(IndustryEvidenceSchema),
  mathBasis: z.string(),
  falsifier: z.string(),
  examples: z.object({
    good: z.array(z.string()),
    bad: z.array(z.string()),
  }),
  tags: z.array(PrincipleTag),
  status: PrincipleStatus,
  enforcementLayers: EnforcementMapSchema,
  priority: PrinciplePriority.optional(),
})
export type Principle = Omit<z.infer<typeof PrincipleSchema>, 'enforcementLayers'> & {
  enforcementLayers: EnforcementMap
}

export const AxisSchema = z.object({
  id: z.string(),
  type: z.literal('axis'),
  name: z.string(),
  tier: AxisTier,
  prefix: z.string(),
  values: z.array(z.string()),
  description: z.string(),
})
export type Axis = z.infer<typeof AxisSchema>

export const MappingSchema = z.object({
  id: z.string(),
  type: z.literal('mapping'),
  principleId: z.string(),
  axisIds: z.array(z.string()),
  state: PrincipleStatus,
  note: z.string(),
})
export type Mapping = z.infer<typeof MappingSchema>

// ── Union + discriminator ───────────────────────────────

export const NodeSchema = z.discriminatedUnion('type', [
  PrincipleSchema,
  AxisSchema,
  MappingSchema,
])
/** Discriminated union over the three node variants. \`Principle\` carries the
 *  hand-typed EnforcementMap override (Record<...> inference does not stay
 *  Partial through z.infer). */
export type PrincipleNode = Principle | Axis | Mapping

// ── Filter shape (used by selectFilteredPrinciples) ─────

export interface PrincipleFilter {
  status?: PrincipleStatus
  tag?: PrincipleTag
  priority?: PrinciplePriority
  query?: string
}
`;export{e as default};