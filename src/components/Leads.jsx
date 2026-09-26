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
const DISPOSITIONS = [
  { label: 'Voicemail',        color: '#a1734a', showOnRow: true  },
  { label: 'Hung Up',          color: '#f97316', showOnRow: true  },
  { label: 'Wrong Number',     color: '#e05c5c', showOnRow: true  },
  { label: 'No English',       color: '#e05c5c', showOnRow: true  },
  { label: 'Under 90 Seconds', color: '#3b82f6', showOnRow: false },
  { label: 'Over 90 Seconds',  color: '#3b82f6', showOnRow: false },
  { label: 'Showed Numbers',   color: '#ec4899', showOnRow: true  },
  { label: 'Interested',       color: '#22d3ee', showOnRow: true  },
  { label: 'Not Interested',   color: '#e05c5c', showOnRow: true  },
  { label: 'Callback',         color: '#f59e0b', showOnRow: true  },
  { label: 'Appointment Set',  color: '#4caf84', showOnRow: true  },
  { label: 'Sold',             color: '#4caf84', showOnRow: true  },
]

const DISP_MAP    = Object.fromEntries(DISPOSITIONS.map(d => [d.label, d.color]))
const DISP_LABELS = DISPOSITIONS.map(d => d.label)
// Row-visible dispositions (excludes call-event duration data)
const DISP_ROW_SET = new Set(DISPOSITIONS.filter(d => d.showOnRow).map(d => d.label))
// Filter dropdown options — "Needs Disposition" is a computed state, not a real disposition
const DISP_FILTER_OPTIONS = ['Needs Disposition', ...DISP_LABELS]

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

