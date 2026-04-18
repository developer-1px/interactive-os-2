var e=`import { ax } from '@styles/ax'

type Tier = 'need' | 'story' | 'feature' | 'screen' | 'layer' | 'component'

interface TierCellProps {
  text: string
  tier: Tier
  subtitle?: string
  thumbnail?: string | null
}

const TIER_STYLE: Record<Tier, { textStyle: 'label' | 'body'; weight?: 'semi'; text: 'bright' | 'primary' | 'secondary' }> = {
  need: { textStyle: 'label', weight: 'semi', text: 'bright' },
  story: { textStyle: 'body', weight: 'semi', text: 'primary' },
  feature: { textStyle: 'body', text: 'primary' },
  screen: { textStyle: 'body', text: 'secondary' },
  layer: { textStyle: 'label', weight: 'semi', text: 'bright' },
  component: { textStyle: 'body', text: 'primary' },
}

export function TierCell({ text, tier, subtitle, thumbnail }: TierCellProps) {
  const style = TIER_STYLE[tier]
  return (
    <span className={ax({ layout: 'bar', gap: 'sm' })}>
      {thumbnail && (
        <img src={thumbnail} alt="" width={36} height={24} className={ax({ shape: 'sm' })} />
      )}
      <span className={ax({ layout: 'stack' })}>
        <span className={ax({
          textStyle: style.textStyle,
          weight: style.weight,
          text: style.text,
        })}>
          {text}
        </span>
        {subtitle && (
          <span className={ax({ text: 'muted', clamp: '1' })}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  )
}
`;export{e as default};