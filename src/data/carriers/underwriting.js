// Core underwriting rules for all 10 carriers
// Decision values: "Preferred"|"Standard"|"Graded"|"Modified"|"Guaranteed"|"Decline"

export const UNDERWRITING_RULES = {

  TRANS: {
    name: "Transamerica",
    products: {
      FE: [
        { id: "FE_EXPRESS", name: "FE Express Solution", maxFace: 50000, ages: [18,85], tier: "Preferred", waitingPeriod: 0 },
        { id: "FE_IMMEDIATE", name: "Immediate Solution", maxFace: 50000, ages: [0,85], tier: "Preferred", waitingPeriod: 0 },
        { id: "FE_10PAY", name: "10-Pay Solution", maxFace: 50000, ages: [0,85], tier: "Preferred", waitingPeriod: 0 },
        { id: "FE_EASY", name: "Easy Solution", maxFace: 25000, ages: [18,80], tier: "Graded", waitingPeriod: 2 }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Organ Transplant","Oxygen Use","Wheelchair/ADL","Hospice Care","Kidney Dialysis"],
    conditions: [
      { condition: "High Blood Pressure", decision: "Preferred" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Preferred" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Graded" },
      { condition: "Diabetes Type 1", decision: "Graded" },
      { condition: "COPD/Emphysema", decision: "Graded" },
      { condition: "Asthma", decision: "Preferred" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Congestive Heart Failure", decision: "Decline" },
      { condition: "Kidney Disease", decision: "Graded" },
      { condition: "Kidney Dialysis", decision: "Decline" },
      { condition: "Liver Disease/Cirrhosis", decision: "Decline" },
      { condition: "Multiple Sclerosis", decision: "Graded" },
      { condition: "Parkinson's Disease", decision: "Graded" },
      { condition: "Blood Thinners", decision: "Graded" },
      { condition: "Sleep Apnea", decision: "Preferred" },
      { condition: "Depression/Anxiety", decision: "Preferred" },
      { condition: "Bipolar Disorder", decision: "Graded" },
      { condition: "Rheumatoid Arthritis", decision: "Graded" },
      { condition: "Lupus (Systemic SLE)", decision: "Decline" },
      { condition: "Seizures/Epilepsy", decision: "Graded" },
      { condition: "Pacemaker/Defibrillator", decision: "Graded" },
      { condition: "Peripheral Vascular Disease", decision: "Decline" },
      { condition: "Sickle Cell Anemia", decision: "Decline" },
      { condition: "Muscular Dystrophy", decision: "Decline" },
      { condition: "Neuropathy", decision: "Graded" },
      { condition: "Amputation (disease-caused)", decision: "Decline" }
    ],
    buildChart: [
      { height: "4'10", min: 84, max: 224 },
      { height: "4'11", min: 87, max: 231 },
      { height: "5'0", min: 90, max: 238 },
      { height: "5'1", min: 93, max: 246 },
      { height: "5'2", min: 96, max: 253 },
      { height: "5'3", min: 100, max: 261 },
      { height: "5'4", min: 103, max: 269 },
      { height: "5'5", min: 106, max: 277 },
      { height: "5'6", min: 110, max: 285 },
      { height: "5'7", min: 113, max: 294 },
      { height: "5'8", min: 117, max: 302 },
      { height: "5'9", min: 121, max: 311 },
      { height: "5'10", min: 124, max: 319 },
      { height: "5'11", min: 128, max: 328 },
      { height: "6'0", min: 132, max: 337 },
      { height: "6'1", min: 136, max: 346 },
      { height: "6'2", min: 140, max: 355 },
      { height: "6'3", min: 144, max: 364 },
      { height: "6'4", min: 148, max: 374 }
    ]
  },

  AMER: {
    name: "Americo",
    tobaccoRule: "Non-nicotine if no nicotine products in 24 months. Quit Smoking Advantage: smokers get non-nicotine rates for first 3 years — if they quit for 12 months they keep non-nicotine rates for life.",
    products: {
      FE: [
        { id: "EAGLE_1", name: "Eagle Select 1", maxFace: 40000, ages: [40,85], tier: "Preferred", waitingPeriod: 0, note: "Instant decision eApp" },
        { id: "EAGLE_2", name: "Eagle Select 2", maxFace: 40000, ages: [40,75], tier: "Standard", waitingPeriod: 0 },
        { id: "EAGLE_3", name: "Eagle Select 3", maxFace: 25000, ages: [40,75], tier: "Graded", waitingPeriod: 2, note: "Graded: months 1-2 = premiums paid + interest, month 3+ = 100%" }
      ],
      WL: [
        { id: "ADVANTAGE_WL", name: "Advantage WL", maxFace: 450000, minFace: 25000, ages: [18,75], tier: "Standard", waitingPeriod: 0, note: "Permanent whole life. Fast underwriting under $100k. Table ratings available up to Table 4. Fits as MP companion or FE add-on." }
      ],
      TERM: [
        { id: "HMS125", name: "HMS 125 / Instant Decision Term", maxFace: 450000, minFace: 25000, ages: [20,75], tier: "Standard", waitingPeriod: 0, terms: ["15","20","25","30"], note: "Accept/Reject through Table 2. All health questions are knockout questions. No exam under $100k under age 51. Mortgage protection flagship." },
        { id: "CBO100", name: "CBO 100", maxFace: 450000, minFace: 25000, ages: [20,75], tier: "Standard", waitingPeriod: 0, terms: ["20","25","30"], note: "Universal life structure, level term to 100" },
        { id: "TERM100", name: "Term 100", maxFace: 450000, minFace: 25000, ages: [20,75], tier: "Standard", waitingPeriod: 0, note: "Term to age 100" }
      ]
    },
    knockouts: ["Multiple Sclerosis","Lupus (Systemic SLE)","ALS","Alzheimer's/Dementia","Organ Transplant","Amputation (disease-caused)","Parkinson's Disease","Kidney Dialysis","Oxygen Use","Wheelchair/ADL","Hospice Care","AIDS/HIV"],
    conditions: [
      { condition: "High Blood Pressure", decision: "Preferred" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Preferred" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Standard" },
      { condition: "Diabetes Type 1", decision: "Standard" },
      { condition: "COPD/Emphysema", decision: "Standard" },
      { condition: "Asthma", decision: "Preferred" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 1, decision: "Decline" },
        { after: 1, decision: "Standard" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 1, decision: "Decline" },
        { after: 1, decision: "Standard" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Standard" }
      ]},
      { condition: "Congestive Heart Failure", decision: "Decline" },
      { condition: "Kidney Disease", decision: "Standard" },
      { condition: "Kidney Dialysis", decision: "Decline" },
      { condition: "Liver Disease/Cirrhosis", decision: "Decline" },
      { condition: "Blood Thinners", decision: "Standard" },
      { condition: "Sleep Apnea", decision: "Preferred" },
      { condition: "Depression/Anxiety", decision: "Preferred" },
      { condition: "Bipolar Disorder", decision: "Standard" },
      { condition: "Rheumatoid Arthritis", decision: "Standard" },
      { condition: "Seizures/Epilepsy", decision: "Standard" },
      { condition: "Pacemaker/Defibrillator", decision: "Decline" },
      { condition: "Peripheral Vascular Disease", decision: "Decline" },
      { condition: "Sickle Cell Anemia", decision: "Decline" },
      { condition: "Muscular Dystrophy", decision: "Decline" },
      { condition: "Neuropathy", decision: "Standard" }
    ],
    buildChart: [
      { height: "4'8", min: 79, max: 189 },
      { height: "4'9", min: 81, max: 196 },
      { height: "4'10", min: 84, max: 203 },
      { height: "4'11", min: 87, max: 210 },
      { height: "5'0", min: 90, max: 217 },
      { height: "5'1", min: 93, max: 224 },
      { height: "5'2", min: 96, max: 232 },
      { height: "5'3", min: 99, max: 239 },
      { height: "5'4", min: 102, max: 247 },
      { height: "5'5", min: 106, max: 255 },
      { height: "5'6", min: 109, max: 263 },
      { height: "5'7", min: 112, max: 271 },
      { height: "5'8", min: 116, max: 279 },
      { height: "5'9", min: 119, max: 287 },
      { height: "5'10", min: 122, max: 296 },
      { height: "5'11", min: 126, max: 304 },
      { height: "6'0", min: 130, max: 313 },
      { height: "6'1", min: 133, max: 322 },
      { height: "6'2", min: 137, max: 331 },
      { height: "6'3", min: 141, max: 340 },
      { height: "6'4", min: 144, max: 349 },
      { height: "6'5", min: 148, max: 358 },
      { height: "6'6", min: 152, max: 367 },
      { height: "6'7", min: 156, max: 377 }
    ]
  },

  AMAM: {
    name: "American Amicable",
    tobaccoRule: "Most lenient in industry — occasional cigar/pipe qualifies for non-tobacco rates",
    products: {
      FE: [
        { id: "SC_IMM", name: "Senior Choice Immediate", maxFace: 50000, ages: [50,85], tier: "Preferred", waitingPeriod: 0 },
        { id: "SC_GRAD", name: "Senior Choice Graded", maxFace: 20000, ages: [50,85], tier: "Graded", waitingPeriod: 2 }
      ],
      MP: [
        { id: "HOME_PROT", name: "Home Protector", maxFace: 300000, ages: [18,65], tier: "Standard", waitingPeriod: 0, requiresMortgage: true, note: "Requires active mortgage" },
        { id: "EASY_TERM", name: "Easy Term", maxFace: 300000, ages: [18,65], tier: "Standard", waitingPeriod: 0, terms: ["10","20","30"] }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Organ Transplant","Oxygen Use","Wheelchair/ADL","Hospice Care","Kidney Dialysis","Congestive Heart Failure","Lupus (Systemic SLE)","Peripheral Vascular Disease","Sickle Cell Anemia","Muscular Dystrophy"],
    conditions: [
      { condition: "High Blood Pressure", decision: "Preferred" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Preferred" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Standard" },
      { condition: "COPD/Emphysema", decision: "Standard" },
      { condition: "Asthma", decision: "Preferred" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 1, decision: "Decline" },
        { within: 2, decision: "Graded" },
        { after: 2, decision: "Standard" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 1, decision: "Decline" },
        { within: 2, decision: "Graded" },
        { after: 2, decision: "Standard" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { within: 5, decision: "Graded" },
        { after: 5, decision: "Standard" }
      ]},
      { condition: "Kidney Disease", decision: "Standard" },
      { condition: "Liver Disease/Cirrhosis", decision: "Decline" },
      { condition: "Multiple Sclerosis", decision: "Standard" },
      { condition: "Parkinson's Disease", decision: "Graded" },
      { condition: "Blood Thinners", decision: "Graded" },
      { condition: "Sleep Apnea", decision: "Preferred" },
      { condition: "Depression/Anxiety", decision: "Preferred" },
      { condition: "Bipolar Disorder", decision: "Graded" },
      { condition: "Rheumatoid Arthritis", decision: "Standard" },
      { condition: "Seizures/Epilepsy", decision: "Standard" },
      { condition: "Pacemaker/Defibrillator", decision: "Graded" },
      { condition: "Neuropathy", decision: "Standard" },
      { condition: "Amputation (disease-caused)", decision: "Decline" }
    ],
    buildChart: [
      { height: "4'10", min: 84, max: 210 },
      { height: "4'11", min: 87, max: 216 },
      { height: "5'0", min: 90, max: 222 },
      { height: "5'1", min: 93, max: 229 },
      { height: "5'2", min: 96, max: 235 },
      { height: "5'3", min: 99, max: 242 },
      { height: "5'4", min: 102, max: 249 },
      { height: "5'5", min: 106, max: 256 },
      { height: "5'6", min: 109, max: 263 },
      { height: "5'7", min: 112, max: 270 },
      { height: "5'8", min: 116, max: 278 },
      { height: "5'9", min: 119, max: 285 },
      { height: "5'10", min: 122, max: 293 },
      { height: "5'11", min: 126, max: 301 },
      { height: "6'0", min: 130, max: 309 },
      { height: "6'1", min: 133, max: 317 },
      { height: "6'2", min: 137, max: 325 },
      { height: "6'3", min: 141, max: 333 },
      { height: "6'4", min: 144, max: 342 }
    ]
  },

  MOO: {
    name: "Mutual of Omaha",
    tobaccoRule: "Non-tobacco if no tobacco/nicotine in 12 months. Up to 24 cigars/year with negative urinalysis = non-tobacco. Marijuana allowable for non-tobacco rates.",
    products: {
      FE: [
        { id: "LP_LEVEL", name: "Living Promise Level", maxFace: 40000, ages: [45,85], tier: "Level", waitingPeriod: 0 },
        { id: "LP_GRADED", name: "Living Promise Graded", maxFace: 20000, ages: [45,80], tier: "Graded", waitingPeriod: 2 }
      ],
      MP: [
        { id: "TLE", name: "Term Life Express", maxFace: 300000, ages: [18,75], tier: "Standard", waitingPeriod: 0, terms: ["10","15","20","30"], note: "Max face: ages 18-50=$300k, 51-60=$250k, 61-75=$150k" },
        { id: "IULE", name: "IUL Express", maxFace: 300000, ages: [18,65], tier: "Standard", waitingPeriod: 0 }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Organ Transplant","Oxygen Use","Wheelchair/ADL","Hospice Care","Kidney Dialysis","Liver Disease/Cirrhosis","Sickle Cell Anemia","Muscular Dystrophy","Pacemaker/Defibrillator","Amputation (disease-caused)","Peripheral Vascular Disease"],
    autoDeclineTLE: ["Diabetes Type 2 (oral meds) diagnosed before age 45","Chronic Severe Asthma","Hodgkin's Disease"],
    multiImpairmentDeclines: ["Diabetes over 45 + Table 2 build","Diabetes over 45 + tobacco","Diabetes over 45 + PVD","Table 2 build + hypertension","Table 2 build + asthma + tobacco"],
    conditions: [
      { condition: "High Blood Pressure", decision: "Level" },
      { condition: "High Cholesterol", decision: "Level" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Level", note: "Decline on TLE if diagnosed before age 45" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Graded" },
      { condition: "Diabetes Type 1", decision: "Graded" },
      { condition: "COPD/Emphysema", decision: "Graded" },
      { condition: "Asthma", decision: "Level", note: "Decline TLE if chronic severe" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Congestive Heart Failure", decision: "Decline" },
      { condition: "Kidney Disease", decision: "Level", note: "Graded if chronic" },
      { condition: "Kidney Dialysis", decision: "Decline" },
      { condition: "Liver Disease/Cirrhosis", decision: "Decline" },
      { condition: "Multiple Sclerosis", decision: "Graded" },
      { condition: "Parkinson's Disease", decision: "Graded" },
      { condition: "Blood Thinners", decision: "Graded" },
      { condition: "Sleep Apnea", decision: "Level" },
      { condition: "Depression/Anxiety", decision: "Level" },
      { condition: "Bipolar Disorder", decision: "Graded" },
      { condition: "Rheumatoid Arthritis", decision: "Level", note: "Decline if Humira/Enbrel/Methotrexate" },
      { condition: "Lupus (Systemic SLE)", decision: "Decline" },
      { condition: "Seizures/Epilepsy", decision: "Level", note: "Controlled, no seizures 2 years" },
      { condition: "Neuropathy", decision: "Graded" },
      { condition: "Peripheral Vascular Disease", decision: "Decline" }
    ],
    buildChart: [
      { height: "4'8", min: 74, max: 197 },
      { height: "4'9", min: 77, max: 202 },
      { height: "4'10", min: 79, max: 208 },
      { height: "4'11", min: 82, max: 214 },
      { height: "5'0", min: 85, max: 220 },
      { height: "5'1", min: 88, max: 226 },
      { height: "5'2", min: 91, max: 232 },
      { height: "5'3", min: 94, max: 238 },
      { height: "5'4", min: 97, max: 245 },
      { height: "5'5", min: 100, max: 251 },
      { height: "5'6", min: 103, max: 258 },
      { height: "5'7", min: 106, max: 265 },
      { height: "5'8", min: 109, max: 274 },
      { height: "5'9", min: 112, max: 282 },
      { height: "5'10", min: 115, max: 289 },
      { height: "5'11", min: 119, max: 298 },
      { height: "6'0", min: 122, max: 305 },
      { height: "6'1", min: 126, max: 313 },
      { height: "6'2", min: 129, max: 321 },
      { height: "6'3", min: 133, max: 329 },
      { height: "6'4", min: 136, max: 338 },
      { height: "6'5", min: 140, max: 347 },
      { height: "6'6", min: 143, max: 358 }
    ]
  },

  FORE: {
    name: "Foresters Financial",
    tobaccoRule: "Non-tobacco if no cigarettes in 12 months. Cigar, pipe, chewing tobacco, nicotine patches = non-tobacco rates. Preferred Tobacco class available.",
    products: {
      FE: [
        { id: "PLANRIGHT_PREF", name: "PlanRight Preferred", maxFace: 35000, ages: [50,85], tier: "Preferred", waitingPeriod: 0 },
        { id: "PLANRIGHT_STAND", name: "PlanRight Standard", maxFace: 35000, ages: [50,85], tier: "Standard", waitingPeriod: 0 },
        { id: "PLANRIGHT_BASIC", name: "PlanRight Basic", maxFace: 35000, ages: [50,85], tier: "Graded", waitingPeriod: 2 }
      ],
      MP: [
        { id: "YOUR_TERM", name: "Your Term Advantage Plus", maxFace: 400000, ages: [18,70], tier: "Standard", waitingPeriod: 0, terms: ["10","20","30"], note: "No exam up to $400k. Living benefits included free." }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Organ Transplant","Oxygen Use","Wheelchair/ADL","Hospice Care","Kidney Dialysis","Liver Disease/Cirrhosis","Congestive Heart Failure","Peripheral Vascular Disease","Sickle Cell Anemia","Muscular Dystrophy"],
    hardKnockout: "Congestive Heart Failure = ABSOLUTE DECLINE regardless of when diagnosed — no exceptions",
    livingBenefits: "Critical illness, chronic illness, and terminal illness riders included FREE on all products",
    conditions: [
      { condition: "High Blood Pressure", decision: "Preferred" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Standard", note: "Very accepting — oral meds controlled" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Graded" },
      { condition: "Diabetes Type 1", decision: "Graded" },
      { condition: "COPD/Emphysema", decision: "Standard", note: "No oxygen, non-smoker, mild only" },
      { condition: "Asthma", decision: "Preferred", note: "Mild/moderate — decline if severe hospitalization" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { within: 4, decision: "Graded" },
        { after: 4, decision: "Standard" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { within: 4, decision: "Graded" },
        { after: 4, decision: "Standard" }
      ]},
      { condition: "Congestive Heart Failure", decision: "Decline", note: "HARD KNOCKOUT — no exceptions ever" },
      { condition: "Kidney Disease", decision: "Standard" },
      { condition: "Kidney Dialysis", decision: "Decline" },
      { condition: "Liver Disease/Cirrhosis", decision: "Decline" },
      { condition: "Multiple Sclerosis", decision: "Decline" },
      { condition: "Parkinson's Disease", decision: "Decline" },
      { condition: "Blood Thinners", decision: "Graded" },
      { condition: "Sleep Apnea", decision: "Preferred" },
      { condition: "Depression/Anxiety", decision: "Preferred" },
      { condition: "Bipolar Disorder", decision: "Graded" },
      { condition: "Rheumatoid Arthritis", decision: "Standard", note: "Decline if Humira/Enbrel/Prednisone moderate-severe" },
      { condition: "Lupus (Systemic SLE)", decision: "Decline" },
      { condition: "Seizures/Epilepsy", decision: "Standard", note: "Controlled, no seizures 2 years" },
      { condition: "Neuropathy", decision: "Standard" },
      { condition: "Peripheral Vascular Disease", decision: "Decline" },
      { condition: "Pacemaker/Defibrillator", decision: "Decline" },
      { condition: "Amputation (disease-caused)", decision: "Decline" }
    ],
    buildChart: [
      { height: "4'10", min: 92, max: 211 },
      { height: "4'11", min: 94, max: 218 },
      { height: "5'0", min: 96, max: 225 },
      { height: "5'1", min: 99, max: 233 },
      { height: "5'2", min: 101, max: 241 },
      { height: "5'3", min: 105, max: 248 },
      { height: "5'4", min: 107, max: 256 },
      { height: "5'5", min: 110, max: 264 },
      { height: "5'6", min: 112, max: 273 },
      { height: "5'7", min: 116, max: 281 },
      { height: "5'8", min: 119, max: 289 },
      { height: "5'9", min: 123, max: 298 },
      { height: "5'10", min: 126, max: 307 },
      { height: "5'11", min: 129, max: 315 },
      { height: "6'0", min: 133, max: 324 },
      { height: "6'1", min: 136, max: 334 },
      { height: "6'2", min: 140, max: 343 },
      { height: "6'3", min: 144, max: 352 },
      { height: "6'4", min: 148, max: 361 }
    ]
  },

  AETNA: {
    name: "Aetna",
    noBuildChart: true,
    tobaccoRule: "Tobacco users rated at higher premium — not declined",
    keyAdvantages: [
      "NO height/weight build chart",
      "Accepts COPD, MS, Parkinson's, Lupus SLE at Standard with day 1 full coverage",
      "Diabetes friendly — insulin not on application, any age/type accepted",
      "Ages up to 89 — highest in industry",
      "Mental health OK for Preferred",
      "90-minute instant decision"
    ],
    products: {
      FE: [
        { id: "AETNA_PREF", name: "Preferred Plan", maxFace: 50000, ages: [40,89], tier: "Preferred", waitingPeriod: 0, note: "Answer NO to all health questions" },
        { id: "AETNA_STAND", name: "Standard Plan", maxFace: 50000, ages: [40,89], tier: "Standard", waitingPeriod: 0, note: "COPD, MS, Parkinson's, Lupus qualify here" },
        { id: "AETNA_MOD", name: "Modified Plan", maxFace: 25000, ages: [40,75], tier: "Modified", waitingPeriod: 2 }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Oxygen Use","Wheelchair/ADL","Hospice Care","Kidney Dialysis","Active cancer treatment","Terminal illness"],
    sectionA_decline: ["Hospice/home health care","Nursing home confined","Wheelchair/ADL assistance","Kidney dialysis","Oxygen use except CPAP","Pending uncompleted medical procedures","AIDS/HIV","Active chemotherapy or radiation"],
    sectionB_modified: ["Heart attack within 2 years","Stroke/TIA within 2 years","Aneurysm within 2 years","Brain tumor within 2 years","Cardiomyopathy within 2 years","ALS ever","Alzheimer's/Dementia ever"],
    sectionC_standard: ["COPD/Emphysema/Chronic Bronchitis ever","Multiple Sclerosis ever","Parkinson's Disease ever","Systemic Lupus SLE ever"],
    conditions: [
      { condition: "High Blood Pressure", decision: "Preferred" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Preferred", note: "Insulin not on application — unique advantage" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Preferred", note: "Any diabetes type accepted at Preferred" },
      { condition: "Diabetes Type 1", decision: "Preferred", note: "Any age, any type" },
      { condition: "COPD/Emphysema", decision: "Standard", note: "KEY STRENGTH — day 1 full coverage" },
      { condition: "Asthma", decision: "Preferred" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 2, decision: "Modified" },
        { after: 2, decision: "Preferred" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 2, decision: "Modified" },
        { after: 2, decision: "Preferred" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Modified" },
        { after: 2, decision: "Preferred" }
      ]},
      { condition: "Congestive Heart Failure", decision: "Modified" },
      { condition: "Kidney Disease", decision: "Preferred" },
      { condition: "Kidney Dialysis", decision: "Decline" },
      { condition: "Liver Disease/Cirrhosis", decision: "Modified" },
      { condition: "Multiple Sclerosis", decision: "Standard", note: "KEY STRENGTH — day 1 full coverage" },
      { condition: "Parkinson's Disease", decision: "Standard", note: "KEY STRENGTH — day 1 full coverage" },
      { condition: "Blood Thinners", decision: "Preferred" },
      { condition: "Sleep Apnea", decision: "Preferred" },
      { condition: "Depression/Anxiety", decision: "Preferred", note: "Mental health OK for Preferred" },
      { condition: "Bipolar Disorder", decision: "Preferred", note: "Mental health OK for Preferred" },
      { condition: "Rheumatoid Arthritis", decision: "Preferred" },
      { condition: "Lupus (Systemic SLE)", decision: "Standard" },
      { condition: "Seizures/Epilepsy", decision: "Preferred" },
      { condition: "Neuropathy", decision: "Preferred" },
      { condition: "Pacemaker/Defibrillator", decision: "Modified" },
      { condition: "Peripheral Vascular Disease", decision: "Modified" },
      { condition: "Amputation (disease-caused)", decision: "Modified" }
    ]
  },

  ETHOS: {
    name: "Ethos",
    laddingSystem: "Auto-ladders: Prime → Choice → Guaranteed. Client almost never fully declined. 90%+ approval rate.",
    keyAdvantages: [
      "Auto-laddering — 90%+ approval rate",
      "10 minute application — fastest in industry",
      "Up to $2M no exam",
      "Best fallback when other carriers decline",
      "Instant decision"
    ],
    products: {
      FE: [
        { id: "TRUSTAGE_GAWL", name: "TruStage Guaranteed WL", maxFace: 25000, ages: [55,80], tier: "Guaranteed", waitingPeriod: 2, note: "No health questions — last resort" }
      ],
      MP: [
        { id: "TERM_PRIME", name: "Term Life Prime", maxFace: 2000000, ages: [18,65], tier: "Preferred", waitingPeriod: 0, note: "Best health only — auto-routes to Choice if not qualified" },
        { id: "TERM_CHOICE", name: "Term Life Choice", maxFace: 1500000, ages: [18,65], tier: "Standard", waitingPeriod: 0, note: "Auto-routes from Prime" },
        { id: "TRUSTAGE_TAWL", name: "TruStage Advantage WL", maxFace: 100000, ages: [18,65], tier: "Standard", waitingPeriod: 0 }
      ]
    },
    knockouts: [],
    conditions: [
      { condition: "High Blood Pressure", decision: "Preferred" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Standard" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Standard" },
      { condition: "COPD/Emphysema", decision: "Standard" },
      { condition: "Asthma", decision: "Preferred" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 2, decision: "Standard" },
        { after: 2, decision: "Preferred" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 2, decision: "Standard" },
        { after: 2, decision: "Preferred" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Standard" },
        { after: 2, decision: "Preferred" }
      ]},
      { condition: "Multiple serious conditions", decision: "Guaranteed", note: "Auto-ladders to Guaranteed WL" },
      { condition: "Any condition", decision: "Guaranteed", note: "Guaranteed WL always available ages 55-80" }
    ],
    buildChart: null,
    buildChartNote: "Proprietary AI engine — no traditional build chart"
  },

  JH: {
    name: "John Hancock",
    tobaccoRule: "Non-tobacco if no cigarettes/e-cigarettes in 12 months. Up to 12 cigars/year = non-tobacco with negative cotinine.",
    vitalityProgram: "Apple Watch included. Earn points for exercise and healthy living. Premium can decrease each year.",
    aspireProgram: "Best diabetes underwriting in industry — Type 1 and Type 2 both considered through Aspire program",
    products: {
      MP: [
        { id: "TERM_VITALITY", name: "Term with Vitality", maxFace: 65000000, ages: [18,65], tier: "Preferred", waitingPeriod: 0, terms: ["10","15","20","25","30"], note: "Vitality wellness rewards — premium decreases for healthy behavior" },
        { id: "PROT_TERM", name: "Protection Term", maxFace: 65000000, ages: [18,70], tier: "Standard", waitingPeriod: 0, terms: ["10","15","20","25","30"] }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Kidney Dialysis","Active cancer","Organ Transplant","Cirrhosis"],
    conditions: [
      { condition: "High Blood Pressure", decision: "Standard Plus" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Standard", note: "Aspire program — best diabetes underwriting" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Standard", note: "Aspire program consideration" },
      { condition: "Diabetes Type 1", decision: "Table", note: "Aspire program case by case" },
      { condition: "COPD/Emphysema", decision: "Standard", note: "Mild only — severe = decline" },
      { condition: "Asthma", decision: "Standard Plus" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { within: 5, decision: "Table" },
        { after: 5, decision: "Standard" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Table" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { within: 5, decision: "Table" },
        { after: 5, decision: "Standard Plus" }
      ]},
      { condition: "Sleep Apnea", decision: "Standard Plus" },
      { condition: "Rheumatoid Arthritis", decision: "Standard" },
      { condition: "Lupus (Systemic SLE)", decision: "Table" },
      { condition: "Multiple Sclerosis", decision: "Table" },
      { condition: "Parkinson's Disease", decision: "Table" }
    ],
    buildChart: null,
    buildChartNote: "Full BMI-based build chart — exam required. Preferred Plus requires approximately BMI under 28."
  },

  CORE: {
    name: "Corebridge Financial",
    tobaccoRule: "Non-tobacco if no tobacco/nicotine in 12 months. 1 cigar/week + negative cotinine + no other tobacco 5 years = non-tobacco. Marijuana 8 or fewer days/month = best class.",
    keyAdvantages: [
      "18 different term lengths 10-35 years — match any mortgage payoff date exactly",
      "35-year term — longest in industry",
      "AU+ program — no exam for 60%+ of applicants",
      "Flex Points — meet 4 of 16 health criteria = one rate class upgrade",
      "Strong for controlled diabetes, sleep apnea, BP"
    ],
    products: {
      FE: [
        { id: "GIWL", name: "Guaranteed Issue WL", maxFace: 25000, ages: [50,80], tier: "Guaranteed", waitingPeriod: 2, note: "No health questions — last resort" }
      ],
      MP: [
        { id: "SELECT_TERM", name: "Select-A-Term", maxFace: 10000000, ages: [18,80], tier: "Preferred", waitingPeriod: 0, terms: ["10-35 (18 options)"], note: "Match exact mortgage payoff — unique in industry" },
        { id: "QOL_FLEX", name: "QoL Flex Term", maxFace: 10000000, ages: [18,70], tier: "Standard", waitingPeriod: 0, note: "Living benefits included" }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Kidney Dialysis","Active cancer","Organ Transplant","Severe COPD on oxygen","Stroke within 1 year","MI within 6 months","Drug use non-marijuana within 3 years"],
    flexPoints: "Meet 4 of 16 criteria = one class upgrade. Criteria include: normal stress EKG, A1C under 5.5, BMI 23-25, untreated BP 120/80, normal colonoscopy, normal mammogram, good exercise capacity and more.",
    conditions: [
      { condition: "High Blood Pressure", decision: "Preferred" },
      { condition: "High Cholesterol", decision: "Preferred" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Standard Plus", note: "Flex Points can improve class" },
      { condition: "Sleep Apnea", decision: "Preferred", note: "Strong underwriting strength with CPAP compliance" },
      { condition: "Asthma", decision: "Standard Plus" },
      { condition: "COPD/Emphysema", decision: "Standard", note: "Not on oxygen" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 0.5, decision: "Decline" },
        { within: 5, decision: "Table" },
        { after: 5, decision: "Standard" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 1, decision: "Decline" },
        { after: 1, decision: "Table" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { within: 5, decision: "Table" },
        { after: 5, decision: "Standard Plus" }
      ]},
      { condition: "Rheumatoid Arthritis", decision: "Standard" },
      { condition: "Lupus (Systemic SLE)", decision: "Table" },
      { condition: "Multiple Sclerosis", decision: "Table" },
      { condition: "Parkinson's Disease", decision: "Table" }
    ],
    buildChart: null,
    buildChartNote: "Standard BMI build chart for fully underwritten — AU+ may bypass exam for healthy applicants"
  },

  PROS: {
    name: "Prosperity Life",
    tobaccoRule: "Smoker rates apply to CIGARETTES ONLY. Chewing tobacco, cigars, vaping, nicotine patches = NON-SMOKER rates. 30-40% premium savings.",
    keyAdvantages: [
      "Cigarettes-only tobacco rule — huge savings for non-cigarette tobacco users",
      "Same commission on Level, Graded, AND Modified",
      "Cancer 3-year lookback not 5 years",
      "COPD and Parkinson's qualify for Graded not just Modified",
      "Diabetes friendly including insulin any age",
      "Instant decision"
    ],
    products: {
      FE: [
        { id: "NV_LEVEL", name: "New Vista Level", maxFace: 35000, ages: [50,80], tier: "Level", waitingPeriod: 0 },
        { id: "NV_GRADED", name: "New Vista Graded", maxFace: 35000, ages: [50,80], tier: "Graded", waitingPeriod: 2, note: "Year 1: 30%, Year 2: 70%, Year 3+: 100%" },
        { id: "NV_MOD", name: "New Vista Modified", maxFace: 35000, ages: [50,80], tier: "Modified", waitingPeriod: 2, note: "Year 1: 110% premiums, Year 2: 231% premiums, Year 3+: 100%" }
      ]
    },
    knockouts: ["AIDS/HIV","ALS","Alzheimer's/Dementia","Oxygen Use","Wheelchair/ADL","Hospice Care","Terminal illness","Organ Transplant on waiting list","Cancer within 3 years","Cancer multiple occurrences","Sickle Cell Anemia","Muscular Dystrophy"],
    conditions: [
      { condition: "High Blood Pressure", decision: "Level" },
      { condition: "High Cholesterol", decision: "Level" },
      { condition: "Diabetes Type 2 (oral meds)", decision: "Level" },
      { condition: "Diabetes Type 2 (insulin)", decision: "Level", note: "Insulin OK for Level — diabetic friendly" },
      { condition: "Diabetes Type 1", decision: "Level", note: "Any age onset accepted" },
      { condition: "Diabetes complications (neuropathy/coma)", decision: "Modified" },
      { condition: "COPD/Emphysema", decision: "Graded", note: "Unique — most carriers put at Modified or Decline" },
      { condition: "Asthma", decision: "Level" },
      { condition: "Heart Attack", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Stroke/TIA", timeBased: true, rules: [
        { within: 2, decision: "Decline" },
        { after: 2, decision: "Graded" }
      ]},
      { condition: "Cancer (non-skin)", timeBased: true, rules: [
        { within: 3, decision: "Decline" },
        { after: 3, decision: "Level", note: "First occurrence only — multiple occurrences = Decline" }
      ]},
      { condition: "Congestive Heart Failure", decision: "Graded" },
      { condition: "Kidney Disease", decision: "Graded" },
      { condition: "Kidney Dialysis", decision: "Graded", note: "Not awaiting transplant" },
      { condition: "Liver Disease/Cirrhosis", decision: "Graded", note: "Stage A or B only" },
      { condition: "Multiple Sclerosis", decision: "Graded" },
      { condition: "Parkinson's Disease", decision: "Graded", note: "Unique — most carriers decline outright" },
      { condition: "Blood Thinners", decision: "Graded", note: "Blood thinners for angina/heart prevention = Graded not Level" },
      { condition: "Sleep Apnea", decision: "Level" },
      { condition: "Depression/Anxiety", decision: "Level" },
      { condition: "Bipolar Disorder", decision: "Graded" },
      { condition: "Rheumatoid Arthritis", decision: "Level" },
      { condition: "Lupus (Systemic SLE)", decision: "Graded" },
      { condition: "Seizures/Epilepsy", decision: "Level" },
      { condition: "Neuropathy", decision: "Level" },
      { condition: "Pacemaker/Defibrillator", decision: "Graded" },
      { condition: "Peripheral Vascular Disease", decision: "Graded" },
      { condition: "Amputation (disease-caused)", decision: "Graded" }
    ],
    buildChart: [
      { height: "4'10", min: 84, max: 212 },
      { height: "4'11", min: 87, max: 219 },
      { height: "5'0", min: 90, max: 226 },
      { height: "5'1", min: 93, max: 234 },
      { height: "5'2", min: 96, max: 241 },
      { height: "5'3", min: 100, max: 249 },
      { height: "5'4", min: 103, max: 257 },
      { height: "5'5", min: 106, max: 265 },
      { height: "5'6", min: 110, max: 273 },
      { height: "5'7", min: 113, max: 281 },
      { height: "5'8", min: 117, max: 289 },
      { height: "5'9", min: 121, max: 298 },
      { height: "5'10", min: 124, max: 306 },
      { height: "5'11", min: 128, max: 315 },
      { height: "6'0", min: 132, max: 324 },
      { height: "6'1", min: 136, max: 333 },
      { height: "6'2", min: 140, max: 342 },
      { height: "6'3", min: 144, max: 351 },
      { height: "6'4", min: 148, max: 360 }
    ]
  }

};

export default UNDERWRITING_RULES;
