import { ALL_CARRIERS } from '../data/carriers/index.js'

// ── Tier ordering (worst = higher number) ────────────────────────────────────
const TIER_RANK = { preferred: 0, standard: 1, graded: 2, modified: 3, decline: 4 }

// ── Time-ago string → approximate months ─────────────────────────────────────
function timeAgoToMonths(timeAgo) {
  const map = {
    within_6_months: 3,
    '6_12_months': 9,
    '1_2_years': 18,
    '2_5_years': 42,
    '5plus_years': 72,
  }
  return map[timeAgo] ?? 999
}

// ── Evaluate a single condition against a carrier's rules ─────────────────────
function evaluateCondition(conditionKey, conditionValue, carrierConditions) {
  const rule = carrierConditions[conditionKey]
  if (!rule) return { impact: 'preferred', note: 'No specific restriction.' }

  if (rule.timeDependent) {
    const months = timeAgoToMonths(conditionValue.timeAgo)
    for (const tr of rule.timeRules) {
      if (tr.defaultImpact) return { impact: tr.defaultImpact, note: rule.note || '' }
      if (months <= tr.maxMonths) return { impact: tr.impact, note: rule.note || '' }
    }
    return { impact: 'preferred', note: rule.note || '' }
  }

  return { impact: rule.impact, note: rule.note || '' }
}

// ── Calculate BMI ─────────────────────────────────────────────────────────────
function calcBMI(heightFt, heightIn, weightLbs) {
  const totalInches = Number(heightFt) * 12 + Number(heightIn)
  if (!totalInches || !weightLbs) return 0
  return (Number(weightLbs) * 703) / (totalInches * totalInches)
}

// ── Evaluate build against carrier limits ────────────────────────────────────
function evaluateBuild(bmi, buildLimits) {
  if (!buildLimits) return 'preferred'
  if (bmi <= 0) return 'preferred'
  if (bmi > buildLimits.declineBMI) return 'decline'
  if (bmi > buildLimits.standardBMI) return 'graded'
  if (bmi > buildLimits.preferredBMI) return 'standard'
  return 'preferred'
}

// ── Pick the best product for a given tier ────────────────────────────────────
function pickProduct(products, overallTier, leadType) {
  // Filter by lead type
  const relevant = products.filter(
    (p) => !leadType || p.leadTypes.includes(leadType)
  )
  if (!relevant.length) return null

  // Map overall tier to required product tier
  // preferred/standard → level; graded → graded; modified → modified
  const tierToProductTier = {
    preferred: ['level'],
    standard:  ['level'],
    graded:    ['graded', 'level'],  // graded product first; some carriers might only have level
    modified:  ['modified', 'graded', 'level'],
    decline:   [],
  }
  const desired = tierToProductTier[overallTier] || []

  for (const desiredTier of desired) {
    const match = relevant.find((p) => p.tier === desiredTier)
    if (match) return match
  }
  return null
}

// ── Generate "why this carrier" explanation ───────────────────────────────────
function buildExplanation(carrier, overallTier, flags, leadType, bmi) {
  const reasons = []

  if (overallTier === 'preferred') {
    reasons.push(`${carrier.name} offers their best rate class — Preferred — based on this client's profile.`)
  } else if (overallTier === 'standard') {
    reasons.push(`${carrier.name} rates this client at Standard — immediate full benefit with a slight rate adjustment.`)
  } else if (overallTier === 'graded') {
    reasons.push(`${carrier.name} qualifies this client for a Graded Benefit product (full benefit from year 3 onward).`)
  } else if (overallTier === 'modified') {
    reasons.push(`${carrier.name} offers a Modified/Guaranteed Issue product for this client's health profile.`)
  }

  if (flags.length) {
    const topFlag = flags[0]
    reasons.push(`Key condition: ${topFlag.conditionLabel} — ${topFlag.note}`)
  }

  if (carrier.id === 'americo' && flags.some(f => f.key.startsWith('diabetes'))) {
    reasons.push('Americo is best-in-class for insulin-dependent diabetics — level benefit available.')
  }
  if (carrier.id === 'foresters' && flags.some(f => f.key === 'hiv_aids')) {
    reasons.push('Foresters Financial is the ONLY final expense carrier that accepts HIV+ clients on antiretroviral therapy.')
  }
  if (carrier.id === 'american_amicable' && leadType === 'veteran') {
    reasons.push('American Amicable has veteran-specific products (Patriot Plus) with favorable PTSD/anxiety underwriting.')
  }
  if (carrier.id === 'prosperity_life' && bmi > 38) {
    reasons.push('Prosperity Life has the most lenient build chart — excellent choice for clients with higher BMI.')
  }
  if (carrier.id === 'corebridge' && overallTier === 'modified') {
    reasons.push('Corebridge\'s Guaranteed Issue product requires NO health questions — guaranteed acceptance ages 50–80.')
  }

  return reasons.join(' ')
}

