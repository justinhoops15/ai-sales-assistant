import { useState } from 'react'
import { searchOccupations } from '../data/occupations.js'

// Shared toggle button style
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

// Dollar-prefix input: shows $ on focus or when field has a value
function DollarInput({ value, onChange, placeholder, style }) {
  const [active, setActive] = useState(!!value)
  return (
    <div style={{ position: 'relative' }}>
      {(active || value) && (
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: '#888888', fontSize: 14, pointerEvents: 'none', zIndex: 1,
          fontFamily: 'inherit',
        }}>$</span>
      )}
      <input
        className="field-input"
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value || ''}
        style={{ paddingLeft: (active || value) ? 24 : 12, ...style }}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(!!value)}
        onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
      />
    </div>
  )
}

export default function Step5Financial({ data, onChange, leadType, onNext, onBack, onCancel, onFollowUp }) {
  const [occQuery,       setOccQuery]       = useState(data.occupation || '')
  const [occSuggestions, setOccSuggestions] = useState([])
  const [occOpen,        setOccOpen]        = useState(false)

  function set(field, val) {
    onChange({ ...data, [field]: val })
  }

  function handleOccInput(e) {
    const q = e.target.value
    setOccQuery(q)
    set('occupation', q)
    if (q.length >= 1) {
      setOccSuggestions(searchOccupations(q))
      setOccOpen(true)
    } else {
      setOccOpen(false)
    }
  }

  function selectOccupation(name) {
    setOccQuery(name)
    set('occupation', name)
    setOccSuggestions([])
    setOccOpen(false)
  }

  function clearMortgage() {
    onChange({ ...data, hasMortgage: false, mortgageBalance: '', mortgagePayment: '', yearsRemaining: '', homeValue: '', equity: '' })
  }

  function clearInsurance() {
    onChange({ ...data, hasInsurance: false, insCompany: '', insCoverage: '', insPremium: '', insYear: '' })
  }

  const equity = data.homeValue && data.mortgageBalance
    ? Number(data.homeValue) - Number(data.mortgageBalance)
    : null

  const isFEorVet = leadType === 'final_expense' || leadType === 'veteran'

  return (
    <div className="animate-in">
      <div className="step-header">
        <div className="step-eyebrow">Step 5 of 7</div>
        <h1 className="step-title">Financial Overview</h1>
        <p className="step-subtitle">Used to determine recommended coverage amount and identify protection gaps.</p>
      </div>

      <div className="card">
        {/* Income & Employment */}
        <div className="section-eyebrow">Income &amp; Employment</div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label className="field-label">Monthly Income ($)</label>
          <input className="field-input" type="number" min="0" placeholder="e.g. 4000" value={data.income} onChange={e => set('income', e.target.value)} />
        </div>

        {/* Occupation */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div className="field">
            <label className="field-label">Occupation</label>
            <input
              className="field-input"
              type="text"
              placeholder="Type to search — e.g. Teacher, Nurse, Driver..."
              value={occQuery}
              onChange={handleOccInput}
              onFocus={() => { if (occQuery.length >= 1) { setOccSuggestions(searchOccupations(occQuery)); setOccOpen(true) } }}
              onBlur={() => setTimeout(() => setOccOpen(false), 180)}
              autoComplete="off"
            />
          </div>
          {occOpen && occSuggestions.length > 0 && (
            <div className="med-dropdown" style={{ maxHeight: 192 }}>
              {occSuggestions.map((name, i) => (
                <div
                  key={i}
                  className="med-dropdown-item"
                  onMouseDown={() => selectOccupation(name)}
                >
                  <div className="med-item-name">{name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SSI */}
        <div className="field" style={{ marginBottom: 16 }}>
          <label className="field-label">Social Security / Disability Monthly Income ($)</label>
          <input className="field-input" type="number" min="0" placeholder="e.g. 1200 (if applicable)" value={data.ssi || ''} onChange={e => set('ssi', e.target.value)} />
        </div>

        <hr className="section-divider" />

        {/* Mortgage */}
        <div className="section-eyebrow">Mortgage</div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Do they have a mortgage?</label>
          <div className="radio-row">
            <label className="radio-pill">
              <input type="radio" name="hasMortgage" checked={!!data.hasMortgage} onChange={() => set('hasMortgage', true)} />
              <span className="radio-pill-label">Yes</span>
            </label>
            <label className="radio-pill">
              <input type="radio" name="hasMortgage" checked={!data.hasMortgage} onChange={clearMortgage} />
              <span className="radio-pill-label">No</span>
            </label>
          </div>
        </div>

        {data.hasMortgage && (
          <div className="sub-section" style={{ marginBottom: 16 }}>
            <div className="form-grid grid-2" style={{ marginBottom: 16 }}>
              <div className="field">
                <label className="field-label">Mortgage Balance ($)</label>
                <input className="field-input" type="number" min="0" placeholder="e.g. 185000" value={data.mortgageBalance} onChange={e => set('mortgageBalance', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Monthly Payment ($)</label>
                <input className="field-input" type="number" min="0" placeholder="e.g. 1250" value={data.mortgagePayment} onChange={e => set('mortgagePayment', e.target.value)} />
              </div>
            </div>
            <div className="form-grid grid-2" style={{ marginBottom: 12 }}>
              <div className="field">
                <label className="field-label">Years Remaining</label>
                <input className="field-input" type="number" min="1" max="30" placeholder="e.g. 22" value={data.yearsRemaining} onChange={e => set('yearsRemaining', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Home Value ($)</label>
                <input className="field-input" type="number" min="0" placeholder="e.g. 280000" value={data.homeValue} onChange={e => set('homeValue', e.target.value)} />
              </div>
            </div>
            {equity !== null && (
              <p style={{ fontSize: 13, color: '#555555' }}>
                Estimated equity:{' '}
                <strong style={{ color: equity >= 0 ? '#4caf84' : '#e05c5c' }}>
                  ${equity.toLocaleString()}
                </strong>
              </p>
            )}
          </div>
        )}

        <hr className="section-divider" />

        {/* Existing Insurance */}
        <div className="section-eyebrow">Existing Life Insurance</div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Do they have existing life insurance?</label>
          <div className="radio-row">
            <label className="radio-pill">
              <input type="radio" name="hasInsurance" checked={!!data.hasInsurance} onChange={() => set('hasInsurance', true)} />
              <span className="radio-pill-label">Yes</span>
            </label>
            <label className="radio-pill">
              <input type="radio" name="hasInsurance" checked={!data.hasInsurance} onChange={clearInsurance} />
              <span className="radio-pill-label">No</span>
            </label>
          </div>
        </div>

        {data.hasInsurance && (
          <div className="sub-section" style={{ marginBottom: 16 }}>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">Company</label>
              <input
                className="field-input"
                type="text"
                placeholder="e.g. MetLife, Prudential..."
                value={data.insCompany || ''}
                onChange={e => set('insCompany', e.target.value)}
              />
            </div>
            <div className="form-grid grid-2" style={{ marginBottom: 12 }}>
              <div className="field">
                <label className="field-label">Coverage Amount</label>
                <DollarInput
                  value={data.insCoverage}
                  onChange={v => set('insCoverage', v)}
                  placeholder="Coverage amount"
                />
              </div>
              <div className="field">
                <label className="field-label">Monthly Premium</label>
                <DollarInput
                  value={data.insPremium}
                  onChange={v => set('insPremium', v)}
                  placeholder="Monthly premium"
                />
              </div>
            </div>
            <div className="field">
              <label className="field-label">Effective Year</label>
              <input
                className="field-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2018"
                maxLength={4}
                value={data.insYear || ''}
                onChange={e => set('insYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
          </div>
        )}

        {/* Method of Final Disposition — FE and Veteran only */}
        {isFEorVet && (
          <>
            <hr className="section-divider" />
            <div className="section-eyebrow">Method of Final Disposition</div>
            <div style={{ marginBottom: 16 }}>
              <label className="field-label" style={{ marginBottom: 10, display: 'block' }}>
                Preferred method of final disposition
                <span style={{ marginLeft: 8, fontSize: 11, color: '#e05c5c', fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}>
                  Required
                </span>
              </label>
              <div className="radio-row">
                {[
                  { value: 'burial',    label: 'Burial',    sub: 'Bronze $10k · Silver $15k · Gold $20k' },
                  { value: 'cremation', label: 'Cremation', sub: 'Bronze $7k · Silver $10k · Gold $15k' },
                ].map(opt => {
                  const isActive = data.finalDisposition === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('finalDisposition', opt.value)}
                      style={{
                        flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isActive ? '#7c3aed' : '#2a2a2a'}`,
                        background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all var(--transition)',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#a78bfa' : '#ffffff', marginBottom: 4 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: isActive ? 'rgba(167,139,250,0.7)' : '#555555' }}>
                        {opt.sub}
                      </div>
                    </button>
                  )
                })}
              </div>
              {!data.finalDisposition && (
                <p style={{ fontSize: 12, color: '#555555', marginTop: 8 }}>
                  Selection determines Bronze / Silver / Gold coverage tiers on the results page.
                </p>
              )}
            </div>
          </>
        )}

        <hr className="section-divider" />

        {/* Assets */}
        <div className="section-eyebrow">Assets &amp; Savings</div>

        <div className="form-grid grid-3" style={{ marginBottom: 16 }}>
          <div className="field">
            <label className="field-label">401k / IRA ($)</label>
            <input className="field-input" type="number" min="0" placeholder="e.g. 45000" value={data.k401} onChange={e => set('k401', e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Stocks / Funds ($)</label>
            <input className="field-input" type="number" min="0" placeholder="e.g. 12000" value={data.stocks} onChange={e => set('stocks', e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Savings ($)</label>
            <input className="field-input" type="number" min="0" placeholder="e.g. 8000" value={data.savings} onChange={e => set('savings', e.target.value)} />
          </div>
        </div>

        <hr className="section-divider" />

        {/* Notes */}
        <div className="section-eyebrow">Agent Notes</div>
        <textarea
          className="field-input"
          style={{ minHeight: 90, resize: 'vertical' }}
          placeholder="Client concerns, family situation, objections, follow-up items..."
          value={data.notes}
          onChange={e => set('notes', e.target.value)}
        />
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
