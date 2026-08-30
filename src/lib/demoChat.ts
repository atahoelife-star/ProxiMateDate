import { useState } from 'react'

export type ChatMsg = { id: number; sender: 'me' | 'partner' | 'system'; text: string }

export function useDemoChat() {
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')

  const roomMessage = (text: string) => {
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: 'system', text }])
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    const newMsg: ChatMsg = { id: Date.now(), sender: 'me', text: chatInput.trim() }
    setChatMessages((prev) => [...prev, newMsg])
    setChatInput('')
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
