import { useState } from 'react'

export type ChatMsg = { id: number; sender: 'me' | 'partner' | 'system'; text: string }

export const partnerReplies = [
  'I feel the same way… I keep reaching for your hand even though you’re not here.',
  'You always know exactly what to say to make my heart flutter.',
  'This is my favorite part of the week now. Just you and me in our little world.',
  'I wish I could kiss you through the screen right now.',
  'Tell me more… I love listening to your voice like this.',
  'Being here with you like this makes the distance feel smaller.',
]

export const INITIAL_CHAT: ChatMsg[] = [
  { id: 1, sender: 'partner', text: 'I miss your face so much tonight... this feels really nice already ❤️' },
  { id: 2, sender: 'me', text: 'You look beautiful. I can’t stop smiling.' },
]

export function useDemoChat() {
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(INITIAL_CHAT)
  const [chatInput, setChatInput] = useState('')

  const roomMessage = (text: string) => {
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: 'system', text }])
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    const newMsg: ChatMsg = { id: Date.now(), sender: 'me', text: chatInput.trim() }
    setChatMessages((prev) => [...prev, newMsg])
    setChatInput('')
    window.setTimeout(() => {
      const reply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)]
      setChatMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'partner', text: reply }])
    }, 1100 + Math.random() * 700)
  }

  const pickSuggestedLine = (line: string) => {
    if (chatInput.trim() === line) sendChatMessage()
    else setChatInput(line)
  }

  return {
    chatMessages,
    chatInput,
    setChatInput,
    sendChatMessage,
    pickSuggestedLine,
    roomMessage,
  }
}
