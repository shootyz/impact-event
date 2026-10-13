// Public origin of this app, never with a trailing slash (a trailing slash in
// the env var produces "//ticket/..." links in emails).
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://impactgstaad.vercel.app').replace(/\/+$/, '')
