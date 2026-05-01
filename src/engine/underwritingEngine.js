// FFL Intelligence — Underwriting Engine v2
import { UNDERWRITING_RULES } from '../data/carriers/underwriting.js'
import { COMP_GRID, getComp } from '../data/compensation.js'
import { estimateMonthly, TERM_PRODUCT_IDS } from '../utils/premiumCalculator.js'

// ── Tier ranking (lower = better for client) ──────────────────────────────────
const TIER_RANK = {
  'Preferred Plus': 0,
  'Preferred':      0,
  'Level':          0,
  'Standard Plus':  1,
  'Standard':       2,
  'Table':          3,
  'Graded':         3,
  'Modified':       4,
  'Guaranteed':     5,
  'Decline':        6,
}

function getTierRank(decision) { return TIER_RANK[decision] ?? 2 }
function normalizeTier(tier)   { return TIER_RANK[tier]     ?? 2 }

// ── Timeframe string → years ──────────────────────────────────────────────────
function timeframeToYears(tf) {
  switch (tf) {
    case '6mo':   return 0.5
    case '12mo':  return 1.0
    case '2yr':   return 1.5
    case '5yr':   return 3.5
    case '5plus': return 6.0
    default:      return 0
  }
}

// ── Evaluate time-based rules (first matching rule wins) ──────────────────────
function evalTimeBased(rules, yearsAgo) {
  for (const rule of rules) {
    if (rule.within !== undefined && yearsAgo <= rule.within) return rule.decision
    if (rule.after  !== undefined)                             return rule.decision
  }
  return 'Preferred'
}

// ── Build chart check ─────────────────────────────────────────────────────────
function checkBuildChart(chart, heightFt, heightIn, weight) {
  if (!chart || chart.length === 0) return null
  const key = `${heightFt}'${heightIn}`
  const row = chart.find(r => r.height === key)
  if (!row) return null
  const w = parseInt(weight)
  if (isNaN(w) || w <= 0) return null
  if (w < row.min || w > row.max) {
    return `Build chart: ${w} lbs out of range for height ${key} (${row.min}–${row.max} lbs)`
  }
  return null
}

// ── Product ID → COMP_GRID carrier + product name ─────────────────────────────
const PROD_TO_COMP = {
  FE_EXPRESS:      { c: 'TRANS', p: 'FE' },
  FE_IMMEDIATE:    { c: 'TRANS', p: 'FE' },
  FE_10PAY:        { c: 'TRANS', p: 'FE' },
  FE_EASY:         { c: 'TRANS', p: 'FE' },
  EAGLE_1:         { c: 'AMER',  p: 'Eagle Select 1' },
  EAGLE_2:         { c: 'AMER',  p: 'Eagle Select 2' },
  EAGLE_3:         { c: 'AMER',  p: 'Eagle Select 3' },
  ADVANTAGE_WL:    { c: 'AMER',  p: 'Advantage WL' },
  HMS125:          { c: 'AMER',  p: 'HMS 125' },
  CBO100:          { c: 'AMER',  p: 'HMS 125' },
  TERM100:         { c: 'AMER',  p: 'HMS 125' },
  SC_IMM:          { c: 'AMAM',  p: 'Senior/Family Choice' },
  SC_GRAD:         { c: 'AMAM',  p: 'Senior/Family Choice' },
  HOME_PROT:       { c: 'AMAM',  p: 'Home Protector' },
  EASY_TERM:       { c: 'AMAM',  p: 'EZ Term' },
  LP_LEVEL:        { c: 'MOO',   p: 'Final Expense' },
  LP_GRADED:       { c: 'MOO',   p: 'Final Expense' },
  TLE:             { c: 'MOO',   p: 'Term Life Express' },
  IULE:            { c: 'MOO',   p: 'IULE' },
  PLANRIGHT_PREF:  { c: 'FORE',  p: 'PlanRight' },
  PLANRIGHT_STAND: { c: 'FORE',  p: 'PlanRight' },
  PLANRIGHT_BASIC: { c: 'FORE',  p: 'PlanRight' },
  YOUR_TERM:       { c: 'FORE',  p: 'Strong Foundation' },
  AETNA_PREF:      { c: 'AETNA', p: 'Whole Life' },
  AETNA_STAND:     { c: 'AETNA', p: 'Whole Life' },
  AETNA_MOD:       { c: 'AETNA', p: 'Whole Life' },
  TRUSTAGE_GAWL:   { c: 'ETHOS', p: 'TruStage GAWL' },
  TERM_PRIME:      { c: 'ETHOS', p: 'LGA Prime' },
  TERM_CHOICE:     { c: 'ETHOS', p: 'LGA Prime' },
  TRUSTAGE_TAWL:   { c: 'ETHOS', p: 'TruStage TAWL' },
  TERM_VITALITY:   { c: 'JH',    p: 'Term with Vitality' },
  PROT_TERM:       { c: 'JH',    p: 'Protection Term' },
  JH_UL_MP:        { c: 'JH',    p: 'Protection Term' },
  GIWL:            { c: 'CORE',  p: 'GIWL' },
  SELECT_TERM:     { c: 'CORE',  p: 'Select-A-Term' },
  QOL_FLEX:        { c: 'CORE',  p: 'Select-A-Term' },
  NV_LEVEL:        { c: 'PROS',  p: 'New Vista Level' },
  NV_GRADED:       { c: 'PROS',  p: 'New Vista Graded' },
  NV_MOD:          { c: 'PROS',  p: 'New Vista Modified' },
}

