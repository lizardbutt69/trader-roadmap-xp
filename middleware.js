export const config = { matcher: ['/blog/:slug*'] }

const SOCIAL_BOTS = [
  'twitterbot', 'facebookexternalhit', 'linkedinbot',
  'discordbot', 'slackbot', 'whatsapp', 'telegram',
]

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  const lower = ua.toLowerCase()
  const isSocialBot = SOCIAL_BOTS.some(bot => lower.includes(bot))

  if (isSocialBot) {
    const { pathname, origin } = new URL(request.url)
    return Response.redirect(`${origin}/api/og-preview?path=${pathname.slice(1)}`)
  }
}
