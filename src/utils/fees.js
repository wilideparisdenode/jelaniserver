import { fees } from '../config/env.js'

// Gross-up so that (total - processing fee) == tuition. Integer cents throughout.
// Free courses carry no processing fee, so the total stays at zero.
export function calculateBreakdown(subtotalCents) {
  if (subtotalCents <= 0) return { subtotalCents: 0, feeCents: 0, totalCents: 0 }
  const rate = fees.percent / 100
  const total = Math.ceil((subtotalCents + fees.fixedCents) / (1 - rate))
  return { subtotalCents, feeCents: total - subtotalCents, totalCents: total }
}