// ── Medication flaggedCarriers → engine carrier ID ─────────────────────────────
const MED_CARRIER_MAP = {
  mutual_of_omaha:   'MOO',
  transamerica:      'TRANS',
  foresters:         'FORE',
  americo:           'AMER',
  american_amicable: 'AMAM',
  aetna:             'AETNA',
  ethos:             'ETHOS',
  john_hancock:      'JH',
  corebridge:        'CORE',
  prosperity_life:   'PROS',
  north_american:    'PROS',
}

// ── Specific cancer types → fall back to "Cancer (non-skin)" underwriting rules ─
// Rather than adding 20 entries to every carrier's rule array, we detect any
// specific cancer condition here and look up the carrier's "Cancer (non-skin)" rule.
const SPECIFIC_CANCER_CONDITIONS = new Set([
  'Leukemia', 'Lymphoma', "Hodgkin's Disease", "Non-Hodgkin's Lymphoma",
  'Breast Cancer', 'Colon Cancer', 'Prostate Cancer', 'Lung Cancer',
  'Skin Cancer (Melanoma)', 'Cervical Cancer', 'Ovarian Cancer',
  'Bladder Cancer', 'Kidney Cancer', 'Thyroid Cancer', 'Pancreatic Cancer',
  'Liver Cancer', 'Brain Tumor', 'Multiple Myeloma', 'Bone Cancer', 'Throat Cancer',
])

// ── AM Best ratings ───────────────────────────────────────────────────────────
const AM_BEST = {
  TRANS: 'A+', AMER: 'A', AMAM: 'A', MOO: 'A+',
  FORE: 'A', AETNA: 'A', ETHOS: 'A', JH: 'A+',
  CORE: 'A', PROS: 'A-',
}

// ── Product candidate groups ───────────────────────────────────────────────────
// Returns [{ label, category, products }] — one entry per product type.
// For MP leads, Americo returns both a 'Term' group and a 'Whole Life' group.
// For TRANS on MP (FE-only carrier), returns FE products as a 'Whole Life' group.
function getProductGroups(carrier, leadType) {
  const p = carrier.products || {}

  if (leadType === 'final_expense') {
    const fe = p.FE || []
    return fe.length ? [{ label: 'Final Expense', category: 'WL', products: fe }] : []
  }

  if (leadType === 'mortgage_protection') {
    const groups = []

    // Term candidates: explicit TERM key + term IDs inside MP key
    const termProds = [
      ...(p.TERM || []),
      ...(p.MP   || []).filter(pr => TERM_PRODUCT_IDS.has(pr.id)),
    ]
    if (termProds.length) groups.push({ label: 'Term', category: 'term', products: termProds })

    // WL candidates: explicit WL key + non-term products inside MP key
    const wlFromMP = (p.MP || []).filter(pr => !TERM_PRODUCT_IDS.has(pr.id))
    const allWL    = [...(p.WL || []), ...wlFromMP]

    // FE-only carriers (TRANS, AETNA, PROS): use FE as supplemental WL option
    const feFallback = (termProds.length === 0 && allWL.length === 0) ? (p.FE || []) : []
    const totalWL    = [...allWL, ...feFallback]
    if (totalWL.length) groups.push({ label: 'Whole Life', category: 'WL', products: totalWL })

    return groups
  }

  // Veteran — same product routing as Final Expense (burial/final expense coverage)
  if (leadType === 'veteran') {
    const fe = p.FE || []
    return fe.length ? [{ label: 'Final Expense', category: 'WL', products: fe }] : []
  }

  return []
}

