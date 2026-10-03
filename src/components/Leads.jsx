import { useState, useEffect, useRef } from 'react'

function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback }
  catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Single source of truth for all disposition labels + colors ────────────────
// showOnRow: false = call-event data, hidden from lead row pills but usable everywhere else
// type: 'outcome' = per-call result; type: 'state' = persistent lead state
const DISPOSITIONS = [
  { label: 'No Answer',        color: '#a1734a', showOnRow: true,  type: 'outcome' },
  { label: 'Hung Up',          color: '#f97316', showOnRow: true,  type: 'outcome' },
  { label: 'Wrong Number',     color: '#e05c5c', showOnRow: true,  type: 'outcome' },
  { label: 'No English',       color: '#e05c5c', showOnRow: true,  type: 'outcome' },
  { label: 'Under 90 Seconds', color: '#3b82f6', showOnRow: false, type: 'outcome' },
  { label: 'Over 90 Seconds',  color: '#3b82f6', showOnRow: false, type: 'outcome' },
  { label: 'Showed Numbers',   color: '#ec4899', showOnRow: true,  type: 'outcome' },
  { label: 'Callback',         color: '#f59e0b', showOnRow: true,  type: 'state'   },
  { label: 'Interested',       color: '#22d3ee', showOnRow: true,  type: 'state'   },
  { label: 'Not Interested',   color: '#e05c5c', showOnRow: true,  type: 'state'   },
  { label: 'Appointment Set',  color: '#4caf84', showOnRow: true,  type: 'state'   },
  { label: 'Sold',             color: '#4caf84', showOnRow: true,  type: 'state'   },
]

const DISP_MAP     = Object.fromEntries(DISPOSITIONS.map(d => [d.label, d.color]))
const DISP_LABELS  = DISPOSITIONS.map(d => d.label)
const DISP_ROW_SET = new Set(DISPOSITIONS.filter(d => d.showOnRow).map(d => d.label))
const DISP_FILTER_OPTIONS = ['Needs Disposition', ...DISP_LABELS]

