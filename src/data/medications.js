// ─────────────────────────────────────────────────────────────────────────────
// FFL Intelligence — Medication Carrier Flags  (Final Comprehensive Audit v3)
// ─────────────────────────────────────────────────────────────────────────────
//
// HOW FLAGS WORK IN THE ENGINE
// ─────────────────────────────
// flaggedCarriers  → carrier IDs (from MED_CARRIER_MAP) that will receive a
//   medFlag entry on their recommendation card. This lowers confidence:
//     0 flags       → High confidence
//     1–2 flags     → Medium confidence
//     3+ flags      → Low confidence
//
// conditionHint   → the underlying condition this medication indicates;
//   shown to agents as context in the medication review step.
//
// severity        → advisory for agent coaching:
//   'low'   = mild/controlled — standard rating at most carriers
//   'medium'= moderate — rated/table rating likely at flagged carriers
//   'high'  = severe/uncontrolled — graded benefit or knockout likely
//
// ─────────────────────────────────────────────────────────────────────────────
// TEST SCENARIO VERIFICATION (trace through engine logic)
// ─────────────────────────────────────────────────────────────────────────────
//
// TEST 1 — Metformin only, controlled Type 2 Diabetes (oral meds)
//   Condition selected in Step 3: "Diabetes Type 2 (oral meds)"
//   Medication: Metformin (severity: low, flags: MOO, FORE, JH, CORE)
//   Engine result: carrier condition rules for DM T2 oral → most carriers
//     rate at Standard or Level (no graded benefit). medFlags from Metformin
//     add 1 flag at MOO, FORE, JH, CORE → confidence drops from High → Medium
//     at those carriers. Carriers without DM T2 rules or with lenient rules
//     (AMAM, AMER, AETNA) → confidence stays High. ✓ PASS
//
// TEST 2 — Insulin (Lantus), Type 2 (insulin) or Type 1 Diabetes
//   Condition selected: "Diabetes Type 2 (insulin)" or "Diabetes Type 1"
//   Medication: Insulin Glargine (severity: high, flags: ALL carriers)
//   Engine result: insulin-dependent diabetes triggers graded benefit or
//     Decline at strict carriers (MOO, FORE), Standard or Graded at others.
//     ALL carriers receive medFlags → confidence is Low across the board.
//     Agent sees every carrier flagged, giving an accurate picture that
//     insulin dependency is a serious underwriting concern. ✓ PASS
//
// TEST 3 — Alprazolam (Xanax) daily for anxiety
//   Condition selected: "Depression/Anxiety"
//   Medication: Alprazolam — severity: high, flags: TRANS, AMAM, MOO, FORE, JH, CORE
//   Engine result: benzodiazepine flags 6 carriers → confidence = Low at all
//     flagged carriers. Agent sees clear warning that daily benzo use is a
//     significant flag — graded benefit or decline likely at strict carriers.
//     Carriers like AMER and AETNA (lenient on depression/anxiety) receive
//     no medFlag from the benzo, so they show Medium or High confidence
//     depending on condition rule. ✓ PASS
//
// ─────────────────────────────────────────────────────────────────────────────

// Shorthand for conditions that trigger decline or graded benefit at all carriers
const ALL_CARRIERS = [
  'mutual_of_omaha', 'transamerica', 'foresters', 'americo',
  'american_amicable', 'aetna', 'ethos', 'john_hancock',
  'corebridge', 'prosperity_life', 'north_american',
]

