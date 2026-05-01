import { useState, useMemo, useEffect, useRef } from 'react'

const LEAD_LABELS = {
  mortgage_protection: 'Mortgage Protection',
  final_expense:       'Final Expense',
  veteran:             'Veteran',
}

const LEAD_COLORS = {
  mortgage_protection: { bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.25)',  color: '#22d3ee' },
  final_expense:       { bg: 'rgba(124,58,237,0.08)',  border: 'rgba(124,58,237,0.25)',  color: '#a78bfa' },
  veteran:             { bg: 'rgba(76,175,132,0.08)',  border: 'rgba(76,175,132,0.25)',  color: '#4caf84' },
}

function loadAppointments() {
  try { return JSON.parse(localStorage.getItem('ffl_appointments') || '[]') } catch { return [] }
}

function loadChargebacks() {
  try { return JSON.parse(localStorage.getItem('chargeback_records') || '[]') } catch { return [] }
}

function saveChargebacks(records) {
  try { localStorage.setItem('chargeback_records', JSON.stringify(records)) } catch {}
}

function saveAppointments(records) {
  try { localStorage.setItem('ffl_appointments', JSON.stringify(records)) } catch {}
}

/** Parse MM/DD/YYYY → Date (midnight local) */
function parseMDY(str) {
  if (!str) return null
  const [m, d, y] = str.split('/')
  if (!m || !d || !y) return null
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return isNaN(dt.getTime()) ? null : dt
}

/** Add N months to a Date */
function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

/** How many persistence tabs (0-12) are green as of today */
function calcMonthsInForce(dateEnforced) {
  const start = parseMDY(dateEnforced)
  if (!start) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let count = 0
  for (let i = 0; i < 12; i++) {
    if (addMonths(start, i) <= today) count++
    else break
  }
  return count
}

/** Format dollar amount */
function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

/** Format date string for display */
function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

