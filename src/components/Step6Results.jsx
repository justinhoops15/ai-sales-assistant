const LEAD_LABELS = {
  mortgage_protection: 'Mortgage Protection',
  final_expense:       'Final Expense',
  veteran:             'Veteran',
}

const TIER_BADGE = {
  'Preferred':     'badge-preferred',
  'Level':         'badge-level',
  'Standard Plus': 'badge-standard-plus',
  'Standard':      'badge-standard',
  'Graded':        'badge-graded',
  'Table':         'badge-graded',
  'Modified':      'badge-modified',
  'Guaranteed':    'badge-guaranteed',
}

const CONF_BADGE = {
  High:   'badge-high',
  Medium: 'badge-medium',
  Low:    'badge-low',
}

const TOBACCO_LABELS = {
  cigarettes:      'Cigarettes',
  cigars:          'Cigars',
  chewing_tobacco: 'Chewing Tobacco',
  vaping:          'Vaping',
}

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

function fmtMonthly(monthly) {
  if (!monthly) return '—'
  return `${fmt(monthly.low)} – ${fmt(monthly.high)}`
}

import { useState } from 'react'

export default function Step6Results({ results, formData, agentInfo, clientName, onNewAppointment, onBack }) {
  const { approved, declined } = results
  const client    = formData.clientInfo
  const financial = formData.financial

  const hasTermResults = approved.some(r => r.productCategory === 'term')
  const hasWLResults   = approved.some(r => r.productCategory === 'WL')
  const showToggle     = hasTermResults && hasWLResults

  const [productFilter, setProductFilter] = useState(
    showToggle ? 'all' : hasTermResults ? 'term' : 'WL'
  )

  const visibleResults = approved.filter(r => {
    if (productFilter === 'term') return r.productCategory === 'term'
    if (productFilter === 'WL')   return r.productCategory === 'WL'
    return true
  })

  const existingCoverage =
    (Number(financial.workInsurance)    || 0) +
    (Number(financial.privateInsurance) || 0)

  if (!approved.length) {
    return (
      <div className="animate-in">
        <div className="step-header">
          <div className="step-eyebrow">Step 6 of 6 — Results</div>
          <h1 className="step-title">No Qualifying Carriers</h1>
          <p className="step-subtitle">
            Based on this health profile no carriers have qualifying products.
            Consider Corebridge Guaranteed Issue or revise conditions in Step 3.
          </p>
        </div>
        {declined.length > 0 && <DeclinedSection declined={declined} />}
        <div className="step-actions" style={{ marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onBack}>‹ Revise Financial</button>
          <button className="btn btn-primary" onClick={onNewAppointment}>New Appointment ›</button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="step-header">
        <div className="step-eyebrow">Step 6 of 6 — Results</div>
        <h1 className="step-title">Carrier Recommendations</h1>
        <p className="step-subtitle">
          {approved.length} qualifying carrier{approved.length !== 1 ? 's' : ''}
          {declined.length > 0 && ` · ${declined.length} declined`}
          {' · ranked by est. 1st-year commission'}
        </p>
      </div>

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
            {client.tobacco
              ? `Yes — ${TOBACCO_LABELS[client.tobaccoType] || 'User'}`
              : 'No'}
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

      {/* Term / Whole Life toggle */}
      {showToggle && (
        <div style={{ display: 'flex', gap: 8, margin: '16px 0 4px' }}>
          <button
            className={`btn ${productFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13, padding: '8px 18px' }}
            onClick={() => setProductFilter('all')}
          >
            All Products
          </button>
          <button
            className={`btn ${productFilter === 'term' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13, padding: '8px 18px' }}
            onClick={() => setProductFilter('term')}
          >
            Term Life
          </button>
          <button
            className={`btn ${productFilter === 'WL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13, padding: '8px 18px' }}
            onClick={() => setProductFilter('WL')}
          >
            Whole Life
          </button>
        </div>
      )}

      {/* Result cards */}
      <div className="results-list" style={{ marginTop: 12 }}>
        {visibleResults.map((rec, idx) => (
          <div key={rec.resultKey || rec.carrierId + rec.product.id} className="result-card">
            {/* Rank */}
            <div className="result-card-rank">
              {idx === 0
                ? '★ Top Recommendation'
                : `#${idx + 1}`}
            </div>

            {/* Top row: carrier name + badges */}
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
                <span className={`badge ${TIER_BADGE[rec.tier] || 'badge-standard'}`}>
                  {rec.tier}
                </span>
                <span className={`badge ${CONF_BADGE[rec.confidence] || 'badge-medium'}`}>
                  {rec.confidence} Confidence
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="result-metrics">
              <div className="result-metric">
                <div className="result-metric-label">Recommended Face</div>
                <div className="result-metric-value">{fmt(rec.recommendedFace)}</div>
              </div>
              <div className="result-metric">
                <div className="result-metric-label">Est. Monthly Premium</div>
                <div className="result-metric-value" style={{ fontSize: 17 }}>
                  {fmtMonthly(rec.monthlyPremium)}
                </div>
              </div>
              <div className="result-metric">
                <div className="result-metric-label">Commission Rate</div>
                <div className="result-metric-value gold">
                  {rec.commissionPct != null ? `${rec.commissionPct}%` : '—'}
                </div>
              </div>
              <div className="result-metric">
                <div className="result-metric-label">Est. 1st Year Commission</div>
                <div className="result-metric-value" style={{ color: 'var(--success)', fontSize: 22 }}>
                  {rec.commissionDollar != null ? fmt(rec.commissionDollar) : '—'}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="result-explanation">{rec.explanation}</div>

            {/* Key advantages */}
            {rec.keyAdvantages?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {rec.keyAdvantages.slice(0, 3).map((adv, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      color: 'var(--gold)',
                    }}
                  >
                    ✦ {adv}
                  </span>
                ))}
              </div>
            )}

            {/* Underwriting flags */}
            {rec.flags.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 5 }}>
                  Underwriting Flags
                </div>
                <div className="result-flags-row">
                  {rec.flags.map((f, i) => (
                    <span key={i} className="flag-tag" title={f.note || ''}>
                      {f.condition} → {f.decision}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Medication flags */}
            {rec.medFlags?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="result-flags-row">
                  {rec.medFlags.map((m, i) => (
                    <span key={i} className="med-flag-tag">⚠ {m.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting period */}
            {rec.waitingPeriod > 0 && (
              <div className="waiting-notice" style={{ marginTop: 10 }}>
                ⚠ {rec.waitingPeriod}-year graded benefit — limited payout in years 1–{rec.waitingPeriod}
                for natural causes. Accidental death typically covered from day 1.
              </div>
            )}

            {/* Tobacco rule */}
            {client.tobacco && rec.tobaccoRule && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Tobacco note: {rec.tobaccoRule}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Declined */}
      {declined.length > 0 && <DeclinedSection declined={declined} />}

      {/* Agent notes */}
      {financial.notes && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-eyebrow">Agent Notes</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'pre-wrap', margin: 0 }}>
            {financial.notes}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: 24, padding: '12px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8, fontSize: 11,
        color: 'var(--text-muted)', lineHeight: 1.5,
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Disclaimer:</strong> Premium estimates are for
        illustration purposes only and are not guaranteed. Actual premiums are determined by each carrier's
        underwriting review. Commission percentages reflect your stated FFL contract level. Consult official
        carrier rate guides before presenting to clients.
      </div>

      {/* Actions */}
      <div className="step-actions" style={{ marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onBack}>‹ Revise Financial</button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>Print Summary</button>
          <button className="btn btn-primary" onClick={onNewAppointment}>+ New Appointment</button>
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
