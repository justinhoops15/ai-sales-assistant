const FIELDS = [
  { key: 'mortgage',        label: 'Monthly Mortgage' },
  { key: 'car',             label: 'Car Payments' },
  { key: 'utilities',       label: 'Utilities' },
  { key: 'cableInternet',   label: 'Cable / Internet' },
  { key: 'cellPhones',      label: 'Cell Phones' },
  { key: 'gasoline',        label: 'Gasoline' },
  { key: 'carInsurance',    label: 'Car Insurance' },
  { key: 'foodGroceries',   label: 'Food / Groceries' },
  { key: 'healthInsurance', label: 'Health Insurance' },
  { key: 'lifeInsurance',   label: 'Existing Life Insurance' },
  { key: 'loans',           label: 'Outstanding Loans' },
  { key: 'creditCards',     label: 'Credit Card Payments' },
  { key: 'extras',          label: 'Extras / Other' },
]

export default function Step6Bills({ data, onChange, monthlyIncome, onNext, onBack, onCancel, onFollowUp }) {
  function set(key, val) {
    onChange({ ...data, [key]: val })
  }

  const total = FIELDS.reduce((sum, f) => sum + (parseFloat(data[f.key]) || 0), 0)

  const fmtTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const discretionary    = monthlyIncome - total
  const affordableBudget = discretionary * 0.30

  function fmtCalc(n) {
    const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return (n < 0 ? '-$' : '$') + abs
  }

  return (
    <div className="animate-in">
      <div className="step-header">
        <div className="step-eyebrow">Step 6 of 7</div>
        <h1 className="step-title">Monthly Bills</h1>
        <p className="step-subtitle">
          Break down each monthly obligation. The total auto-calculates as you type.
        </p>
      </div>

      <div className="card">
        <div className="section-eyebrow">Monthly Expenses</div>

        <div className="form-grid grid-2" style={{ marginBottom: 24 }}>
          {FIELDS.map(f => (
            <div key={f.key} className="field">
              <label className="field-label">{f.label} ($)</label>
              <input
                className="field-input"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={data[f.key]}
                onChange={e => set(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Total Monthly Obligations */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid #2a2a2a', borderRadius: 'var(--radius-sm)', marginBottom: 8
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Total Monthly Obligations
          </span>
          <span style={{ fontSize: 26, fontWeight: 600, color: total > 0 ? '#ffffff' : '#555555' }}>
            ${fmtTotal}
          </span>
        </div>

        {/* Discretionary & Budget */}
        {monthlyIncome > 0 && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', marginBottom: 8,
              background: discretionary >= 0 ? 'rgba(76,175,132,0.06)' : 'rgba(224,92,92,0.06)',
              border: `1px solid ${discretionary >= 0 ? 'rgba(76,175,132,0.2)' : 'rgba(224,92,92,0.2)'}`,
              borderRadius: 'var(--radius-sm)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Discretionary Income
                </div>
                <div style={{ fontSize: 11, color: '#555555', marginTop: 2 }}>
                  Monthly income (${monthlyIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}) − total bills
                </div>
              </div>
              <span style={{ fontSize: 24, fontWeight: 600, color: discretionary >= 0 ? '#ffffff' : 'var(--danger)' }}>
                {fmtCalc(discretionary)}
              </span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px',
              background: 'rgba(76,175,132,0.06)',
              border: '1px solid rgba(76,175,132,0.2)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Affordable Coverage Budget
                </div>
                <div style={{ fontSize: 11, color: '#555555', marginTop: 2 }}>30% of discretionary income</div>
              </div>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#4caf84' }}>
                {fmtCalc(affordableBudget)}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="step-actions">
        <div className="step-actions-left">
          <button className="btn btn-secondary" onClick={onBack}>Back</button>
          <button className="btn btn-cancel"   onClick={onCancel}>Cancel</button>
          <button className="btn btn-followup" onClick={onFollowUp}>Not Sold / Follow Up</button>
        </div>
        <button className="btn btn-primary" onClick={onNext}>Run Underwriting</button>
      </div>
    </div>
  )
}