/* ── Persistence Tracker ─────────────────────────────────────────────────── */
function PersistenceTracker({ dateEnforced, chargebackMonth }) {
  const monthsInForce = calcMonthsInForce(dateEnforced)

  return (
    <div className="persist-track">
      {Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        const isActive  = month <= monthsInForce
        const isCharged = chargebackMonth != null && month >= chargebackMonth
        let cls = 'persist-tab'
        if (isCharged) cls += ' persist-tab-cb'
        else if (isActive) cls += ' persist-tab-on'
        return (
          <div key={month} className={cls} title={`Month ${month}`}>
            {month}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Advance commission formula (must match Earnings calcCommission exactly):
 *   Non-Ethos: monthly × commPct/100 × 9
 *   Ethos:     monthly × commPct/100 × 12
 *
 * Verification example (per spec):
 *   $100/mo, 70% comm, non-Ethos, chargeback at month 2
 *   Total Advance  = 100 × 0.70 × 9  = $630
 *   Already Earned = 100 × 0.70 × 2  = $140
 *   Chargeback     = $630 - $140      = $490  (< $630, no cap needed)
 *   Advanced Agent Commission on card = $630  ✓ matches Earnings
 */
function calcAdvanceComm(monthlyPrem, commPct, carrierId) {
  const advMonths = carrierId === 'ETHOS' ? 12 : 9
  return Math.round(monthlyPrem * (commPct / 100) * advMonths)
}

/**
 * Chargeback amount owed:
 *   totalAdvance  = monthly × commPct/100 × advanceMonths
 *   alreadyEarned = monthly × commPct/100 × monthsInForce
 *   owed          = totalAdvance - alreadyEarned  (capped at totalAdvance, min 0)
 */
function calcChargebackOwed(monthlyPrem, commPct, carrierId, monthsInForce) {
  const advMonths   = carrierId === 'ETHOS' ? 12 : 9
  const totalAdv    = monthlyPrem * (commPct / 100) * advMonths
  const earned      = monthlyPrem * (commPct / 100) * monthsInForce
  const owed        = Math.max(0, Math.min(totalAdv - earned, totalAdv))
  return {
    advanceMonths: advMonths,
    totalAdvance:  Math.round(totalAdv),
    alreadyEarned: Math.round(earned),
    chargebackAmt: Math.round(owed),
  }
}

/* ── Read-Only View Details Modal (chargebacked clients) ─────────────────── */
function ClientViewDetailsModal({ record, chargeback, onClose }) {
  const monthlyPrem = parseFloat(record.monthlyPremium) || 0
  const commPct     = record.commissionPct || 0
  const advComm     = calcAdvanceComm(monthlyPrem, commPct, record.carrierId)

  function Item({ label, value }) {
    if (!value && value !== 0) return null
    return (
      <div className="fu-details-item">
        <span className="fu-details-item-label">{label}</span>
        <span className="fu-details-item-val">{value}</span>
      </div>
    )
  }

  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>

        <div className="db-modal-head">
          <h2 className="db-modal-title">{record.clientName || 'Unknown'}</h2>
          <button className="db-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>

        <div className="fu-details-body">

          {/* Client Info */}
          <div>
            <div className="fu-details-section-label">Client Information</div>
            <div className="fu-details-grid">
              <Item label="Age"           value={record.clientAge} />
              <Item label="Sex"           value={record.clientSex} />
              <Item label="State"         value={record.clientState} />
              <Item label="Date of Birth" value={record.clientDOB} />
              <Item label="Phone"         value={record.clientPhone} />
              <Item label="Lead Type"     value={LEAD_LABELS[record.leadType] || record.leadType} />
              <Item label="Marital Status" value={record.maritalStatus} />
              {record.spouseName && <Item label="Spouse"  value={record.spouseName} />}
              <Item label="Tobacco"       value={record.tobacco ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Policy Details */}
          <div>
            <div className="fu-details-section-label">Policy Details</div>
            <div className="fu-details-grid">
              <Item label="Carrier"       value={record.carrier} />
              <Item label="Product"       value={record.product} />
              {record.planCode && <Item label="Plan Code" value={record.planCode} />}
              <Item label="Underwriting Tier" value={record.tier} />
              <Item label="Coverage"      value={fmt(record.face)} />
              <Item label="Monthly Premium" value={monthlyPrem ? `$${monthlyPrem.toFixed(2)}` : '—'} />
              <Item label="Annual Premium"  value={monthlyPrem ? fmt(monthlyPrem * 12) : '—'} />
              <Item label="Commission %"  value={commPct ? `${commPct}%` : '—'} />
              <Item label="Adv. Agent Commission" value={advComm ? fmt(advComm) : '—'} />
              <Item label="Date Enforced" value={record.dateEnforced} />
              <Item label="Date Closed"   value={fmtDate(record.savedAt)} />
            </div>
          </div>

          {/* Beneficiaries */}
          {(record.beneficiaries || []).filter(b => b.name?.trim()).length > 0 && (
            <div>
              <div className="fu-details-section-label">
                Beneficiaries ({record.beneficiaries.filter(b => b.name?.trim()).length})
              </div>
              <div className="fu-details-grid">
                {record.beneficiaries.filter(b => b.name?.trim()).map((b, i) => (
                  <div key={i} className="fu-details-item">
                    <span className="fu-details-item-label">
                      {i === 0 ? 'Primary' : `Beneficiary ${i + 1}`}
                    </span>
                    <span className="fu-details-item-val">
                      {[b.name, b.relationship, record.beneficiaries.length > 1 ? `${b.percentage}%` : null]
                        .filter(Boolean).join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chargeback Record */}
          {chargeback && (
            <div>
              <div className="fu-details-section-label" style={{ color: '#e05c5c' }}>
                Chargeback Record
              </div>
              <div className="fu-details-grid">
                <Item label="Date Recorded"       value={fmtDate(chargeback.chargebackedAt)} />
                <Item label="Months in Force"     value={chargeback.monthsInForceAtChargeback ?? chargeback.monthAtChargeback} />
                {chargeback.totalAdvance != null && (
                  <Item label="Total Advance Paid" value={fmt(chargeback.totalAdvance)} />
                )}
                {chargeback.alreadyEarned != null && (
                  <Item label="Already Earned"    value={fmt(chargeback.alreadyEarned)} />
                )}
                <Item label="Amount Owed Back"   value={chargeback.chargebackAmount != null ? `−${fmt(chargeback.chargebackAmount)}` : '—'} />
              </div>
            </div>
          )}

        </div>

        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="db-btn-cancel" style={{ minWidth: 100 }} onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  )
}

/* ── Single Client Card ──────────────────────────────────────────────────── */
function ClientCard({ record, chargeback, onDelete, onEdit, onChargeback, onViewDetails }) {
  const leadColor    = LEAD_COLORS[record.leadType] || LEAD_COLORS.final_expense
  const monthlyPrem  = parseFloat(record.monthlyPremium) || 0
  const commPct      = record.commissionPct || 0
  const advanceComm  = calcAdvanceComm(monthlyPrem, commPct, record.carrierId)
  const isCharged    = !!chargeback
  const chargebackMonth = chargeback?.monthAtChargeback ?? null

  return (
    <div className={`client-card${isCharged ? ' client-card-cb' : ''}`}>

      {/* Card header */}
      <div className="client-card-header">
        <div>
          <div className="client-card-name">{record.clientName || 'Unknown'}</div>
          <div className="client-card-sub">
            {[record.clientAge && `Age ${record.clientAge}`, record.clientSex, record.clientState].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className="client-lead-badge" style={{ background: leadColor.bg, border: `1px solid ${leadColor.border}`, color: leadColor.color }}>
            {LEAD_LABELS[record.leadType] || record.leadType}
          </span>
          {isCharged && (
            <span className="client-cb-badge">Chargebacked</span>
          )}
        </div>
      </div>

      {/* Carrier + product */}
      <div className="client-carrier-row">
        <span className="client-carrier-name">{record.carrier}</span>
        <span className="client-carrier-sep">·</span>
        <span className="client-product-name">{record.product}</span>
        {record.tier && <span className="client-tier-badge">{record.tier}</span>}
      </div>

      {/* Key metrics */}
      <div className="client-metrics">
        <div className="client-metric">
          <div className="client-metric-label">Coverage</div>
          <div className="client-metric-value">{fmt(record.face)}</div>
        </div>
        <div className="client-metric">
          <div className="client-metric-label">Monthly Premium</div>
          <div className="client-metric-value" style={{ color: '#7c3aed' }}>
            {monthlyPrem ? `$${monthlyPrem.toFixed(2)}` : '—'}
          </div>
        </div>
        <div className="client-metric">
          <div className="client-metric-label">Annual Premium</div>
          <div className="client-metric-value">{monthlyPrem ? fmt(monthlyPrem * 12) : '—'}</div>
        </div>
        <div className="client-metric">
          <div className="client-metric-label">Advanced Agent Commission</div>
          <div className="client-metric-value" style={{ color: '#22d3ee' }}>{advanceComm ? fmt(advanceComm) : '—'}</div>
        </div>
      </div>

      {/* Dates row */}
      <div className="client-dates-row">
        <span className="client-date-item">
          <span className="client-date-label">Date Enforced</span>
          <span className="client-date-val">{record.dateEnforced || '—'}</span>
        </span>
        <span className="client-date-item">
          <span className="client-date-label">Date Closed</span>
          <span className="client-date-val">{fmtDate(record.savedAt)}</span>
        </span>
        {record.planCode && (
          <span className="client-date-item">
            <span className="client-date-label">Plan Code</span>
            <span className="client-date-val">{record.planCode}</span>
          </span>
        )}
      </div>

      {/* Persistence tracker */}
      <div className="client-persist-section">
        <div className="client-persist-label">
          Policy Persistence
          <span className="client-persist-months">{calcMonthsInForce(record.dateEnforced)} / 12 months in force</span>
        </div>
        <PersistenceTracker dateEnforced={record.dateEnforced} chargebackMonth={chargebackMonth} />
      </div>

      {/* Chargeback detail */}
      {isCharged && chargeback.chargebackAmount != null && (
        <div className="client-cb-detail">
          <span>Chargeback recorded {fmtDate(chargeback.chargebackedAt)}</span>
          <span className="client-cb-amount">−{fmt(chargeback.chargebackAmount)} owed back</span>
        </div>
      )}

      {/* Actions */}
      <div className="client-card-actions">
        {isCharged ? (
          /* Chargebacked: View Details (read-only) replaces Edit */
          <button className="fu-action-btn fu-btn-view" onClick={() => onViewDetails(record)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6.5" cy="6.5" r="5.5"/>
              <line x1="6.5" y1="4.5" x2="6.5" y2="7.5"/>
              <circle cx="6.5" cy="9" r="0.5" fill="currentColor"/>
            </svg>
            View Details
          </button>
        ) : (
          /* Not chargebacked: normal Edit button */
          <button className="client-action-btn client-action-edit" onClick={() => onEdit(record)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 1.5l2 2L4 11H2v-2L9.5 1.5Z"/>
            </svg>
            Edit
          </button>
        )}
        {!isCharged && (
          <button className="client-action-btn client-action-cb" onClick={() => onChargeback(record)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="5.5"/>
              <line x1="6.5" y1="3.5" x2="6.5" y2="7"/>
              <circle cx="6.5" cy="9" r="0.6" fill="currentColor"/>
            </svg>
            Chargeback
          </button>
        )}
        <button className="client-action-btn client-action-delete" onClick={() => onDelete(record)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 3.5 11 3.5"/>
            <path d="M4.5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1"/>
            <rect x="2.5" y="3.5" width="8" height="7.5" rx="1"/>
            <line x1="5.5" y1="6" x2="5.5" y2="9"/>
            <line x1="7.5" y1="6" x2="7.5" y2="9"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}

/* ── Chargeback Confirm Modal ─────────────────────────────────────────────── */
function ChargebackModal({ record, onConfirm, onCancel }) {
  const monthsInForce = calcMonthsInForce(record.dateEnforced)
  const monthlyPrem   = parseFloat(record.monthlyPremium) || 0
  const commPct       = record.commissionPct || 0
  const carrierId     = record.carrierId || ''
  const chargebackMonth = monthsInForce + 1 // first month that turns red in persistence tracker

  // ── Correct 3-step advance chargeback formula ──────────────────────────
  // Step 1: total advance deposited into agent's bank account
  const advanceMonths = carrierId === 'ETHOS' ? 12 : 9
  const totalAdvance  = Math.round(monthlyPrem * (commPct / 100) * advanceMonths)

  // Step 2: amount the agent already legitimately earned before chargeback
  const alreadyEarned = Math.round(monthlyPrem * (commPct / 100) * monthsInForce)

  // Step 3: what the agent must pay back (capped at totalAdvance, floor 0)
  const chargebackAmt = Math.max(0, Math.min(totalAdvance - alreadyEarned, totalAdvance))

  return (
    <div className="db-overlay" onClick={onCancel}>
      <div className="db-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Record Chargeback</h2>
          <button className="db-modal-close" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ fontSize: 14, color: '#888888', marginBottom: 16, lineHeight: 1.6 }}>
            Recording a chargeback for{' '}
            <strong style={{ color: '#ffffff' }}>{record.clientName}</strong>.
            Policy has been in force for{' '}
            <strong style={{ color: '#22d3ee' }}>{monthsInForce}</strong> month{monthsInForce !== 1 ? 's' : ''}.
          </div>

          <div className="cb-calc-grid">
            {/* Step 1 */}
            <div className="cb-calc-section-label">Step 1 — Total Advance Paid</div>
            <div className="cb-calc-row">
              <span>Monthly premium</span><span>${monthlyPrem.toFixed(2)}</span>
            </div>
            <div className="cb-calc-row">
              <span>Commission rate</span><span>{commPct}%</span>
            </div>
            <div className="cb-calc-row">
              <span>Advance period ({carrierId === 'ETHOS' ? 'Ethos — 12 mo' : '9 mo'})</span>
              <span>× {advanceMonths}</span>
            </div>
            <div className="cb-calc-row cb-calc-subtotal">
              <span>Total advance paid</span>
              <span style={{ color: '#22d3ee' }}>{fmt(totalAdvance)}</span>
            </div>

            {/* Step 2 */}
            <div className="cb-calc-section-label" style={{ marginTop: 10 }}>Step 2 — Already Earned</div>
            <div className="cb-calc-row">
              <span>Months in force</span><span>{monthsInForce}</span>
            </div>
            <div className="cb-calc-row cb-calc-subtotal">
              <span>Already earned</span>
              <span style={{ color: '#4caf84' }}>{fmt(alreadyEarned)}</span>
            </div>

            {/* Step 3 */}
            <div className="cb-calc-row cb-calc-total" style={{ marginTop: 10 }}>
              <span>Amount owed back</span>
              <span className="cb-calc-total-val">{fmt(chargebackAmt)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="db-btn-cancel" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button
              className="db-btn-save"
              style={{ flex: 2, background: 'rgba(224,92,92,0.15)', borderColor: 'rgba(224,92,92,0.4)', color: '#e05c5c' }}
              onClick={() => onConfirm({
                chargebackMonth,
                monthsInForce,
                advanceMonths,
                totalAdvance,
                alreadyEarned,
                chargebackAmt,
              })}
            >
              Confirm Chargeback
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Clients Page ───────────────────────────────────────────────────── */
export default function Clients({ onEdit, onNewAppointment, highlightClientId, onHighlightClear }) {
  const [appointments,   setAppointments]   = useState(loadAppointments)
  const [chargebacks,    setChargebacks]    = useState(loadChargebacks)
  const [search,         setSearch]         = useState('')
  const [sortKey,        setSortKey]        = useState('most_recent')
  const [cbTarget,       setCbTarget]       = useState(null)  // record to chargeback
  const [deleteTarget,   setDeleteTarget]   = useState(null)  // record to delete (confirm)
  const [viewTarget,     setViewTarget]     = useState(null)  // chargebacked record to view (read-only)

  // Escape key closes any open modal
  useEffect(() => {
    function handleKey(e) {
      if (e.key !== 'Escape') return
      if (viewTarget)   setViewTarget(null)
      if (cbTarget)     setCbTarget(null)
      if (deleteTarget) setDeleteTarget(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [viewTarget, cbTarget, deleteTarget])

  // Scroll to highlighted card when navigated from Dashboard chart dot
  useEffect(() => {
    if (!highlightClientId) return
    const el = document.getElementById(`client-card-${highlightClientId}`)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('client-card-highlight')
        setTimeout(() => {
          el.classList.remove('client-card-highlight')
          onHighlightClear?.()
        }, 2500)
      }, 150)
    }
  }, [highlightClientId, onHighlightClear])

  // Build chargeback lookup: clientId → chargeback record
  const cbMap = useMemo(() => {
    const map = {}
    chargebacks.forEach(cb => { map[cb.clientId] = cb })
    return map
  }, [chargebacks])

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return appointments
    return appointments.filter(r =>
      (r.clientName || '').toLowerCase().includes(q) ||
      (r.carrier    || '').toLowerCase().includes(q) ||
      (r.product    || '').toLowerCase().includes(q)
    )
  }, [appointments, search])

  // Sort / filter
  const sorted = useMemo(() => {
    const arr = [...filtered]
    switch (sortKey) {
      case 'most_recent':
        return arr.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
      case 'oldest_first':
        return arr.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt))
      case 'highest_premium':
        return arr.sort((a, b) => (parseFloat(b.monthlyPremium) || 0) - (parseFloat(a.monthlyPremium) || 0))
      case 'lowest_premium':
        return arr.sort((a, b) => (parseFloat(a.monthlyPremium) || 0) - (parseFloat(b.monthlyPremium) || 0))
      case 'most_months': {
        return arr.sort((a, b) => {
          const mA = calcMonthsInForce(a.dateEnforced)
          const mB = calcMonthsInForce(b.dateEnforced)
          if (mB !== mA) return mB - mA
          return new Date(a.savedAt) - new Date(b.savedAt)
        })
      }
      case 'least_months': {
        return arr.sort((a, b) => {
          const mA = calcMonthsInForce(a.dateEnforced)
          const mB = calcMonthsInForce(b.dateEnforced)
          if (mA !== mB) return mA - mB
          return new Date(a.savedAt) - new Date(b.savedAt)
        })
      }
      case 'chargebacks':
        // Show only chargebacked clients, ordered by most recent chargeback date
        return arr
          .filter(r => !!cbMap[r.id])
          .sort((a, b) => {
            const aDate = cbMap[a.id]?.chargebackedAt || a.savedAt
            const bDate = cbMap[b.id]?.chargebackedAt || b.savedAt
            return new Date(bDate) - new Date(aDate)
          })
      default: return arr
    }
  }, [filtered, sortKey, cbMap])

  function handleDelete(record) {
    setDeleteTarget(record)
  }

  function confirmDelete() {
    const updated = appointments.filter(r => r.id !== deleteTarget.id)
    saveAppointments(updated)
    setAppointments(updated)
    // also remove chargeback if exists
    const updatedCBs = chargebacks.filter(cb => cb.clientId !== deleteTarget.id)
    saveChargebacks(updatedCBs)
    setChargebacks(updatedCBs)
    setDeleteTarget(null)
  }

  function handleChargeback(record) {
    setCbTarget(record)
  }

  function confirmChargeback({ chargebackMonth, monthsInForce, advanceMonths, totalAdvance, alreadyEarned, chargebackAmt }) {
    const newCB = {
      id:                        Date.now(),
      clientId:                  cbTarget.id,
      clientName:                cbTarget.clientName,
      carrier:                   cbTarget.carrier   || '',
      carrierId:                 cbTarget.carrierId || '',
      chargebackedAt:            new Date().toISOString(),
      monthAtChargeback:         chargebackMonth,
      monthsInForceAtChargeback: monthsInForce,
      advanceMonths,
      monthlyPremium:            cbTarget.monthlyPremium,
      commissionPct:             cbTarget.commissionPct,
      totalAdvance,
      alreadyEarned,
      chargebackAmount:          chargebackAmt,
    }
    const updated = chargebacks.filter(cb => cb.clientId !== cbTarget.id)
    updated.push(newCB)
    saveChargebacks(updated)
    setChargebacks(updated)
    setCbTarget(null)
  }

  // Summary stats
  const totalAnnualPremium = appointments.reduce((sum, r) => sum + (parseFloat(r.monthlyPremium) || 0) * 12, 0)
  const totalCommission    = appointments.reduce((sum, r) => {
    const ap  = (parseFloat(r.monthlyPremium) || 0) * 12
    const pct = r.commissionPct || 0
    return sum + Math.round(ap * (pct / 100))
  }, 0)
  const chargebackCount    = chargebacks.length

  return (
    <div className="clients-root animate-in">

      {/* Page header */}
      <div className="clients-header">
        <div>
          <div className="clients-eyebrow">Policy Management</div>
          <h1 className="clients-title">Clients</h1>
          <p className="clients-sub">{appointments.length} sold {appointments.length === 1 ? 'policy' : 'policies'} on record</p>
        </div>
      </div>

      {/* Summary stats */}
      {appointments.length > 0 && (
        <div className="clients-stats">
          <div className="clients-stat">
            <div className="clients-stat-num">{appointments.length}</div>
            <div className="clients-stat-label">Policies Sold</div>
          </div>
          <div className="clients-stat">
            <div className="clients-stat-num" style={{ color: '#4caf84' }}>{fmt(totalAnnualPremium)}</div>
            <div className="clients-stat-label">Total Annual Premium</div>
          </div>
          <div className="clients-stat">
            <div className="clients-stat-num" style={{ color: '#22d3ee' }}>{fmt(totalCommission)}</div>
            <div className="clients-stat-label">Total 1st-Year Commission</div>
          </div>
          <div className="clients-stat">
            <div className="clients-stat-num" style={{ color: chargebackCount > 0 ? '#e05c5c' : '#ffffff' }}>{chargebackCount}</div>
            <div className="clients-stat-label">Chargebacks</div>
          </div>
        </div>
      )}

      {/* Search + sort bar */}
      <div className="clients-toolbar">
        <div className="clients-search-wrap">
          <svg className="clients-search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5"/>
            <line x1="10.5" y1="10.5" x2="14" y2="14"/>
          </svg>
          <input
            className="clients-search"
            type="text"
            placeholder="Search by name, carrier, or product…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clients-search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
        <select
          className="clients-sort"
          value={sortKey}
          onChange={e => setSortKey(e.target.value)}
        >
          <option value="most_recent">Most Recent</option>
          <option value="oldest_first">Oldest First</option>
          <option value="highest_premium">Highest Annual Premium</option>
          <option value="lowest_premium">Lowest Annual Premium</option>
          <option value="most_months">Most Months in Force</option>
          <option value="least_months">Least Months in Force</option>
          <option value="chargebacks">Chargebacks</option>
        </select>
      </div>

      {/* Empty state */}
      {appointments.length === 0 ? (
        <div className="clients-empty">
          <div className="clients-empty-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="10" r="4.5"/>
              <path d="M3 22c0-4 3.5-7 8-7s8 3 8 7"/>
              <circle cx="21" cy="10" r="3.5" opacity="0.5"/>
              <path d="M24.5 22c0-3-2-5-5-5.8" opacity="0.5"/>
            </svg>
          </div>
          <div className="clients-empty-title">No clients yet</div>
          <div className="clients-empty-sub">Policies you mark as sold will appear here.</div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="clients-empty">
          <div className="clients-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div className="clients-empty-title">No results for "{search}"</div>
          <div className="clients-empty-sub">Try a different name, carrier, or product.</div>
        </div>
      ) : (
        <div className="clients-grid">
          {sorted.map(record => (
            <div key={record.id} id={`client-card-${record.id}`}>
              <ClientCard
                record={record}
                chargeback={cbMap[record.id] || null}
                onEdit={onEdit}
                onDelete={handleDelete}
                onChargeback={handleChargeback}
                onViewDetails={setViewTarget}
              />
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="db-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="db-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="db-modal-head">
              <h2 className="db-modal-title">Delete Client</h2>
              <button className="db-modal-close" onClick={() => setDeleteTarget(null)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: 14, color: '#888888', marginBottom: 20, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: '#ffffff' }}>{deleteTarget.clientName}</strong>?
                This will permanently remove this client record and cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="db-btn-cancel" style={{ flex: 1 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button
                  className="db-btn-save"
                  style={{ flex: 2, background: 'rgba(224,92,92,0.15)', borderColor: 'rgba(224,92,92,0.4)', color: '#e05c5c' }}
                  onClick={confirmDelete}
                >
                  Delete Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chargeback modal */}
      {cbTarget && (
        <ChargebackModal
          record={cbTarget}
          onConfirm={confirmChargeback}
          onCancel={() => setCbTarget(null)}
        />
      )}

      {/* View Details modal — read-only, shown on chargebacked cards */}
      {viewTarget && (
        <ClientViewDetailsModal
          record={viewTarget}
          chargeback={cbMap[viewTarget.id] || null}
          onClose={() => setViewTarget(null)}
        />
      )}
    </div>
  )
}