// ── Determine confidence rating ────────────────────────────────────────────────
function calcConfidence(flags, overallTier) {
  const declineFlags = flags.filter(f => f.impact === 'decline').length
  const gradedFlags = flags.filter(f => f.impact === 'graded' || f.impact === 'modified').length

  if (overallTier === 'decline') return 'N/A'
  if (declineFlags > 0) return 'Low'
  if (gradedFlags >= 2 || flags.length >= 4) return 'Low'
  if (gradedFlags === 1 || flags.length >= 2) return 'Medium'
  return 'High'
}

// ── Main underwriting function ────────────────────────────────────────────────
export function runUnderwriting(clientData, agentContractLevel) {
  const {
    leadType,
    clientInfo,
    conditions,    // { conditionKey: { checked: bool, timeAgo: string } }
    medications,   // array of { name, conditionHint, flaggedCarriers, ... }
    financial,
  } = clientData

  const bmi = calcBMI(clientInfo.heightFt, clientInfo.heightIn, clientInfo.weight)

  // Build list of active conditions from form
  const activeConditions = Object.entries(conditions || {})
    .filter(([, v]) => v && v.checked)

  // Build medication-derived condition hints (additional flags from meds)
  const medFlags = new Set((medications || []).map(m => m.conditionHint).filter(Boolean))

  const results = []
  const declined = []

  for (const carrier of ALL_CARRIERS) {
    // Skip carriers not relevant to this lead type
    if (leadType && !carrier.leadTypes.includes(leadType)) {
      declined.push({
        carrier: carrier.name,
        reason: `Does not offer products for ${formatLeadType(leadType)} lead type.`,
      })
      continue
    }

    const flags = []
    let worstTier = 'preferred'

    // Evaluate each active condition
    for (const [condKey, condVal] of activeConditions) {
      const result = evaluateCondition(condKey, condVal, carrier.underwriting.conditions)
      const condLabel = CONDITION_LABELS[condKey] || condKey

      if (TIER_RANK[result.impact] > TIER_RANK['preferred']) {
        flags.push({
          key: condKey,
          conditionLabel: condLabel,
          impact: result.impact,
          note: result.note,
        })
      }

      if (TIER_RANK[result.impact] > TIER_RANK[worstTier]) {
        worstTier = result.impact
      }
    }

    // Evaluate medication hints that weren't already captured
    for (const hint of medFlags) {
      if (!activeConditions.find(([k]) => k === hint)) {
        const result = evaluateCondition(hint, { checked: true }, carrier.underwriting.conditions)
        if (TIER_RANK[result.impact] > TIER_RANK['preferred']) {
          const condLabel = CONDITION_LABELS[hint] || hint
          flags.push({
            key: hint,
            conditionLabel: condLabel + ' (from medication)',
            impact: result.impact,
            note: result.note + ' (inferred from medication list)',
          })
          if (TIER_RANK[result.impact] > TIER_RANK[worstTier]) {
            worstTier = result.impact
          }
        }
      }
    }

    // Evaluate build/BMI
    const buildImpact = evaluateBuild(bmi, carrier.underwriting.buildLimits)
    if (TIER_RANK[buildImpact] > TIER_RANK[worstTier]) {
      worstTier = buildImpact
      if (buildImpact !== 'preferred') {
        flags.push({
          key: 'build',
          conditionLabel: `Build/BMI (${bmi.toFixed(1)})`,
          impact: buildImpact,
          note: buildImpact === 'decline'
            ? `BMI of ${bmi.toFixed(1)} exceeds this carrier's maximum.`
            : `BMI of ${bmi.toFixed(1)} places client in a higher rate class.`,
        })
      }
    }

    // Corebridge: if overallTier would be decline, bump to modified (GI)
    if (carrier.underwriting.hasGuaranteedIssue && worstTier === 'decline') {
      // Still show as modified (GI), not decline — except for hospice
      const hospiceFlag = flags.find(f => f.key === 'hospice')
      if (!hospiceFlag) {
        worstTier = 'modified'
      }
    }

    if (worstTier === 'decline') {
      const declineReasons = flags
        .filter(f => f.impact === 'decline')
        .map(f => f.conditionLabel)
        .join(', ')
      declined.push({
        carrier: carrier.name,
        reason: `Declined due to: ${declineReasons || 'underwriting criteria not met'}.`,
      })
      continue
    }

    // Pick the best matching product
    const product = pickProduct(carrier.products, worstTier, leadType)
    if (!product) {
      declined.push({
        carrier: carrier.name,
        reason: 'No matching product available for this lead type and health profile.',
      })
      continue
    }

    // Calculate recommended face amount
    const recommendedFace = calcRecommendedFace(leadType, financial, product, clientInfo)

    // Calculate commission
    const effectiveCommission = Math.min(agentContractLevel || 100, product.commissionMax)

    // Confidence
    const confidence = calcConfidence(flags, worstTier)

    // Explanation
    const explanation = buildExplanation(carrier, worstTier, flags, leadType, bmi)

    results.push({
      carrierId: carrier.id,
      carrierName: carrier.name,
      amBestRating: carrier.amBestRating,
      productId: product.id,
      productName: product.name,
      productType: product.type,
      tier: worstTier,
      tierLabel: TIER_LABELS[worstTier],
      flags,
      recommendedFace,
      effectiveCommission,
      carrierMaxCommission: product.commissionMax,
      confidence,
      explanation,
      minFace: product.minFace,
      maxFace: product.maxFace,
    })
  }

  // Sort: highest commission first; flag if lower-commission is medically better
  results.sort((a, b) => {
    // Prioritize better tier (preferred > standard > graded > modified)
    const tierDiff = TIER_RANK[a.tier] - TIER_RANK[b.tier]
    if (tierDiff !== 0) return tierDiff
    // Then by commission descending
    return b.effectiveCommission - a.effectiveCommission
  })

  // Tag "medically better fit" flag for lower-commission options
  const bestTier = results.length ? results[0].tier : null
  for (const r of results) {
    r.isMedicallyBetter = bestTier && TIER_RANK[r.tier] < TIER_RANK[bestTier]
    r.hasBetterMedicalOption = results.some(
      other => other.carrierId !== r.carrierId && TIER_RANK[other.tier] < TIER_RANK[r.tier]
    )
  }

  return { recommendations: results, declined }
}

