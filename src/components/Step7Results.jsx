import { useState } from 'react'

const LEAD_LABELS = {
  mortgage_protection: 'Mortgage Protection',
  final_expense:       'Final Expense',
  veteran:             'Veteran',
}

const TOBACCO_LABELS = {
  cigarettes:      'Cigarettes',
  cigars:          'Cigars',
  chewing_tobacco: 'Chewing Tobacco',
  vaping:          'Vaping',
}

// Maps tier string → badge CSS class suffix
const TIER_BADGE_CLASS = {
  'Preferred':     'badge-preferred',
  'Level':         'badge-level',
  'Standard Plus': 'badge-standard-plus',
  'Standard':      'badge-standard',
  'Graded':        'badge-graded',
  'Table':         'badge-standard',
  'Modified':      'badge-modified',
  'Guaranteed':    'badge-guaranteed',
}

const CONF_BADGE_CLASS = {
  High:   'badge-high',
  Medium: 'badge-medium',
  Low:    'badge-low',
}

// Bronze/Silver/Gold tier configs — use inline styles for dynamic colors
const TIER_CONFIG = {
  bronze: {
    label:       'Bronze',
    sub:         '50% of recommended',
    color:       '#cd7f32',
    borderBase:  'rgba(205,127,50,0.4)',
    borderActive:'#cd7f32',
    bgActive:    'rgba(205,127,50,0.08)',
  },
  silver: {
    label:       'Silver',
    sub:         '75% of recommended',
    color:       '#b0b8c4',
    borderBase:  'rgba(176,184,196,0.4)',
    borderActive:'#b0b8c4',
    bgActive:    'rgba(176,184,196,0.08)',
  },
  gold: {
    label:       'Gold',
    sub:         '100% recommended',
    color:       '#c9a84c',
    borderBase:  'rgba(201,168,76,0.4)',
    borderActive:'#c9a84c',
    bgActive:    'rgba(201,168,76,0.08)',
  },
}

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

function roundK(n) {
  return Math.max(1000, Math.round(n / 1000) * 1000)
}

function tierFace(recommendedFace, tier, tierOverride) {
  if (tierOverride?.[tier] != null) return tierOverride[tier]
  if (tier === 'bronze') return roundK(recommendedFace * 0.50)
  if (tier === 'silver') return roundK(recommendedFace * 0.75)
  if (tier === 'gold')   return recommendedFace
  return null
}