const SEED_LEADS = [
  { id: 'l1',  firstName: 'Dorothy', lastName: 'Hawkins',  phone: '(555) 210-3847', altPhone: '',               email: 'dhawkins@email.com',    street: '142 Maple Dr',   city: 'Memphis',     state: 'TN', zip: '38103', timezone: 'America/Chicago',    dob: '1954-03-12', age: 70, source: 'Direct Mail', vendor: 'LeadCo',       costPerLead: 28, smoker: false, medicalConditions: 'Diabetes, COPD',     veteran: false, coverageInterest: 'Final Expense', dispositions: [],                              callCount: 0, called: false, notes: '',                        receivedAt: '2026-09-10T09:15:00Z', lastContactedAt: null,                   nextFollowUpAt: null,                   clientId: null },
  { id: 'l2',  firstName: 'Marcus',  lastName: 'Rivera',   phone: '(555) 334-9201', altPhone: '(555) 334-9202', email: 'mrivera@mail.net',      street: '88 Oak Ave',     city: 'Phoenix',     state: 'AZ', zip: '85001', timezone: 'America/Phoenix',    dob: '1968-07-25', age: 57, source: 'Facebook',    vendor: 'ZipLeads',     costPerLead: 35, smoker: true,  medicalConditions: 'Hypertension',       veteran: true,  coverageInterest: 'Term Life',     dispositions: ['Voicemail'],                   callCount: 2, called: true,  notes: 'Called twice, left VM.',  receivedAt: '2026-09-09T14:20:00Z', lastContactedAt: '2026-09-11T10:00:00Z', nextFollowUpAt: '2026-09-15T10:00:00Z', clientId: null },
  { id: 'l3',  firstName: 'Linda',   lastName: 'Chen',     phone: '(555) 448-7762', altPhone: '',               email: 'linda.chen@work.com',   street: '305 Birch Ln',   city: 'Sacramento',  state: 'CA', zip: '94203', timezone: 'America/Los_Angeles', dob: '1972-11-08', age: 53, source: 'Internet',    vendor: 'PremiumLeads', costPerLead: 42, smoker: false, medicalConditions: 'None',               veteran: false, coverageInterest: 'Whole Life',    dispositions: ['Interested', 'Showed Numbers'], callCount: 1, called: true,  notes: 'Very interested, send info.', receivedAt: '2026-09-08T11:30:00Z', lastContactedAt: '2026-09-09T14:00:00Z', nextFollowUpAt: '2026-09-14T09:00:00Z', clientId: null },
  { id: 'l4',  firstName: 'Robert',  lastName: 'Jackson',  phone: '(555) 567-1234', altPhone: '',               email: 'rjackson@gmail.com',    street: '712 Pine St',    city: 'Atlanta',     state: 'GA', zip: '30301', timezone: 'America/New_York',   dob: '1960-01-30', age: 66, source: 'Direct Mail', vendor: 'MediaAlpha',   costPerLead: 31, smoker: false, medicalConditions: 'Heart Disease',      veteran: false, coverageInterest: 'Final Expense', dispositions: ['Callback'],                    callCount: 1, called: true,  notes: 'Call back Friday after 3pm.', receivedAt: '2026-09-07T08:45:00Z', lastContactedAt: '2026-09-10T13:00:00Z', nextFollowUpAt: '2026-09-12T15:00:00Z', clientId: null },
  { id: 'l5',  firstName: 'Patricia',lastName: 'Moore',    phone: '(555) 623-5581', altPhone: '(555) 623-0001', email: '',                      street: '29 Elm Court',   city: 'Houston',     state: 'TX', zip: '77001', timezone: 'America/Chicago',    dob: '1950-06-14', age: 76, source: 'TV/Radio',    vendor: 'LeadCo',       costPerLead: 22, smoker: false, medicalConditions: 'Arthritis',          veteran: false, coverageInterest: 'Final Expense', dispositions: ['Not Interested'],              callCount: 1, called: true,  notes: '',                        receivedAt: '2026-09-06T16:10:00Z', lastContactedAt: '2026-09-08T11:00:00Z', nextFollowUpAt: null,                   clientId: null },
  { id: 'l6',  firstName: 'James',   lastName: 'Williams', phone: '(555) 789-4433', altPhone: '',               email: 'james.w@outlook.com',   street: '456 Cedar Blvd', city: 'Chicago',     state: 'IL', zip: '60601', timezone: 'America/Chicago',    dob: '1975-09-02', age: 50, source: 'Facebook',    vendor: 'ZipLeads',     costPerLead: 38, smoker: true,  medicalConditions: 'None',               veteran: true,  coverageInterest: 'Term Life',     dispositions: [],                              callCount: 0, called: false, notes: '',                        receivedAt: '2026-09-11T07:00:00Z', lastContactedAt: null,                   nextFollowUpAt: null,                   clientId: null },
  { id: 'l7',  firstName: 'Barbara', lastName: 'Taylor',   phone: '(555) 891-2200', altPhone: '',               email: 'btaylor55@email.com',   street: '17 Willow Way',  city: 'Denver',      state: 'CO', zip: '80201', timezone: 'America/Denver',     dob: '1955-04-19', age: 71, source: 'Referral',    vendor: 'ProspectBoss', costPerLead: 0,  smoker: false, medicalConditions: 'Diabetes',           veteran: false, coverageInterest: 'Final Expense', dispositions: ['Interested'],                  callCount: 1, called: true,  notes: 'Referred by client Dorothy H.', receivedAt: '2026-09-05T10:20:00Z', lastContactedAt: '2026-09-05T15:00:00Z', nextFollowUpAt: '2026-09-13T10:00:00Z', clientId: null },
  { id: 'l8',  firstName: 'Thomas',  lastName: 'Anderson', phone: '(555) 102-6677', altPhone: '',               email: 'tanderson@yahoo.com',   street: '900 Spruce St',  city: 'Portland',    state: 'OR', zip: '97201', timezone: 'America/Los_Angeles', dob: '1982-12-05', age: 43, source: 'Internet',    vendor: 'DigitalLeads', costPerLead: 45, smoker: false, medicalConditions: 'None',               veteran: false, coverageInterest: 'Whole Life',    dispositions: [],                              callCount: 0, called: false, notes: '',                        receivedAt: '2026-09-12T13:00:00Z', lastContactedAt: null,                   nextFollowUpAt: null,                   clientId: null },
  { id: 'l9',  firstName: 'Margaret',lastName: 'Wilson',   phone: '(555) 213-8890', altPhone: '(555) 213-8891', email: 'mwilson@hotmail.com',   street: '3 Magnolia Pl',  city: 'Charlotte',   state: 'NC', zip: '28201', timezone: 'America/New_York',   dob: '1948-08-22', age: 77, source: 'Direct Mail', vendor: 'MediaAlpha',   costPerLead: 29, smoker: false, medicalConditions: 'COPD, Hypertension', veteran: false, coverageInterest: 'Final Expense', dispositions: ['Hung Up', 'Wrong Number'],     callCount: 2, called: true,  notes: 'Requested removal.',      receivedAt: '2026-09-04T09:30:00Z', lastContactedAt: '2026-09-06T09:00:00Z', nextFollowUpAt: null,                   clientId: null },
  { id: 'l10', firstName: 'Charles', lastName: 'Martinez', phone: '(555) 324-5566', altPhone: '',               email: 'cmartinez@icloud.com',  street: '200 Pecan Rd',   city: 'San Antonio', state: 'TX', zip: '78201', timezone: 'America/Chicago',    dob: '1963-02-17', age: 63, source: 'Call Center', vendor: 'LeadCo',       costPerLead: 20, smoker: true,  medicalConditions: 'Hypertension',       veteran: true,  coverageInterest: 'Final Expense', dispositions: [],                              callCount: 0, called: false, notes: '',                        receivedAt: '2026-09-11T15:45:00Z', lastContactedAt: null,                   nextFollowUpAt: null,                   clientId: null },
  { id: 'l11', firstName: 'Susan',   lastName: 'Thompson', phone: '(555) 435-7788', altPhone: '',               email: 'sthompson@gmail.com',   street: '55 Hickory Ln',  city: 'Columbus',    state: 'OH', zip: '43085', timezone: 'America/New_York',   dob: '1969-05-30', age: 57, source: 'Facebook',    vendor: 'PremiumLeads', costPerLead: 40, smoker: false, medicalConditions: 'None',               veteran: false, coverageInterest: 'Whole Life',    dispositions: ['Under 90 Seconds'],            callCount: 1, called: true,  notes: '',                        receivedAt: '2026-09-03T12:00:00Z', lastContactedAt: '2026-09-04T10:00:00Z', nextFollowUpAt: null,                   clientId: null },
  { id: 'l12', firstName: 'Michael', lastName: 'Garcia',   phone: '(555) 546-9900', altPhone: '',               email: 'mgarcia@protonmail.com', street: '78 Aspen Ave',  city: 'Las Vegas',   state: 'NV', zip: '89101', timezone: 'America/Los_Angeles', dob: '1978-10-11', age: 47, source: 'Internet',    vendor: 'DigitalLeads', costPerLead: 48, smoker: false, medicalConditions: 'None',               veteran: false, coverageInterest: 'Term Life',     dispositions: ['Appointment Set', 'Sold'],     callCount: 3, called: true,  notes: 'Sold Mutual of Omaha FE.', receivedAt: '2026-09-02T08:00:00Z', lastContactedAt: '2026-09-03T09:00:00Z', nextFollowUpAt: null,                   clientId: null },
]

