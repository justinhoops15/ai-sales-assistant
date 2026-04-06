/**
 * Actuarial premium estimator — FFL Intelligence
 * All rates are for illustration purposes only. Actual premiums
 * are determined by carrier underwriting.
 *
 * Sources: industry experience from NAIC data, carrier rate guides,
 * and published simplified-issue / fully-underwritten rate filings.
 */

// ── Whole Life / Final Expense rates ─────────────────────────────────────────
// Monthly premium per $1,000 face amount
// Male, Non-Tobacco, STANDARD rate class (baseline = 1.0)
// Points are [age, rate]; interpolated between entries
const WL_RATES_M = [
  [18,  0.95],
  [25,  1.15],
  [30,  1.40],
  [35,  1.72],
  [40,  2.12],
  [45,  2.68],
  [50,  3.45],
  [55,  4.55],
  [60,  5.95],
  [65,  7.70],
  [70, 10.50],
  [75, 14.60],
  [80, 20.80],
  [85, 29.60],
  [89, 43.50],
]

// ── Term Life rates (20-year, Standard) ──────────────────────────────────────
// Monthly premium per $1,000 face amount
// Male, Non-Tobacco, STANDARD rate class
// Calibrated so that e.g. $220k 20-yr term for a 45M non-tobacco ≈ $84/mo
const TERM_RATES_M = [
  [18,  0.09],
  [25,  0.11],
  [30,  0.15],
  [35,  0.21],
  [40,  0.31],
  [45,  0.38],
  [50,  0.60],
  [55,  0.97],
  [60,  1.55],
  [65,  2.60],
  [70,  4.50],
  [75,  7.80],
  [80, 13.50],
]

// Female rate multipliers (lower mortality risk)
const FEMALE_MULT_WL   = 0.83
const FEMALE_MULT_TERM = 0.76

// Tobacco surcharge multipliers (applied to base rate)
const TOBACCO_MULT_WL   = 1.90   // WL / FE tobacco surcharge
const TOBACCO_MULT_TERM = 2.15   // Term tobacco surcharge

// Tobacco type fine-tuning (relative to generic tobacco surcharge)
const TOBACCO_TYPE_FACTOR = {
  cigarettes:      1.00,  // full surcharge
  vaping:          0.92,
  cigars:          0.82,
  chewing_tobacco: 0.78,
}

// Tier adjustment multipliers (vs Standard baseline = 1.0)
const TIER_MULT = {
  'Preferred Plus': 0.72,
  'Preferred':      0.76,
  'Level':          0.76,
  'Standard Plus':  0.88,
  'Standard':       1.00,
  'Table':          1.28,
  'Graded':         1.28,
  'Modified':       1.55,
  'Guaranteed':     1.85,
}

// Term length adjustment (vs 20-year = 1.0)
const TERM_LENGTH_MULT = {
  '10': 0.72,
  '15': 0.86,
  '20': 1.00,
  '25': 1.18,
  '30': 1.35,
  '35': 1.52,
}

// ── Known term product IDs ────────────────────────────────────────────────────
export const TERM_PRODUCT_IDS = new Set([
  'HMS125', 'CBO100', 'TERM100',
  'HOME_PROT', 'EASY_TERM',
  'TLE',
  'YOUR_TERM',
  'TERM_PRIME', 'TERM_CHOICE',
  'TERM_VITALITY', 'PROT_TERM',
  'SELECT_TERM', 'QOL_FLEX',
])

export const UL_PRODUCT_IDS = new Set([
  'IULE', 'JH_UL_MP',
])

export function isTerm(productId) { return TERM_PRODUCT_IDS.has(productId) }
export function isUL(productId)   { return UL_PRODUCT_IDS.has(productId) }
export function isWL(productId)   { return !isTerm(productId) && !isUL(productId) }

// ── Linear interpolation helper ───────────────────────────────────────────────
function interpolate(table, age) {
  const n = table.length
  if (age <= table[0][0])   return table[0][1]
  if (age >= table[n-1][0]) return table[n-1][1]
  for (let i = 1; i < n; i++) {
    if (age <= table[i][0]) {
      const [a0, r0] = table[i - 1]
      const [a1, r1] = table[i]
      const t = (age - a0) / (a1 - a0)
      return r0 + t * (r1 - r0)
    }
  }
  return table[n-1][1]
}

/**
 * Estimate monthly premium range for a life insurance product.
 *
 * @param {object} params
 * @param {string}  params.productId   — product ID from UNDERWRITING_RULES
 * @param {number}  params.age         — client age
 * @param {string}  params.sex         — 'male' | 'female'
 * @param {boolean} params.tobacco     — true if tobacco user
 * @param {string}  params.tobaccoType — cigarettes | cigars | chewing_tobacco | vaping
 * @param {number}  params.faceAmount  — policy face amount in dollars
 * @param {string}  params.tier        — underwriting tier string
 * @param {string}  [params.termYears] — '10'|'15'|'20'|'25'|'30'|'35' (term only)
 *
 * @returns {{ low: number, mid: number, high: number }} monthly premiums
 */
export function estimateMonthly({ productId, age, sex, tobacco, tobaccoType, faceAmount, tier, termYears = '20' }) {
  const useTermRates = isTerm(productId) || isUL(productId)
  const rateTable    = useTermRates ? TERM_RATES_M : WL_RATES_M
  const femaleMult   = useTermRates ? FEMALE_MULT_TERM : FEMALE_MULT_WL
  const tobaccoMult  = useTermRates ? TOBACCO_MULT_TERM : TOBACCO_MULT_WL

  // Base rate (male, non-tobacco, standard)
  let rate = interpolate(rateTable, Number(age) || 50)

  // Sex adjustment
  if (sex === 'female') rate *= femaleMult

  // Tobacco adjustment
  if (tobacco) {
    const typeFactor = TOBACCO_TYPE_FACTOR[tobaccoType] || 1.0
    rate *= tobaccoMult * typeFactor
  }

  // Tier adjustment
  rate *= (TIER_MULT[tier] ?? 1.0)

  // Term length adjustment
  if (useTermRates) {
    rate *= (TERM_LENGTH_MULT[String(termYears)] ?? 1.0)
  }

  const units = faceAmount / 1000
  const mid   = Math.round(rate * units * 100) / 100
  const low   = Math.round(rate * units * 0.88 * 100) / 100
  const high  = Math.round(rate * units * 1.13 * 100) / 100

  return { low, mid, high }
}

/**
 * Format a number as a dollar string.
 */
export function formatCurrency(n) {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Estimate first-year commission.
 */
export function estimateCommission({ monthlyPremium, commissionPct }) {
  return Math.round(monthlyPremium * 12 * (commissionPct / 100) * 100) / 100
}
