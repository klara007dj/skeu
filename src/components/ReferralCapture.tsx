'use client'
import { useEffect } from 'react'

/**
 * Captures a reseller referral code from the URL (?ref=CODE) and stores it
 * in localStorage so it can be applied at signup and at checkout, even for
 * guests who haven't created an account yet.
 */
export const REF_STORAGE_KEY = 'sk_ref'

export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref') || params.get('code')
      if (ref) {
        localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase())
      }
    } catch {
      /* ignore */
    }
  }, [])

  return null
}