// ── Disposition-based tier face amounts ──────────────────────────────────────
// Cremation needs a tierOverride because 7/10/15 doesn't follow 50/75/100%.
// Burial follows 50/75/100 of 20000 exactly — no override needed.
const DISPOSITION_FACE = {
  burial:    20000,
  cremation: 15000,
}
const DISPOSITION_TIER_OVERRIDE = {
  cremation: { bronze: 7000, silver: 10000, gold: 15000 },
}

// ── Recommended face amount ───────────────────────────────────────────────────
function getRecommendedFace(leadType, financial, clientInfo) {
  const income      = parseInt(String(financial?.income            || '0').replace(/\D/g, '')) || 0
  const mortgage    = parseInt(String(financial?.mortgageBalance   || '0').replace(/\D/g, '')) || 0
  const feDesired   = parseInt(String(financial?.feDesiredCoverage || '0').replace(/\D/g, '')) || 0
  const disposition = financial?.finalDisposition || ''
  const age         = parseInt(clientInfo?.age) || 55

  // MORTGAGE PROTECTION — always use the actual mortgage balance. No income multiplier.
  if (leadType === 'mortgage_protection') {
    return mortgage > 0 ? mortgage : 250000
  }

  // FINAL EXPENSE & VETERAN — identical burial/final expense coverage rules.
  // Disposition takes precedence; fall back to agent-entered amount or age default.
  if (leadType === 'final_expense' || leadType === 'veteran') {
    if (disposition && DISPOSITION_FACE[disposition]) return DISPOSITION_FACE[disposition]
    if (feDesired > 0) return Math.min(Math.max(feDesired, 5000), 35000)
    if (age >= 80) return 7500
    if (age >= 75) return 10000
    if (age >= 65) return 15000
    return 20000
  }

  // MORTGAGE PROTECTION term fallback — income replacement
  return Math.min(income > 0 ? income * 120 : 150000, 500000)
}

// ── Explanation text ──────────────────────────────────────────────────────────
function buildExplanation(carrier, product, flags) {
  const tierDescMap = {
    'Preferred':      'best available rate class with full day-1 benefit',
    'Level':          'best available rate class with full day-1 benefit',
    'Standard Plus':  'standard-plus class with immediate full coverage',
    'Standard':       'standard rate class with full day-1 coverage',
    'Graded':         'graded benefit — limited payout in years 1–2, full coverage year 3+',
    'Modified':       'modified benefit — 2-year waiting period applies',
    'Guaranteed':     'guaranteed issue — no health questions, anyone qualifies',
  }
  const tierDesc = tierDescMap[product.tier] || product.tier
  const parts = [`Qualifies for ${carrier.name}'s ${tierDesc}.`]
  if (product.note) parts.push(product.note)
  if (carrier.keyAdvantages?.length) parts.push(`Key advantage: ${carrier.keyAdvantages[0]}.`)
  if (flags.length > 0) {
    const summary = flags.slice(0, 2).map(f => `${f.condition} (${f.decision})`).join(', ')
    parts.push(`Health flags noted: ${summary}.`)
  }
  return parts.join(' ')
}

