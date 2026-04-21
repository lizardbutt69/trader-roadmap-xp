export const blogPosts = [
  {
    slug: 'build-a-repeatable-pre-market-routine',
    title: 'Build a Repeatable Pre-Market Routine',
    description: 'A clean framework for preparing before the open so your trade decisions come from process, not emotion.',
    publishedAt: '2026-04-18',
    readTime: '6 min read',
    category: 'Execution',
    accent: '#22d3ee',
    tags: ['Routine', 'Process', 'Discipline'],
    featured: true,
    heroStat: 'Open calm, not reactive',
    sections: [
      {
        heading: 'The market punishes improvisation',
        paragraphs: [
          'Most bad sessions do not begin with a terrible setup. They begin with a loose routine. When you sit down rushed, unfocused, or emotionally noisy, every chart starts to look actionable.',
          'A strong pre-market routine does not guarantee a green day. It does something better. It gives you a repeatable baseline so you can separate market conditions from your own lack of preparation.',
        ],
      },
      {
        heading: 'What to review before the bell',
        paragraphs: [
          'Start with context. Mark higher time frame structure, the key levels that matter, and the session narrative you actually believe in. Then define what would invalidate that narrative so you do not stay married to it.',
        ],
        bullets: [
          'Major overnight highs and lows',
          'Economic events and scheduled catalysts',
          'Your primary bias and the price action that would invalidate it',
          'The one or two setups you are willing to execute today',
        ],
      },
      {
        heading: 'Keep the plan small enough to obey',
        paragraphs: [
          'Traders often confuse detail with quality. A good plan is not the longest plan. It is the one you will actually follow under pressure.',
          'If your plan contains five scenarios, three backup setups, and a dozen exceptions, you are not reducing decision fatigue. You are creating room for negotiation.',
        ],
      },
      {
        heading: 'Your goal is readiness, not certainty',
        paragraphs: [
          'The best routine puts you in a position to respond cleanly when the market reveals its hand. That means arriving with context, defined triggers, and enough self-awareness to know when you are forcing it.',
          'When your routine is consistent, your review process becomes more honest. You can finally tell whether the issue was the setup, the execution, or the state you brought into the session.',
        ],
      },
    ],
  },
  {
    slug: 'why-most-trade-journals-do-not-change-behavior',
    title: 'Why Most Trade Journals Do Not Change Behavior',
    description: 'Recording trades is easy. Using a journal to reduce repeat mistakes takes a much tighter review loop.',
    publishedAt: '2026-04-14',
    readTime: '7 min read',
    category: 'Review',
    accent: '#34d399',
    tags: ['Journal', 'Review', 'Behavior'],
    featured: true,
    heroStat: 'Data is not feedback by itself',
    sections: [
      {
        heading: 'Logging is not reviewing',
        paragraphs: [
          'A lot of traders have a journal full of screenshots, entries, and P&L numbers. That looks productive, but it often changes nothing. Information only becomes useful when it leads to a tighter rule, a clearer pattern, or a behavior you can actually track.',
          'If you are recording trades without extracting decisions from them, your journal becomes storage instead of coaching.',
        ],
      },
      {
        heading: 'What your review should answer',
        paragraphs: [
          'A good review is trying to answer a few hard questions. Was the trade truly inside plan? Did you execute the setup well? Did you size it appropriately? Did your emotional state distort the decision?',
        ],
        bullets: [
          'What did I do well that should become more repeatable?',
          'What mistake showed up more than once this week?',
          'Which rule would have prevented the largest avoidable loss?',
          'Where did my process break down before I clicked buy or sell?',
        ],
      },
      {
        heading: 'Make your journal point to one adjustment',
        paragraphs: [
          'The review cycle gets stronger when it ends with a single corrective action. That might be reducing size after two losses, refusing second entries without a reclaim, or requiring a checklist score before every trade.',
          'The point is not to write a smarter summary. The point is to change your next session.',
        ],
      },
    ],
  },
  {
    slug: 'the-difference-between-patience-and-passivity',
    title: 'The Difference Between Patience and Passivity',
    description: 'Waiting is only valuable when you know exactly what you are waiting for.',
    publishedAt: '2026-04-09',
    readTime: '5 min read',
    category: 'Psychology',
    accent: '#fbbf24',
    tags: ['Psychology', 'Patience', 'Setups'],
    featured: false,
    heroStat: 'Selectivity beats screen time',
    sections: [
      {
        heading: 'Patience has structure',
        paragraphs: [
          'Traders like to say they need more patience, but patience without criteria becomes passivity. You cannot measure whether you waited well unless you know the setup, location, and confirmation you required.',
          'Real patience is active. It tracks levels, watches behavior, and stays emotionally neutral until the conditions match the plan.',
        ],
      },
      {
        heading: 'Passivity hides behind vague language',
        paragraphs: [
          'Passive traders often tell themselves they are being disciplined when they are actually hesitating. They miss valid setups, enter late, and then label the session "weird" instead of admitting they were not decisive.',
          'That kind of hesitation still creates damage. It erodes trust in your system and makes you more likely to force the next opportunity.',
        ],
      },
      {
        heading: 'Define the trigger before the market opens',
        paragraphs: [
          'The solution is clarity, not motivation. If you can write the exact behavior that earns your entry, then you can tell the difference between healthy waiting and fear-based freezing.',
          'Strong execution comes from narrowing the decision window. When the pattern appears, you act. When it does not, you stay out and preserve energy.',
        ],
      },
    ],
  },
]

export function getAllBlogPosts() {
  return [...blogPosts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

export function getFeaturedBlogPosts(limit = 2) {
  return getAllBlogPosts().filter((post) => post.featured).slice(0, limit)
}

export function getBlogPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug)
}