const VALID_DISPS = new Set(DISP_LABELS)

function migrateLead(lead) {
  const out = { ...lead }
  // currentDisposition string → dispositions array
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
  // Strip removed dispositions (e.g. 'Contacted')
  out.dispositions = out.dispositions.filter(d => VALID_DISPS.has(d))
  if (typeof out.callCount !== 'number') out.callCount = out.called ? 1 : 0
  return out
}

// ── Call log seed data (ffl_call_logs) ───────────────────────────────────────
const SEED_CALL_LOGS = [
  { id: 'cl001', leadId: 'l2',  agentId: null, dispositions: ['Voicemail'],                                      notes: null, durationSec: null, loggedAt: '2026-09-11T10:14:00Z' },
  { id: 'cl002', leadId: 'l2',  agentId: null, dispositions: ['Voicemail'],                                      notes: null, durationSec: null, loggedAt: '2026-09-09T15:30:00Z' },
  { id: 'cl003', leadId: 'l3',  agentId: null, dispositions: ['Over 90 Seconds', 'Showed Numbers', 'Interested'], notes: null, durationSec: null, loggedAt: '2026-09-09T14:22:00Z' },
  { id: 'cl004', leadId: 'l4',  agentId: null, dispositions: ['Over 90 Seconds', 'Callback'],                    notes: null, durationSec: null, loggedAt: '2026-09-10T13:05:00Z' },
  { id: 'cl005', leadId: 'l5',  agentId: null, dispositions: ['Under 90 Seconds', 'Not Interested'],             notes: null, durationSec: null, loggedAt: '2026-09-08T11:10:00Z' },
  { id: 'cl006', leadId: 'l7',  agentId: null, dispositions: ['Over 90 Seconds', 'Interested'],                  notes: null, durationSec: null, loggedAt: '2026-09-05T15:20:00Z' },
  { id: 'cl007', leadId: 'l9',  agentId: null, dispositions: ['Wrong Number'],                                   notes: null, durationSec: null, loggedAt: '2026-09-06T09:15:00Z' },
  { id: 'cl008', leadId: 'l9',  agentId: null, dispositions: ['Hung Up'],                                        notes: null, durationSec: null, loggedAt: '2026-09-04T14:40:00Z' },
  { id: 'cl009', leadId: 'l11', agentId: null, dispositions: ['Under 90 Seconds'],                               notes: null, durationSec: null, loggedAt: '2026-09-04T10:05:00Z' },
  { id: 'cl010', leadId: 'l12', agentId: null, dispositions: ['Appointment Set', 'Sold'],                        notes: null, durationSec: null, loggedAt: '2026-09-03T09:10:00Z' },
  { id: 'cl011', leadId: 'l12', agentId: null, dispositions: ['Over 90 Seconds', 'Showed Numbers'],              notes: null, durationSec: null, loggedAt: '2026-09-02T16:30:00Z' },
  { id: 'cl012', leadId: 'l12', agentId: null, dispositions: ['Voicemail'],                                      notes: null, durationSec: null, loggedAt: '2026-09-02T11:00:00Z' },
]