export default function Step7Results({
  results,
  formData,
  agentInfo,
  clientName,
  onNewAppointment,
  onBack,
  onSelectApplication,
  onCancel,
  onFollowUp,
}) {
  const { approved, declined, allGraded2 } = results
  const client    = formData.clientInfo
  const financial = formData.financial

  const hasTermResults = approved.some(r => r.productCategory === 'term')
  const hasWLResults   = approved.some(r => r.productCategory === 'WL')
  const showToggle     = hasTermResults && hasWLResults

  const [productFilter, setProductFilter] = useState(
    showToggle ? 'all' : hasTermResults ? 'term' : 'WL'
  )
  const [cardSel, setCardSel] = useState({})
  const [showAll, setShowAll] = useState(false)

  const TOP_COUNT = 3

  function setSel(resultKey, updates) {
    setCardSel(prev => ({
      ...prev,
      [resultKey]: { tier: null, customAmount: '', ...prev[resultKey], ...updates },
    }))
  }

  function getSelectedFace(rec) {
    const sel = cardSel[rec.resultKey]
    if (!sel) return null
    if (sel.tier) return tierFace(rec.recommendedFace, sel.tier, rec.tierOverride)
    if (sel.customAmount) {
      const n = parseInt(String(sel.customAmount).replace(/[^0-9]/g, ''))
      return n > 0 ? n : null
    }
    return null
  }

  const filteredByType = approved.filter(r => {
    if (productFilter === 'term') return r.productCategory === 'term'
    if (productFilter === 'WL')   return r.productCategory === 'WL'
    return true
  })

  const topResults       = filteredByType.slice(0, TOP_COUNT)
  const remainingResults = filteredByType.slice(TOP_COUNT)
  const visibleResults   = showAll ? filteredByType : topResults

  const existingCoverage = Number(financial.insCoverage) || 0

  if (!approved.length) {
    return (
      <div className="animate-in">
        <div className="step-header">
          <div className="step-eyebrow">Step 7 of 7 — Results</div>
          <h1 className="step-title">No Qualifying Carriers</h1>
          <p className="step-subtitle">
            Based on this health profile no carriers have qualifying products.
            Consider Corebridge Guaranteed Issue or revise conditions in Step 3.
          </p>
        </div>
        {declined.length > 0 && <DeclinedSection declined={declined} />}
        <div className="step-actions">
          <div className="step-actions-left">
            <button className="btn btn-secondary" onClick={onBack}>Revise Bills</button>
            <button className="btn btn-cancel"   onClick={onCancel}>Cancel</button>
            <button className="btn btn-followup" onClick={onFollowUp}>Not Sold / Follow Up</button>
          </div>
          <button className="btn btn-primary" onClick={onNewAppointment}>New Appointment</button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="step-header">
        <div className="step-eyebrow">Step 7 of 7 — Results</div>
        <h1 className="step-title">Carrier Recommendations</h1>
        <p className="step-subtitle">
          {approved.length} qualifying carrier{approved.length !== 1 ? 's' : ''}
          {declined.length > 0 && ` · ${declined.length} declined`}
          {' · ranked by est. 1st-year commission'}
        </p>
      </div>

      {/* All-graded warning — shown when every qualifying carrier has a 2-year waiting period */}
      {allGraded2 && (
        <div className="all-graded-warning">
          <span className="all-graded-warning-icon">⚠</span>
          <span>
            All available carriers for this client result in a 2-year graded benefit.
            Review carefully before proceeding.
          </span>
        </div>
      )}

      {/* Client summary bar */}
      <div className="client-bar">
        {clientName && (
          <div className="client-bar-item">
            <span className="client-bar-key">Client</span>
            <span className="client-bar-val">{clientName}</span>
          </div>
        )}
        <div className="client-bar-item">
          <span className="client-bar-key">Age</span>
          <span className="client-bar-val">{client.age}</span>
        </div>
        <div className="client-bar-item">
          <span className="client-bar-key">Sex</span>
          <span className="client-bar-val">{client.sex === 'male' ? 'Male' : 'Female'}</span>
        </div>
        <div className="client-bar-item">
          <span className="client-bar-key">Tobacco</span>
          <span className="client-bar-val">
            {client.tobacco ? `Yes — ${TOBACCO_LABELS[client.tobaccoType] || 'User'}` : 'No'}
          </span>
        </div>
        <div className="client-bar-item">
          <span className="client-bar-key">Lead Type</span>
          <span className="client-bar-val">{LEAD_LABELS[formData.leadType] || formData.leadType}</span>
        </div>
        {existingCoverage > 0 && (
          <div className="client-bar-item">
            <span className="client-bar-key">Existing Coverage</span>
            <span className="client-bar-val">{fmt(existingCoverage)}</span>
          </div>
        )}
      </div>

      {/* Term / WL toggle */}
      {showToggle && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['all', 'All Products'], ['term', 'Term Life'], ['WL', 'Whole Life']].map(([val, lbl]) => (
            <button
              key={val}
              className={productFilter === val ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setProductFilter(val)}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* Result cards */}
      <div className="results-list" style={{ marginBottom: 16 }}>
        {visibleResults.map((rec, idx) => {
          const sel          = cardSel[rec.resultKey] || {}
          const selectedFace = getSelectedFace(rec)

          return (
            <div key={rec.resultKey} className="result-card">
              {/* Rank */}
              <div className="result-card-rank" style={{ color: idx === 0 ? '#c9a84c' : '#555555' }}>
                {idx === 0 ? 'Top Recommendation' : `#${idx + 1}`}
              </div>

              {/* Carrier header */}
              <div className="result-top">
                <div>
                  <div className="result-carrier-name">{rec.name}</div>
                  <div className="result-product-name">
                    {rec.product.name} &middot; AM Best {rec.amBest}
                  </div>
                </div>
                <div className="result-badges">
                  {rec.productLabel && rec.productLabel !== 'Final Expense' && (
                    <span className="badge badge-am">{rec.productLabel}</span>
                  )}
                  <span className={`badge ${TIER_BADGE_CLASS[rec.tier] || 'badge-standard'}`}>
                    {rec.tier}
                  </span>
                  <span className={`badge ${CONF_BADGE_CLASS[rec.confidence] || 'badge-medium'}`}>
                    {rec.confidence} Confidence
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
                <div className="result-metric">
                  <div className="result-metric-label">Commission Rate</div>
                  <div className="result-metric-value gold">
                    {rec.commissionPct != null ? `${rec.commissionPct}%` : '—'}
                  </div>
                </div>
                <div className="result-metric">
                  <div className="result-metric-label">AM Best</div>
                  <div className="result-metric-value" style={{ fontSize: 18 }}>{rec.amBest}</div>
                </div>
                <div className="result-metric">
                  <div className="result-metric-label">Waiting Period</div>
                  <div className="result-metric-value" style={{ fontSize: 18 }}>
                    {rec.waitingPeriod > 0 ? `${rec.waitingPeriod} yr` : 'None'}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <p className="result-explanation">{rec.explanation}</p>

              {/* Key advantages */}
              {rec.keyAdvantages?.length > 0 && (
                <div className="result-flags-row" style={{ marginBottom: 16 }}>
                  {rec.keyAdvantages.slice(0, 3).map((adv, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
                      color: '#22d3ee',
                    }}>
                      {adv}
                    </span>
                  ))}
                </div>
              )}

              {/* Underwriting flags */}
              {rec.flags.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#555555', marginBottom: 8, fontWeight: 500 }}>
                    Underwriting Flags
                  </div>
                  <div className="result-flags-row">
                    {rec.flags.map((f, i) => (
                      <span key={i} className="flag-tag" title={f.note || ''}>
                        {f.condition} &rarr; {f.decision}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rec.medFlags?.length > 0 && (
                <div className="result-flags-row" style={{ marginBottom: 16 }}>
                  {rec.medFlags.map((m, i) => (
                    <span key={i} className="med-flag-tag">{m.name}</span>
                  ))}
                </div>
              )}

              {/* Coverage Tier Selection */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, marginTop: 8 }}>
                <div className="section-eyebrow" style={{ marginBottom: 12 }}>Select Coverage Amount</div>

                {/* Bronze / Silver / Gold buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {(['bronze', 'silver', 'gold']).map(t => {
                    const tc       = TIER_CONFIG[t]
                    const face     = tierFace(rec.recommendedFace, t, rec.tierOverride)
                    const isActive = sel.tier === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSel(rec.resultKey, { tier: t, customAmount: '' })}
                        style={{
                          padding: 12, borderRadius: 8,
                          border: `2px solid ${isActive ? tc.borderActive : tc.borderBase}`,
                          background: isActive ? tc.bgActive : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', textAlign: 'center',
                          transition: 'all 150ms ease', outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: tc.color }}>{tc.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 2, color: isActive ? tc.color : '#ffffff' }}>
                          {fmt(face)}
                        </div>
                        <div style={{ fontSize: 10, color: '#555555' }}>{tc.sub}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Custom amount */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label className="field-label">Custom Amount ($)</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="Enter any amount..."
                      value={sel.customAmount || ''}
                      onChange={e => setSel(rec.resultKey, { tier: null, customAmount: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    disabled={!selectedFace}
                    style={{ flexShrink: 0, padding: '10px 20px' }}
                    onClick={() => { if (selectedFace) onSelectApplication({ rec, face: selectedFace }) }}
                  >
                    Confirm Selection
                  </button>
                </div>

                {selectedFace && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#22d3ee' }}>
                    Selected: {fmt(selectedFace)}
                    {sel.tier && ` (${TIER_CONFIG[sel.tier].label})`}
                  </div>
                )}
              </div>

              {/* Waiting period notice */}
              {rec.waitingPeriod > 0 && (
                <div className="waiting-notice" style={{ marginTop: 12 }}>
                  {rec.waitingPeriod}-year graded benefit — limited natural-cause payout in years 1–{rec.waitingPeriod}.
                </div>
              )}

              {/* Tobacco note */}
              {client.tobacco && rec.tobaccoRule && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#555555', fontStyle: 'italic' }}>
                  Tobacco: {rec.tobaccoRule}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* View all toggle */}
      {remainingResults.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', border: '1px dashed #2a2a2a', fontSize: 13, padding: '10px 20px' }}
            onClick={() => setShowAll(v => !v)}
          >
            {showAll
              ? `Show Top ${TOP_COUNT} Only`
              : `View All Qualifying Carriers (${remainingResults.length} more)`}
          </button>
        </div>
      )}

      {/* Declined */}
      {declined.length > 0 && <DeclinedSection declined={declined} />}

      {/* Agent notes */}
      {financial.notes && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-eyebrow">Agent Notes</div>
          <p style={{ fontSize: 14, color: '#888888', whiteSpace: 'pre-wrap' }}>{financial.notes}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 11, color: '#555555', lineHeight: 1.6 }}>
        <strong style={{ color: '#888888' }}>Disclaimer:</strong> Premium estimates are for illustration purposes only.
        Actual premiums are determined by each carrier's underwriting review.
        Commission percentages reflect your stated FFL contract level.
      </div>

      {/* Actions */}
      <div className="step-actions">
        <div className="step-actions-left">
          <button className="btn btn-secondary" onClick={onBack}>Revise Bills</button>
          <button className="btn btn-cancel"   onClick={onCancel}>Cancel</button>
          <button className="btn btn-followup" onClick={onFollowUp}>Not Sold / Follow Up</button>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>Print Summary</button>
          <button className="btn btn-primary" onClick={onNewAppointment}>New Appointment</button>
        </div>
      </div>
    </div>
  )
}

function DeclinedSection({ declined }) {
  return (
    <div className="declined-section">
      <div className="declined-header">Declined / Not Applicable</div>
      <div className="declined-grid">
        {declined.map((d, i) => (
          <div key={i} className="declined-item">
            <div className="declined-name">{d.name || d.carrierId}</div>
            <div className="declined-reason">{d.reason}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
