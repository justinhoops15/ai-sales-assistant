import { useState } from 'react'

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

const PLAN_CODES = {
  FE_EXPRESS:      ['FE Express Solution'],
  FE_IMMEDIATE:    ['Immediate Solution'],
  FE_10PAY:        ['10-Pay Solution'],
  FE_EASY:         ['Easy Solution'],
  EAGLE_1:         ['Eagle Select 1 (Level)'],
  EAGLE_2:         ['Eagle Select 2 (Standard)'],
  EAGLE_3:         ['Eagle Select 3 (Graded)'],
  ADVANTAGE_WL:    ['Advantage WL'],
  HMS125:          ['Term 125', 'CBO 100', 'Term 100', 'CBO 50'],
  CBO100:          ['CBO 100 – 20yr', 'CBO 100 – 25yr', 'CBO 100 – 30yr'],
  TERM100:         ['Term 100 (to age 100)'],
  SC_IMM:          ['Senior Choice Immediate'],
  SC_GRAD:         ['Senior Choice Graded'],
  HOME_PROT:       ['Home Protector – 15yr', 'Home Protector – 20yr', 'Home Protector – 30yr'],
  EASY_TERM:       ['Easy Term – 10yr', 'Easy Term – 20yr', 'Easy Term – 30yr'],
  LP_LEVEL:        ['Living Promise Level'],
  LP_GRADED:       ['Living Promise Graded'],
  TLE:             ['Term Life Express – 10yr', 'Term Life Express – 15yr', 'Term Life Express – 20yr', 'Term Life Express – 30yr'],
  IULE:            ['IUL Express'],
  PLANRIGHT_PREF:  ['PlanRight Preferred'],
  PLANRIGHT_STAND: ['PlanRight Standard'],
  PLANRIGHT_BASIC: ['PlanRight Basic'],
  YOUR_TERM:       ['Your Term Advantage Plus – 10yr', 'Your Term Advantage Plus – 20yr', 'Your Term Advantage Plus – 30yr'],
  AETNA_PREF:      ['Aetna Preferred Plan'],
  AETNA_STAND:     ['Aetna Standard Plan'],
  AETNA_MOD:       ['Aetna Modified Plan'],
  TRUSTAGE_GAWL:   ['TruStage Guaranteed WL'],
  TERM_PRIME:      ['Term Life Prime – 10yr', 'Term Life Prime – 15yr', 'Term Life Prime – 20yr', 'Term Life Prime – 25yr', 'Term Life Prime – 30yr'],
  TERM_CHOICE:     ['Term Life Choice – 10yr', 'Term Life Choice – 15yr', 'Term Life Choice – 20yr', 'Term Life Choice – 25yr', 'Term Life Choice – 30yr'],
  TRUSTAGE_TAWL:   ['TruStage Advantage WL'],
  TERM_VITALITY:   ['Term with Vitality – 10yr', 'Term with Vitality – 15yr', 'Term with Vitality – 20yr', 'Term with Vitality – 25yr', 'Term with Vitality – 30yr'],
  PROT_TERM:       ['Protection Term – 10yr', 'Protection Term – 15yr', 'Protection Term – 20yr', 'Protection Term – 25yr', 'Protection Term – 30yr'],
  GIWL:            ['Guaranteed Issue WL'],
  SELECT_TERM:     ['Select-A-Term – 10yr', 'Select-A-Term – 15yr', 'Select-A-Term – 20yr', 'Select-A-Term – 25yr', 'Select-A-Term – 30yr', 'Select-A-Term – 35yr'],
  QOL_FLEX:        ['QoL Flex Term – 10yr', 'QoL Flex Term – 15yr', 'QoL Flex Term – 20yr', 'QoL Flex Term – 25yr', 'QoL Flex Term – 30yr'],
  NV_LEVEL:        ['New Vista Level'],
  NV_GRADED:       ['New Vista Graded'],
  NV_MOD:          ['New Vista Modified'],
}

