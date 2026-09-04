const LEAVES = [
  { left: '5%', delay: '0s', duration: '18s', size: 38, rot: 12, color: '#C45C26', kind: 'maple' },
  { left: '13%', delay: '3s', duration: '22s', size: 32, rot: -22, color: '#C9A962', kind: 'oak' },
  { left: '21%', delay: '7s', duration: '16s', size: 36, rot: 26, color: '#B55239', kind: 'maple' },
  { left: '30%', delay: '1s', duration: '20s', size: 30, rot: -10, color: '#D4783A', kind: 'pointed' },
  { left: '40%', delay: '5s', duration: '24s', size: 42, rot: 16, color: '#A44A2E', kind: 'maple' },
  { left: '51%', delay: '2s', duration: '19s', size: 34, rot: -28, color: '#C9A962', kind: 'oak' },
  { left: '61%', delay: '8s', duration: '21s', size: 36, rot: 8, color: '#C45C26', kind: 'maple' },
  { left: '70%', delay: '4s', duration: '17s', size: 32, rot: -16, color: '#8B3A2F', kind: 'oak' },
  { left: '78%', delay: '6s', duration: '23s', size: 30, rot: 20, color: '#D4A017', kind: 'pointed' },
  { left: '86%', delay: '0.8s', duration: '18s', size: 36, rot: -18, color: '#B55239', kind: 'maple' },
  { left: '93%', delay: '9s', duration: '20s', size: 32, rot: 6, color: '#C9A962', kind: 'oak' },
] as const

type LeafKind = (typeof LEAVES)[number]['kind']

function Leaf({ color, size, kind }: { color: string; size: number; kind: LeafKind }) {
  if (kind === 'oak') {
    return (
      <svg width={size * 0.58} height={size} viewBox="0 0 36 72" aria-hidden="true">
        <path
          fill={color}
          d="M18 4l4 6 6-2 2 8 6 1-2 7 6 4-4 5 5 6-7 3 2 8-6 1-2 8-4-2v16h-2V53l-4 2-2-8-6-1 2-8-7-3 5-6-4-5 6-4-2-7 6-1 2-8 6 2z"
        />
        <path fill="none" stroke="#3A2418" strokeOpacity="0.45" strokeWidth="1.5" d="M18 12v58" />
      </svg>
    )
  }
  if (kind === 'pointed') {
    return (
      <svg width={size * 0.72} height={size} viewBox="0 0 36 64" aria-hidden="true">
        <path
          fill={color}
          d="M18 2l8 14h-4l8 12h-5l5 11-12-2v19h-2V37l-12 2 5-11H6l8-12H10z"
        />
        <path fill="none" stroke="#3A2418" strokeOpacity="0.45" strokeWidth="1.5" d="M18 8v54" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 80" aria-hidden="true">
      <path
        fill={color}
        d="M32 3l7 15 17-5-8 15 19 9-19 5 11 16-17-5 3 19-13-16-13 16 3-19-17 5 11-16-19-5 19-9-8-15 17 5z"
      />
      <path fill={color} d="M31 58h2v20h-2z" />
      <path fill="none" stroke="#3A2418" strokeOpacity="0.45" strokeWidth="1.6" d="M32 20v58" />
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
            top: variant === 'scatter' ? `${12 + (index % 5) * 16}%` : undefined,
          }}
        >
          <Leaf color={leaf.color} size={leaf.size} kind={leaf.kind} />
        </span>
      ))}
    </div>
  )
}
