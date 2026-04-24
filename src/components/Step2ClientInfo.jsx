const TOBACCO_TYPES = [
  { value: 'cigarettes',      label: 'Cigarettes' },
  { value: 'cigars',          label: 'Cigars' },
  { value: 'chewing_tobacco', label: 'Chewing Tobacco' },
  { value: 'vaping',          label: 'Vaping / E-Cig' },
]

const US_STATES = [
  { abbr: 'AL', name: 'Alabama' },
  { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },
  { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },
  { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },
  { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },
  { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },
  { abbr: 'WY', name: 'Wyoming' },
]

const RELATIONSHIPS = [
  'Spouse', 'Son', 'Daughter', 'Sibling', 'Family Member', 'Parent', 'Non-Relative',
]

function calcBMI(ft, inch, weight) {
  const inches = Number(ft) * 12 + Number(inch)
  if (!inches || !weight) return null
  return (Number(weight) * 703) / (inches * inches)
}

function BMIStrip({ ft, inch, weight }) {
  const bmi = calcBMI(ft, inch, weight)
  if (!bmi || isNaN(bmi)) return null
  let label, color
  if (bmi < 18.5)      { label = 'Underweight';   color = '#60a5fa' }
  else if (bmi < 25)   { label = 'Normal Weight';  color = '#4caf84' }
  else if (bmi < 30)   { label = 'Overweight';     color = '#fbbf24' }
  else if (bmi < 40)   { label = 'Obese';          color = '#fb923c' }
  else                 { label = 'Severely Obese'; color = '#e05c5c' }
  return (
    <div className="bmi-strip">
      <span className="bmi-num" style={{ color }}>{bmi.toFixed(1)}</span>
      <span style={{ fontSize: 12, color: '#555555' }}>BMI —</span>
      <span style={{ fontSize: 13, fontWeight: 500, color }}>{label}</span>
    </div>
  )
}

