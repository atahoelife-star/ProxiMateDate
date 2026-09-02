import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { WatchChatOverlay, type RoomChatMsg } from '../components/dateroom/WatchChatOverlay'
import type { ChatMoment } from '../data/suggestedLines'

export type FloatingChatProps = {
  messages: RoomChatMsg[]
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  partnerName: string
  moment?: ChatMoment
}

function copyStyles(fromDoc: Document, toDoc: Document) {
  for (const node of fromDoc.querySelectorAll('link[rel="stylesheet"], style')) {
    toDoc.head.appendChild(node.cloneNode(true))
  }
  const base = toDoc.createElement('style')
  base.textContent = `
    html, body, #floating-date-chat { height: 100%; margin: 0; }
    body { background: #0F0A0D; color: #F8F4ED; }
    #floating-date-chat { display: flex; flex-direction: column; min-height: 100%; }
  `
  toDoc.head.appendChild(base)
}

function prepareDocument(win: Window) {
  const doc = win.document
  doc.title = 'Date chat'
  try {
    copyStyles(document, doc)
  } catch {
    /* some stylesheets are cross-origin */
  }
  doc.body.replaceChildren()
  const mount = doc.createElement('div')
  mount.id = 'floating-date-chat'
  doc.body.appendChild(mount)
  return mount
}

function requestChatWindow(): Window | null {
  const width = 360
  const height = 520
  // Must stay synchronous in the Play click. An awaited Picture-in-Picture request
  // (or a YouTube tab opened first) spends the gesture and the floater never appears.
  const popup = window.open(
    '',
    'proximate-date-chat',
    `popup=yes,width=${width},height=${height},left=24,top=72,resizable=yes,scrollbars=yes`,
  )
  if (!popup || popup.closed) return null
  return popup
}

export class FloatingDateChat {
  private win: Window | null = null
  private root: Root | null = null
  private onGone: (() => void) | null = null

  isOpen() {
    return Boolean(this.win && !this.win.closed)
  }

  open() {
    if (this.isOpen()) return true
    const win = requestChatWindow()
    if (!win) return false
    this.win = win
    const mount = prepareDocument(win)
    this.root = createRoot(mount)
    const gone = () => this.close()
    this.onGone = gone
    win.addEventListener('pagehide', gone)
    return true
  }

  render(props: FloatingChatProps) {
    if (!this.root || !this.isOpen()) return
    this.root.render(
      <StrictMode>
        <WatchChatOverlay
          variant="panel"
          caption="Same thread as the date room."
          messages={props.messages}
          input={props.input}
          onInputChange={props.onInputChange}
          onSend={props.onSend}
          partnerName={props.partnerName}
          moment={props.moment ?? 'movie'}
        />
      </StrictMode>,
    )
  }

  close() {
    const win = this.win
    const root = this.root
    this.win = null
    this.root = null
    if (win && this.onGone) {
      try {
        win.removeEventListener('pagehide', this.onGone)
      } catch {
        /* already gone */
      }
    }
    this.onGone = null
    try {
      root?.unmount()
    } catch {
      /* already unmounted */
    }
    try {
      if (win && !win.closed) win.close()
    } catch {
      /* popup already closed */
    }
  }
}