// ── Main underwriting function ─────────────────────────────────────────────────
export function runUnderwriting(formData, agentContractLevel) {
  const {
    leadType    = 'final_expense',
    clientInfo  = {},
    conditions  = {},
    medications = [],
    financial   = {},
  } = formData

  const {
    heightFt    = '5',
    heightIn    = '6',
    weight      = '',
    age:  ageStr = '55',
    sex         = 'male',
    tobacco     = false,
    tobaccoType = '',
  } = clientInfo

  const finalDisposition = financial?.finalDisposition || ''

  const clientAge = parseInt(ageStr) || 55

  const selectedConditions = Object.entries(conditions)
    .filter(([, v]) => v && v !== false)
    .map(([name, value]) => ({ name, value }))

  const approved = []
  const declined = []

  for (const [carrierId, carrier] of Object.entries(UNDERWRITING_RULES)) {

    // ── 1. Knockout check ────────────────────────────────────────────────
    let declineReason = null
    for (const { name } of selectedConditions) {
      // Specific cancer types also match "Cancer (non-skin)" knockouts
      const koName = SPECIFIC_CANCER_CONDITIONS.has(name) ? 'Cancer (non-skin)' : name
      const isKO = carrier.knockouts?.some(ko =>
        ko.toLowerCase() === name.toLowerCase() || ko.toLowerCase() === koName.toLowerCase()
      )
      if (isKO) { declineReason = `Knockout condition: ${name}`; break }
    }
    if (declineReason) {
      declined.push({ carrierId, name: carrier.name, reason: declineReason })
      continue
    }

    // ── 2. Build chart check ─────────────────────────────────────────────
    if (carrier.buildChart && !carrier.noBuildChart) {
      const fail = checkBuildChart(carrier.buildChart, heightFt, heightIn, weight)
      if (fail) {
        declined.push({ carrierId, name: carrier.name, reason: fail })
        continue
      }
    }

    // ── 3. Condition evaluation ──────────────────────────────────────────
    const flags       = []
    let worstTierRank = 0
    for (const { name: condName, value: condValue } of selectedConditions) {
      // Specific cancer types fall back to "Cancer (non-skin)" carrier rule
      const lookupName = SPECIFIC_CANCER_CONDITIONS.has(condName) ? 'Cancer (non-skin)' : condName
      const rule = carrier.conditions?.find(c => c.condition.toLowerCase() === lookupName.toLowerCase())
      if (!rule) continue

      let decision
      if (rule.timeBased && typeof condValue === 'string' && condValue !== 'true') {
        decision = evalTimeBased(rule.rules, timeframeToYears(condValue))
      } else {
        decision = rule.decision
      }

      const rank = getTierRank(decision)
      if (rank >= 6) { declineReason = `${condName}: Decline`; break }
      if (rank > 0) {
        flags.push({ condition: condName, decision, note: rule.note })
        if (rank > worstTierRank) worstTierRank = rank
      }
    }
    if (declineReason) {
      declined.push({ carrierId, name: carrier.name, reason: declineReason })
      continue
    }

    // ── 4. Medication flags ──────────────────────────────────────────────
    const medFlags = medications.filter(med =>
      med.flaggedCarriers?.some(fc => MED_CARRIER_MAP[fc] === carrierId)
    )

    // ── 5. Product groups for this lead type ─────────────────────────────
    const productGroups = getProductGroups(carrier, leadType)

    if (productGroups.length === 0) {
      declined.push({
        carrierId,
        name: carrier.name,
        reason: `No products for ${leadType.replace(/_/g, ' ')}`,
      })
      continue
    }

    let carrierApproved = false

    for (const { label: productLabel, category: productCategory, products: candidates } of productGroups) {
      // Filter by age
      const ageEligible = candidates.filter(pr => clientAge >= pr.ages[0] && clientAge <= pr.ages[1])
      if (ageEligible.length === 0) continue

      // Sort best tier first; find first product whose tier >= client's worst tier
      const sorted  = [...ageEligible].sort((a, b) => normalizeTier(a.tier) - normalizeTier(b.tier))
      let chosen    = sorted.find(pr => normalizeTier(pr.tier) >= worstTierRank)
      if (!chosen) {
        const lenient = sorted[sorted.length - 1]
        if (normalizeTier(lenient.tier) < worstTierRank) continue
        chosen = lenient
      }

      // ── 6. Commission ────────────────────────────────────────────────
      // Primary lookup: product-specific rate from COMP_GRID via PROD_TO_COMP mapping.
      // This ensures an agent at e.g. 70% base earns the actual product rate (e.g. 65%
      // on Eagle Premier rather than their base 70%). The looked-up rate is saved to
      // localStorage at submission time for permanent historical accuracy.
      let commissionPct = null
      const compMap = PROD_TO_COMP[chosen.id]
      if (compMap) commissionPct = getComp(compMap.c, compMap.p, agentContractLevel)
      if (commissionPct == null) {
        // Fallback: no PROD_TO_COMP mapping or product not in COMP_GRID for this level.
        // Use the first product listed for this carrier as a best approximation.
        console.warn(
          `[FFL Commission] No product-specific rate found for product "${chosen.id}" ` +
          `(carrier ${carrierId}) at contract level ${agentContractLevel}%. ` +
          `Falling back to carrier first-product rate.`
        )
        const compCarrier = COMP_GRID[carrierId]
        if (compCarrier) {
          const firstProd = Object.values(compCarrier)[0]
          commissionPct = firstProd?.[agentContractLevel] ?? null
        }
        if (commissionPct == null) {
          console.warn(
            `[FFL Commission] Carrier fallback also failed for ${carrierId} at level ` +
            `${agentContractLevel}%. Commission will display as null.`
          )
        }
      }
      // Age-based override: Ethos TruStage Advantage WL commission varies by client age.
      if (chosen.id === 'TRUSTAGE_TAWL') {
        commissionPct = (clientAge >= 60 && clientAge <= 80) ? 72.5 : 39.5
      }

      // ── 7. Face amount & premium ────────────────────────────────────
      const rawFace    = getRecommendedFace(leadType, financial, clientInfo)
      const cappedFace = Math.min(rawFace, chosen.maxFace)

      const monthly = estimateMonthly({
        productId:   chosen.id,
        age:         clientAge,
        sex,
        tobacco,
        tobaccoType,
        faceAmount:  cappedFace,
        tier:        chosen.tier,
        termYears:   '20',
      })

      const annualPremium  = Math.round(monthly.mid * 12)
      const commissionDollar = commissionPct != null
        ? Math.round(annualPremium * (commissionPct / 100))
        : null

      // ── 8. Confidence ────────────────────────────────────────────────
      const totalFlags = flags.length + medFlags.length
      const confidence = totalFlags === 0 ? 'High' : totalFlags <= 2 ? 'Medium' : 'Low'

      carrierApproved = true
      approved.push({
        carrierId,
        resultKey:       `${carrierId}_${chosen.id}`,
        name:            carrier.name,
        amBest:          AM_BEST[carrierId] || 'A',
        product:         chosen,
        productLabel,
        productCategory,
        tier:            chosen.tier,
        recommendedFace: cappedFace,
        annualPremium,
        monthlyPremium:  monthly,
        commissionPct,
        commissionDollar,
        confidence,
        flags,
        medFlags,
        explanation:     buildExplanation(carrier, chosen, flags),
        keyAdvantages:   carrier.keyAdvantages || [],
        tobaccoRule:     carrier.tobaccoRule   || null,
        waitingPeriod:   chosen.waitingPeriod  ?? 0,
        tierOverride:    DISPOSITION_TIER_OVERRIDE[finalDisposition] || null,
      })
    }

    if (!carrierApproved && productGroups.length > 0) {
      const allCandidates = productGroups.flatMap(g => g.products)
      const ageOk = allCandidates.some(pr => clientAge >= pr.ages[0] && clientAge <= pr.ages[1])
      declined.push({
        carrierId,
        name: carrier.name,
        reason: ageOk
          ? 'Health profile exceeds available product tiers'
          : `Client age ${clientAge} outside eligible range`,
      })
    }
  }

  // Sort approved: primary = commission rate % descending, secondary = commission dollar descending.
  // This ensures a lower-rate product (e.g. 39.5%) never outranks a higher-rate product (e.g. 70%+)
  // regardless of face amount or premium size. Nulls sort last on both keys.
  approved.sort((a, b) => {
    const aPct = a.commissionPct ?? -1
    const bPct = b.commissionPct ?? -1
    if (bPct !== aPct) return bPct - aPct
    // Same rate — break tie by commission dollar
    const aDol = a.commissionDollar ?? -1
    const bDol = b.commissionDollar ?? -1
    return bDol - aDol
  })

  // ── 2-year graded benefit override ────────────────────────────────────────
  // Any carrier resulting in a 2-year graded benefit must never appear as the
  // top recommendation. Move all graded-2 carriers to the bottom of the list,
  // preserving relative order within each group.
  const nonGraded2 = approved.filter(r => r.waitingPeriod !== 2)
  const graded2    = approved.filter(r => r.waitingPeriod === 2)
  const sortedApproved = [...nonGraded2, ...graded2]

  return { approved: sortedApproved, declined }
}
