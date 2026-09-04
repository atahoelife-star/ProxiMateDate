const LEAVES = [
  { left: '6%', delay: '0s', duration: '18s', size: 18, rot: 12, color: '#C45C26' },
  { left: '14%', delay: '3s', duration: '22s', size: 14, rot: -20, color: '#C9A962' },
  { left: '22%', delay: '7s', duration: '16s', size: 16, rot: 28, color: '#B55239' },
  { left: '31%', delay: '1s', duration: '20s', size: 12, rot: -8, color: '#D4783A' },
  { left: '41%', delay: '5s', duration: '24s', size: 20, rot: 16, color: '#A44A2E' },
  { left: '52%', delay: '2s', duration: '19s', size: 13, rot: -30, color: '#C9A962' },
  { left: '61%', delay: '8s', duration: '21s', size: 17, rot: 10, color: '#C45C26' },
  { left: '70%', delay: '4s', duration: '17s', size: 15, rot: -14, color: '#8B3A2F' },
  { left: '78%', delay: '6s', duration: '23s', size: 12, rot: 22, color: '#D4A017' },
  { left: '86%', delay: '0.8s', duration: '18s', size: 16, rot: -18, color: '#B55239' },
  { left: '93%', delay: '9s', duration: '20s', size: 14, rot: 6, color: '#C9A962' },
]

function Leaf({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={color}
        d="M12 2c3.2 2.4 7.2 6.2 8.4 11.1.6 2.4-.2 5-2.2 6.6-1.6 1.3-3.8 1.7-5.8 1.2-.4 1.1-.9 1.8-1.4 2.1-.5-.3-1-1-1.4-2.1-2 .5-4.2.1-5.8-1.2-2-1.6-2.8-4.2-2.2-6.6C4.8 8.2 8.8 4.4 12 2Z"
      />
      <path fill="none" stroke="#3A2418" strokeOpacity="0.35" strokeWidth="1" d="M12 4.2v14.2" />
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
          <Leaf color={leaf.color} size={leaf.size} />
        </span>
      ))}
    </div>
  )
}
