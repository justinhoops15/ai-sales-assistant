import { useState } from 'react'
import FollowUpModal from './FollowUpModal.jsx'

const LEAD_LABELS = {
  mortgage_protection: 'Mortgage Protection',
  final_expense:       'Final Expense',
  veteran:             'Veteran',
}

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

function saveAppointment({ application, clientName, formData, agentInfo, editingClientId, apptSessionId, policyStatus }) {
  const { rec, face } = application
  const record = {
    id:               Date.now(),
    apptSessionId:    apptSessionId || null,
    savedAt:          new Date().toISOString(),
    agentName:        agentInfo?.name   || '',
    agentLevel:       agentInfo?.contractLevel || '',
    clientName:       clientName || '',
    clientAge:        formData.clientInfo?.age            || '',
    clientDOB:        formData.clientInfo?.dateOfBirth    || '',
    clientSex:        formData.clientInfo?.sex            || '',
    clientState:      formData.clientInfo?.state          || '',
    clientPhone:      formData.clientInfo?.phoneNumber    || '',
    clientEmail:      formData.clientInfo?.clientEmail    || '',
    maritalStatus:    formData.clientInfo?.maritalStatus  || '',
    spouseName:       formData.clientInfo?.spouseName     || '',
    beneficiaries:    formData.clientInfo?.beneficiaries  || [],
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
    dateEnforced:     application.dateEnforced || '',
    insCompany:       formData.financial?.insCompany  || '',
    insCoverage:      formData.financial?.insCoverage || '',
    insPremium:       formData.financial?.insPremium  || '',
    insYear:          formData.financial?.insYear     || '',
    // Policy status: 'approved' | 'underwriting' | 'denied' | 'paid'
    policyStatus:     policyStatus || 'approved',
  }
  try {
    let existing = JSON.parse(localStorage.getItem('ffl_appointments') || '[]')
    // If editing an existing record, replace it instead of appending
    if (editingClientId) {
      existing = existing.filter(r => r.id !== editingClientId)
    }
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
      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
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

// Status selection configs
const STATUS_OPTIONS = [
  {
    id:      'approved',
    label:   'Approved as Applied',
    sub:     'Policy approved on the spot. Counts toward IP and Commission immediately.',
    color:   '#4caf84',
    border:  'rgba(76,175,132,0.5)',
    bg:      'rgba(76,175,132,0.08)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4caf84" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="9"/><polyline points="6 10 8.5 12.5 14 7"/>
      </svg>
    ),
  },
  {
    id:      'underwriting',
    label:   'Sent to Underwriting',
    sub:     'Submitted but pending carrier review. Counts toward AP only. Move to IP when approved.',
    color:   '#f59e0b',
    border:  'rgba(245,158,11,0.5)',
    bg:      'rgba(245,158,11,0.07)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="9"/><polyline points="10 5 10 10 13 13"/>
      </svg>
    ),
  },
  {
    id:      'denied',
    label:   'Denied',
    sub:     'Carrier denied this application. No record is saved. Return to carrier results to select a new option.',
    color:   '#3b82f6',
    border:  'rgba(59,130,246,0.5)',
    bg:      'rgba(59,130,246,0.07)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="9"/><line x1="7" y1="7" x2="13" y2="13"/><line x1="13" y1="7" x2="7" y2="13"/>
      </svg>
    ),
  },
]

