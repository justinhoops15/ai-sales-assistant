import { useState } from 'react'

const LEAD_LABELS = {
  mortgage_protection: 'Mortgage Protection',
  final_expense:       'Final Expense',
  veteran:             'Veteran',
}

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

function saveAppointment({ application, clientName, formData, agentInfo }) {
  const { rec, face } = application
  const record = {
    id:               Date.now(),
    savedAt:          new Date().toISOString(),
    agentName:        agentInfo?.name   || '',
    agentLevel:       agentInfo?.contractLevel || '',
    clientName:       clientName || '',
    clientAge:        formData.clientInfo?.age   || '',
    clientSex:        formData.clientInfo?.sex   || '',
    clientState:      formData.clientInfo?.state || '',
    tobacco:          formData.clientInfo?.tobacco || false,
    leadType:         formData.leadType || '',
    carrier:          rec.name,
    carrierId:        rec.carrierId,
    product:          rec.product.name,
    planCode:         application.planCode || '',
    monthlyPremium:   application.monthlyPremium || '',
    tier:             rec.tier,
    face,
    commissionPct:    rec.commissionPct,
    commissionDollar: rec.commissionDollar,
    confidence:       rec.confidence,
  }
  try {
    const existing = JSON.parse(localStorage.getItem('ffl_appointments') || '[]')
    existing.push(record)
    localStorage.setItem('ffl_appointments', JSON.stringify(existing))
  } catch (e) {
    console.error('Failed to save appointment:', e)
  }
  return record
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#555555', fontWeight: 500, marginBottom: 12 }}>
      {children}
    </div>
  )
}

function Row({ label, value, accent, large, warn, success }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid #2a2a2a',
    }}>
      <span style={{ fontSize: 14, color: '#888888', flexShrink: 0, marginRight: 16 }}>{label}</span>
      <span style={{
        fontSize: large ? 20 : 14,
        fontWeight: large || accent || success ? 600 : 500,
        color: warn ? '#fbbf24' : success ? '#4caf84' : accent ? '#a78bfa' : '#ffffff',
      }}>
        {value}
      </span>
    </div>
  )
}

export default function AppointmentSummary({
  application,
  clientName,
  formData,
  agentInfo,
  onBack,
  onNewAppointment,
}) {
  const { rec, face } = application
  const client = formData.clientInfo

  const [saved,    setSaved]    = useState(false)
  const [saveTime, setSaveTime] = useState(null)

  function handleMarkSold() {
    saveAppointment({ application, clientName, formData, agentInfo })
    setSaved(true)
    setSaveTime(new Date().toLocaleTimeString())
  }

  return (
    <div className="animate-in" style={{ maxWidth: 672, margin: '0 auto' }}>
      <div className="step-header">
        <div className="step-eyebrow">Appointment Summary</div>
        <h1 className="step-title">
          {saved ? 'Marked as Sold' : 'Pre-Approved Summary'}
        </h1>
        <p className="step-subtitle">
          {saved
            ? `Appointment saved at ${saveTime}. Great work!`
            : 'Review all details, then print or mark as sold.'}
        </p>
      </div>

      {/* Printable summary card */}
      <div className="card" id="appointment-print-area" style={{ padding: 0 }}>
        {/* Agent + date header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #2a2a2a' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555555', marginBottom: 4 }}>Agent</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>{agentInfo?.name || '—'}</div>
            <div style={{ fontSize: 12, color: '#888888' }}>Contract Level: {agentInfo?.contractLevel}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555555', marginBottom: 4 }}>Date</div>
            <div style={{ fontSize: 14, color: '#ffffff' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Client Information */}
          <SectionLabel>Client Information</SectionLabel>
          <Row label="Name"      value={clientName || '—'} />
          <Row label="Age"       value={client.age} />
          <Row label="Sex"       value={client.sex === 'male' ? 'Male' : 'Female'} />
          {client.state && <Row label="State" value={client.state} />}
          <Row label="Tobacco"   value={client.tobacco ? 'Yes' : 'No'} />
          <Row label="Lead Type" value={LEAD_LABELS[formData.leadType] || formData.leadType} />

          <hr className="section-divider" />

          {/* Carrier & Product */}
          <SectionLabel>Carrier &amp; Product</SectionLabel>
          <Row label="Carrier"             value={rec.name} />
          <Row label="Product"             value={rec.product.name} />
          {application.planCode && (
            <Row label="Plan Code"         value={application.planCode} />
          )}
          <Row label="AM Best"             value={rec.amBest} />
          <Row label="Underwriting Tier"   value={rec.tier} accent />
          <Row label="Confidence"          value={rec.confidence} />
          {rec.waitingPeriod > 0 && (
            <Row label="Waiting Period"    value={`${rec.waitingPeriod} year graded benefit`} warn />
          )}

          <hr className="section-divider" />

          {/* Coverage & Commission */}
          <SectionLabel>Coverage &amp; Commission</SectionLabel>
          <Row label="Selected Coverage"    value={fmt(face)} large />
          {application.monthlyPremium && (
            <Row label="Monthly Premium"    value={`$${parseFloat(application.monthlyPremium).toFixed(2)}`} accent />
          )}
          <Row label="Commission Rate"      value={rec.commissionPct != null ? `${rec.commissionPct}%` : '—'} accent />
          {application.monthlyPremium && rec.commissionPct != null && (
            <Row
              label="Agent 1st Year Earnings"
              value={`$${Math.round(parseFloat(application.monthlyPremium) * 12 * (rec.commissionPct / 100)).toLocaleString()}`}
              success
            />
          )}

          {/* Financial Snapshot */}
          {(formData.financial.income || formData.financial.mortgageBalance) && (
            <>
              <hr className="section-divider" />
              <SectionLabel>Financial Snapshot</SectionLabel>
              {formData.financial.income && (
                <Row label="Monthly Income" value={fmt(Number(formData.financial.income))} />
              )}
              {formData.financial.income && (
                <Row label="Annual Income"  value={fmt(Number(formData.financial.income) * 12)} />
              )}
              {formData.financial.mortgageBalance && (
                <Row label="Mortgage Balance" value={fmt(Number(formData.financial.mortgageBalance))} />
              )}
              {formData.financial.notes && (
                <div style={{ marginTop: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: '#555555', marginBottom: 4 }}>Agent Notes</div>
                  <div style={{ fontSize: 13, color: '#888888', whiteSpace: 'pre-wrap' }}>{formData.financial.notes}</div>
                </div>
              )}
            </>
          )}

          {/* Underwriting Flags */}
          {rec.flags?.length > 0 && (
            <>
              <hr className="section-divider" />
              <SectionLabel>Underwriting Flags</SectionLabel>
              {rec.flags.map((f, i) => (
                <Row key={i} label={f.condition} value={f.decision} warn />
              ))}
            </>
          )}

          {/* Saved indicator */}
          {saved && (
            <div style={{
              marginTop: 20, padding: '12px 16px',
              background: 'rgba(76,175,132,0.08)', border: '1px solid rgba(76,175,132,0.25)',
              borderRadius: 8, textAlign: 'center', fontSize: 13, color: '#4caf84', fontWeight: 600,
            }}>
              Saved to appointment history at {saveTime}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>Print Summary</button>
          {!saved && (
            <button className="btn btn-success" onClick={handleMarkSold}>
              Mark as Sold
            </button>
          )}
          <button className="btn btn-primary" onClick={onNewAppointment}>New Appointment</button>
        </div>
      </div>
    </div>
  )
}
