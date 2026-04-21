import { useState, useMemo } from 'react'

// ── Constants ────────────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadRecords() {
  try { return JSON.parse(localStorage.getItem('follow_up_appointments') || '[]') } catch { return [] }
}

function saveRecords(list) {
  try { localStorage.setItem('follow_up_appointments', JSON.stringify(list)) } catch {}
}

function addDaysToDate(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function normalizeRecord(r) {
  if (r.notes) return r
  // Migrate old-format records that only had followUpNote string
  const base = r.savedAt || new Date().toISOString()
  return {
    ...r,
    priority:        'warm',
    nextContactDate: addDaysToDate(base, 60),
    lastContacted:   null,
    notes:           [{ date: base, text: r.followUpNote || '' }],
  }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function isOverdue(r) {
  if (!r.nextContactDate) return false
  return r.nextContactDate < todayStr()
}

function isToday(r) {
  if (!r.nextContactDate) return false
  return r.nextContactDate === todayStr()
}

function daysUntil(r) {
  if (!r.nextContactDate) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(r.nextContactDate + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

function timeSince(iso) {
  if (!iso) return ''
  const diff  = Date.now() - new Date(iso).getTime()
  const days  = Math.floor(diff / 86400000)
  const months = Math.floor(days / 30)
  if (months >= 2) return `${months} months since saved`
  if (months === 1) return '1 month since saved'
  if (days >= 1)   return `${days} day${days > 1 ? 's' : ''} since saved`
  return 'Saved today'
}

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

function fmtMoney(n) {
  if (n == null || isNaN(n)) return null
  return '$' + Math.round(n).toLocaleString()
}

function fmtContactDate(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return new Date(Number(y), Number(m)-1, Number(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function clientFullName(r) {
  const fd = r.formData
  if (!fd?.clientInfo) return r.agentName || 'Unknown'
  const { firstName, lastName } = fd.clientInfo
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown'
}

function clientSub(r) {
  const ci = r.formData?.clientInfo
  if (!ci) return ''
  return [ci.age && `Age ${ci.age}`, ci.sex, ci.state].filter(Boolean).join(' · ')
}

// ── Stat computation ─────────────────────────────────────────────────────────
function computeStats(records) {
  return {
    overdue: records.filter(r => isOverdue(r)).length,
    today:   records.filter(r => isToday(r) && !isOverdue(r)).length,
    hot:     records.filter(r => r.priority === 'hot'  && !isOverdue(r)).length,
    warm:    records.filter(r => r.priority === 'warm' && !isOverdue(r)).length,
    cold:    records.filter(r => r.priority === 'cold' && !isOverdue(r)).length,
  }
}

// ── View Details Modal ───────────────────────────────────────────────────────
function ViewDetailsModal({ record, onClose }) {
  const fd  = record.formData || {}
  const ci  = fd.clientInfo  || {}
  const fin = fd.financial   || {}

  const activeConditions = Object.entries(fd.conditions || {})
    .filter(([, v]) => v)
    .map(([k, v]) => typeof v === 'string' ? `${k} (${v})` : k)

  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>

        <div className="db-modal-head">
          <h2 className="db-modal-title">{clientFullName(record)}</h2>
          <button className="db-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>

        <div className="fu-details-body">

          {/* Summary */}
          <div>
            <div className="fu-details-section-label">Summary</div>
            <div className="fu-details-grid">
              <div className="fu-details-item">
                <span className="fu-details-item-label">Lead Type</span>
                <span className="fu-details-item-val">{LEAD_LABELS[fd.leadType] || fd.leadType || '—'}</span>
              </div>
              <div className="fu-details-item">
                <span className="fu-details-item-label">Priority</span>
                <span className="fu-details-item-val" style={{ textTransform: 'capitalize' }}>{record.priority || '—'}</span>
              </div>
              <div className="fu-details-item">
                <span className="fu-details-item-label">Next Contact</span>
                <span className="fu-details-item-val">{fmtContactDate(record.nextContactDate)}</span>
              </div>
              <div className="fu-details-item">
                <span className="fu-details-item-label">Last Contacted</span>
                <span className="fu-details-item-val">{record.lastContacted ? fmtDate(record.lastContacted) : 'Never'}</span>
              </div>
              <div className="fu-details-item">
                <span className="fu-details-item-label">Saved On</span>
                <span className="fu-details-item-val">{fmtDate(record.savedAt)}</span>
              </div>
              <div className="fu-details-item">
                <span className="fu-details-item-label">Step Reached</span>
                <span className="fu-details-item-val">Step {record.currentStep || '—'} of 7</span>
              </div>
            </div>
          </div>

          {/* Quote Snapshot */}
          <div>
            <div className="fu-details-section-label">Quote Snapshot</div>
            <QuoteBlock qs={record.quoteSnapshot} inline={false} />
          </div>

          {/* Client Info */}
          <div>
            <div className="fu-details-section-label">Client Information</div>
            <div className="fu-details-grid">
              {ci.firstName && <div className="fu-details-item"><span className="fu-details-item-label">First Name</span><span className="fu-details-item-val">{ci.firstName}</span></div>}
              {ci.lastName  && <div className="fu-details-item"><span className="fu-details-item-label">Last Name</span><span className="fu-details-item-val">{ci.lastName}</span></div>}
              {ci.age       && <div className="fu-details-item"><span className="fu-details-item-label">Age</span><span className="fu-details-item-val">{ci.age}</span></div>}
              {ci.sex       && <div className="fu-details-item"><span className="fu-details-item-label">Sex</span><span className="fu-details-item-val">{ci.sex}</span></div>}
              {ci.state     && <div className="fu-details-item"><span className="fu-details-item-label">State</span><span className="fu-details-item-val">{ci.state}</span></div>}
              {ci.dateOfBirth && <div className="fu-details-item"><span className="fu-details-item-label">Date of Birth</span><span className="fu-details-item-val">{ci.dateOfBirth}</span></div>}
              {ci.phoneNumber && <div className="fu-details-item"><span className="fu-details-item-label">Phone</span><span className="fu-details-item-val">{ci.phoneNumber}</span></div>}
              {ci.maritalStatus && <div className="fu-details-item"><span className="fu-details-item-label">Marital Status</span><span className="fu-details-item-val">{ci.maritalStatus}</span></div>}
              {ci.spouseName && <div className="fu-details-item"><span className="fu-details-item-label">Spouse</span><span className="fu-details-item-val">{ci.spouseName}</span></div>}
              {ci.beneficiaryName && <div className="fu-details-item"><span className="fu-details-item-label">Beneficiary</span><span className="fu-details-item-val">{ci.beneficiaryName}</span></div>}
              <div className="fu-details-item"><span className="fu-details-item-label">Tobacco</span><span className="fu-details-item-val">{ci.tobacco ? 'Yes' : 'No'}</span></div>
            </div>
          </div>

          {/* Conditions */}
          {activeConditions.length > 0 && (
            <div>
              <div className="fu-details-section-label">Health Conditions</div>
              <div className="fu-details-conditions">
                {activeConditions.map((c, i) => (
                  <span key={i} className="fu-details-condition-tag">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          {fd.medications?.length > 0 && (
            <div>
              <div className="fu-details-section-label">Medications ({fd.medications.length})</div>
              <div className="fu-details-med-list">
                {fd.medications.map((m, i) => (
                  <div key={i} className="fu-details-med-item">
                    {m.name}{m.conditionHint ? ` — ${m.conditionHint}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial */}
          {(fin.occupation || fin.income) && (
            <div>
              <div className="fu-details-section-label">Financial Overview</div>
              <div className="fu-details-grid">
                {fin.occupation && <div className="fu-details-item"><span className="fu-details-item-label">Occupation</span><span className="fu-details-item-val">{fin.occupation}</span></div>}
                {fin.income     && <div className="fu-details-item"><span className="fu-details-item-label">Monthly Income</span><span className="fu-details-item-val">${Number(fin.income).toLocaleString()}</span></div>}
                {fin.savings    && <div className="fu-details-item"><span className="fu-details-item-label">Savings</span><span className="fu-details-item-val">${Number(fin.savings).toLocaleString()}</span></div>}
                {fin.notes      && <div className="fu-details-item" style={{ gridColumn: '1/-1' }}><span className="fu-details-item-label">Appointment Notes</span><span className="fu-details-item-val">{fin.notes}</span></div>}
              </div>
            </div>
          )}

          {/* Notes history */}
          {(() => {
            const filledNotes = (record.notes || []).filter(n => n.text?.trim())
            return filledNotes.length > 0 ? (
              <div>
                <div className="fu-details-section-label">Note History ({filledNotes.length})</div>
                <div className="fu-details-notes-list">
                  {filledNotes.map((n, i) => (
                    <div key={i} className="fu-details-note">
                      <div className="fu-details-note-date">{fmtDate(n.date)}</div>
                      <div className="fu-details-note-text">{n.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          })()}

        </div>

        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="db-btn-cancel" style={{ minWidth: 100 }} onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  )
}

// ── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }) {
  return (
    <div className="db-overlay" onClick={onCancel}>
      <div className="db-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Remove from Follow Up</h2>
          <button className="db-modal-close" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ fontSize: 14, color: '#888888', marginBottom: 20, lineHeight: 1.6 }}>
            Are you sure you want to remove <strong style={{ color: '#ffffff' }}>{name}</strong> from Follow Up?
            This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="db-btn-cancel" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button
              className="db-btn-save"
              style={{ flex: 2, background: 'rgba(224,92,92,0.15)', borderColor: 'rgba(224,92,92,0.4)', color: '#e05c5c' }}
              onClick={onConfirm}
            >
              Remove Client
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Quote Snapshot Block (card + modal reuse) ────────────────────────────────
function QuoteBlock({ qs, inline }) {
  const coverage = qs?.coverage ? fmtMoney(qs.coverage) : null
  const premium  = qs?.monthlyPremium ? fmtMoney(qs.monthlyPremium) : null

  if (!qs) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: inline ? '8px 0' : '9px 12px',
        background: inline ? 'transparent' : 'rgba(255,255,255,0.02)',
        border: inline ? 'none' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 6,
      }}>
        <span style={{ fontSize: 11, color: '#333333', fontStyle: 'italic' }}>
          Not yet quoted — client saved before reaching results
        </span>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '6px 12px',
      padding: inline ? '8px 0' : '10px 12px',
      background: inline ? 'transparent' : 'rgba(255,255,255,0.02)',
      border: inline ? 'none' : '1px solid rgba(255,255,255,0.04)',
      borderRadius: 6,
    }}>
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#444444', marginBottom: 2 }}>Carrier</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#cccccc' }}>{qs.carrier || '—'}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#444444', marginBottom: 2 }}>Product</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#888888' }}>{qs.product || '—'}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#444444', marginBottom: 2 }}>Coverage</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{coverage || '—'}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#444444', marginBottom: 2 }}>Monthly Premium</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#22d3ee' }}>{premium ? `${premium}/mo` : '—'}</div>
      </div>
    </div>
  )
}

// ── Single Follow Up Card ────────────────────────────────────────────────────
function FollowUpCard({ record, onViewDetails, onResume, onDelete }) {
  const overdue   = isOverdue(record)
  const today     = isToday(record)
  const days      = daysUntil(record)
  const leadColor = LEAD_COLORS[record.formData?.leadType] || LEAD_COLORS.final_expense
  const name      = clientFullName(record)
  const sub       = clientSub(record)

  let cardClass = 'fu-card'
  if (overdue)                    cardClass += ' fu-card-overdue'
  else if (record.priority === 'hot')  cardClass += ' fu-card-hot'
  else if (record.priority === 'warm') cardClass += ' fu-card-warm'
  else                            cardClass += ' fu-card-cold'

  let countdownText = null
  let countdownClass = 'fu-countdown'
  if (overdue) {
    const overdueDays = Math.abs(days)
    countdownText = overdueDays === 0 ? 'Due today' : `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`
    countdownClass = 'fu-countdown fu-countdown-overdue'
  } else if (today) {
    countdownText = 'Follow up today'
    countdownClass = 'fu-countdown fu-countdown-today'
  } else if (days !== null) {
    countdownText = `Follow up in ${days} day${days !== 1 ? 's' : ''}`
  }

  const filledNotes  = (record.notes || []).filter(n => n.text?.trim())
  const recentNotes  = filledNotes.slice(0, 2)

  return (
    <div className={cardClass}>

      {overdue && (
        <div className="fu-overdue-banner">
          <span className="fu-overdue-dot" />
          Overdue Follow Up
        </div>
      )}

      <div className="fu-card-body">

        {/* Header */}
        <div className="fu-card-header">
          <div className="fu-card-header-left">
            <div className="fu-client-name">{name}</div>
            {sub && <div className="fu-client-sub">{sub}</div>}
          </div>
          <div className="fu-card-badges">
            {record.priority && (
              <span className={`fu-priority-badge fu-badge-${record.priority}`}>
                {record.priority}
              </span>
            )}
            {record.formData?.leadType && (
              <span className="fu-lead-badge" style={{ background: leadColor.bg, border: `1px solid ${leadColor.border}`, color: leadColor.color }}>
                {LEAD_LABELS[record.formData.leadType] || record.formData.leadType}
              </span>
            )}
          </div>
        </div>

        {/* Quote snapshot */}
        <QuoteBlock qs={record.quoteSnapshot} />

        {/* Meta rows */}
        <div className="fu-meta-grid">
          <div className="fu-meta-row">
            <span className="fu-meta-label">Next Contact</span>
            <span className="fu-meta-val">{fmtContactDate(record.nextContactDate)}</span>
          </div>
          {countdownText && (
            <div className="fu-meta-row">
              <span className="fu-meta-label">Countdown</span>
              <span className={countdownClass}>{countdownText}</span>
            </div>
          )}
          <div className="fu-meta-row">
            <span className="fu-meta-label">Time Since Saved</span>
            <span className="fu-meta-val">{timeSince(record.savedAt)}</span>
          </div>
          <div className="fu-meta-row">
            <span className="fu-meta-label">Last Contacted</span>
            <span className="fu-meta-val">{record.lastContacted ? fmtDate(record.lastContacted) : 'Never'}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="fu-notes">
          <div className="fu-notes-label">
            Notes {filledNotes.length > 0 ? `(${filledNotes.length})` : ''}
          </div>
          <div className="fu-notes-list">
            {recentNotes.length === 0 ? (
              <div className="fu-note-empty">No notes yet.</div>
            ) : recentNotes.map((n, i) => (
              <div key={i} className="fu-note-item">
                <div className="fu-note-date">{fmtDate(n.date)}</div>
                <div className="fu-note-text">{n.text}</div>
              </div>
            ))}
            {filledNotes.length > 2 && (
              <div className="fu-note-item" style={{ textAlign: 'center' }}>
                <div className="fu-note-text" style={{ color: '#555555', fontStyle: 'italic' }}>
                  + {filledNotes.length - 2} more — view details
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="fu-card-actions">
        <button className="fu-action-btn fu-btn-view" onClick={() => onViewDetails(record)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6.5" cy="6.5" r="5.5"/>
            <line x1="6.5" y1="4.5" x2="6.5" y2="7.5"/>
            <circle cx="6.5" cy="9" r="0.5" fill="currentColor"/>
          </svg>
          View Details
        </button>
        <button className="fu-action-btn fu-btn-resume" onClick={() => onResume(record)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2.5 6.5 5.5 9.5 10.5 4"/>
          </svg>
          Follow Up
        </button>
        <button className="fu-action-btn fu-btn-delete" onClick={() => onDelete(record)}>
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

// ── Main Follow Up Page ──────────────────────────────────────────────────────
export default function FollowUp({ onResumeFollowUp, onNewAppointment, onCountChange }) {
  const [records,      setRecords]      = useState(() => loadRecords().map(normalizeRecord))
  const [activeFilter, setActiveFilter] = useState(null)
  const [sortFilter,   setSortFilter]   = useState('most_recent')
  const [search,       setSearch]       = useState('')
  const [viewTarget,   setViewTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const stats = useMemo(() => computeStats(records), [records])

  const STAT_BOXES = [
    { key: 'overdue', label: 'Overdue',  value: stats.overdue, cls: 'fu-stat-overdue' },
    { key: 'today',   label: 'Today',    value: stats.today,   cls: '' },
    { key: 'hot',     label: '30 Days',  value: stats.hot,     cls: '' },
    { key: 'warm',    label: '60 Days',  value: stats.warm,    cls: '' },
    { key: 'cold',    label: '90 Days',  value: stats.cold,    cls: '' },
  ]

  // Combined filter + search + sort
  const displayed = useMemo(() => {
    let list = [...records]

    // Stat box filter
    if (activeFilter === 'overdue') list = list.filter(r => isOverdue(r))
    else if (activeFilter === 'today') list = list.filter(r => isToday(r) && !isOverdue(r))
    else if (activeFilter === 'hot')   list = list.filter(r => r.priority === 'hot'  && !isOverdue(r))
    else if (activeFilter === 'warm')  list = list.filter(r => r.priority === 'warm' && !isOverdue(r))
    else if (activeFilter === 'cold')  list = list.filter(r => r.priority === 'cold' && !isOverdue(r))

    // Dropdown sort/filter
    if (sortFilter === 'today')    list = list.filter(r => isToday(r) && !isOverdue(r))
    if (sortFilter === '30days')   list = list.filter(r => r.priority === 'hot'  && !isOverdue(r))
    if (sortFilter === '60days')   list = list.filter(r => r.priority === 'warm' && !isOverdue(r))
    if (sortFilter === '90days')   list = list.filter(r => r.priority === 'cold' && !isOverdue(r))
    if (sortFilter === 'overdue')  list = list.filter(r => isOverdue(r))

    // Search
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(r => clientFullName(r).toLowerCase().includes(q))
    }

    // Sort
    if (sortFilter === 'oldest') {
      list.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt))
    } else {
      // Default: most recent first, with overdue always on top
      list.sort((a, b) => {
        const aOver = isOverdue(a) ? 0 : 1
        const bOver = isOverdue(b) ? 0 : 1
        if (aOver !== bOver) return aOver - bOver
        return new Date(b.savedAt) - new Date(a.savedAt)
      })
    }

    return list
  }, [records, activeFilter, sortFilter, search])

  function handleStatClick(key) {
    setActiveFilter(prev => prev === key ? null : key)
    setSortFilter('most_recent')
  }

  function handleDelete(record) {
    setDeleteTarget(record)
  }

  function confirmDelete() {
    const updated = records.filter(r => r.id !== deleteTarget.id)
    saveRecords(updated)
    setRecords(updated)
    if (onCountChange) onCountChange(updated.length)
    setDeleteTarget(null)
  }

  function handleResume(record) {
    onResumeFollowUp(record)
  }

  return (
    <div className="fu-root animate-in">

      {/* Header */}
      <div className="fu-header">
        <div>
          <div className="fu-eyebrow">Pipeline Management</div>
          <h1 className="fu-title">Follow Up</h1>
          <p className="fu-sub">{records.length} client{records.length !== 1 ? 's' : ''} in pipeline</p>
        </div>
      </div>

      {/* Stat boxes */}
      <div className="fu-stat-row">
        {STAT_BOXES.map(s => (
          <div
            key={s.key}
            className={`fu-stat-card${s.cls ? ' ' + s.cls : ''}${activeFilter === s.key ? ' active' : ''}`}
            onClick={() => handleStatClick(s.key)}
          >
            <div className="fu-stat-num">{s.value}</div>
            <div className="fu-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="fu-toolbar">
        <div className="fu-search-wrap">
          <svg className="fu-search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5"/>
            <line x1="10.5" y1="10.5" x2="14" y2="14"/>
          </svg>
          <input
            className="fu-search"
            type="text"
            placeholder="Search by client name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="fu-search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
        <select
          className="fu-filter-select"
          value={sortFilter}
          onChange={e => { setSortFilter(e.target.value); setActiveFilter(null) }}
        >
          <option value="most_recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="overdue">Overdue Contact</option>
          <option value="today">Today</option>
          <option value="30days">30 Days (Hot)</option>
          <option value="60days">60 Days (Warm)</option>
          <option value="90days">90 Days (Cold)</option>
        </select>
      </div>

      {/* Empty state */}
      {records.length === 0 ? (
        <div className="fu-empty">
          <div className="fu-empty-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="14" cy="10" r="5"/>
              <path d="M4 24c0-5 4.5-8 10-8s10 3 10 8"/>
              <line x1="20" y1="6" x2="24" y2="6"/>
              <line x1="24" y1="4" x2="24" y2="8"/>
            </svg>
          </div>
          <div className="fu-empty-title">No follow-ups yet</div>
          <div className="fu-empty-sub">
            When you save a client as "Not Sold", they'll appear here for follow-up tracking.
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="fu-empty">
          <div className="fu-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div className="fu-empty-title">No results</div>
          <div className="fu-empty-sub">Try a different filter or search term.</div>
        </div>
      ) : (
        <div className="fu-grid">
          {displayed.map(r => (
            <FollowUpCard
              key={r.id}
              record={r}
              onViewDetails={setViewTarget}
              onResume={handleResume}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* View Details modal */}
      {viewTarget && (
        <ViewDetailsModal record={viewTarget} onClose={() => setViewTarget(null)} />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          name={clientFullName(deleteTarget)}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

    </div>
  )
}