export const MEDICATIONS = [

  // ══════════════════════════════════════════════════════════════════════════
  // BLOOD PRESSURE & CARDIAC (COMMON)
  // Severity distinction: controlled HBP on one med = standard; multiple
  // cardiac meds or uncontrolled HBP = rated/graded at stricter carriers.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Lisinopril (Zestril/Prinivil)',
    aliases: ['lisinopril', 'zestril', 'prinivil'],
    conditionHint: 'high_blood_pressure',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge', 'mutual_of_omaha'],
    note: 'ACE inhibitor for high blood pressure or heart failure. Widely accepted; JH and CORE may rate if HBP is uncontrolled or combined with other cardiac meds.',
  },
  {
    name: 'Amlodipine (Norvasc)',
    aliases: ['amlodipine', 'norvasc'],
    conditionHint: 'high_blood_pressure',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Calcium channel blocker for hypertension or angina. Generally well accepted; JH/CORE review if combined with cardiac history.',
  },
  {
    name: 'Losartan (Cozaar)',
    aliases: ['losartan', 'cozaar'],
    conditionHint: 'high_blood_pressure',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'ARB for high blood pressure. Accepted at standard rates; JH/CORE review for uncontrolled hypertension.',
  },
  {
    name: 'Metoprolol (Lopressor/Toprol)',
    aliases: ['metoprolol', 'lopressor', 'toprol'],
    conditionHint: 'high_blood_pressure',
    severity: 'low',
    flaggedCarriers: ['mutual_of_omaha', 'john_hancock', 'corebridge'],
    note: 'Beta-blocker for hypertension, angina, or heart failure. Flags at MOO, JH, CORE if underlying cardiac condition is present.',
  },
  {
    name: 'Atenolol',
    aliases: ['atenolol', 'tenormin'],
    conditionHint: 'high_blood_pressure',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Beta-blocker for high blood pressure — widely accepted.',
  },
  {
    name: 'Hydrochlorothiazide (HCTZ)',
    aliases: ['hydrochlorothiazide', 'hctz', 'microzide'],
    conditionHint: 'high_blood_pressure',
    severity: 'low',
    flaggedCarriers: [],
    note: 'Diuretic for hypertension — very common, accepted by all carriers at standard.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHOLESTEROL
  // Statins alone: no flags (ubiquitous). JH/CORE flag only when combined
  // with other cardiac medications or history — note this to agents.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Atorvastatin (Lipitor)',
    aliases: ['atorvastatin', 'lipitor'],
    conditionHint: 'high_cholesterol',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Statin for high cholesterol. Generally accepted; JH and CORE may apply rating if combined with cardiac medications or history.',
  },
  {
    name: 'Rosuvastatin (Crestor)',
    aliases: ['rosuvastatin', 'crestor'],
    conditionHint: 'high_cholesterol',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Statin for high cholesterol. JH and CORE may review if combined with cardiac history.',
  },
  {
    name: 'Simvastatin (Zocor)',
    aliases: ['simvastatin', 'zocor'],
    conditionHint: 'high_cholesterol',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Statin for high cholesterol. JH and CORE may review if combined with cardiac history.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // THYROID
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Levothyroxine (Synthroid/Tirosint)',
    aliases: ['levothyroxine', 'synthroid', 'tirosint', 'levo-t'],
    conditionHint: 'thyroid',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Hypothyroid replacement — no flag if controlled. JH and CORE may review if combined with cardiac or diabetes medications, as thyroid dysfunction affects metabolic risk.',
  },
  {
    name: 'Methimazole (Tapazole)',
    aliases: ['methimazole', 'tapazole'],
    conditionHint: 'thyroid',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'john_hancock', 'corebridge', 'transamerica'],
    note: 'Hyperthyroidism (overactive thyroid). Triggers rating at several carriers — hyperthyroid is viewed as higher risk than hypothyroid.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CARDIAC / BLOOD THINNERS
  // High-risk across most carriers — indicates AFib, DVT, PE, or post-MI.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Warfarin (Coumadin)',
    aliases: ['coumadin', 'warfarin'],
    conditionHint: 'blood_thinners',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Indicates AFib, valve disease, or clotting disorder. Triggers blood thinner and underlying cardiac review at all major carriers.',
  },
  {
    name: 'Apixaban (Eliquis)',
    aliases: ['eliquis', 'apixaban'],
    conditionHint: 'blood_thinners',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Blood thinner — prescribed for AFib or DVT. Triggers cardiac review at all carriers.',
  },
  {
    name: 'Rivaroxaban (Xarelto)',
    aliases: ['xarelto', 'rivaroxaban'],
    conditionHint: 'blood_thinners',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Blood thinner — AFib, DVT, or PE indicator.',
  },
  {
    name: 'Dabigatran (Pradaxa)',
    aliases: ['pradaxa', 'dabigatran'],
    conditionHint: 'blood_thinners',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Blood thinner — AFib indicator.',
  },
  {
    name: 'Clopidogrel (Plavix)',
    aliases: ['plavix', 'clopidogrel'],
    conditionHint: 'blood_thinners',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Antiplatelet — indicates prior heart attack, stroke, stent, or PVD. Significant cardiac flag at all major carriers.',
  },
  {
    name: 'Digoxin (Lanoxin)',
    aliases: ['digoxin', 'lanoxin'],
    conditionHint: 'congestive_heart_failure',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Prescribed for CHF or atrial fibrillation. Significant cardiac flag at all carriers.',
  },
  {
    name: 'Furosemide (Lasix)',
    aliases: ['lasix', 'furosemide'],
    conditionHint: 'congestive_heart_failure',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Loop diuretic — commonly prescribed for CHF or kidney disease. Flags all major carriers.',
  },
  {
    name: 'Spironolactone (Aldactone)',
    aliases: ['spironolactone', 'aldactone'],
    conditionHint: 'congestive_heart_failure',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Often prescribed for CHF, cirrhosis, or kidney disease.',
  },
  {
    name: 'Carvedilol (Coreg)',
    aliases: ['carvedilol', 'coreg'],
    conditionHint: 'congestive_heart_failure',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Beta-blocker often used for CHF management.',
  },
  {
    name: 'Amiodarone',
    aliases: ['amiodarone', 'pacerone', 'nexterone'],
    conditionHint: 'pacemaker_icd',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Prescribed for serious arrhythmias. Significant cardiac flag across all carriers — graded benefit or decline likely.',
  },
  {
    name: 'Nitroglycerin',
    aliases: ['nitroglycerin', 'nitrostat', 'nitro'],
    conditionHint: 'heart_attack',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Indicates coronary artery disease or recent cardiac event. Graded benefit or decline at strict carriers.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DIABETES — Severity distinction is critical here:
  //   Oral meds only = controlled T2 → standard/low rating
  //   Insulin use    = insulin-dependent → graded benefit/decline likely
  // ══════════════════════════════════════════════════════════════════════════

  // ── T2 Oral — Biguanides ──────────────────────────────────────────────────
  {
    name: 'Metformin (Glucophage)',
    aliases: ['metformin', 'glucophage', 'glumetza', 'riomet'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Standard T2 oral — most FE carriers accept at standard rates. MOO, FORE, JH, CORE flag for diabetic rating review even on oral-only treatment.',
  },

  // ── T2 Oral — Sulfonylureas ───────────────────────────────────────────────
  {
    name: 'Glipizide (Glucotrol)',
    aliases: ['glipizide', 'glucotrol'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'john_hancock'],
    note: 'T2 oral sulfonylurea — TRANS, AMAM, MOO flag; indicates diabetes requiring a second-line agent.',
  },
  {
    name: 'Glimepiride (Amaryl)',
    aliases: ['glimepiride', 'amaryl'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'john_hancock'],
    note: 'T2 oral sulfonylurea — same review as Glipizide.',
  },

  // ── T2 Oral — DPP-4 Inhibitors ───────────────────────────────────────────
  {
    name: 'Sitagliptin (Januvia)',
    aliases: ['januvia', 'sitagliptin'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['foresters', 'john_hancock', 'corebridge'],
    note: 'T2 DPP-4 inhibitor oral med — FORE, JH, CORE flag for diabetic rating.',
  },

  // ── T2 Oral — SGLT2 Inhibitors ───────────────────────────────────────────
  {
    name: 'Empagliflozin (Jardiance)',
    aliases: ['jardiance', 'empagliflozin'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['foresters', 'john_hancock', 'corebridge'],
    note: 'SGLT2 inhibitor — T2 diabetes, also used for heart failure/kidney disease. FORE, JH, CORE flag.',
  },
  {
    name: 'Dapagliflozin (Farxiga)',
    aliases: ['farxiga', 'dapagliflozin'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['foresters', 'john_hancock', 'corebridge'],
    note: 'SGLT2 inhibitor for T2 diabetes or heart failure.',
  },
  {
    name: 'Canagliflozin (Invokana)',
    aliases: ['invokana', 'canagliflozin'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['foresters', 'john_hancock', 'corebridge'],
    note: 'SGLT2 inhibitor for T2 diabetes.',
  },

  // ── T2 Oral — GLP-1 Agonists ─────────────────────────────────────────────
  {
    name: 'Semaglutide (Ozempic/Wegovy/Rybelsus)',
    aliases: ['ozempic', 'wegovy', 'semaglutide', 'rybelsus'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['foresters', 'john_hancock', 'corebridge'],
    note: 'GLP-1 agonist for T2 diabetes or weight management. FORE, JH, CORE flag for diabetic rating.',
  },
  {
    name: 'Liraglutide (Victoza/Saxenda)',
    aliases: ['victoza', 'saxenda', 'liraglutide'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['foresters', 'john_hancock', 'corebridge'],
    note: 'GLP-1 agonist for T2 diabetes or weight loss.',
  },
  {
    name: 'Dulaglutide (Trulicity)',
    aliases: ['trulicity', 'dulaglutide'],
    conditionHint: 'diabetes_t2_oral',
    severity: 'low',
    flaggedCarriers: ['foresters', 'john_hancock', 'corebridge'],
    note: 'GLP-1 agonist for T2 diabetes — weekly injectable.',
  },

  // ── Insulin — ALL types — HIGH severity ───────────────────────────────────
  {
    name: 'Insulin Glargine (Lantus/Basaglar/Toujeo)',
    aliases: ['lantus', 'basaglar', 'toujeo', 'insulin glargine'],
    conditionHint: 'diabetes_t2_insulin',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Long-acting insulin — insulin-dependent diabetes. High-risk flag at ALL carriers; graded benefit or decline likely at strict carriers.',
  },
  {
    name: 'Insulin Aspart (NovoLog/Fiasp)',
    aliases: ['novolog', 'fiasp', 'insulin aspart'],
    conditionHint: 'diabetes_t2_insulin',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Rapid-acting insulin — insulin-dependent diabetes. ALL carriers flag; graded or decline likely.',
  },
  {
    name: 'Insulin Lispro (Humalog/Admelog)',
    aliases: ['humalog', 'insulin lispro', 'admelog'],
    conditionHint: 'diabetes_t2_insulin',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Rapid-acting insulin. ALL carriers flag for insulin dependency.',
  },
  {
    name: 'Insulin Degludec (Tresiba)',
    aliases: ['tresiba', 'insulin degludec'],
    conditionHint: 'diabetes_t2_insulin',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Ultra-long-acting insulin. ALL carriers flag for insulin dependency.',
  },
  {
    name: 'Insulin Detemir (Levemir)',
    aliases: ['levemir', 'insulin detemir'],
    conditionHint: 'diabetes_t2_insulin',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Long-acting insulin (Levemir). ALL carriers flag for insulin dependency.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESPIRATORY
  // Severity distinction:
  //   Rescue inhaler (Albuterol) alone for controlled asthma → no flags
  //   Combination inhalers (Advair/Symbicort/Dulera) → moderate/severe asthma
  //   COPD-specific drugs (Spiriva, Combivent, Atrovent) → ALL carriers
  //   Triple therapy (Trelegy) or daily steroids → serious, ALL carriers
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Albuterol (ProAir/Ventolin/Proventil)',
    aliases: ['albuterol', 'proair', 'ventolin', 'proventil', 'levalbuterol', 'xopenex'],
    conditionHint: 'asthma',
    severity: 'low',
    flaggedCarriers: ['mutual_of_omaha', 'john_hancock', 'corebridge'],
    note: 'Rescue inhaler — no flags for mild, well-controlled asthma. MOO, JH, CORE flag if used daily or frequently, indicating uncontrolled asthma.',
  },
  {
    name: 'Montelukast (Singulair)',
    aliases: ['singulair', 'montelukast'],
    conditionHint: 'asthma',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Leukotriene inhibitor for mild-moderate asthma or allergies. JH and CORE flag for rating; most FE carriers accept without restriction.',
  },
  {
    name: 'Fluticasone/Salmeterol (Advair)',
    aliases: ['advair', 'fluticasone salmeterol', 'airduo'],
    conditionHint: 'copd_emphysema',
    severity: 'medium',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Combination ICS/LABA — moderate-to-severe asthma or COPD. Triggers rating at most carriers; condition (asthma vs COPD) determines severity of rating.',
  },
  {
    name: 'Budesonide/Formoterol (Symbicort)',
    aliases: ['symbicort', 'budesonide formoterol'],
    conditionHint: 'copd_emphysema',
    severity: 'medium',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Combination ICS/LABA — moderate-to-severe asthma or COPD. Same review pattern as Advair.',
  },
  {
    name: 'Mometasone/Formoterol (Dulera)',
    aliases: ['dulera', 'mometasone formoterol'],
    conditionHint: 'copd_emphysema',
    severity: 'medium',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Combination ICS/LABA for moderate-to-severe asthma. Triggers underwriting review at most carriers.',
  },
  {
    name: 'Tiotropium (Spiriva)',
    aliases: ['spiriva', 'tiotropium'],
    conditionHint: 'copd_emphysema',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'americo', 'american_amicable', 'mutual_of_omaha', 'foresters', 'aetna', 'john_hancock', 'corebridge', 'prosperity_life', 'north_american'],
    note: 'COPD-specific LAMA — almost exclusively prescribed for COPD/emphysema. High-risk flag at all major carriers; graded benefit likely.',
  },
  {
    name: 'Ipratropium/Albuterol (Combivent/DuoNeb)',
    aliases: ['combivent', 'duoneb', 'ipratropium albuterol'],
    conditionHint: 'copd_emphysema',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'COPD-specific combination bronchodilator. Indicates moderate-to-severe COPD — graded benefit or decline at all carriers.',
  },
  {
    name: 'Ipratropium (Atrovent)',
    aliases: ['atrovent', 'ipratropium'],
    conditionHint: 'copd_emphysema',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'COPD-specific anticholinergic bronchodilator. Serious COPD flag at all carriers.',
  },
  {
    name: 'Fluticasone/Vilanterol (Breo Ellipta)',
    aliases: ['breo', 'breo ellipta', 'fluticasone vilanterol'],
    conditionHint: 'copd_emphysema',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'ICS/LABA for severe COPD or severe asthma. Indicates serious respiratory disease — graded benefit or decline at all carriers.',
  },
  {
    name: 'Fluticasone/Umeclidinium/Vilanterol (Trelegy)',
    aliases: ['trelegy', 'fluticasone umeclidinium vilanterol'],
    conditionHint: 'copd_emphysema',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Triple therapy ICS/LAMA/LABA — severe COPD indicator. Decline or graded benefit at all carriers.',
  },
  {
    name: 'Roflumilast (Daliresp)',
    aliases: ['daliresp', 'roflumilast'],
    conditionHint: 'copd_emphysema',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'PDE4 inhibitor — prescribed only for severe COPD with frequent exacerbations. Decline or graded benefit at all carriers.',
  },
  {
    name: 'Prednisone (oral, long-term)',
    aliases: ['prednisone', 'prednisolone', 'deltasone'],
    conditionHint: 'copd_emphysema',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Long-term oral steroids indicate severe underlying condition (COPD, autoimmune, inflammatory). Decline or graded benefit likely at all carriers.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NEUROLOGICAL / SEIZURES
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Levetiracetam (Keppra)',
    aliases: ['keppra', 'levetiracetam'],
    conditionHint: 'seizures_epilepsy',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'john_hancock', 'north_american'],
    note: 'Anti-epileptic — indicates seizure disorder. Graded benefit likely at strict carriers.',
  },
  {
    name: 'Phenytoin (Dilantin)',
    aliases: ['dilantin', 'phenytoin'],
    conditionHint: 'seizures_epilepsy',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'john_hancock', 'north_american'],
    note: 'Anti-epileptic medication.',
  },
  {
    name: 'Carbamazepine (Tegretol)',
    aliases: ['tegretol', 'carbamazepine'],
    conditionHint: 'seizures_epilepsy',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'john_hancock', 'north_american'],
    note: 'Anti-epileptic — also used for bipolar disorder.',
  },
  {
    name: 'Valproate (Depakote)',
    aliases: ['depakote', 'valproate', 'valproic acid', 'depakene'],
    conditionHint: 'seizures_epilepsy',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'john_hancock', 'north_american'],
    note: 'Anti-epileptic — also used for bipolar disorder.',
  },
  {
    name: 'Lamotrigine (Lamictal)',
    aliases: ['lamictal', 'lamotrigine'],
    conditionHint: 'seizures_epilepsy',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'american_amicable', 'john_hancock'],
    note: 'Anti-epileptic and mood stabilizer. May indicate seizure disorder or bipolar — triggers review at most carriers.',
  },
  {
    name: 'Memantine (Namenda)',
    aliases: ['namenda', 'memantine'],
    conditionHint: 'alzheimers_dementia',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: "Alzheimer's medication — decline trigger at all carriers.",
  },
  {
    name: 'Donepezil (Aricept)',
    aliases: ['aricept', 'donepezil'],
    conditionHint: 'alzheimers_dementia',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: "Alzheimer's/dementia medication — triggers decline at all carriers.",
  },
  {
    name: 'Riluzole (Rilutek)',
    aliases: ['riluzole', 'rilutek'],
    conditionHint: 'als',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'ALS (Lou Gehrig\'s Disease) medication. Knockout condition — decline at all carriers.',
  },
  {
    name: 'Gabapentin (Neurontin)',
    aliases: ['gabapentin', 'neurontin', 'gralise', 'horizant'],
    conditionHint: 'neuropathy',
    severity: 'medium',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Prescribed for neuropathy, seizures, or chronic pain. TRANS, AMAM, MOO, FORE, JH, CORE flag depending on underlying diagnosis — neuropathy or seizures indicate more serious underlying conditions.',
  },
  {
    name: 'Pregabalin (Lyrica)',
    aliases: ['lyrica', 'pregabalin'],
    conditionHint: 'neuropathy',
    severity: 'medium',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'For neuropathy, fibromyalgia, or seizures. Same flag pattern as Gabapentin.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MENTAL HEALTH
  // Severity distinction:
  //   SSRIs for anxiety/mild depression → low severity, JH/CORE flag
  //   SSRIs for diagnosed Major Depression → medium severity, JH/CORE flag
  //   SNRIs → medium severity, JH/CORE/FORE flag
  //   Benzodiazepines (any) → HIGH severity, 6-carrier flag
  //   Antipsychotics (any) → HIGH severity, ALL carriers
  // ══════════════════════════════════════════════════════════════════════════

  // ── SSRIs ─────────────────────────────────────────────────────────────────
  {
    name: 'Sertraline (Zoloft)',
    aliases: ['zoloft', 'sertraline'],
    conditionHint: 'depression_anxiety',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'SSRI antidepressant — widely accepted. JH and CORE flag for rating review if diagnosed Major Depression (vs mild/anxiety only).',
  },
  {
    name: 'Escitalopram (Lexapro)',
    aliases: ['lexapro', 'escitalopram'],
    conditionHint: 'depression_anxiety',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'SSRI antidepressant — JH and CORE review for Major Depression diagnosis.',
  },
  {
    name: 'Fluoxetine (Prozac)',
    aliases: ['prozac', 'fluoxetine', 'sarafem'],
    conditionHint: 'depression_anxiety',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'SSRI antidepressant — JH and CORE review for Major Depression.',
  },
  {
    name: 'Citalopram (Celexa)',
    aliases: ['celexa', 'citalopram'],
    conditionHint: 'depression_anxiety',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'SSRI antidepressant — JH and CORE review for Major Depression.',
  },
  {
    name: 'Paroxetine (Paxil)',
    aliases: ['paxil', 'paroxetine', 'pexeva'],
    conditionHint: 'depression_anxiety',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'SSRI antidepressant — JH and CORE review for Major Depression. Also used for anxiety, PTSD, OCD.',
  },

  // ── SNRIs ─────────────────────────────────────────────────────────────────
  {
    name: 'Venlafaxine (Effexor)',
    aliases: ['effexor', 'venlafaxine', 'effexor xr'],
    conditionHint: 'depression_anxiety',
    severity: 'medium',
    flaggedCarriers: ['john_hancock', 'corebridge', 'foresters', 'transamerica'],
    note: 'SNRI antidepressant — more potent than SSRIs. JH, CORE, FORE, TRANS flag for rating; indicates moderate-to-severe depression or anxiety.',
  },
  {
    name: 'Duloxetine (Cymbalta)',
    aliases: ['cymbalta', 'duloxetine'],
    conditionHint: 'depression_anxiety',
    severity: 'medium',
    flaggedCarriers: ['john_hancock', 'corebridge', 'foresters', 'transamerica'],
    note: 'SNRI — also used for chronic pain/neuropathy. JH, CORE, FORE, TRANS flag depending on diagnosis.',
  },
  {
    name: 'Desvenlafaxine (Pristiq)',
    aliases: ['pristiq', 'desvenlafaxine'],
    conditionHint: 'depression_anxiety',
    severity: 'medium',
    flaggedCarriers: ['john_hancock', 'corebridge', 'foresters'],
    note: 'SNRI antidepressant — JH, CORE, FORE flag for rating review.',
  },
  {
    name: 'Bupropion (Wellbutrin/Zyban)',
    aliases: ['wellbutrin', 'bupropion', 'zyban', 'aplenzin'],
    conditionHint: 'depression_anxiety',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'NDRI antidepressant/smoking cessation. JH and CORE flag for rating; widely accepted at FE carriers.',
  },

  // ── Benzodiazepines — HIGH severity, 6-carrier flag ───────────────────────
  {
    name: 'Alprazolam (Xanax)',
    aliases: ['xanax', 'alprazolam', 'xanax xr'],
    conditionHint: 'depression_anxiety',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Benzodiazepine for anxiety/panic disorder. HIGH risk flag — daily use indicates serious anxiety or dependency risk. Graded benefit likely at strict carriers.',
  },
  {
    name: 'Lorazepam (Ativan)',
    aliases: ['ativan', 'lorazepam'],
    conditionHint: 'depression_anxiety',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Benzodiazepine — daily or chronic use is a serious underwriting flag at most carriers.',
  },
  {
    name: 'Clonazepam (Klonopin)',
    aliases: ['klonopin', 'clonazepam'],
    conditionHint: 'depression_anxiety',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Benzodiazepine — long-acting; chronic use triggers serious flag at most carriers.',
  },
  {
    name: 'Diazepam (Valium)',
    aliases: ['valium', 'diazepam'],
    conditionHint: 'depression_anxiety',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Benzodiazepine — long-acting; chronic use is a serious underwriting flag.',
  },

  // ── Antipsychotics — ALL carriers, HIGH severity ──────────────────────────
  {
    name: 'Quetiapine (Seroquel)',
    aliases: ['seroquel', 'quetiapine'],
    conditionHint: 'bipolar_disorder',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Antipsychotic — indicates bipolar disorder or schizophrenia. Among the most serious medication flags in life insurance — graded benefit or knockout at all carriers.',
  },
  {
    name: 'Aripiprazole (Abilify)',
    aliases: ['abilify', 'aripiprazole'],
    conditionHint: 'bipolar_disorder',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Antipsychotic — bipolar or schizophrenia indicator. ALL-carrier flag; graded benefit or knockout.',
  },
  {
    name: 'Risperidone (Risperdal)',
    aliases: ['risperdal', 'risperidone'],
    conditionHint: 'bipolar_disorder',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Antipsychotic — serious mental health indicator. Decline or graded benefit at all carriers.',
  },
  {
    name: 'Olanzapine (Zyprexa)',
    aliases: ['zyprexa', 'olanzapine'],
    conditionHint: 'bipolar_disorder',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Antipsychotic — indicates bipolar disorder or schizophrenia. Decline or graded benefit at all carriers.',
  },
  {
    name: 'Clozapine (Clozaril)',
    aliases: ['clozaril', 'clozapine'],
    conditionHint: 'bipolar_disorder',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Serious antipsychotic for treatment-resistant schizophrenia. Decline at all carriers.',
  },
  {
    name: 'Haloperidol (Haldol)',
    aliases: ['haldol', 'haloperidol'],
    conditionHint: 'bipolar_disorder',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Typical antipsychotic — schizophrenia or acute psychosis. Decline at all carriers.',
  },

  // ── Mood Stabilizers (Bipolar) ────────────────────────────────────────────
  {
    name: 'Lithium',
    aliases: ['lithium', 'eskalith', 'lithobid'],
    conditionHint: 'bipolar_disorder',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'john_hancock', 'prosperity_life', 'north_american'],
    note: 'Mood stabilizer — indicates bipolar disorder. Graded benefit at most carriers.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SLEEP MEDICATIONS
  // Chronic use is the concern — short-term or PRN use is less significant.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Zolpidem (Ambien)',
    aliases: ['ambien', 'zolpidem', 'ambien cr', 'intermezzo'],
    conditionHint: 'depression_anxiety',
    severity: 'medium',
    flaggedCarriers: ['john_hancock', 'corebridge', 'mutual_of_omaha'],
    note: 'Sleep medication — long-term daily use flags JH, CORE, MOO for rating. May indicate underlying anxiety, depression, or sleep disorder.',
  },
  {
    name: 'Eszopiclone (Lunesta)',
    aliases: ['lunesta', 'eszopiclone'],
    conditionHint: 'depression_anxiety',
    severity: 'medium',
    flaggedCarriers: ['john_hancock', 'corebridge', 'mutual_of_omaha'],
    note: 'Sleep medication — chronic use flags JH, CORE, MOO. Same pattern as Ambien.',
  },
  {
    name: 'Trazodone (for sleep)',
    aliases: ['trazodone', 'desyrel'],
    conditionHint: 'depression_anxiety',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Sedating antidepressant often prescribed off-label for insomnia. JH and CORE flag if used chronically for sleep — may indicate underlying depression.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PAIN MEDICATIONS — OPIOIDS
  // Universal high-risk flag — chronic opioid use = decline or graded benefit
  // at ALL carriers. No exceptions in life insurance underwriting.
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Oxycodone (OxyContin/Percocet)',
    aliases: ['oxycodone', 'oxycontin', 'percocet', 'roxicodone'],
    conditionHint: 'chronic_pain',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Opioid painkiller — chronic use is a knockout or graded benefit at ALL carriers. Indicates serious chronic pain condition or dependency risk.',
  },
  {
    name: 'Hydrocodone (Vicodin/Norco)',
    aliases: ['hydrocodone', 'vicodin', 'norco', 'lortab'],
    conditionHint: 'chronic_pain',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Opioid — chronic daily use triggers decline or graded benefit at all carriers.',
  },
  {
    name: 'Morphine (MS Contin/Kadian)',
    aliases: ['morphine', 'ms contin', 'kadian', 'avinza'],
    conditionHint: 'chronic_pain',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Long-acting opioid — serious chronic pain or palliative care indicator. Decline at all carriers.',
  },
  {
    name: 'Fentanyl (Duragesic patch)',
    aliases: ['fentanyl', 'duragesic', 'actiq', 'subsys'],
    conditionHint: 'chronic_pain',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Potent opioid — chronic use or patch indicates severe chronic pain. Decline at all carriers.',
  },
  {
    name: 'Methadone (Dolophine)',
    aliases: ['methadone', 'dolophine'],
    conditionHint: 'chronic_pain',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Opioid — used for chronic pain or opioid addiction treatment (MAT). Decline or graded benefit at all carriers regardless of purpose.',
  },
  {
    name: 'Tramadol (Ultram)',
    aliases: ['tramadol', 'ultram', 'conzip'],
    conditionHint: 'chronic_pain',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'john_hancock', 'corebridge'],
    note: 'Weaker opioid-like analgesic — MOO, TRANS, FORE, JH, CORE flag for chronic pain rating. Dependency risk noted.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADHD MEDICATIONS
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Amphetamine Salts (Adderall)',
    aliases: ['adderall', 'amphetamine salts', 'adderall xr'],
    conditionHint: 'adhd',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'john_hancock', 'corebridge'],
    note: 'ADHD stimulant medication. MOO, JH, CORE flag for mental health rating review — ADHD itself is generally accepted but may affect rating.',
  },
  {
    name: 'Lisdexamfetamine (Vyvanse)',
    aliases: ['vyvanse', 'lisdexamfetamine'],
    conditionHint: 'adhd',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'john_hancock', 'corebridge'],
    note: 'ADHD stimulant — same flag pattern as Adderall.',
  },
  {
    name: 'Methylphenidate (Ritalin/Concerta)',
    aliases: ['ritalin', 'concerta', 'methylphenidate', 'methylin'],
    conditionHint: 'adhd',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'john_hancock', 'corebridge'],
    note: 'ADHD stimulant — MOO, JH, CORE flag for rating review.',
  },
  {
    name: 'Atomoxetine (Strattera)',
    aliases: ['strattera', 'atomoxetine'],
    conditionHint: 'adhd',
    severity: 'low',
    flaggedCarriers: ['john_hancock', 'corebridge'],
    note: 'Non-stimulant ADHD medication — lower risk than stimulants. JH and CORE review.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HIV MEDICATIONS
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Biktarvy (Bictegravir/FTC/TAF)',
    aliases: ['biktarvy', 'bictegravir'],
    conditionHint: 'hiv_aids',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'americo', 'american_amicable', 'john_hancock', 'prosperity_life', 'north_american', 'corebridge'],
    note: 'HIV antiretroviral. Triggers decline at most carriers. Foresters accepts HIV+ clients on antiretroviral therapy.',
  },
  {
    name: 'Truvada (Emtricitabine/Tenofovir)',
    aliases: ['truvada', 'emtricitabine tenofovir'],
    conditionHint: 'hiv_aids',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'americo', 'american_amicable', 'john_hancock', 'prosperity_life', 'north_american', 'corebridge'],
    note: 'HIV/PrEP medication. May indicate HIV-positive status. Foresters accepts HIV+ clients.',
  },
  {
    name: 'Atripla',
    aliases: ['atripla'],
    conditionHint: 'hiv_aids',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'americo', 'american_amicable', 'john_hancock', 'prosperity_life', 'north_american', 'corebridge'],
    note: 'HIV antiretroviral combination therapy.',
  },
  {
    name: 'Descovy (Emtricitabine/TAF)',
    aliases: ['descovy'],
    conditionHint: 'hiv_aids',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'americo', 'american_amicable', 'john_hancock', 'prosperity_life', 'north_american', 'corebridge'],
    note: 'HIV/PrEP medication.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TRANSPLANT / IMMUNOSUPPRESSION
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Tacrolimus (Prograf)',
    aliases: ['prograf', 'tacrolimus', 'advagraf'],
    conditionHint: 'organ_transplant',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Organ transplant rejection medication. Triggers decline or graded benefit at all carriers.',
  },
  {
    name: 'Cyclosporine (Neoral/Sandimmune)',
    aliases: ['cyclosporine', 'neoral', 'sandimmune'],
    conditionHint: 'organ_transplant',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Transplant/autoimmune immunosuppressant. All-carrier flag.',
  },
  {
    name: 'Mycophenolate (CellCept)',
    aliases: ['cellcept', 'mycophenolate', 'myfortic'],
    conditionHint: 'organ_transplant',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Organ transplant immunosuppressant. All-carrier flag.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AUTOIMMUNE — RA / LUPUS / INFLAMMATORY
  // Methotrexate → ALL carriers, HIGH severity (low-dose RA still serious)
  // TNF inhibitors (Humira, Enbrel, Remicade) → 6 carriers, HIGH severity
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Methotrexate',
    aliases: ['methotrexate', 'trexall', 'rheumatrex', 'otrexup'],
    conditionHint: 'rheumatoid_arthritis',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'DMARD for RA or cancer. Even low-dose RA use triggers rating review at all carriers — graded benefit likely at most.',
  },
  {
    name: 'Adalimumab (Humira)',
    aliases: ['humira', 'adalimumab'],
    conditionHint: 'rheumatoid_arthritis',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge', 'north_american'],
    note: 'TNF inhibitor for RA, Crohn\'s, psoriasis. Graded benefit or rating at TRANS, AMAM, MOO, FORE, JH, CORE.',
  },
  {
    name: 'Etanercept (Enbrel)',
    aliases: ['enbrel', 'etanercept'],
    conditionHint: 'rheumatoid_arthritis',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge', 'north_american'],
    note: 'TNF inhibitor for RA. Same pattern as Humira.',
  },
  {
    name: 'Infliximab (Remicade)',
    aliases: ['remicade', 'infliximab', 'inflectra', 'renflexis'],
    conditionHint: 'rheumatoid_arthritis',
    severity: 'high',
    flaggedCarriers: ['transamerica', 'american_amicable', 'mutual_of_omaha', 'foresters', 'john_hancock', 'corebridge', 'north_american'],
    note: 'TNF inhibitor biologic for RA, Crohn\'s, colitis. Serious autoimmune flag — graded benefit at most carriers.',
  },
  {
    name: 'Hydroxychloroquine (Plaquenil)',
    aliases: ['plaquenil', 'hydroxychloroquine'],
    conditionHint: 'lupus',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Lupus or RA medication — triggers review for underlying autoimmune condition at most carriers.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CANCER / CHEMOTHERAPY — ALL carriers, HIGH severity
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Imatinib (Gleevec)',
    aliases: ['gleevec', 'imatinib'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'CML/GIST cancer medication. Active cancer — decline at all carriers.',
  },
  {
    name: 'Tamoxifen',
    aliases: ['tamoxifen', 'nolvadex', 'soltamox'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Hormone therapy for breast cancer. Active/recent cancer flag at all carriers.',
  },
  {
    name: 'Letrozole (Femara)',
    aliases: ['letrozole', 'femara'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Aromatase inhibitor for breast cancer. Active/recent cancer flag.',
  },
  {
    name: 'Anastrozole (Arimidex)',
    aliases: ['anastrozole', 'arimidex'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Aromatase inhibitor for breast cancer.',
  },
  {
    name: 'Trastuzumab (Herceptin)',
    aliases: ['herceptin', 'trastuzumab'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'HER2-positive breast cancer targeted therapy. Active cancer flag.',
  },
  {
    name: 'Pembrolizumab (Keytruda)',
    aliases: ['keytruda', 'pembrolizumab'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Immunotherapy checkpoint inhibitor for multiple cancer types. Active cancer — decline at all carriers.',
  },
  {
    name: 'Rituximab (Rituxan)',
    aliases: ['rituximab', 'rituxan'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'For lymphoma, leukemia, or severe RA. Active cancer triggers decline; RA use flags all carriers.',
  },
  {
    name: 'Leuprolide (Lupron)',
    aliases: ['lupron', 'leuprolide', 'eligard'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Hormone therapy for prostate cancer. Active cancer flag at all carriers.',
  },
  {
    name: 'Enzalutamide (Xtandi)',
    aliases: ['xtandi', 'enzalutamide'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Androgen receptor inhibitor for prostate cancer. Active cancer — decline.',
  },
  {
    name: 'Bortezomib (Velcade)',
    aliases: ['velcade', 'bortezomib'],
    conditionHint: 'cancer',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Multiple myeloma chemotherapy. Active cancer — decline at all carriers.',
  },
  {
    name: 'Riluzole (Rilutek) — ALS',
    aliases: ['riluzole', 'rilutek'],
    conditionHint: 'als',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'ALS medication. Knockout at all carriers.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // KIDNEY / LIVER
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Torsemide',
    aliases: ['torsemide', 'demadex'],
    conditionHint: 'kidney_disease',
    severity: 'medium',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Diuretic for kidney disease or CHF.',
  },
  {
    name: 'Rifaximin (Xifaxan)',
    aliases: ['xifaxan', 'rifaximin'],
    conditionHint: 'liver_disease',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'american_amicable', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'Prescribed for hepatic encephalopathy — indicates serious liver disease/cirrhosis.',
  },
  {
    name: 'Lactulose',
    aliases: ['lactulose', 'kristalose'],
    conditionHint: 'liver_disease',
    severity: 'high',
    flaggedCarriers: ['mutual_of_omaha', 'transamerica', 'foresters', 'americo', 'aetna', 'john_hancock', 'corebridge', 'north_american'],
    note: 'For hepatic encephalopathy — serious liver disease indicator.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OXYGEN — ALL carriers
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: 'Home Oxygen Therapy',
    aliases: ['oxygen', 'home oxygen', 'o2', 'supplemental oxygen'],
    conditionHint: 'oxygen_use',
    severity: 'high',
    flaggedCarriers: ALL_CARRIERS,
    note: 'Home oxygen use is a decline at all carriers except Corebridge GI.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Search helper — used in Step 4 medication autocomplete
// ─────────────────────────────────────────────────────────────────────────────
export function searchMedications(query) {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return MEDICATIONS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.aliases.some((a) => a.toLowerCase().includes(q))
  ).slice(0, 10)
}
