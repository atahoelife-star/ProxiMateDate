import { linesForMoment, type ChatMoment } from '../../data/suggestedLines'

export function SuggestedLines({
  moment,
  onPick,
  compact = false,
}: {
  moment: ChatMoment
  onPick: (line: string) => void
  compact?: boolean
}) {
  const lines = linesForMoment(moment)

  return (
    <div className={`suggest-row ${compact ? 'suggest-row-compact' : ''}`} role="list" aria-label="Suggested lines">
      {lines.map((line) => (
        <button
          key={line}
          type="button"
          className="suggest-chip"
          role="listitem"
          title="Tap to fill. Tap again to send."
          onClick={() => onPick(line)}
        >
          {line}
        </button>
      ))}
    </div>
  )
}