// Auto-format MM/DD/YYYY — strips non-digits, inserts slashes as user types
function formatDOB(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// Auto-format 000-000-0000 — strips non-digits, inserts dashes as user types
function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Shared toggle button style (matches Tobacco toggle styling)
function toggleBtnStyle(isActive) {
  return {
    flex: 1, padding: '9px 18px', borderRadius: 'var(--radius-sm)',
    border: `1px solid ${isActive ? '#7c3aed' : '#2a2a2a'}`,
    background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
    color: isActive ? '#a78bfa' : '#888888',
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all var(--transition)',
  }
}

export default function Step2ClientInfo({ data, onChange, onNext, onBack, onCancel, onFollowUp }) {
  function set(field, val) {
    onChange({ ...data, [field]: val })
  }

  // Batch update — prevents stale-closure overwrites when two fields must change together
  function setMany(updates) {
    onChange({ ...data, ...updates })
  }

  // ── Beneficiary helpers ──────────────────────────────────────────────────
  const beneficiaries = data.beneficiaries || [{ name: '', relationship: '', percentage: '100' }]

  function updateBeneficiary(idx, field, val) {
    const next = beneficiaries.map((b, i) => i === idx ? { ...b, [field]: val } : b)
    set('beneficiaries', next)
  }

  function addBeneficiary() {
    const next = [...beneficiaries, { name: '', relationship: '', percentage: '' }]
    set('beneficiaries', next)
  }

  function removeBeneficiary(idx) {
    const next = beneficiaries.filter((_, i) => i !== idx)
    // Auto-reset to 100% when only one remains
    if (next.length === 1) next[0] = { ...next[0], percentage: '100' }
    set('beneficiaries', next)
  }

  const totalPct    = beneficiaries.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0)
  const multiMode   = beneficiaries.length > 1
  const pctValid    = !multiMode || totalPct === 100
  const pctWarning  = multiMode && totalPct !== 100

  const canProceed = data.firstName && data.lastName && data.age && data.sex

  return (
    <div className="animate-in">
      <div className="step-header">
        <div className="step-eyebrow">Step 2 of 7</div>
        <h1 className="step-title">Client Information</h1>
        <p className="step-subtitle">Demographics used for underwriting evaluation and product eligibility.</p>
      </div>

      <div className="card">
        {/* Personal Details */}
        <div className="section-eyebrow">Personal Details</div>

        <div className="form-grid grid-2" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="field-label">First Name</label>
            <input className="field-input" type="text" placeholder="First" value={data.firstName} onChange={e => set('firstName', e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Last Name</label>
            <input className="field-input" type="text" placeholder="Last" value={data.lastName} onChange={e => set('lastName', e.target.value)} />
          </div>
        </div>

        {/* Row 1: Age | Sex | State */}
        <div className="form-grid grid-3" style={{ marginBottom: 8 }}>
          <div className="field">
            <label className="field-label">Age</label>
            <input className="field-input" type="number" min="18" max="99" placeholder="e.g. 58" value={data.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Sex at Birth</label>
            <div className="radio-row">
              {['male', 'female'].map(s => (
                <label key={s} className="radio-pill">
                  <input
                    type="radio"
                    name="sex"
                    value={s}
                    checked={data.sex === s}
                    onChange={() => set('sex', s)}
                  />
                  <span className="radio-pill-label">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field-label">State</label>
            <select
              className="field-input"
              value={data.state || ''}
              onChange={e => set('state', e.target.value)}
            >
              <option value="">— Select state —</option>
              {US_STATES.map(s => (
                <option key={s.abbr} value={s.abbr}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: D.O.B | (empty) | Phone — aligns under Age and State */}
        <div className="form-grid grid-3" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="field-label">Date of Birth</label>
            <input
              className="field-input"
              type="text"
              inputMode="numeric"
              placeholder="MM/DD/YYYY"
              value={data.dateOfBirth || ''}
              onChange={e => set('dateOfBirth', formatDOB(e.target.value))}
              maxLength={10}
            />
          </div>
          <div /> {/* spacer — keeps Phone aligned under State */}
          <div className="field">
            <label className="field-label">Phone Number</label>
            <input
              className="field-input"
              type="text"
              inputMode="numeric"
              placeholder="000-000-0000"
              value={data.phoneNumber || ''}
              onChange={e => set('phoneNumber', formatPhone(e.target.value))}
              maxLength={12}
            />
          </div>
        </div>

        <hr className="section-divider" />

        {/* Marital Status */}
        <div className="section-eyebrow">Marital Status</div>

        <div style={{ marginBottom: 16 }}>
          <div className="radio-row" style={{ marginBottom: data.maritalStatus === 'Married' ? 12 : 0 }}>
            {['Married', 'Single'].map(status => (
              <button
                key={status}
                type="button"
                style={toggleBtnStyle(data.maritalStatus === status)}
                onClick={() => {
                  if (status === 'Single') {
                    setMany({ maritalStatus: 'Single', spouseName: '' })
                  } else {
                    set('maritalStatus', status)
                  }
                }}
              >
                {status}
              </button>
            ))}
          </div>
          {data.maritalStatus === 'Married' && (
            <div className="field">
              <label className="field-label">Spouse Name</label>
              <input
                className="field-input"
                type="text"
                placeholder="Spouse's full name"
                value={data.spouseName || ''}
                onChange={e => set('spouseName', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Beneficiaries */}
        <div className="section-eyebrow">Beneficiary</div>

        <div style={{ marginBottom: 16 }}>
          {beneficiaries.length === 0 ? (
            <p style={{ fontSize: 13, color: '#555555', marginBottom: 12 }}>
              No beneficiaries added. Click below to add one.
            </p>
          ) : (
            beneficiaries.map((b, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 12,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555555', fontWeight: 500 }}>
                    Beneficiary {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBeneficiary(idx)}
                    style={{
                      background: 'none', border: '1px solid #3a2a2a', borderRadius: 4,
                      color: '#e05c5c', cursor: 'pointer', fontSize: 13, padding: '2px 8px',
                      fontFamily: 'inherit', lineHeight: 1.4,
                    }}
                    title="Remove beneficiary"
                  >
                    Remove
                  </button>
                </div>

                {/* Name */}
                <div className="field" style={{ marginBottom: 10 }}>
                  <label className="field-label">Beneficiary Name</label>
                  <input
                    className="field-input"
                    type="text"
                    placeholder="Full name"
                    value={b.name}
                    onChange={e => updateBeneficiary(idx, 'name', e.target.value)}
                  />
                </div>

                {/* Relationship + Percentage side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                  <div className="field">
                    <label className="field-label">Relationship</label>
                    <select
                      className="field-input"
                      value={b.relationship}
                      onChange={e => updateBeneficiary(idx, 'relationship', e.target.value)}
                    >
                      <option value="">— Select —</option>
                      {RELATIONSHIPS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">% Share</label>
                    <input
                      className="field-input"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="100"
                      value={b.percentage}
                      readOnly={!multiMode}
                      style={{ background: !multiMode ? 'rgba(255,255,255,0.04)' : undefined, cursor: !multiMode ? 'default' : undefined }}
                      onChange={e => multiMode && updateBeneficiary(idx, 'percentage', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add Beneficiary button */}
          <button
            type="button"
            onClick={addBeneficiary}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 6,
              border: '1px dashed #2a2a2a', background: 'transparent',
              color: '#888888', fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#a78bfa' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888' }}
          >
            + Add Beneficiary
          </button>

          {/* Percentage total indicator */}
          {multiMode && (
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, color: pctValid ? '#4caf84' : '#e05c5c' }}>
              {pctValid
                ? `✓ Beneficiary split is correct — total: 100%`
                : `⚠ Beneficiary percentages must total 100% (current total: ${totalPct}%)`}
            </div>
          )}
        </div>

        <hr className="section-divider" />

        {/* Tobacco Use */}
        <div className="section-eyebrow">Tobacco Use</div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Tobacco / Nicotine Use (last 12 months)</label>
          <div className="radio-row">
            {[
              { value: false, label: 'Non-Tobacco' },
              { value: true,  label: 'Tobacco User' },
            ].map(opt => {
              const isActive = !!data.tobacco === opt.value
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  style={toggleBtnStyle(isActive)}
                  onClick={() => {
                    if (opt.value === true) {
                      setMany({ tobacco: true })
                    } else {
                      setMany({ tobacco: false, tobaccoType: '' })
                    }
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {data.tobacco && (
          <div className="sub-section" style={{ marginBottom: 16 }}>
            <label className="field-label">Tobacco Type</label>
            <div className="radio-row" style={{ flexWrap: 'wrap' }}>
              {TOBACCO_TYPES.map(tt => (
                <label key={tt.value} className="radio-pill" style={{ flex: 'none' }}>
                  <input
                    type="radio"
                    name="tobaccoType"
                    value={tt.value}
                    checked={data.tobaccoType === tt.value}
                    onChange={() => set('tobaccoType', tt.value)}
                  />
                  <span className="radio-pill-label">{tt.label}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#555555', marginTop: 8 }}>
              Note: Cigars, chewing tobacco, and vaping qualify for non-tobacco rates at several carriers.
            </p>
          </div>
        )}

        <hr className="section-divider" />

        {/* Height & Weight */}
        <div className="section-eyebrow">Height &amp; Weight</div>

        <div className="form-grid grid-3">
          <div className="field">
            <label className="field-label">Height — Feet</label>
            <select className="field-input" value={data.heightFt} onChange={e => set('heightFt', e.target.value)}>
              {[4, 5, 6, 7].map(f => <option key={f} value={f}>{f} ft</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Height — Inches</label>
            <select className="field-input" value={data.heightIn} onChange={e => set('heightIn', e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{i} in</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Weight (lbs)</label>
            <input className="field-input" type="number" min="50" max="700" placeholder="185" value={data.weight} onChange={e => set('weight', e.target.value)} />
          </div>
        </div>

        {data.heightFt && data.heightIn !== '' && data.weight && (
          <BMIStrip ft={data.heightFt} inch={data.heightIn} weight={data.weight} />
        )}
      </div>

      <div className="step-actions">
        <div className="step-actions-left">
          <button className="btn btn-secondary" onClick={onBack}>Back</button>
          <button className="btn btn-cancel"   onClick={onCancel}>Cancel</button>
          <button className="btn btn-followup" onClick={onFollowUp}>Not Sold / Follow Up</button>
        </div>
        <button className="btn btn-primary" onClick={onNext} disabled={!canProceed}>Continue</button>
      </div>
    </div>
  )
}
