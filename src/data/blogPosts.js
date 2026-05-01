export const blogPosts = [
  {
    slug: 'i-built-my-own-trading-journal-because-the-others-were-lying-to-me',
    title: 'I Built My Own Trading Journal Because the Others Were Lying to Me',
    description: 'TradeSharp started as a desperate A+ checklist, then became the journal system I needed to stop repeating bad trades.',
    publishedAt: '2026-04-29',
    readTime: '6 min read',
    category: 'Trading Journal',
    accent: '#22d3ee',
    tags: ['Journal', 'Discipline', 'TradeSharp'],
    featured: true,
    heroStat: 'Scoreboards are not mirrors',
    sections: [
      {
        heading: 'You know the feeling.',
        paragraphs: [
          "You blow your evals. You blow your fundeds. You tell yourself you'll journal this time. You open a spreadsheet, log three trades, then never open it again. The next account goes the same way.",
          "You try Tradezella hoping a professional dashboard will make you a better trader. But you're embarrassed to see the numbers on the screen, so you don't journal anyway.",
          "That was me. For longer than I'd like to admit.",
        ],
      },
      {
        heading: 'It started with a checklist.',
        paragraphs: [
          'Not an app. Not a business. Just a desperate attempt to stop taking bad trades.',
          'I trade with a model. I have an edge. I knew I had one. But every month my overall numbers told a different story than my A+ setup numbers, and the gap between those two figures was where all my money was going.',
          'So I built a simple A+ checklist in a Google Sheet. Then I wired it to a journal that synced automatically. Then I needed stats. Then I needed a calendar. Then I needed to track my mindset before sessions, not just my P&L after them.',
          'Months later, what started as a checklist and a journal had become TradeSharp, a full trading journal system built by a futures trader who needed it to exist.',
        ],
      },
      {
        heading: 'The real problem with every other journal.',
        paragraphs: [
          'Tradezella shows you your win rate. Edgewonk shows you your profit factor. Every journal I tried gave me clean charts and color-coded P&L calendars.',
          'None of them stopped me from taking bad trades.',
          'That is the lie. They are scoreboards, not mirrors. They log the damage after the fact. They do not ask why you took the trade before you clicked the button, and they definitely do not stop you when the honest answer is "I don\'t know, it just felt like it wanted to move."',
          'You do not need more features. You need specific features that actually make you journal every single session.',
        ],
      },
      {
        heading: 'So what does TradeSharp actually do differently?',
        paragraphs: [
          'It starts before you ever place a trade.',
          "There's a journal that you'll actually write in, because it's built around your session, not just your trades. Pre-session mindset. In-session notes. Post-session review.",
          'Your REAL words each and everyday.',
          'This is important. How you talk in the journal is your own words, thoughts, and feelings day in and day out.',
          'Why is this important? It is because your language deciphers your psychology, an important factor in journaling. But no one deciphers this because no one likes to read their own journal back to themselves.',
          "That's where Edge comes in. Edge AI, yes, we're using AI to help you become a better trader, deciphers your language, the way you talk through a trade, and gives you blunt feedback.",
          '"Price action is so shit today"',
          '"Unbelievable. Can\'t catch a clean move/break. FFS"',
          "You're not describing the market. You're describing your emotional state.",
          'Why is this helpful?',
          'Believe it or not, emotions are a HUGE factor in trading. Not all traders can turn off emotionally and trade like robots. That is just impossible.',
          'So you need to get actual feedback, via Edge AI, on how you talk to yourself and behave day in and day out.',
          'Sure, TradeSharp does not have a full suite of tools that TradeZella or the other journals have. But it also has some unique features that you would use everyday.',
        ],
      },
      {
        heading: 'Who this is for.',
        paragraphs: [
          "Traders who already have a model/strategy and keep losing money anyway. Traders who know what to do and still don't do it. Traders who've blown accounts, skipped journaling, and watched good setups turn into bad habits.",
          "I built this for me. Turns out it's for a lot of us.",
          'It is free. No credit card. Start Journaling.',
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
