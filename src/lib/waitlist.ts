export type WaitlistPayload = {
  email: string
  name?: string
  intent: string
  plan?: string
  message?: string
}

const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/atahoelife@gmail.com'

export async function submitWaitlist(payload: WaitlistPayload): Promise<void> {
  const body = {
    email: payload.email.trim(),
    name: payload.name?.trim() || '',
    intent: payload.intent,
    plan: payload.plan || '',
    message: payload.message?.trim() || '',
    _subject: 'ProxiMateDate waitlist',
    _template: 'table',
  }

  const response = await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Waitlist signup could not be sent. Please email atahoelife@gmail.com.')
  }
}