// ── Recommended face amount calculation ───────────────────────────────────────
function calcRecommendedFace(leadType, financial, product, clientInfo) {
  const income = Number(financial?.annualIncome) || 0
  const mortgage = Number(financial?.mortgageBalance) || 0
  const monthlyExpenses = Number(financial?.monthlyBills) || 0

  let recommended = 10000 // default

  if (leadType === 'mortgage_protection') {
    recommended = mortgage || income * 5 || 150000
  } else if (leadType === 'final_expense') {
    // Typical FE: cover burial + outstanding debts + leave a little behind
    const burialEstimate = 12000
    const monthsExpensesCover = monthlyExpenses * 6
    recommended = Math.max(burialEstimate, Math.min(25000, burialEstimate + monthsExpensesCover * 0.5))
  } else if (leadType === 'veteran') {
    // Veterans often need supplemental coverage
    recommended = Math.max(25000, Math.min(75000, income * 2 || 25000))
  }

  // Clamp to product limits
  return Math.min(product.maxFace, Math.max(product.minFace, Math.round(recommended / 1000) * 1000))
}

// ── Human-readable labels ─────────────────────────────────────────────────────
export const TIER_LABELS = {
  preferred: 'Preferred',
  standard:  'Standard',
  graded:    'Graded Benefit',
  modified:  'Modified/GI',
  decline:   'Declined',
}

export const CONDITION_LABELS = {
  high_blood_pressure:      'High Blood Pressure',
  high_cholesterol:         'High Cholesterol',
  diabetes_t2_oral:         'Diabetes Type 2 (Oral Meds)',
  diabetes_t2_insulin:      'Diabetes Type 2 (Insulin)',
  diabetes_t1:              'Diabetes Type 1',
  copd_emphysema:           'COPD / Emphysema',
  asthma:                   'Asthma',
  heart_attack:             'Heart Attack',
  stroke_tia:               'Stroke / TIA',
  cancer:                   'Cancer (Non-Skin)',
  congestive_heart_failure: 'Congestive Heart Failure',
  kidney_disease:           'Kidney Disease',
  kidney_dialysis:          'Kidney Dialysis',
  liver_disease:            'Liver Disease / Cirrhosis',
  multiple_sclerosis:       'Multiple Sclerosis',
  parkinsons:               "Parkinson's Disease",
  als:                      'ALS',
  alzheimers_dementia:      "Alzheimer's / Dementia",
  hiv_aids:                 'HIV / AIDS',
  organ_transplant:         'Organ Transplant',
  oxygen_use:               'Oxygen Use',
  wheelchair_adl:           'Wheelchair / ADL Assistance',
  hospice:                  'Hospice Care',
  amputation_disease:       'Amputation (Disease-Caused)',
  blood_thinners:           'Blood Thinners',
  sleep_apnea:              'Sleep Apnea',
  depression_anxiety:       'Depression / Anxiety',
  bipolar_disorder:         'Bipolar Disorder',
  rheumatoid_arthritis:     'Rheumatoid Arthritis',
  lupus:                    'Lupus (Systemic SLE)',
  seizures_epilepsy:        'Seizures / Epilepsy',
  neuropathy:               'Neuropathy',
  pvd:                      'Peripheral Vascular Disease',
  sickle_cell:              'Sickle Cell Anemia',
  muscular_dystrophy:       'Muscular Dystrophy',
  pacemaker_icd:            'Pacemaker / Defibrillator',
}

function formatLeadType(lt) {
  return { mortgage_protection: 'Mortgage Protection', final_expense: 'Final Expense', veteran: 'Veteran' }[lt] || lt
}
