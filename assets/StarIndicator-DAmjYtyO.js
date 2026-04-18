var e=`// ② Rating star indicator — filled/empty via SVG
import { ax } from '@styles/ax'

const starEmpty = (
  <svg className="item-indicator--star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z" />
  </svg>
)

const starFilled = (
  <svg className="item-indicator--star-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z" />
  </svg>
)

const starHalf = (
  <svg className="item-indicator--star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <defs>
      <clipPath id="star-half-clip"><rect x="0" y="0" width="12" height="24" /></clipPath>
    </defs>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z" />
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z" fill="currentColor" clipPath="url(#star-half-clip)" />
  </svg>
)

interface StarIndicatorProps {
  filled?: boolean
  half?: boolean
  className?: string
}

export function StarIndicator({ filled, half, className }: StarIndicatorProps) {
  const classes = [
    ax({ flex: 'none', layout: 'center', square: 'md' }),
    'item-indicator--star',
    filled ? 'item-indicator--star-filled' : undefined,
    className,
  ].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {half ? starHalf : filled ? starFilled : starEmpty}
    </span>
  )
}
`;export{e as default};