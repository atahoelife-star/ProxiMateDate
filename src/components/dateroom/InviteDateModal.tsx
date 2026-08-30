import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Link as LinkIcon, Mail } from 'lucide-react'

type InviteDateModalProps = {
  open: boolean
  onClose: () => void
  partnerName: string
  roomId: string
  invitePath: string
  follow: boolean
  startedAt?: number
  step: 'options' | 'success'
  onStep: (step: 'options' | 'success') => void
}

export function InviteDateModal({
  open,
  onClose,
  partnerName,
  roomId,
  invitePath,
  follow,
  startedAt,
  step,
  onStep,
}: InviteDateModalProps) {
  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="modal w-full max-w-lg bg-[#1A1418] border border-[#3A2F36] rounded-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {step === 'options' ? (
            <>
              <div className="px-8 pt-8 pb-6 text-center border-b border-[#3A2F36]">
                <h3 className="text-[#F8F4ED] text-2xl">Share this preview</h3>
                <p className="text-[#A8988A] mt-2 text-sm">Copy this room URL. Your date joins as themselves — they pick their own name, not yours.</p>
              </div>
              <div className="p-8 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    const url = new URL(`${window.location.origin}${invitePath}`)
                    url.searchParams.set('room', roomId)
                    if (follow) url.searchParams.set('follow', '1')
                    if (startedAt && startedAt > 0) url.searchParams.set('started', String(startedAt))
                    navigator.clipboard.writeText(url.toString())
                    toast.success('Preview link copied', { description: 'Live invites are not sending. This opens the demo.' })
                  }}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#3A2F36] hover:border-[#C9A962] text-left"
                >
                  <LinkIcon className="w-5 h-5 text-[#C9A962]" />
                  <div>
                    <div className="text-[#F8F4ED] font-medium">Copy room URL</div>
                    <div className="text-[#A8988A] text-sm">Same preview, this room only</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onStep('success')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] text-left"
                >
                  <Mail className="w-5 h-5 text-[#E8A0B8]" />
                  <div>
                    <div className="text-[#F8F4ED] font-medium">Compose a note (demo)</div>
                    <div className="text-[#A8988A] text-sm">Does not send mail</div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-[#F8F4ED] text-2xl">Nothing was sent</h3>
              <p className="text-[#A8988A] mt-3">This preview does not notify {partnerName}. Share the copied URL yourself.</p>
              <button type="button" onClick={onClose} className="btn btn-gold mt-6 w-full py-3">
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
