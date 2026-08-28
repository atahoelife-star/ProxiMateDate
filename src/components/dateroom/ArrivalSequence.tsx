import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ArrivalBeat } from '../../data/arrival'
import { markArrived, shouldSkipArrival } from '../../lib/arrivalGate'

type ArrivalSequenceProps = {
  beats: ArrivalBeat[]
  storageKey: string
  onDone: () => void
}

export function ArrivalSequence({ beats, storageKey, onDone }: ArrivalSequenceProps) {
  const [index, setIndex] = useState(0)
  const beat = beats[index]
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const finish = () => {
    markArrived(storageKey)
    onDoneRef.current()
  }

  useEffect(() => {
    if (shouldSkipArrival(storageKey)) {
      onDoneRef.current()
      return
    }
    const current = beats[index]
    if (!current) {
      markArrived(storageKey)
      onDoneRef.current()
      return
    }
    const timer = window.setTimeout(() => {
      if (index >= beats.length - 1) {
        markArrived(storageKey)
        onDoneRef.current()
      } else {
        setIndex((i) => i + 1)
      }
    }, current.durationMs)
    return () => window.clearTimeout(timer)
  }, [index, beats, storageKey])

  if (!beat) return null

  return (
    <div className="fixed inset-0 z-[200] bg-[#0F0A0D] text-[#F8F4ED]" role="dialog" aria-label="Walking in">
      <AnimatePresence mode="wait">
        <motion.div
          key={beat.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          {beat.kind === 'video' ? (
            <video
              className="arrival-media absolute inset-0 w-full h-full object-cover"
              src={beat.src}
              muted
              playsInline
              autoPlay
              onError={() => {
                if (index >= beats.length - 1) finish()
                else setIndex((i) => i + 1)
              }}
            />
          ) : (
            <img
              className="arrival-media absolute inset-0 w-full h-full object-cover"
              src={beat.src}
              alt=""
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A0D] via-[#0F0A0D]/25 to-[#0F0A0D]/40" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-10 left-0 right-0 z-10 px-6 text-center">
        <div className="text-[#C9A962] text-xs tracking-[4px] mb-3">WALKING IN</div>
        <div className="font-serif text-3xl sm:text-4xl">{beat.caption}</div>
        <div className="mt-6 flex justify-center gap-2" aria-hidden>
          {beats.map((item, i) => (
            <span
              key={item.id}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-8 bg-[#C9A962]' : i < index ? 'w-3 bg-[#C9A962]/50' : 'w-3 bg-white/25'
              }`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="absolute top-6 right-6 z-10 btn btn-ghost text-sm px-5 py-2 border border-white/20"
        onClick={finish}
      >
        Skip
      </button>
    </div>
  )
}
