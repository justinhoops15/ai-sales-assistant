// Suggested medications grouped by selected condition.
// Keys match the exact condition strings used in UNDERWRITING_RULES (Step 3).

export const CONDITION_MEDICATIONS = {
  'High Blood Pressure': [
    'Lisinopril', 'Losartan', 'Amlodipine', 'Metoprolol',
    'Atenolol', 'Hydrochlorothiazide (HCTZ)', 'Carvedilol',
    'Valsartan', 'Benazepril', 'Olmesartan',
  ],
  'High Cholesterol': [
    'Atorvastatin (Lipitor)', 'Simvastatin (Zocor)', 'Rosuvastatin (Crestor)',
    'Pravastatin', 'Lovastatin', 'Ezetimibe (Zetia)',
    'Fenofibrate', 'Gemfibrozil',
  ],
  'Diabetes Type 2 (oral meds)': [
    'Metformin', 'Glipizide', 'Glimepiride',
    'Januvia (Sitagliptin)', 'Jardiance (Empagliflozin)',
    'Farxiga (Dapagliflozin)', 'Trulicity (Dulaglutide)',
    'Ozempic (Semaglutide)', 'Victoza (Liraglutide)',
    'Invokana (Canagliflozin)',
  ],
  'Diabetes Type 2 (insulin)': [
    'Lantus (Insulin Glargine)', 'Toujeo', 'Tresiba (Insulin Degludec)',
    'Basaglar', 'Humalog (Insulin Lispro)', 'Novolog (Insulin Aspart)',
    'Apidra', 'NovoLog FlexPen', 'Levemir',
  ],
  'Diabetes Type 1': [
    'Lantus (Insulin Glargine)', 'Humalog (Insulin Lispro)', 'Novolog',
    'Tresiba', 'Toujeo', 'Omnipod / Insulin Pump',
    'Metformin (adjunct)', 'Symlin (Pramlintide)',
  ],
  'COPD/Emphysema': [
    'Albuterol (ProAir, Ventolin)', 'Spiriva (Tiotropium)',
    'Advair Diskus', 'Symbicort', 'Breo Ellipta',
    'Stiolto Respimat', 'Daliresp (Roflumilast)',
    'Ipratropium (Atrovent)', 'Combivent',
  ],
  'Asthma': [
    'Albuterol (ProAir, Ventolin)', 'Fluticasone (Flonase)',
    'Montelukast (Singulair)', 'Advair Diskus', 'Symbicort',
    'Dulera', 'Breo Ellipta', 'Xolair (Omalizumab)',
    'Ipratropium (Atrovent)',
  ],
  'Heart Attack': [
    'Aspirin', 'Clopidogrel (Plavix)', 'Ticagrelor (Brilinta)',
    'Atorvastatin (Lipitor)', 'Metoprolol', 'Carvedilol',
    'Lisinopril', 'Ramipril', 'Nitroglycerin',
    'Isosorbide Mononitrate',
  ],
  'Stroke/TIA': [
    'Aspirin', 'Clopidogrel (Plavix)', 'Warfarin (Coumadin)',
    'Eliquis (Apixaban)', 'Xarelto (Rivaroxaban)',
    'Pradaxa (Dabigatran)', 'Atorvastatin (Lipitor)',
    'Lisinopril', 'Metoprolol',
  ],
  'Cancer (non-skin)': [
    'Tamoxifen', 'Letrozole (Femara)', 'Anastrozole (Arimidex)',
    'Imatinib (Gleevec)', 'Rituximab (Rituxan)',
    'Trastuzumab (Herceptin)', 'Capecitabine (Xeloda)',
    'Exemestane (Aromasin)', 'Fulvestrant (Faslodex)',
  ],
  'Congestive Heart Failure': [
    'Furosemide (Lasix)', 'Spironolactone (Aldactone)',
    'Carvedilol', 'Metoprolol Succinate', 'Lisinopril',
    'Sacubitril/Valsartan (Entresto)', 'Digoxin',
    'Torsemide', 'Hydralazine', 'Isosorbide Dinitrate',
  ],
  'Kidney Disease': [
    'Amlodipine', 'Lisinopril', 'Losartan',
    'Furosemide (Lasix)', 'Erythropoietin (Epogen)',
    'Cinacalcet (Sensipar)', 'Sevelamer (Renvela)',
    'Calcitriol', 'Sodium Bicarbonate',
  ],
  'Liver Disease/Cirrhosis': [
    'Lactulose', 'Rifaximin (Xifaxan)', 'Nadolol',
    'Propranolol', 'Spironolactone', 'Furosemide',
    'Ursodiol (Actigall)', 'Cholestyramine',
  ],
  'Multiple Sclerosis': [
    'Tecfidera (Dimethyl Fumarate)', 'Copaxone (Glatiramer)',
    'Rebif (Interferon Beta-1a)', 'Avonex', 'Betaseron',
    'Ocrevus (Ocrelizumab)', 'Tysabri (Natalizumab)',
    'Gilenya (Fingolimod)', 'Mayzent (Siponimod)',
    'Baclofen', 'Ampyra (Dalfampridine)',
  ],
  "Parkinson's Disease": [
    'Carbidopa/Levodopa (Sinemet)', 'Pramipexole (Mirapex)',
    'Ropinirole (Requip)', 'Entacapone (Comtan)',
    'Rasagiline (Azilect)', 'Selegiline', 'Amantadine',
    'Rotigotine (Neupro patch)',
  ],
  'Blood Thinners': [
    'Warfarin (Coumadin)', 'Eliquis (Apixaban)',
    'Xarelto (Rivaroxaban)', 'Pradaxa (Dabigatran)',
    'Clopidogrel (Plavix)', 'Aspirin 81mg',
    'Ticagrelor (Brilinta)', 'Heparin',
  ],
  'Sleep Apnea': [
    'CPAP Machine (not a medication)', 'Modafinil (Provigil)',
    'Armodafinil (Nuvigil)', 'Solriamfetol (Sunosi)',
    'Fluticasone (nasal)', 'Montelukast (Singulair)',
  ],
  'Depression/Anxiety': [
    'Sertraline (Zoloft)', 'Fluoxetine (Prozac)',
    'Escitalopram (Lexapro)', 'Citalopram (Celexa)',
    'Bupropion (Wellbutrin)', 'Duloxetine (Cymbalta)',
    'Venlafaxine (Effexor)', 'Mirtazapine (Remeron)',
    'Alprazolam (Xanax)', 'Clonazepam (Klonopin)',
    'Lorazepam (Ativan)', 'Buspirone',
  ],
  'Bipolar Disorder': [
    'Lithium', 'Valproate (Depakote)', 'Lamotrigine (Lamictal)',
    'Quetiapine (Seroquel)', 'Aripiprazole (Abilify)',
    'Risperidone (Risperdal)', 'Olanzapine (Zyprexa)',
    'Lurasidone (Latuda)', 'Carbamazepine (Tegretol)',
  ],
  'Rheumatoid Arthritis': [
    'Methotrexate', 'Humira (Adalimumab)',
    'Enbrel (Etanercept)', 'Remicade (Infliximab)',
    'Prednisone', 'Hydroxychloroquine (Plaquenil)',
    'Xeljanz (Tofacitinib)', 'Orencia (Abatacept)',
    'Sulfasalazine', 'Leflunomide (Arava)',
  ],
  'Lupus (Systemic SLE)': [
    'Hydroxychloroquine (Plaquenil)', 'Prednisone',
    'Mycophenolate (CellCept)', 'Belimumab (Benlysta)',
    'Azathioprine (Imuran)', 'Cyclophosphamide',
    'Tacrolimus', 'Anifrolumab (Saphnelo)',
  ],
  'Seizures/Epilepsy': [
    'Levetiracetam (Keppra)', 'Lamotrigine (Lamictal)',
    'Carbamazepine (Tegretol)', 'Phenytoin (Dilantin)',
    'Valproate (Depakote)', 'Topiramate (Topamax)',
    'Oxcarbazepine (Trileptal)', 'Zonisamide (Zonegran)',
    'Lacosamide (Vimpat)', 'Brivaracetam (Briviact)',
  ],
  'Neuropathy': [
    'Gabapentin (Neurontin)', 'Pregabalin (Lyrica)',
    'Duloxetine (Cymbalta)', 'Amitriptyline',
    'Nortriptyline', 'Capsaicin cream',
    'Lidocaine patch', 'Tramadol',
  ],
  'Pacemaker/Defibrillator': [
    'Amiodarone (Cordarone)', 'Metoprolol',
    'Carvedilol', 'Digoxin', 'Warfarin (Coumadin)',
    'Eliquis (Apixaban)', 'Sotalol',
  ],
  'Peripheral Vascular Disease': [
    'Cilostazol (Pletal)', 'Pentoxifylline (Trental)',
    'Aspirin', 'Clopidogrel (Plavix)',
    'Atorvastatin (Lipitor)', 'Warfarin',
    'Eliquis (Apixaban)',
  ],
  'Sickle Cell Anemia': [
    'Hydroxyurea (Droxia)', 'L-Glutamine (Endari)',
    'Crizanlizumab (Adakveo)', 'Voxelotor (Oxbryta)',
    'Opioids (pain management)', 'Penicillin VK',
    'Folic Acid',
  ],
  'Muscular Dystrophy': [
    'Deflazacort (Emflaza)', 'Prednisone',
    'Eteplirsen (Exondys 51)', 'Golodirsen (Vyondys 53)',
    'Ataluren (Translarna)', 'Baclofen',
    'Creatine (supplement)',
  ],
  'Amputation (disease-caused)': [
    'Aspirin', 'Clopidogrel (Plavix)',
    'Gabapentin (Neurontin)', 'Pregabalin (Lyrica)',
    'Opioid pain management', 'Tramadol',
    'Amitriptyline', 'Metformin',
  ],
  'Kidney Dialysis': [
    'Erythropoietin (Epogen / Procrit)', 'Darbepoetin (Aranesp)',
    'Sevelamer (Renvela)', 'Cinacalcet (Sensipar)',
    'Calcitriol', 'Heparin (during dialysis)',
    'Iron supplements', 'Sodium Bicarbonate',
  ],
}

/**
 * Given the conditions object from Step 3, return an array of
 * { condition, medications[] } for any conditions that have suggestions.
 * Excludes conditions with no medication mapping.
 */
export function getMedicationsForConditions(conditions = {}) {
  const groups = []
  for (const condName of Object.keys(conditions)) {
    const val = conditions[condName]
    if (!val || val === false) continue
    const meds = CONDITION_MEDICATIONS[condName]
    if (meds?.length) {
      groups.push({ condition: condName, medications: meds })
    }
  }
  return groups
}