function initCallLogs() {
  const existing = load('ffl_call_logs', null)
  if (existing) return existing
  save('ffl_call_logs', SEED_CALL_LOGS)
  return SEED_CALL_LOGS
}

function initLeads() {
  const existing = load('ffl_leads', null)
  if (existing) {
    const migrated = existing.map(migrateLead)
    if (JSON.stringify(migrated) !== JSON.stringify(existing)) save('ffl_leads', migrated)
    return migrated
  }
  save('ffl_leads', SEED_LEADS)
  return SEED_LEADS
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
function DispositionPills({ dispositions, callCount, onNeedsDisposition }) {
  // Zero calls always wins regardless of what's in dispositions array
  if (callCount === 0) {
    return (
      <div className="lead-disp-pills-row">
        <span className="lead-disp-pill" style={{ color: '#888888', background: 'rgba(136,136,136,0.1)', borderColor: '#888888' }}>
          NOT CALLED
        </span>
      </div>
    )
  }

  const rowDisps = (dispositions || []).filter(d => DISP_ROW_SET.has(d))

  if (rowDisps.length > 0) {
    return (
      <div className="lead-disp-pills-row">
        {rowDisps.map(d => (
          <span key={d} className="lead-disp-pill" style={dispStyle(d)}>{d}</span>
        ))}
      </div>
    )
  }

  // Has calls but no row-visible disposition — needs cleanup
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
function DispositionModal({ lead, onSave, onClose }) {
  const [selected, setSelected] = useState(lead.dispositions ? [...lead.dispositions] : [])

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
              <div className="ch-list">
                {leadLogs.map(log => (
                  <div key={log.id} className="ch-row">
                    <div className="ch-row-top">
                      <div className="ch-date">{formatDateTime(log.loggedAt)}</div>
                      <button className="ch-undo-btn" onClick={() => setConfirmDeleteId(log.id)}>Undo</button>
                    </div>
                    <div className="ch-pills">
                      {log.dispositions.length > 0
                        ? log.dispositions.map(d => (
                            <span key={d} className="lead-disp-pill" style={dispStyle(d)}>{d}</span>
                          ))
                        : <span style={{ color: '#555555', fontSize: 12 }}>No dispositions tagged</span>}
                    </div>
                  </div>
                ))}
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

// ── Lead Row ──────────────────────────────────────────────────────────────────
function LeadRow({ lead, callCount, onDisposition, onLogCall, onNotesChange, onCopyPhone, onCallHistory }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(lead.notes || '')
  const callLabel = callCount === 1 ? 'call' : 'calls'

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
            dispositions={lead.dispositions}
            callCount={callCount}
            onNeedsDisposition={() => onDisposition(lead)}
          />
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
export default function Leads() {
  const [leads, setLeads]           = useState(initLeads)
  const [callLogs, setCallLogs]     = useState(initCallLogs)
  const [filtersOpen, setFiltersOpen]     = useState(false)
  const [showCreate, setShowCreate]       = useState(false)
  const [showCsv, setShowCsv]             = useState(false)
  const [dispModal, setDispModal]               = useState(null)
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
        const rowDisps = (lead.dispositions || []).filter(d => DISP_ROW_SET.has(d))
        const isNeedsDisp = lc > 0 && rowDisps.length === 0
        const dispSet = new Set(lead.dispositions || [])
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
      if (f.filterNeverCalled && lead.called) return false
      return true
    })

  function handleCopyPhone(phone) {
    navigator.clipboard.writeText(phone).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function saveDisposition(newDisps) {
    // If opened from Log Call, write dispositions onto that log record
    if (pendingCallLogId) {
      const originalDisps = dispModal.dispositions || []
      const addedDisps = newDisps.filter(d => !originalDisps.includes(d))
      const updatedLogs = callLogs.map(log =>
        log.id === pendingCallLogId ? { ...log, dispositions: addedDisps } : log
      )
      setCallLogs(updatedLogs)
      save('ffl_call_logs', updatedLogs)
      setPendingCallLogId(null)
    }
    const updated = leads.map(l => l.id === dispModal.id
      ? { ...l, dispositions: newDisps, called: newDisps.length > 0 }
      : l)
    setLeads(updated); save('ffl_leads', updated); setDispModal(null)
  }

  function handleCloseDisposition() {
    setPendingCallLogId(null)
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
            {filteredLeads.map(lead => (
              <LeadRow key={lead.id} lead={lead}
                callCount={callCountByLead[lead.id] || 0}
                onDisposition={l => setDispModal(l)}
                onLogCall={handleLogCall}
                onNotesChange={handleNotesChange}
                onCopyPhone={handleCopyPhone}
                onCallHistory={l => setCallHistoryModal(l)} />
            ))}
          </>
        )}
      </div>

      {copied && <div className="leads-copy-toast">Phone copied!</div>}

      {dispModal && <DispositionModal lead={dispModal} onSave={saveDisposition} onClose={handleCloseDisposition} />}
      {callHistoryModal && <CallHistoryModal lead={callHistoryModal} callLogs={callLogs} onDeleteLog={handleDeleteLog} onClose={() => setCallHistoryModal(null)} />}
      {showCreate && <CreateLeadModal onSave={handleCreateLead} onClose={() => setShowCreate(false)} />}
      {showCsv && <CsvModal onClose={() => setShowCsv(false)} />}
    </div>
  )
}