// State dispositions represent the lead's persistent status; outcomes are per-call
const STATE_DISPS   = new Set(DISPOSITIONS.filter(d => d.type === 'state').map(d => d.label))
const OUTCOME_DISPS = new Set(DISPOSITIONS.filter(d => d.type === 'outcome').map(d => d.label))
// Which incoming state clears which earlier states
const STATE_CLEARS = {
  'Sold':            new Set(['Callback','Interested','Not Interested','Appointment Set']),
  'Appointment Set': new Set(['Callback','Interested','Not Interested']),
  'Not Interested':  new Set(['Callback','Interested']),
  'Interested':      new Set(['Not Interested']),
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function dispStyle(label) {
  const color = DISP_MAP[label] || '#888888'
  return { color, background: hexToRgba(color, 0.1), borderColor: color }
}

const SOURCES = ['Facebook', 'Direct Mail', 'Internet', 'Referral', 'Call Center', 'TV/Radio']
const VENDORS = ['LeadCo', 'ZipLeads', 'PremiumLeads', 'MediaAlpha', 'ProspectBoss', 'DigitalLeads']
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

const VALID_DISPS = new Set(DISP_LABELS)

// Derive a lead's current state + most-recent-call outcomes from its call logs
function deriveLeadState(leadLogs) {
  const sorted = [...leadLogs].sort((a,b) => new Date(a.loggedAt)-new Date(b.loggedAt))
  let currentState = null
  let stateLogId   = null
  const superseded = []

  for (const log of sorted) {
    for (const d of (log.dispositions || [])) {
      if (!STATE_DISPS.has(d)) continue
      const clears = STATE_CLEARS[d]
      if (clears && currentState && clears.has(currentState)) {
        superseded.push({ logId: stateLogId, disp: currentState, replacedBy: d })
        currentState = null; stateLogId = null
      }
      currentState = d; stateLogId = log.id
    }
  }

  const mostRecent    = sorted[sorted.length - 1]
  const currentOutcomes = mostRecent
    ? (mostRecent.dispositions || []).filter(d => OUTCOME_DISPS.has(d))
    : []

  return { currentState, stateLogId, currentOutcomes, superseded }
}

function migrateLead(lead) {
  const out = { ...lead }
  if (!Array.isArray(out.dispositions)) {
    if (out.currentDisposition === 'Closed - Sold') {
      out.dispositions = ['Appointment Set', 'Sold']
    } else if (out.currentDisposition && out.currentDisposition !== 'Do Not Contact') {
      out.dispositions = [out.currentDisposition]
    } else {
      out.dispositions = []
    }
    delete out.currentDisposition
  }
  // Voicemail → No Answer
  out.dispositions = out.dispositions.map(d => d === 'Voicemail' ? 'No Answer' : d)
  out.dispositions = out.dispositions.filter(d => VALID_DISPS.has(d))
  if (typeof out.callCount !== 'number') out.callCount = out.called ? 1 : 0
  return out
}

function initCallLogs() {
  const logs = load('ffl_call_logs', [])
  // Migrate Voicemail → No Answer in all existing logs
  const migrated = logs.map(log => ({
    ...log,
    dispositions: (log.dispositions || []).map(d => d === 'Voicemail' ? 'No Answer' : d)
  }))
  if (JSON.stringify(migrated) !== JSON.stringify(logs)) save('ffl_call_logs', migrated)
  return migrated
}

function initLeads() {
  const existing = load('ffl_leads', [])
  if (!existing.length) return []
  const migrated = existing.map(migrateLead)
  if (JSON.stringify(migrated) !== JSON.stringify(existing)) save('ffl_leads', migrated)
  return migrated
}

function getLocalTime(timezone) {
  try { return new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}
function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return iso }
}
function formatDateTime(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}
function formatRelativeDate(iso) {
  if (!iso) return ''
  const ms   = Date.now() - new Date(iso)
  const mins = Math.floor(ms / 60000)
  const hrs  = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hrs  < 24)  return `${hrs}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7)   return `${days}d ago`
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconChevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}>
      <polyline points="4 2 8 6 4 10" />
    </svg>
  )
}
function IconCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1" /><path d="M1 8V1h7" />
    </svg>
  )
}
function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="3" x2="13" y2="3" /><line x1="3" y1="7" x2="11" y2="7" /><line x1="5" y1="11" x2="9" y2="11" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5 5.5 4.5 8.5 9.5 2.5" />
    </svg>
  )
}

// ── MultiSelect dropdown ──────────────────────────────────────────────────────
function MultiSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div className="lf-multiselect" style={{ position: 'relative' }}>
      <button className="lf-ms-btn" onClick={() => setOpen(o => !o)} type="button">
        <span>{value.length ? `${label}: ${value.length} selected` : label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="2 3.5 5 6.5 8 3.5" />
        </svg>
      </button>
      {open && (
        <div className="lf-ms-dropdown">
          {options.map(opt => (
            <label key={opt} className="lf-ms-option">
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Search Autocomplete ───────────────────────────────────────────────────────
function SearchAutocomplete({ value, onChange, onSelectLead, leads }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const suggestions = value.trim().length > 0
    ? leads.filter(l => {
        const q = value.toLowerCase()
        const name = `${l.firstName} ${l.lastName}`.toLowerCase()
        return name.includes(q) || l.phone.includes(q) || (l.email || '').toLowerCase().includes(q)
      }).slice(0, 8)
    : []

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])

  function handleChange(e) {
    onChange(e.target.value)
    setOpen(true)
  }

  function handleSelect(lead) {
    onChange(`${lead.firstName} ${lead.lastName}`)
    onSelectLead(lead.id)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="lf-search-wrap">
      <input
        className="lf-search-input"
        value={value}
        onChange={handleChange}
        onFocus={() => value.trim().length > 0 && setOpen(true)}
        placeholder="Name, phone, or email"
      />
      {open && value.trim().length > 0 && (
        <div className="lf-search-dropdown">
          {suggestions.length === 0
            ? <div className="lf-search-empty">No leads found</div>
            : suggestions.map(l => (
              <button key={l.id} className="lf-search-result" onMouseDown={() => handleSelect(l)}>
                <span className="lf-search-name">{l.firstName} {l.lastName}</span>
                <span className="lf-search-phone">{l.phone}</span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── Disposition pills (row display) ──────────────────────────────────────────
function DispositionPills({ leadLogs, callCount, onNeedsDisposition }) {
  if (callCount === 0) {
    return (
      <div className="lead-disp-pills-row">
        <span className="lead-disp-pill" style={{ color: '#888888', background: 'rgba(136,136,136,0.1)', borderColor: '#888888' }}>
          NOT CALLED
        </span>
      </div>
    )
  }

  const { currentState, currentOutcomes } = deriveLeadState(leadLogs)

  // Sold is terminal — show only Sold, nothing else
  if (currentState === 'Sold') {
    return (
      <div className="lead-disp-pills-row">
        <span className="lead-disp-pill" style={dispStyle('Sold')}>Sold</span>
      </div>
    )
  }

  // No Answer is a placeholder: suppress it once the lead has any real disposition
  const hasNonNoAnswer = leadLogs.some(log =>
    (log.dispositions || []).some(d => d !== 'No Answer')
  )

  const pills = []
  if (currentState && DISP_ROW_SET.has(currentState)) pills.push(currentState)
  currentOutcomes
    .filter(d => DISP_ROW_SET.has(d) && !pills.includes(d))
    .filter(d => !(d === 'No Answer' && hasNonNoAnswer))
    .forEach(d => pills.push(d))

  if (pills.length > 0) {
    return (
      <div className="lead-disp-pills-row">
        {pills.map(d => (
          <span key={d} className="lead-disp-pill" style={dispStyle(d)}>{d}</span>
        ))}
      </div>
    )
  }

  return (
    <div className="lead-disp-pills-row">
      <button className="lead-disp-needs-btn"
        onClick={e => { e.stopPropagation(); onNeedsDisposition() }}>
        NEEDS DISPOSITION
      </button>
    </div>
  )
}

// ── Disposition picker modal (multi-select toggle) ────────────────────────────
function DispositionModal({ lead, initialDispositions, onSave, onClose }) {
  const [selected, setSelected] = useState(initialDispositions ? [...initialDispositions] : [])

  function toggle(label) {
    if (selected.includes(label)) setSelected(selected.filter(s => s !== label))
    else setSelected([...selected, label])
  }

  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Set Disposition</h2>
          <button className="db-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#888' }}>
            {lead.firstName} {lead.lastName} · select all that apply
          </p>
          <div className="lead-disp-picker">
            {DISPOSITIONS.map(({ label, color }) => {
              const active = selected.includes(label)
              return (
                <button key={label} onClick={() => toggle(label)}
                  className={`lead-disp-pick-item${active ? ' lead-disp-pick-active' : ''}`}
                  style={active ? { background: hexToRgba(color, 0.1), borderColor: hexToRgba(color, 0.35) } : {}}>
                  <span className="lead-disp-pick-check"
                    style={active
                      ? { background: color, borderColor: color, color: '#fff' }
                      : { borderColor: color }}>
                    {active && <IconCheck />}
                  </span>
                  <span style={{ color }}>{label}</span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <button className="leads-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="leads-btn-teal" onClick={() => onSave(selected)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Create Lead modal ─────────────────────────────────────────────────────────
function CreateLeadModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    state: '', age: '', source: '', vendor: '', costPerLead: '',
  })
  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }
  function handleCreate() {
    if (!form.firstName || !form.lastName || !form.phone) return
    onSave({
      id: `l${Date.now()}`,
      firstName: form.firstName, lastName: form.lastName,
      phone: form.phone, altPhone: '', email: form.email,
      street: '', city: '', state: form.state, zip: '', timezone: '',
      dob: '', age: parseInt(form.age) || 0,
      source: form.source, vendor: form.vendor,
      costPerLead: parseFloat(form.costPerLead) || 0,
      smoker: false, medicalConditions: '', veteran: false, coverageInterest: '',
      dispositions: [], callCount: 0, called: false, notes: '',
      receivedAt: new Date().toISOString(), lastContactedAt: null, nextFollowUpAt: null, clientId: null,
    })
  }
  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" onClick={e => e.stopPropagation()}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Create Lead</h2>
          <button className="db-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="leads-field"><label>First Name *</label><input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First" /></div>
            <div className="leads-field"><label>Last Name *</label><input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="leads-field"><label>Phone *</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" /></div>
            <div className="leads-field"><label>Email</label><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="leads-field">
              <label>State</label>
              <select value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="leads-field"><label>Age</label><input type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="0" min="18" max="99" /></div>
            <div className="leads-field"><label>Cost / Lead</label><input type="number" value={form.costPerLead} onChange={e => set('costPerLead', e.target.value)} placeholder="0.00" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="leads-field">
              <label>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}>
                <option value="">Select</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="leads-field">
              <label>Vendor</label>
              <select value={form.vendor} onChange={e => set('vendor', e.target.value)}>
                <option value="">Select</option>
                {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="leads-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="leads-btn-teal" onClick={handleCreate}
              disabled={!form.firstName || !form.lastName || !form.phone}
              style={{ opacity: (!form.firstName || !form.lastName || !form.phone) ? 0.4 : 1 }}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CSV modal ─────────────────────────────────────────────────────────────────
function CsvModal({ onClose }) {
  return (
    <div className="db-overlay" onClick={onClose}>
      <div className="db-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Upload CSV</h2>
          <button className="db-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '0 24px 28px' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#888', lineHeight: 1.6 }}>
            CSV import is coming soon. You'll be able to bulk-upload leads from any vendor export.
          </p>
          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button className="leads-btn-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Call History modal ────────────────────────────────────────────────────────
function CallHistoryModal({ lead, callLogs, onDeleteLog, onClose }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const leadLogs = [...callLogs]
    .filter(log => log.leadId === lead.id)
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))

  // Build map of which logId has a superseded state disposition
  const { superseded } = deriveLeadState(leadLogs)
  const supersededByLog = {}
  superseded.forEach(s => { supersededByLog[s.logId] = s })

  return (
    <>
      <div className="db-overlay" onClick={onClose}>
        <div className="db-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="db-modal-head">
            <h2 className="db-modal-title">Call History — {lead.firstName} {lead.lastName}</h2>
            <button className="db-modal-close" onClick={onClose}>×</button>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {leadLogs.length === 0 ? (
              <p style={{ color: '#555555', fontSize: 14, margin: 0 }}>No calls logged yet.</p>
            ) : (
              <div style={{ position: 'relative' }}>
                {leadLogs.length > 1 && (
                  <div style={{ position: 'absolute', left: 10, top: 20, bottom: 20, width: 1, background: '#2a2a2a', zIndex: 0 }} />
                )}
                {leadLogs.map((log, idx) => {
                  const isLatest = idx === 0
                  const sup = supersededByLog[log.id]
                  return (
                    <div key={log.id} style={{ position: 'relative', display: 'flex', gap: 14, marginBottom: 18, zIndex: 1 }}>
                      <div style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 3 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isLatest ? '#7c3aed' : '#2a2a2a', border: `1px solid ${isLatest ? '#7c3aed' : '#3a3a3a'}`, flexShrink: 0 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#888888' }}>{formatDateTime(log.loggedAt)}</span>
                            {isLatest && (
                              <span style={{ fontSize: 9, color: '#7c3aed', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 999, padding: '2px 7px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Latest</span>
                            )}
                          </div>
                          <button className="ch-undo-btn" onClick={() => setConfirmDeleteId(log.id)}>Undo</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {(log.dispositions || []).length > 0
                            ? (log.dispositions || []).map(d => {
                                const isSuperseded = sup && sup.disp === d
                                return (
                                  <span key={d} className="lead-disp-pill"
                                    style={isSuperseded
                                      ? { ...dispStyle(d), opacity: 0.4, textDecoration: 'line-through' }
                                      : dispStyle(d)}>
                                    {d}
                                    {isSuperseded && <span style={{ fontSize: 9, marginLeft: 3 }}>→ {sup.replacedBy}</span>}
                                  </span>
                                )
                              })
                            : <span style={{ color: '#555555', fontSize: 12 }}>No dispositions tagged</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="leads-btn-cancel" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>

      {confirmDeleteId && (
        <div className="db-overlay" style={{ zIndex: 1001 }} onClick={() => setConfirmDeleteId(null)}>
          <div className="db-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="db-modal-head">
              <h2 className="db-modal-title">Delete this call log?</h2>
              <button className="db-modal-close" onClick={() => setConfirmDeleteId(null)}>×</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <p style={{ color: '#888888', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
                This removes the call from the lead's history and call analytics.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="leads-btn-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                <button className="leads-btn-delete" onClick={() => { onDeleteLog(confirmDeleteId); setConfirmDeleteId(null) }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Earlier calls tooltip ─────────────────────────────────────────────────────
function EarlierCallsTooltip({ leadLogs, onOpenHistory }) {
  const [show, setShow] = useState(false)
  const sorted    = [...leadLogs].sort((a,b) => new Date(b.loggedAt) - new Date(a.loggedAt))
  const priorLogs = sorted.slice(1)  // everything except the most recent call
  const count     = priorLogs.length
  if (count === 0) return null

  const display  = priorLogs.slice(0, 8)
  const overflow = priorLogs.length - 8

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      <span
        onClick={e => { e.stopPropagation(); onOpenHistory() }}
        style={{ color: '#b4b4b4', fontSize: 11, cursor: 'pointer',
          textDecoration: show ? 'underline' : 'none', textUnderlineOffset: 2 }}>
        +{count} earlier
      </span>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
          background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8,
          padding: '10px 12px', zIndex: 1000, minWidth: 210, maxWidth: 300,
          boxShadow: '0 6px 24px rgba(0,0,0,0.6)', pointerEvents: 'none',
        }}>
          {display.map((log, i) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8,
              marginBottom: i < display.length - 1 ? 7 : 0 }}>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {(log.dispositions || []).length === 0
                  ? <span style={{ fontSize: 10, color: '#444444', fontStyle: 'italic' }}>No disposition</span>
                  : (log.dispositions || []).map(d => {
                      const color = DISP_MAP[d] || '#888888'
                      return (
                        <span key={d} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 999,
                          color, background: hexToRgba(color, 0.12), border: `1px solid ${hexToRgba(color, 0.22)}` }}>
                          {d}
                        </span>
                      )
                    })
                }
              </div>
              <span style={{ fontSize: 10, color: '#555555', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2 }}>
                {formatRelativeDate(log.loggedAt)}
              </span>
            </div>
          ))}
          {overflow > 0 && (
            <div style={{ fontSize: 10, color: '#444444', marginTop: 7 }}>…and {overflow} more</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Lead Row ──────────────────────────────────────────────────────────────────
function LeadRow({ lead, leadLogs, callCount, onDisposition, onLogCall, onNotesChange, onCopyPhone, onCallHistory }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(lead.notes || '')
  const callLabel = callCount === 1 ? 'call' : 'calls'

  const sortedLogs = [...leadLogs].sort((a,b) => new Date(b.loggedAt)-new Date(a.loggedAt))
  const lastLog    = sortedLogs[0]
  const lastCallRel = lastLog ? formatRelativeDate(lastLog.loggedAt) : null
  const { currentState } = deriveLeadState(leadLogs)
  const isSold           = currentState === 'Sold'

  return (
    <div className={`lead-row${open ? ' lead-row-open' : ''}`}>
      <div className="lead-row-head" onClick={() => setOpen(o => !o)}>
        <button className="lead-chevron-btn" onClick={e => { e.stopPropagation(); setOpen(o => !o) }}>
          <IconChevron open={open} />
        </button>
        <div className="lead-name-col">
          <span className="lead-name">{lead.firstName} {lead.lastName}</span>
          <div className="lead-phone-row">
            <span className="lead-phone">{lead.phone}</span>
            <button className="lead-copy-btn" onClick={e => { e.stopPropagation(); onCopyPhone(lead.phone) }} title="Copy phone">
              <IconCopy />
            </button>
          </div>
        </div>
        <div className="lead-location">{lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.state || '—'}</div>
        <div className="lead-age">{lead.age || '—'}</div>
        <span className="lead-vendor-pill">{lead.vendor || '—'}</span>
        <div className="lead-disp-pills-col">
          <DispositionPills
            leadLogs={leadLogs}
            callCount={callCount}
            onNeedsDisposition={() => onDisposition(lead)}
          />
          {lastCallRel && (
            <div style={{ fontSize: 11, color: '#b4b4b4', marginTop: 3, display: 'flex', gap: 5, alignItems: 'center' }}
              title={lastLog ? formatDateTime(lastLog.loggedAt) : ''}>
              <span>{lastCallRel}</span>
              {!isSold && (
                <EarlierCallsTooltip leadLogs={leadLogs} onOpenHistory={() => onCallHistory(lead)}/>
              )}
            </div>
          )}
        </div>
        <div className="lead-call-activity-col">
          <button className="lead-call-history-btn" onClick={e => { e.stopPropagation(); onCallHistory(lead) }}>
            <span className="lead-call-count">{callCount}</span>
            <span className="lead-call-word"> {callLabel}</span>
          </button>
        </div>
        <div className="lead-received-col">{formatDate(lead.receivedAt)}</div>
        <div className="lead-actions" onClick={e => e.stopPropagation()}>
          <div className="lead-call-wrap" title="Connect a phone number in Settings → Connectors">
            <button className="lead-call-btn" disabled>Call</button>
          </div>
          <button className="lead-log-call-btn" onClick={e => { e.stopPropagation(); onLogCall(lead) }}>
            Log Call
          </button>
          <button className="lead-disp-btn" onClick={e => { e.stopPropagation(); onDisposition(lead) }}>
            Disposition
          </button>
        </div>
      </div>

      {open && (
        <div className="lead-detail">
          <div className="lead-detail-col">
            <div className="lead-detail-title">Contact</div>
            {lead.street && <div className="lead-detail-row"><span className="lead-detail-label">Address</span><span>{lead.street}, {lead.city}, {lead.state} {lead.zip}</span></div>}
            {lead.dob && <div className="lead-detail-row"><span className="lead-detail-label">DOB</span><span>{lead.dob}</span></div>}
            {lead.timezone && <div className="lead-detail-row"><span className="lead-detail-label">Local Time</span><span>{getLocalTime(lead.timezone)}</span></div>}
            {lead.altPhone && <div className="lead-detail-row"><span className="lead-detail-label">Alt Phone</span><span>{lead.altPhone}</span></div>}
            {lead.email && <div className="lead-detail-row"><span className="lead-detail-label">Email</span><span>{lead.email}</span></div>}
          </div>
          <div className="lead-detail-col">
            <div className="lead-detail-title">Lead Info</div>
            {lead.source && <div className="lead-detail-row"><span className="lead-detail-label">Source</span><span>{lead.source}</span></div>}
            {lead.vendor && <div className="lead-detail-row"><span className="lead-detail-label">Vendor</span><span>{lead.vendor}</span></div>}
            <div className="lead-detail-row"><span className="lead-detail-label">Cost</span><span>{lead.costPerLead > 0 ? `$${lead.costPerLead}` : 'Referral'}</span></div>
            {lead.age > 0 && <div className="lead-detail-row"><span className="lead-detail-label">Age</span><span>{lead.age}</span></div>}
            <div className="lead-detail-row"><span className="lead-detail-label">Smoker</span><span>{lead.smoker ? 'Yes' : 'No'}</span></div>
            {lead.medicalConditions && <div className="lead-detail-row"><span className="lead-detail-label">Conditions</span><span>{lead.medicalConditions}</span></div>}
            <div className="lead-detail-row"><span className="lead-detail-label">Veteran</span><span>{lead.veteran ? 'Yes' : 'No'}</span></div>
            {lead.coverageInterest && <div className="lead-detail-row"><span className="lead-detail-label">Coverage</span><span>{lead.coverageInterest}</span></div>}
          </div>
          <div className="lead-detail-col">
            <div className="lead-detail-title">Notes</div>
            <textarea className="lead-notes-ta" value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => onNotesChange(lead.id, notes)}
              placeholder="Add notes..." rows={6} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Column header row ─────────────────────────────────────────────────────────
function LeadsTableHeader() {
  return (
    <div className="leads-table-header">
      <div className="lth-spacer" />
      <div className="lth-name">NAME</div>
      <div className="lth-location">LOCATION</div>
      <div className="lth-age">AGE</div>
      <div className="lth-vendor">VENDOR</div>
      <div className="lth-disp">DISPOSITION</div>
      <div className="lth-calls">CALL ACTIVITY</div>
      <div className="lth-received">RECEIVED</div>
      <div className="lth-actions" />
    </div>
  )
}

// ── Main Leads component ──────────────────────────────────────────────────────
// Every disposition where a live person answered — No Answer is the only exclusion
const CONTACT_SET_LEADS = new Set([
  'Hung Up','Wrong Number','No English',
  'Under 90 Seconds','Over 90 Seconds','Showed Numbers',
  'Callback','Interested','Not Interested','Appointment Set','Sold',
])

const PREFILTER_TESTS = {
  untouched:         (lead, logs) => !logs.some(l => l.leadId === lead.id),
  needs_disposition: (lead, logs) => { const ll = logs.filter(l => l.leadId === lead.id); if (!ll.length) return false; const last = ll.sort((a,b) => new Date(b.loggedAt)-new Date(a.loggedAt))[0]; return last.dispositions.length === 0 },
  overdue_callback:  (lead, logs) => { const ll = logs.filter(l => l.leadId === lead.id); const { currentState } = deriveLeadState(ll); if (currentState !== 'Callback') return false; const sorted = ll.sort((a,b) => new Date(b.loggedAt)-new Date(a.loggedAt)); const cbLog = sorted.find(l => l.dispositions.includes('Callback')); return cbLog && (Date.now()-new Date(cbLog.loggedAt)) > 86400000 },
  called:     (lead, logs) => logs.some(l => l.leadId === lead.id),
  contacted:  (lead, logs) => logs.some(l => l.leadId === lead.id && l.dispositions.some(d => CONTACT_SET_LEADS.has(d))),
  interested: (lead, logs) => { const ll = logs.filter(l => l.leadId === lead.id); const { currentState } = deriveLeadState(ll); return currentState === 'Interested' || currentState === 'Callback' || currentState === 'Appointment Set' || currentState === 'Sold' || ll.some(l => l.dispositions.includes('Showed Numbers')) },
  appt_set:   (lead, logs) => logs.some(l => l.leadId === lead.id && (l.dispositions.includes('Appointment Set') || l.dispositions.includes('Sold'))),
  sold:       (lead, logs) => logs.some(l => l.leadId === lead.id && l.dispositions.includes('Sold')),
}

export default function Leads({ preFilter }) {
  const [leads, setLeads]           = useState(initLeads)
  const [callLogs, setCallLogs]     = useState(initCallLogs)
  const [preFilterChip, setPreFilterChip] = useState(null)

  useEffect(() => {
    if (!preFilter) return
    setPreFilterChip(preFilter.label || preFilter.type)
  }, [])
  const [filtersOpen, setFiltersOpen]     = useState(false)
  const [showCreate, setShowCreate]       = useState(false)
  const [showCsv, setShowCsv]             = useState(false)
  const [dispModal, setDispModal]               = useState(null)
  const [dispInitDisps, setDispInitDisps]       = useState([])
  const [pendingCallLogId, setPendingCallLogId] = useState(null)
  const [callHistoryModal, setCallHistoryModal] = useState(null)
  const [copied, setCopied]                     = useState(false)

  // Derive call count per lead from logs
  const callCountByLead = {}
  callLogs.forEach(log => {
    callCountByLead[log.leadId] = (callCountByLead[log.leadId] || 0) + 1
  })

  // Live search (applied immediately, not gated by Apply button)
  const [filterSearch, setFilterSearch]     = useState('')
  const [filterSearchId, setFilterSearchId] = useState(null)

  // Gated filters (applied on button click)
  const [filterDateFrom, setFilterDateFrom]   = useState('')
  const [filterDateTo, setFilterDateTo]       = useState('')
  const [filterVendors, setFilterVendors]     = useState([])
  const [filterStates, setFilterStates]       = useState([])
  const [filterDisps, setFilterDisps]         = useState([])
  const [filterExclDisps, setFilterExclDisps] = useState([])
  const [filterNeverCalled, setFilterNeverCalled] = useState(false)
  const [applied, setApplied] = useState(null)

  function applyFilters() {
    setApplied({ filterDateFrom, filterDateTo, filterVendors, filterStates, filterDisps, filterExclDisps, filterNeverCalled })
    setFiltersOpen(false)
  }
  function resetFilters() {
    setFilterDateFrom(''); setFilterDateTo(''); setFilterVendors([]); setFilterStates([])
    setFilterDisps([]); setFilterExclDisps([]); setFilterNeverCalled(false)
    setFilterSearch(''); setFilterSearchId(null)
    setApplied(null)
  }

  const activeCount = [
    applied?.filterDateFrom, applied?.filterDateTo,
    ...(applied?.filterVendors || []), ...(applied?.filterStates || []),
    ...(applied?.filterDisps || []), ...(applied?.filterExclDisps || []),
    applied?.filterNeverCalled ? 'x' : null,
    filterSearch || null,
  ].filter(Boolean).length

  const filteredLeads = [...leads]
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
    .filter(lead => {
      // preFilter from analytics deep link
      if (preFilter && preFilterChip) {
        const testFn = PREFILTER_TESTS[preFilter.type]
        if (testFn && !testFn(lead, callLogs)) return false
      }
      // Live search / autocomplete
      if (filterSearchId) {
        if (lead.id !== filterSearchId) return false
      } else if (filterSearch) {
        const q = filterSearch.toLowerCase()
        const name = `${lead.firstName} ${lead.lastName}`.toLowerCase()
        if (!name.includes(q) && !lead.phone.includes(q) && !(lead.email || '').toLowerCase().includes(q)) return false
      }
      // Applied filters
      const f = applied
      if (!f) return true
      if (f.filterDateFrom && lead.receivedAt < f.filterDateFrom) return false
      if (f.filterDateTo && lead.receivedAt > f.filterDateTo + 'T23:59:59Z') return false
      if (f.filterVendors.length && !f.filterVendors.includes(lead.vendor)) return false
      if (f.filterStates.length && !f.filterStates.includes(lead.state)) return false
      if (f.filterDisps.length || f.filterExclDisps.length) {
        const lc = callCountByLead[lead.id] || 0
        const leadLogs2 = callLogs.filter(l => l.leadId === lead.id)
        const { currentState, currentOutcomes } = deriveLeadState(leadLogs2)
        const dispSet = new Set([currentState, ...currentOutcomes].filter(Boolean))
        const isNeedsDisp = lc > 0 && dispSet.size === 0
        if (f.filterDisps.length) {
          const matches = f.filterDisps.some(fd =>
            fd === 'Needs Disposition' ? isNeedsDisp : dispSet.has(fd)
          )
          if (!matches) return false
        }
        if (f.filterExclDisps.length) {
          const excluded = f.filterExclDisps.some(fd =>
            fd === 'Needs Disposition' ? isNeedsDisp : dispSet.has(fd)
          )
          if (excluded) return false
        }
      }
      if (f.filterNeverCalled && (callCountByLead[lead.id] || 0) > 0) return false
      return true
    })

  function handleCopyPhone(phone) {
    navigator.clipboard.writeText(phone).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function saveDisposition(newDisps) {
    let updatedLogs
    if (pendingCallLogId) {
      updatedLogs = callLogs.map(log =>
        log.id === pendingCallLogId ? { ...log, dispositions: newDisps } : log
      )
      setPendingCallLogId(null)
    } else {
      // Standalone disposition: update most recent log, or create a new one
      const leadCallLogs = callLogs.filter(l => l.leadId === dispModal.id)
        .sort((a,b) => new Date(b.loggedAt)-new Date(a.loggedAt))
      if (leadCallLogs.length > 0) {
        updatedLogs = callLogs.map(log =>
          log.id === leadCallLogs[0].id ? { ...log, dispositions: newDisps } : log
        )
      } else {
        const now = new Date().toISOString()
        const newLog = { id: `cl${Date.now()}`, leadId: dispModal.id, agentId: null, dispositions: newDisps, notes: null, durationSec: null, loggedAt: now }
        updatedLogs = [newLog, ...callLogs]
      }
    }
    setCallLogs(updatedLogs)
    save('ffl_call_logs', updatedLogs)
    // Keep lead.called flag in sync (no longer store dispositions on lead)
    const updated = leads.map(l => l.id === dispModal.id ? { ...l, called: true } : l)
    setLeads(updated); save('ffl_leads', updated); setDispModal(null)
  }

  function handleCloseDisposition() {
    setPendingCallLogId(null)
    setDispInitDisps([])
    setDispModal(null)
  }

  function handleLogCall(lead) {
    const now = new Date().toISOString()
    const newLog = {
      id: `cl${Date.now()}`,
      leadId: lead.id,
      agentId: null,
      dispositions: [],
      notes: null,
      durationSec: null,
      loggedAt: now,
    }
    const updatedLogs = [newLog, ...callLogs]
    setCallLogs(updatedLogs)
    save('ffl_call_logs', updatedLogs)
    const updatedLeads = leads.map(l =>
      l.id === lead.id ? { ...l, lastContactedAt: now, called: true } : l
    )
    setLeads(updatedLeads)
    save('ffl_leads', updatedLeads)
    setPendingCallLogId(newLog.id)
    setDispInitDisps([])
    setDispModal(lead)
  }

  function handleDeleteLog(logId) {
    const logToDelete = callLogs.find(l => l.id === logId)
    const updatedLogs = callLogs.filter(l => l.id !== logId)
    setCallLogs(updatedLogs)
    save('ffl_call_logs', updatedLogs)
    if (logToDelete) {
      const remaining = updatedLogs
        .filter(l => l.leadId === logToDelete.leadId)
        .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
      const newLastContacted = remaining.length > 0 ? remaining[0].loggedAt : null
      const updatedLeads = leads.map(l =>
        l.id === logToDelete.leadId ? { ...l, lastContactedAt: newLastContacted } : l
      )
      setLeads(updatedLeads)
      save('ffl_leads', updatedLeads)
    }
  }

  function handleNotesChange(id, notes) {
    const updated = leads.map(l => l.id === id ? { ...l, notes } : l)
    setLeads(updated); save('ffl_leads', updated)
  }

  function handleCreateLead(lead) {
    const updated = [lead, ...leads]
    setLeads(updated); save('ffl_leads', updated); setShowCreate(false)
  }

  return (
    <div className="leads-root">
      <div className="leads-header">
        <div className="leads-header-left">
          <h1 className="leads-title">Leads</h1>
          <span className="leads-count">{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="leads-header-right">
          <button className="leads-btn-filter" onClick={() => setFiltersOpen(o => !o)}>
            <IconFilter />
            Filters
            {activeCount > 0 && <span className="leads-filter-badge">{activeCount}</span>}
          </button>
          <button className="leads-btn-outline" onClick={() => setShowCsv(true)}>Upload CSV</button>
          <button className="leads-btn-teal" onClick={() => setShowCreate(true)}>+ Create Lead</button>
        </div>
      </div>

      {preFilterChip && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 999, padding: '5px 12px', fontSize: 12, color: '#a78bfa' }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="1,1 11,1 7,6 7,11 5,11 5,6"/></svg>
            Filtered: {preFilterChip}
            <button onClick={() => setPreFilterChip(null)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: '0 0 0 4px', fontSize: 14, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
          </div>
        </div>
      )}

      {filtersOpen && (
        <div className="leads-filter-bar">
          <div className="lf-grid">
            <div className="leads-field">
              <label>Received From</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="leads-field">
              <label>Received To</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
            <MultiSelect label="Vendor" options={VENDORS} value={filterVendors} onChange={setFilterVendors} />
            <MultiSelect label="State" options={US_STATES} value={filterStates} onChange={setFilterStates} />
            <MultiSelect label="Disposition" options={DISP_FILTER_OPTIONS} value={filterDisps} onChange={setFilterDisps} />
            <MultiSelect label="Exclude Disposition" options={DISP_FILTER_OPTIONS} value={filterExclDisps} onChange={setFilterExclDisps} />
            <div className="leads-field" style={{ gridColumn: '1 / 3' }}>
              <label>Search</label>
              <SearchAutocomplete
                value={filterSearch}
                onChange={v => { setFilterSearch(v); setFilterSearchId(null) }}
                onSelectLead={id => setFilterSearchId(id)}
                leads={leads}
              />
            </div>
            <div className="lf-toggle-row">
              <label className="lf-toggle">
                <input type="checkbox" checked={filterNeverCalled} onChange={e => setFilterNeverCalled(e.target.checked)} />
                <span>Only show never called</span>
              </label>
            </div>
          </div>
          <div className="lf-actions">
            <button className="leads-btn-cancel" onClick={resetFilters}>Reset</button>
            <button className="leads-btn-teal" onClick={applyFilters}>Apply</button>
          </div>
        </div>
      )}

      <div className="leads-list">
        {filteredLeads.length === 0 ? (
          <div className="leads-empty">No leads match the current filters.</div>
        ) : (
          <>
            <LeadsTableHeader />
            {filteredLeads.map(lead => {
              const leadLogs = callLogs.filter(l => l.leadId === lead.id)
              return (
                <LeadRow key={lead.id} lead={lead}
                  leadLogs={leadLogs}
                  callCount={callCountByLead[lead.id] || 0}
                  onDisposition={l => {
                    const ll = callLogs.filter(cl => cl.leadId === l.id)
                      .sort((a,b) => new Date(b.loggedAt)-new Date(a.loggedAt))
                    setDispInitDisps(ll.length > 0 ? ll[0].dispositions : [])
                    setDispModal(l)
                  }}
                  onLogCall={handleLogCall}
                  onNotesChange={handleNotesChange}
                  onCopyPhone={handleCopyPhone}
                  onCallHistory={l => setCallHistoryModal(l)} />
              )
            })}
          </>
        )}
      </div>

      {copied && <div className="leads-copy-toast">Phone copied!</div>}

      {dispModal && <DispositionModal lead={dispModal} initialDispositions={dispInitDisps} onSave={saveDisposition} onClose={handleCloseDisposition} />}
      {callHistoryModal && <CallHistoryModal lead={callHistoryModal} callLogs={callLogs} onDeleteLog={handleDeleteLog} onClose={() => setCallHistoryModal(null)} />}
      {showCreate && <CreateLeadModal onSave={handleCreateLead} onClose={() => setShowCreate(false)} />}
      {showCsv && <CsvModal onClose={() => setShowCsv(false)} />}
    </div>
  )
}