export default function AppointmentSummary({
  application,
  clientName,
  formData,
  agentInfo,
  editingClientId,
  apptSessionId,
  onBack,
  onGoToClients,
  onSaveToFollowUp,
  onDenied,
}) {
  const { rec, face } = application
  const client = formData.clientInfo

  const [showFollowUpModal,  setShowFollowUpModal]  = useState(false)
  const [statusSelection,    setStatusSelection]    = useState(null) // 'approved'|'underwriting'|'denied'

  // Advance commission preview (display only — matches existing card/earnings logic)
  const isEthos       = rec.carrierId === 'ETHOS'
  const advanceMonths = isEthos ? 12 : 9
  const advanceComm   = (application.monthlyPremium && rec.commissionPct != null)
    ? Math.round(parseFloat(application.monthlyPremium) * (rec.commissionPct / 100) * advanceMonths)
    : null

  // Save gate — denied only needs a status selection; others need premium + date
  const hasMonthlyPremium = parseFloat(application.monthlyPremium || 0) > 0
  const hasDateEnforced   = /^\d{2}\/\d{2}\/\d{4}$/.test(application.dateEnforced || '')
  const canSell = statusSelection === 'denied'
    ? true                                                   // denied — nothing saved, no data needed
    : hasMonthlyPremium && hasDateEnforced && !!statusSelection

  function handleMarkSold() {
    if (!canSell || !statusSelection) return
    if (statusSelection === 'denied') {
      // Denied — do NOT save to AP/IP; just return to carrier results
      onDenied?.()
    } else {
      // Approved or Underwriting — save the record, then navigate to Clients
      saveAppointment({ application, clientName, formData, agentInfo, editingClientId, apptSessionId, policyStatus: statusSelection })
      onGoToClients()
    }
  }

  return (
    <div className="animate-in" style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      <div className="step-header">
        <div className="step-eyebrow">Appointment Summary</div>
        <h1 className="step-title">Pre-Approved Summary</h1>
        <p className="step-subtitle">Review all details, then print, mark as sold, or save for follow-up.</p>
      </div>

      {/* Printable summary card */}
      <div className="card" id="appointment-print-area" style={{ padding: 0 }}>
        {/* Agent + date header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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

        <div style={{ padding: '24px 28px' }}>

          {/* Two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>

            {/* LEFT COLUMN: Client Info + Coverage & Commission */}
            <div>
              <SectionLabel>Client Information</SectionLabel>
              <Row label="Name"        value={clientName || '—'} />
              <Row label="Age"         value={client.age} />
              {client.dateOfBirth    && <Row label="Date of Birth"  value={client.dateOfBirth} />}
              <Row label="Sex"         value={client.sex === 'male' ? 'Male' : 'Female'} />
              {client.state          && <Row label="State"          value={client.state} />}
              {client.phoneNumber    && <Row label="Phone"          value={client.phoneNumber} />}
              {client.clientEmail   && <Row label="Email"          value={client.clientEmail} />}
              {client.maritalStatus  && <Row label="Marital Status" value={client.maritalStatus} />}
              {client.maritalStatus === 'Married' && client.spouseName && (
                <Row label="Spouse Name" value={client.spouseName} />
              )}
              {(client.beneficiaries || []).filter(b => b.name?.trim()).map((b, i, arr) => (
                <Row
                  key={i}
                  label={i === 0 ? 'Beneficiary' : `Beneficiary ${i + 1}`}
                  value={[b.name, b.relationship, arr.length > 1 ? `${b.percentage}%` : null].filter(Boolean).join(' · ')}
                />
              ))}
              <Row label="Tobacco"     value={client.tobacco ? 'Yes' : 'No'} />
              <Row label="Lead Type"   value={LEAD_LABELS[formData.leadType] || formData.leadType} />

              <hr className="section-divider" />

              <SectionLabel>Coverage &amp; Commission</SectionLabel>
              <Row label="Selected Coverage"    value={fmt(face)} large />
              {application.monthlyPremium && (
                <Row label="Monthly Premium"    value={`$${parseFloat(application.monthlyPremium).toFixed(2)}`} accent />
              )}
              <Row label="Commission Rate" value={rec.commissionPct != null ? `${rec.commissionPct}%` : '—'} accent />
              {advanceComm != null && (
                <Row
                  label={`Advanced Agent Commission (×${advanceMonths} mo${isEthos ? ' — Ethos' : ''})`}
                  value={`$${advanceComm.toLocaleString()}`}
                  success
                />
              )}
            </div>

            {/* RIGHT COLUMN: Carrier & Product + Financial Snapshot */}
            <div>
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

              {(formData.financial.income || formData.financial.mortgageBalance || (formData.financial.hasInsurance && formData.financial.insCompany)) && (
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
                  {formData.financial.hasInsurance && formData.financial.insCompany && (
                    <Row label="Existing Ins. Co." value={formData.financial.insCompany} />
                  )}
                  {formData.financial.hasInsurance && formData.financial.insCoverage && (
                    <Row label="Existing Coverage" value={`$${Number(formData.financial.insCoverage).toLocaleString()}`} />
                  )}
                  {formData.financial.hasInsurance && formData.financial.insPremium && (
                    <Row label="Existing Premium" value={`$${formData.financial.insPremium}/mo`} />
                  )}
                  {formData.financial.notes && (
                    <div style={{ marginTop: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: '#555555', marginBottom: 4 }}>Agent Notes</div>
                      <div style={{ fontSize: 13, color: '#888888', whiteSpace: 'pre-wrap' }}>{formData.financial.notes}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* FULL WIDTH: Underwriting Flags */}
          {rec.flags?.length > 0 && (
            <>
              <hr className="section-divider" />
              <SectionLabel>Underwriting Flags</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
                {rec.flags.map((f, i) => (
                  <Row key={i} label={f.condition} value={f.decision} warn />
                ))}
              </div>
            </>
          )}

          {/* No saved indicator — agent is navigated away immediately on Mark as Sold */}
        </div>
      </div>

      {/* Status Selection — required before completing */}
      <div className="apmt-status-section">
        <div className="apmt-status-heading">
          <span className="apmt-status-heading-text">Select Policy Status</span>
          <span className="apmt-status-heading-sub">Choose the outcome before saving this appointment.</span>
        </div>
        <div className="apmt-status-grid">
          {STATUS_OPTIONS.map(opt => {
            const isActive = statusSelection === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                className={`apmt-status-card${isActive ? ' apmt-status-card-active' : ''}`}
                style={isActive ? {
                  borderColor: opt.border,
                  background:  opt.bg,
                  boxShadow:   `0 0 0 1px ${opt.border}`,
                } : {}}
                onClick={() => setStatusSelection(prev => prev === opt.id ? null : opt.id)}
              >
                <div className="apmt-status-card-icon">{opt.icon}</div>
                <div className="apmt-status-card-label" style={{ color: isActive ? opt.color : undefined }}>
                  {opt.label}
                </div>
                <div className="apmt-status-card-sub">{opt.sub}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="step-actions">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>Print Summary</button>
          <button className="btn btn-followup" onClick={() => setShowFollowUpModal(true)}>
            Save to Follow Up
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button
              className={`btn ${statusSelection === 'denied' ? 'btn-denied-save' : 'btn-success'}`}
              onClick={handleMarkSold}
              disabled={!canSell}
              style={!canSell ? { opacity: 0.38, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
            >
              {statusSelection === 'denied'      ? 'Return to Carriers — Not Saved' :
               statusSelection === 'underwriting' ? 'Save — Sent to Underwriting' :
               statusSelection === 'approved'     ? 'Save — Approved' :
               'Complete & Save'}
            </button>
            {!canSell && (
              <span style={{ fontSize: 11, color: '#555555', textAlign: 'right', lineHeight: 1.4 }}>
                {!statusSelection
                  ? 'Select a policy status above to continue.'
                  : 'Monthly Premium and Date Enforced are required to save.'}
              </span>
            )}
          </div>
        </div>
      </div>

      {showFollowUpModal && (
        <FollowUpModal
          onSave={data => { onSaveToFollowUp(data); setShowFollowUpModal(false) }}
          onBack={() => setShowFollowUpModal(false)}
        />
      )}
    </div>
  )
}
