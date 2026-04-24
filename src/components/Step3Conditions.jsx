const TIME_BASED = new Set(['Heart Attack', 'Stroke/TIA', 'Cancer (non-skin)'])

const TIMEFRAME_OPTIONS = [
  { value: '6mo',   label: 'Within 6 months' },
  { value: '12mo',  label: '6–12 months ago' },
  { value: '2yr',   label: '1–2 years ago' },
  { value: '5yr',   label: '2–5 years ago' },
  { value: '5plus', label: '5+ years ago' },
]

const SECTIONS = [
  {
    title: 'Common Conditions',
    items: [
      'High Blood Pressure', 'High Cholesterol', 'Diabetes Type 2 (oral meds)',
      'Diabetes Type 2 (insulin)', 'Diabetes Type 1', 'Sleep Apnea',
      'Depression/Anxiety', 'Asthma', 'COPD/Emphysema',
    ],
  },
  {
    title: 'Cardiac & Vascular',
    items: [
      'Heart Attack', 'Stroke/TIA', 'Congestive Heart Failure',
      'Pacemaker/Defibrillator', 'Peripheral Vascular Disease', 'Blood Thinners',
    ],
  },
  {
    title: 'Cancer & Serious Illness',
    items: ['Cancer (non-skin)', 'ALS', "Alzheimer's/Dementia", 'AIDS/HIV'],
  },
  {
    title: 'Specific Cancer Types',
    items: [
      'Leukemia', 'Lymphoma', "Hodgkin's Disease", "Non-Hodgkin's Lymphoma",
      'Breast Cancer', 'Colon Cancer', 'Prostate Cancer', 'Lung Cancer',
      'Skin Cancer (Melanoma)', 'Cervical Cancer', 'Ovarian Cancer',
      'Bladder Cancer', 'Kidney Cancer', 'Thyroid Cancer', 'Pancreatic Cancer',
      'Liver Cancer', 'Brain Tumor', 'Multiple Myeloma', 'Bone Cancer', 'Throat Cancer',
    ],
  },
  {
    title: 'Organ Health',
    items: ['Kidney Disease', 'Kidney Dialysis', 'Liver Disease/Cirrhosis', 'Organ Transplant'],
  },
  {
    title: 'Neurological & Muscular',
    items: [
      'Multiple Sclerosis', "Parkinson's Disease", 'Seizures/Epilepsy',
      'Neuropathy', 'Muscular Dystrophy',
    ],
  },
  {
    title: 'Autoimmune & Other',
    items: ['Bipolar Disorder', 'Rheumatoid Arthritis', 'Lupus (Systemic SLE)', 'Sickle Cell Anemia'],
  },
  {
    title: 'Functional & Mobility',
    items: ['Oxygen Use', 'Wheelchair/ADL', 'Hospice Care', 'Amputation (disease-caused)'],
  },
]

export default function Step3Conditions({ data, onChange, onNext, onBack, onCancel, onFollowUp }) {
  function toggle(key) {
    if (data[key] !== undefined) {
      const next = { ...data }
      delete next[key]
      onChange(next)
    } else {
      onChange({ ...data, [key]: TIME_BASED.has(key) ? '5plus' : true })
    }
  }

  function setTimeframe(key, val) {
    onChange({ ...data, [key]: val })
  }

  const checkedCount = Object.keys(data).length

  return (
    <div className="animate-in">
      <div className="step-header">
        <div className="step-eyebrow">Step 3 of 7</div>
        <h1 className="step-title">Medical Conditions</h1>
        <p className="step-subtitle">
          Select all conditions that apply. Time-sensitive events show a timeframe selector.
          {checkedCount > 0 && (
            <span style={{ marginLeft: 8, color: '#22d3ee', fontWeight: 600 }}>{checkedCount} selected</span>
          )}
        </p>
      </div>

      <div className="card">
        <div className="conditions-layout">
          {SECTIONS.map(sec => (
            <div key={sec.title} className="condition-group">
              <div className="condition-group-label">{sec.title}</div>
              {sec.items.map(key => {
                const isChecked   = data[key] !== undefined
                const isTimeBased = TIME_BASED.has(key)
                return (
                  <div key={key}>
                    <label
                      className="checkbox-row"
                      onClick={() => toggle(key)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="checkbox-label">{key}</span>
                    </label>
                    {isChecked && isTimeBased && (
                      <select
                        value={data[key]}
                        onChange={e => setTimeframe(key, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="field-input condition-time-select"
                      >
                        {TIMEFRAME_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {checkedCount === 0 && (
          <p style={{ marginTop: 24, fontSize: 13, color: '#555555', textAlign: 'center' }}>
            No conditions selected — client may qualify for Preferred rates at most carriers.
          </p>
        )}
      </div>

      <div className="step-actions">
        <div className="step-actions-left">
          <button className="btn btn-secondary" onClick={onBack}>Back</button>
          <button className="btn btn-cancel"   onClick={onCancel}>Cancel</button>
          <button className="btn btn-followup" onClick={onFollowUp}>Not Sold / Follow Up</button>
        </div>
        <button className="btn btn-primary" onClick={onNext}>Continue</button>
      </div>
    </div>
  )
}
