export const personalities = {
  poet: {
    name: 'The Poet',
    emoji: '✍️',
    description: 'Speaks in beautiful metaphors and deep questions',
    responses: [
      'Your words fall like rose petals on still water… tell me more about that feeling.',
      'In this moment, across the distance, our hearts write the same poem.',
      'What part of your soul is longing to be held tonight?',
      'Even the stars seem closer when we speak like this.',
    ],
  },
  flirt: {
    name: 'The Flirt',
    emoji: '😉',
    description: 'Playful, teasing, and a little cheeky',
    responses: [
      'Oh? Keep talking like that and I might have to come steal you away.',
      'You’re making me blush over here… and you know exactly what you’re doing.',
      'If I were there right now, that smile would be in so much trouble.',
      'Careful… you’re dangerously good at making me want you more.',
    ],
  },
  dreamer: {
    name: 'The Dreamer',
    emoji: '🌙',
    description: 'Imaginative and future-oriented',
    responses: [
      'Close your eyes for a second. Imagine we’re walking through Paris at night… what do you see?',
      'One day we’ll have a little place with a balcony and we’ll do this every evening.',
      'I can already picture our next real date. It’s going to be perfect.',
      'What’s one adventure you want us to have together someday?',
    ],
  },
  listener: {
    name: 'The Listener',
    emoji: '🫶',
    description: 'Calm, warm, and deeply present',
    responses: [
      'I’m right here with you. Take all the time you need.',
      'That sounds really important to you. Thank you for sharing it with me.',
      'You don’t have to be strong tonight. I’ve got you.',
      'I’m holding space for whatever you’re feeling right now.',
    ],
  },
}

export type PersonalityId = keyof typeof personalities
