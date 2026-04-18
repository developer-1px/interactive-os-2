var e=`export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

interface CmsViewportWrapperProps {
  viewport: ViewportSize
  children: React.ReactNode
}

export default function CmsViewportWrapper({ viewport, children }: CmsViewportWrapperProps) {
  const className = viewport === 'desktop'
    ? 'cms-viewport w-full'
    : \`cms-viewport w-full cms-viewport--\${viewport}\`

  return <div className={className}>{children}</div>
}
`;export{e as default};