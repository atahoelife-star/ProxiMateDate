import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Copy, Mail } from 'lucide-react'
import { useMemo } from 'react'

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

function buildInviteUrl(invitePath: string, roomId: string, follow: boolean, startedAt?: number) {
  const url = new URL(`${window.location.origin}${invitePath}`)
  url.searchParams.set('room', roomId)
  if (follow) url.searchParams.set('follow', '1')
  if (startedAt && startedAt > 0) url.searchParams.set('started', String(startedAt))
  return url.toString()
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
  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return buildInviteUrl(invitePath, roomId, follow, startedAt)
  }, [invitePath, roomId, follow, startedAt])

  if (!open) return null

  const copyInvite = () => {
    const url = buildInviteUrl(invitePath, roomId, follow, startedAt)
    void navigator.clipboard.writeText(url)
    toast.success('Link copied', { description: 'Email or text it to your date so they can join this room.' })
  }

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
                <h3 className="text-[#F8F4ED] text-2xl">Invite your date</h3>
                <p className="text-[#A8988A] mt-2 text-sm">
                  Copy this link and email it or text it to your date. They join in their own browser, pick their own
                  name, and chat in this room with you.
                </p>
              </div>
              <div className="p-8 space-y-4">
                <div className="p-4 rounded-2xl border border-[#C9A962]/40 bg-[#221C21]">
                  <div className="text-[10px] tracking-widest text-[#C9A962] mb-2">THEIR LINK</div>
                  <p className="text-[#EDE4D9] text-xs break-all leading-relaxed">{inviteUrl || 'Open this page to copy the link.'}</p>
                </div>
                <button
                  type="button"
                  onClick={copyInvite}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#C9A962]/50 hover:border-[#C9A962] text-left"
                >
                  <Copy className="w-5 h-5 text-[#C9A962]" />
                  <div>
                    <div className="text-[#F8F4ED] font-medium">Copy this link</div>
                    <div className="text-[#A8988A] text-sm">Then email or text it to your date</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onStep('success')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border border-[#3A2F36] hover:border-[#E8A0B8] text-left"
                >
                  <Mail className="w-5 h-5 text-[#E8A0B8]" />
                  <div>
                    <div className="text-[#F8F4ED] font-medium">In-app email does not send</div>
                    <div className="text-[#A8988A] text-sm">Use the copied link in your own mail or texts</div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-[#F8F4ED] text-2xl">Nothing was emailed from here</h3>
              <p className="text-[#A8988A] mt-3">
                Copy the link and send it to {partnerName} yourself — email, text, or any app you already use.
              </p>
              <button type="button" onClick={copyInvite} className="btn btn-gold mt-6 w-full py-3">
                Copy the link
              </button>
              <button type="button" onClick={onClose} className="btn btn-outline mt-3 w-full py-3">
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
