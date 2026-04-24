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
    'Acetazolamide (Diamox)', 'Mometasone (Nasonex)',
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
  // Previously missing — serious illness conditions from Step 3
  'ALS': [
    'Riluzole (Rilutek)', 'Edaravone (Radicava)',
    'Tofersen (Qalsody)', 'Baclofen',
    'Diazepam', 'Glycopyrrolate',
    'Mexiletine', 'Quinine',
  ],
  "Alzheimer's/Dementia": [
    'Donepezil (Aricept)', 'Memantine (Namenda)',
    'Rivastigmine (Exelon)', 'Galantamine (Razadyne)',
    'Aducanumab (Aduhelm)', 'Lecanemab (Leqembi)',
    'Quetiapine (Seroquel)', 'Melatonin',
  ],
  'AIDS/HIV': [
    'Tenofovir/Emtricitabine (Truvada)', 'Biktarvy',
    'Dovato', 'Descovy',
    'Dolutegravir (Tivicay)', 'Efavirenz (Sustiva)',
    'Atazanavir (Reyataz)', 'Darunavir (Prezista)',
  ],
  // ── Specific Cancer Types ─────────────────────────────────────────────────
  'Leukemia': [
    'Imatinib (Gleevec)', 'Dasatinib (Sprycel)',
    'Nilotinib (Tasigna)', 'Venetoclax (Venclexta)',
    'Ibrutinib (Imbruvica)', 'Cytarabine (Ara-C)',
    'Hydroxyurea', 'Vincristine',
  ],
  'Lymphoma': [
    'Rituximab (Rituxan)', 'Cyclophosphamide',
    'Doxorubicin (Adriamycin)', 'Vincristine',
    'Prednisone', 'Bendamustine (Treanda)',
    'Brentuximab Vedotin (Adcetris)', 'Lenalidomide (Revlimid)',
  ],
  "Hodgkin's Disease": [
    'Doxorubicin (Adriamycin)', 'Bleomycin',
    'Vinblastine', 'Dacarbazine (ABVD)',
    'Brentuximab Vedotin (Adcetris)', 'Pembrolizumab (Keytruda)',
    'Nivolumab (Opdivo)', 'Carmustine',
  ],
  "Non-Hodgkin's Lymphoma": [
    'Rituximab (Rituxan)', 'Cyclophosphamide',
    'Doxorubicin', 'Vincristine',
    'Ibrutinib (Imbruvica)', 'Obinutuzumab (Gazyva)',
    'Idelalisib (Zydelig)', 'Brentuximab Vedotin',
  ],
  'Breast Cancer': [
    'Tamoxifen', 'Letrozole (Femara)',
    'Anastrozole (Arimidex)', 'Trastuzumab (Herceptin)',
    'Pertuzumab (Perjeta)', 'Palbociclib (Ibrance)',
    'Ribociclib (Kisqali)', 'Fulvestrant (Faslodex)',
  ],
  'Colon Cancer': [
    'Capecitabine (Xeloda)', 'Oxaliplatin (Eloxatin)',
    'Irinotecan (Camptosar)', 'Bevacizumab (Avastin)',
    'Cetuximab (Erbitux)', 'Leucovorin',
    'Fluorouracil (5-FU)', 'Regorafenib (Stivarga)',
  ],
  'Prostate Cancer': [
    'Leuprolide (Lupron)', 'Enzalutamide (Xtandi)',
    'Abiraterone (Zytiga)', 'Bicalutamide (Casodex)',
    'Docetaxel (Taxotere)', 'Cabazitaxel (Jevtana)',
    'Olaparib (Lynparza)', 'Radium-223 (Xofigo)',
  ],
  'Lung Cancer': [
    'Erlotinib (Tarceva)', 'Osimertinib (Tagrisso)',
    'Pembrolizumab (Keytruda)', 'Nivolumab (Opdivo)',
    'Carboplatin', 'Paclitaxel (Taxol)',
    'Pemetrexed (Alimta)', 'Crizotinib (Xalkori)',
  ],
  'Skin Cancer (Melanoma)': [
    'Pembrolizumab (Keytruda)', 'Nivolumab (Opdivo)',
    'Ipilimumab (Yervoy)', 'Vemurafenib (Zelboraf)',
    'Dabrafenib (Tafinlar)', 'Trametinib (Mekinist)',
    'Interferon Alfa-2b',
  ],
  'Cervical Cancer': [
    'Cisplatin', 'Carboplatin',
    'Paclitaxel', 'Bevacizumab (Avastin)',
    'Pembrolizumab (Keytruda)', 'Topotecan',
    'Fluorouracil (5-FU)',
  ],
  'Ovarian Cancer': [
    'Carboplatin', 'Paclitaxel (Taxol)',
    'Bevacizumab (Avastin)', 'Olaparib (Lynparza)',
    'Niraparib (Zejula)', 'Rucaparib (Rubraca)',
    'Topotecan', 'Gemcitabine',
  ],
  'Bladder Cancer': [
    'Gemcitabine', 'Cisplatin',
    'Carboplatin', 'Atezolizumab (Tecentriq)',
    'Pembrolizumab (Keytruda)', 'Nivolumab (Opdivo)',
    'BCG (intravesical)', 'Erdafitinib (Balversa)',
  ],
  'Kidney Cancer': [
    'Sunitinib (Sutent)', 'Pazopanib (Votrient)',
    'Cabozantinib (Cabometyx)', 'Pembrolizumab (Keytruda)',
    'Nivolumab (Opdivo)', 'Axitinib (Inlyta)',
    'Everolimus (Afinitor)',
  ],
  'Thyroid Cancer': [
    'Levothyroxine (Synthroid)', 'Sorafenib (Nexavar)',
    'Lenvatinib (Lenvima)', 'Vandetanib (Caprelsa)',
    'Cabozantinib (Cometriq)', 'Radioactive Iodine (I-131)',
    'Pralsetinib (Gavreto)',
  ],
  'Pancreatic Cancer': [
    'Gemcitabine', 'Erlotinib (Tarceva)',
    'Capecitabine (Xeloda)', 'Nab-Paclitaxel (Abraxane)',
    'Olaparib (Lynparza)', 'Irinotecan (Camptosar)',
    'Pembrolizumab (Keytruda)', 'Fluorouracil (5-FU)',
  ],
  'Liver Cancer': [
    'Sorafenib (Nexavar)', 'Lenvatinib (Lenvima)',
    'Atezolizumab (Tecentriq)', 'Bevacizumab (Avastin)',
    'Nivolumab (Opdivo)', 'Cabozantinib (Cabometyx)',
    'Ramucirumab (Cyramza)', 'Regorafenib (Stivarga)',
  ],
  'Brain Tumor': [
    'Temozolomide (Temodar)', 'Bevacizumab (Avastin)',
    'Carmustine (BCNU)', 'Lomustine (CCNU)',
    'Dexamethasone', 'Vincristine',
    'Procarbazine', 'Irinotecan',
  ],
  'Multiple Myeloma': [
    'Bortezomib (Velcade)', 'Lenalidomide (Revlimid)',
    'Dexamethasone', 'Carfilzomib (Kyprolis)',
    'Pomalidomide (Pomalyst)', 'Daratumumab (Darzalex)',
    'Thalidomide (Thalomid)', 'Ixazomib (Ninlaro)',
  ],
  'Bone Cancer': [
    'Methotrexate', 'Doxorubicin (Adriamycin)',
    'Cisplatin', 'Ifosfamide',
    'Denosumab (Xgeva)', 'Zoledronic Acid (Zometa)',
    'Sorafenib (Nexavar)', 'Regorafenib (Stivarga)',
  ],
  'Throat Cancer': [
    'Cisplatin', 'Carboplatin',
    'Fluorouracil (5-FU)', 'Docetaxel (Taxotere)',
    'Cetuximab (Erbitux)', 'Pembrolizumab (Keytruda)',
    'Nivolumab (Opdivo)', 'Hydroxyurea',
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
