import { useCallback, useEffect, useRef, useState } from 'react'
import {
  hasSeenFeedbackPrompt,
  markFeedbackPromptSeen,
  type FeedbackPlan,
  type FeedbackRoom,
} from './feedback'

type UseDateFeedbackArgs = {
  room: Exclude<FeedbackRoom, 'site'>
  roomId: string
  startedAt: number
  expired: boolean
  waiting: boolean
  plan?: FeedbackPlan | string
}

export function useDateFeedback({
  room,
  roomId,
  startedAt,
  expired,
  waiting,
  plan,
}: UseDateFeedbackArgs) {
  const [open, setOpen] = useState(false)
  const afterClose = useRef<(() => void) | null>(null)
  const sawRunning = useRef(false)

  useEffect(() => {
    if (startedAt > 0 && !waiting && !expired) sawRunning.current = true
  }, [startedAt, waiting, expired])

  const alreadySeen = useCallback(() => {
    return hasSeenFeedbackPrompt(room, roomId, startedAt)
  }, [room, roomId, startedAt])

  const finish = useCallback(() => {
    markFeedbackPromptSeen(room, roomId, startedAt)
    setOpen(false)
    const next = afterClose.current
    afterClose.current = null
    next?.()
  }, [room, roomId, startedAt])

  useEffect(() => {
    if (!expired) return
    if (!sawRunning.current) return
    if (alreadySeen()) return
    setOpen(true)
  }, [alreadySeen, expired])

  const requestEnd = useCallback(
    (then: () => void) => {
      if (startedAt <= 0 || alreadySeen()) {
        then()
        return
      }
      afterClose.current = then
      setOpen(true)
    },
    [alreadySeen, startedAt],
  )

  return { open, requestEnd, finish, plan: plan || '', room }
}
