type SessionWrapNoticeProps = {
  open: boolean
  title: string
  body: string
  onDismiss: () => void
}

export function SessionWrapNotice({ open, title, body, onDismiss }: SessionWrapNoticeProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4">
      <div className="modal w-full max-w-md bg-[#1A1418] border border-[#3A2F36] rounded-3xl p-8">
        <h3 className="text-[#F8F4ED] text-2xl mb-2">{title}</h3>
        <p className="text-[#A8988A] text-sm mb-6">{body}</p>
        <button type="button" className="btn btn-gold w-full py-3" onClick={onDismiss}>
          Keep this evening
        </button>
      </div>
    </div>
  )
}