function CardRow({ label, value, accent, large, warn, success }) {
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

export default function ApplicationScreen({
  application,
  clientName,
  onPreApproved,
  onDeclined,
  onBack,
}) {
  const { rec, face } = application
  const codes = PLAN_CODES[rec.product.id] || [rec.product.name]

  const [planCode,       setPlanCode]       = useState(codes[0] || '')
  const [monthlyPremium, setMonthlyPremium] = useState('')

  return (
    <div className="animate-in" style={{ maxWidth: 672, margin: '0 auto' }}>
      <div className="step-header">
        <div className="step-eyebrow">Application Review</div>
        <h1 className="step-title">Submit Application</h1>
        <p className="step-subtitle">
          Select the plan code, enter the quoted monthly premium, then mark as Pre-Approved or Declined.
        </p>
      </div>

      <div className="card">
        <div className="section-eyebrow">Application Details</div>

        <CardRow label="Client"             value={clientName || '—'} />
        <CardRow label="Carrier"            value={rec.name} />
        <CardRow label="AM Best Rating"     value={rec.amBest} />
        <CardRow label="Underwriting Tier"  value={rec.tier} accent />
        <CardRow label="Selected Coverage"  value={fmt(face)} large />

        {/* Plan Code dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2a2a2a' }}>
          <span style={{ fontSize: 14, color: '#888888', flexShrink: 0, marginRight: 16 }}>Plan Code</span>
          <select
            value={planCode}
            onChange={e => setPlanCode(e.target.value)}
            style={{
              background: '#1e1e1e', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 'var(--radius-sm)',
              color: '#22d3ee', fontSize: 14, fontWeight: 600, padding: '6px 12px',
              cursor: 'pointer', outline: 'none', minWidth: 220, fontFamily: 'inherit',
              transition: 'border-color 150ms ease',
            }}
          >
            {codes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Monthly Premium input */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2a2a2a' }}>
          <span style={{ fontSize: 14, color: '#888888', flexShrink: 0, marginRight: 16 }}>Monthly Premium ($)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter quoted amount"
            value={monthlyPremium}
            onChange={e => setMonthlyPremium(e.target.value)}
            style={{
              background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 'var(--radius-sm)',
              color: '#ffffff', fontSize: 14, fontWeight: 500, padding: '6px 12px',
              minWidth: 160, textAlign: 'right', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 150ms ease',
            }}
            onFocus={e => e.target.style.borderColor = '#22d3ee'}
            onBlur={e => e.target.style.borderColor = '#2a2a2a'}
          />
        </div>

        {rec.waitingPeriod > 0 && (
          <CardRow
            label="Waiting Period"
            value={`${rec.waitingPeriod} year graded benefit`}
            warn
          />
        )}
      </div>

      {/* Decision buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
        <button
          onClick={() => onPreApproved({ planCode, monthlyPremium })}
          style={{
            padding: '18px 24px', background: 'rgba(76,175,132,0.1)',
            border: '2px solid rgba(76,175,132,0.4)', color: '#4caf84',
            fontWeight: 700, fontSize: 15, borderRadius: 8, cursor: 'pointer',
            transition: 'all 150ms ease', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(76,175,132,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(76,175,132,0.1)'}
        >
          Pre-Approved
        </button>
        <button
          onClick={onDeclined}
          style={{
            padding: '18px 24px', background: 'rgba(224,92,92,0.1)',
            border: '2px solid rgba(224,92,92,0.35)', color: '#e05c5c',
            fontWeight: 700, fontSize: 15, borderRadius: 8, cursor: 'pointer',
            transition: 'all 150ms ease', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,92,92,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,92,92,0.1)'}
        >
          Declined
        </button>
      </div>

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2a2a2a' }}>
        <button className="btn btn-ghost" onClick={onBack}>Back to Results</button>
      </div>
    </div>
  )
}
