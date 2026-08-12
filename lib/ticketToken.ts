// A ticket's qr_token stays valid indefinitely once issued — anyone who ever
// held the link (e.g. a forwarded email) could view a guest's name/email or
// pull a fresh PDF/Wallet pass forever. Expiring it a fixed window after the
// event limits how long that personal data stays reachable via the token.
export const TICKET_TOKEN_TTL_DAYS = 30

export function isTicketTokenExpired(eventDate: string): boolean {
  const expiry = new Date(eventDate)
  expiry.setDate(expiry.getDate() + TICKET_TOKEN_TTL_DAYS)
  return Date.now() > expiry.getTime()
}
