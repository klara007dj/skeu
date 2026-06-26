/** Detects whether an error means the database is unreachable / misconfigured. */
export function isDbUnavailable(error: unknown): boolean {
  const message = String((error as any)?.message || '')
  return /MONGODB_URI manquant|ECONN|ENOTFOUND|ETIMEDOUT|querySrv|authentication failed|bad auth|topology|server selection/i.test(
    message
  )
}

/** Generates a short, human-friendly referral code, e.g. "MARIE7K3X". */
export function generateReferralCode(name?: string): string {
  const base = (String(name || 'SK')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 5)) || 'SK'
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}${rand}`
}

/** Normalises a phone number to digits only (keeps a leading country code). */
export function normalizePhone(raw?: string): string {
  return String(raw || '').replace(/[^\d]/g, '')
}
