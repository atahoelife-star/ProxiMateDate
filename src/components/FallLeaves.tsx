const LEAVES = [
  { left: '3%', delay: '0s', duration: '18s', size: 66, rot: 14, color: '#C45C26', kind: 'maple' },
  { left: '12%', delay: '3s', duration: '22s', size: 58, rot: -16, color: '#C9A962', kind: 'oak' },
  { left: '22%', delay: '7s', duration: '16s', size: 62, rot: 20, color: '#B55239', kind: 'maple' },
  { left: '33%', delay: '1s', duration: '20s', size: 54, rot: -10, color: '#D4783A', kind: 'oak' },
  { left: '48%', delay: '5s', duration: '24s', size: 70, rot: 8, color: '#A44A2E', kind: 'maple' },
  { left: '62%', delay: '2s', duration: '19s', size: 58, rot: -22, color: '#C9A962', kind: 'oak' },
  { left: '72%', delay: '8s', duration: '21s', size: 64, rot: 12, color: '#C45C26', kind: 'maple' },
  { left: '82%', delay: '4s', duration: '17s', size: 56, rot: -14, color: '#8B3A2F', kind: 'oak' },
  { left: '91%', delay: '6s', duration: '23s', size: 60, rot: 18, color: '#D4A017', kind: 'maple' },
  { left: '7%', delay: '0.8s', duration: '18s', size: 52, rot: -8, color: '#B55239', kind: 'oak' },
  { left: '95%', delay: '9s', duration: '20s', size: 56, rot: 6, color: '#C9A962', kind: 'maple' },
] as const

type LeafKind = (typeof LEAVES)[number]['kind']

function Leaf({ color, size, kind }: { color: string; size: number; kind: LeafKind }) {
  if (kind === 'oak') {
    return (
      <svg width={size * 0.48} height={size} viewBox="0 0 40 100" aria-hidden="true">
        <path
          fill={color}
          d="M20 4l6 8-2 6 8 4-4 8 8 6-6 8 8 8-8 6 4 10-8 4-2 10 2 4v20h-4V82l2-4-2-10-8-4 4-10-8-6 8-8-6-8 8-6-4-8 8-4-2-6z"
        />
        <path fill={color} d="M18 80h4v18h-4z" />
        <path fill="none" stroke="#2A1810" strokeOpacity="0.5" strokeWidth="2" d="M20 14v84" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 80 96" aria-hidden="true">
      <path
        fill={color}
        d="M40 4l8 18 22-8-12 20 24 12-24 6 14 20-22-6 4 24L40 66l-14 24 4-24-22 6 14-20-24-6 24-12-12-20 22 8z"
      />
      <path fill={color} d="M38 70h4v24h-4z" />
      <path fill="none" stroke="#2A1810" strokeOpacity="0.55" strokeWidth="2.2" d="M40 24v70" />
    </svg>
  )
}

type FallLeavesProps = {
  variant?: 'fall' | 'scatter'
}

export function FallLeaves({ variant = 'fall' }: FallLeavesProps) {
  return (
    <div
      className={`fall-leaves fall-leaves-${variant} pointer-events-none absolute inset-0 overflow-hidden`}
      aria-hidden="true"
    >
      {LEAVES.map((leaf, index) => (
        <span
          key={`${variant}-${index}`}
          className={variant === 'fall' ? 'fall-leaf' : 'fall-leaf-static'}
          style={{
            left: leaf.left,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration,
            ['--leaf-rot' as string]: `${leaf.rot}deg`,
            top: variant === 'scatter' ? `${8 + (index % 6) * 15}%` : undefined,
          }}
        >
          <Leaf color={leaf.color} size={leaf.size} kind={leaf.kind} />
        </span>
      ))}
    </div>
  )
}
