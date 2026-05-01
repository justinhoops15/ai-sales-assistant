import { useMemo, useState, useRef, useCallback } from 'react'

// ── Constants ───────────────────────────────────────────────────────────────
const LEAD_LABELS = {
  mortgage_protection: 'Mortgage Protection',
  final_expense:       'Final Expense',
  veteran:             'Veteran',
}

const US_STATES = [
  { abbr: 'AL', name: 'Alabama' },       { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },       { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },    { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },   { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },       { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },        { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },      { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },          { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },      { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },         { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },     { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },      { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },      { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },    { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },{ abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },          { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },        { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },         { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },       { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },    { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },     { abbr: 'WY', name: 'Wyoming' },
]

const EMPTY_APPT = {
  name: '', email: '', state: '', location: '', leadType: '',
  tobacco: '', date: '', time: '',
  mortgageBalance: '', mortgagePayment: '', mortgageTerm: '',
  age: '', phone: '', notes: '',
}

const FILTER_OPTS = [
  { key: 'week',  label: 'Week'     },
  { key: 'month', label: 'Month'    },
  { key: 'year',  label: 'Year'     },
  { key: 'all',   label: 'All Time' },
]

const APPT_FILTER_OPTS = [
  { key: 'day',   label: 'Day'      },
  { key: 'week',  label: 'Week'     },
  { key: 'month', label: 'Month'    },
  { key: 'year',  label: 'Year'     },
  { key: 'all',   label: 'All Time' },
]

const CAL_FILTER_OPTS = [
  { key: 'day',   label: 'Day'   },
  { key: 'week',  label: 'Week'  },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year'  },
]

// ── localStorage helpers ────────────────────────────────────────────────────
function loadSoldAppts() {
  try { return JSON.parse(localStorage.getItem('ffl_appointments') || '[]') }
  catch { return [] }
}

function loadFollowUpAppts() {
  try { return JSON.parse(localStorage.getItem('follow_up_appointments') || '[]') }
  catch { return [] }
}

function loadReachedResults() {
  try { return JSON.parse(localStorage.getItem('all_appointments_reached_results') || '[]') }
  catch { return [] }
}

function loadScheduled() {
  try { return JSON.parse(localStorage.getItem('scheduled_appointments') || '[]') }
  catch { return [] }
}

function saveScheduled(list) {
  localStorage.setItem('scheduled_appointments', JSON.stringify(list))
}

// ── Date helpers ────────────────────────────────────────────────────────────
function isFuture(appt) {
  if (!appt.date) return false
  const dt = new Date(`${appt.date}T${appt.time || '23:59'}`)
  return dt > new Date()
}

function isApptToday(appt) {
  if (!appt.date) return false
  return appt.date === new Date().toISOString().split('T')[0]
}

function isApptThisWeek(appt) {
  if (!appt.date) return false
  const d = new Date(appt.date + 'T00:00:00')
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  return d >= weekStart && d < weekEnd
}

function isApptThisMonth(appt) {
  if (!appt.date) return false
  const d = new Date(appt.date + 'T00:00:00'), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}

function isApptThisYear(appt) {
  if (!appt.date) return false
  return new Date(appt.date + 'T00:00:00').getFullYear() === new Date().getFullYear()
}

function isIsoToday(iso) {
  if (!iso) return false
  const d = new Date(iso), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function isThisWeek(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return d >= weekStart
}

function isThisMonth(iso) {
  if (!iso) return false
  const d = new Date(iso), n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}

function isThisYear(iso) {
  if (!iso) return false
  return new Date(iso).getFullYear() === new Date().getFullYear()
}

function filterByPeriod(appts, period) {
  if (period === 'week')  return appts.filter(a => isThisWeek(a.savedAt))
  if (period === 'month') return appts.filter(a => isThisMonth(a.savedAt))
  if (period === 'year')  return appts.filter(a => isThisYear(a.savedAt))
  return appts
}

function filterByApptPeriod(appts, period, key = 'savedAt') {
  if (period === 'day')   return appts.filter(a => isIsoToday(a[key]))
  if (period === 'week')  return appts.filter(a => isThisWeek(a[key]))
  if (period === 'month') return appts.filter(a => isThisMonth(a[key]))
  if (period === 'year')  return appts.filter(a => isThisYear(a[key]))
  return appts
}

function fmtApptDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Chart engine ────────────────────────────────────────────────────────────
const CW = 800, CH = 180
const PAD = { top: 16, right: 16, bottom: 28, left: 52 }

function computePoints(data) {
  if (!data.length) return []
  const apVals = data.map(a => (parseFloat(a.monthlyPremium) || 0) * 12)
  const dates  = data.map(a => new Date(a.savedAt).getTime())
  const minD   = Math.min(...dates), maxD = Math.max(...dates)
  const maxAP  = Math.max(...apVals) * 1.25 || 1000
  const xR = CW - PAD.left - PAD.right
  const yR = CH - PAD.top  - PAD.bottom
  return data.map((a, i) => ({
    x:    PAD.left + ((dates[i] - minD) / (maxD - minD || 1)) * xR,
    y:    CH - PAD.bottom - (apVals[i] / maxAP) * yR,
    ap:   apVals[i],
    maxAP,
    appt: a,
  }))
}

function buildPaths(pts) {
  if (!pts.length) return { line: '', area: '' }
  if (pts.length === 1) {
    const p = pts[0]
    return {
      line: `M ${p.x} ${p.y} L ${p.x + 4} ${p.y}`,
      area: `M ${p.x} ${p.y} L ${p.x + 4} ${p.y} L ${p.x + 4} ${CH - PAD.bottom} L ${p.x} ${CH - PAD.bottom} Z`,
    }
  }
  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i]
    const cx = (prev.x + curr.x) / 2
    line += ` C ${cx} ${prev.y} ${cx} ${curr.y} ${curr.x} ${curr.y}`
  }
  return {
    line,
    area: line
      + ` L ${pts[pts.length - 1].x} ${CH - PAD.bottom}`
      + ` L ${pts[0].x} ${CH - PAD.bottom} Z`,
  }
}

function YLabels({ maxAP }) {
  return [0.25, 0.5, 0.75, 1].map(f => {
    const val = maxAP * f
    const y   = CH - PAD.bottom - f * (CH - PAD.top - PAD.bottom)
    const lbl = val >= 10000 ? `$${(val / 1000).toFixed(0)}k`
              : val >= 1000  ? `$${(val / 1000).toFixed(1)}k`
              : `$${Math.round(val)}`
    return (
      <g key={f}>
        <line x1={PAD.left} y1={y} x2={CW - PAD.right} y2={y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <text x={PAD.left - 6} y={y + 4} textAnchor="end"
          fontSize="10" fill="#444" fontFamily="inherit">{lbl}</text>
      </g>
    )
  })
}

// ── New Appointment Modal ───────────────────────────────────────────────────
function NewApptModal({ onSave, onCancel }) {
  const [form,   setForm]   = useState(EMPTY_APPT)
  const [errors, setErrors] = useState({})

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: false }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())  e.name  = true
    if (!form.email.trim()) e.email = true
    if (!form.state)        e.state = true
    if (!form.location)     e.location = true
    if (!form.leadType)     e.leadType = true
    if (!form.tobacco)      e.tobacco  = true
    if (!form.date)         e.date  = true
    if (!form.time)         e.time  = true
    if (!form.age)          e.age   = true
    if (!form.phone.trim()) e.phone = true
    if (form.leadType === 'mortgage_protection') {
      if (!form.mortgageBalance) e.mortgageBalance = true
      if (!form.mortgagePayment) e.mortgagePayment = true
      if (!form.mortgageTerm)    e.mortgageTerm    = true
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...form,
      createdAt: new Date().toISOString(),
    })
  }

  const showMortgage = form.leadType === 'mortgage_protection'
  const today = new Date().toISOString().split('T')[0]

  function ToggleGroup({ field, options }) {
    return (
      <div className="db-toggle-row">
        {options.map(([val, label]) => (
          <button key={val} type="button"
            className={`db-toggle-btn${form[field] === val ? ' active' : ''}${errors[field] ? ' err' : ''}`}
            onClick={() => set(field, val)}>
            {label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="db-overlay" onClick={onCancel}>
      <div className="db-modal" onClick={e => e.stopPropagation()}>

        <div className="db-modal-head">
          <h2 className="db-modal-title">Enter Details</h2>
          <button type="button" className="db-modal-close" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14" /><line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="db-modal-form" noValidate>

          <div className="db-field">
            <label className="db-field-label">Name *</label>
            <input className={`db-field-input${errors.name ? ' db-err' : ''}`}
              type="text" value={form.name} placeholder="Client full name"
              onChange={e => set('name', e.target.value)} />
          </div>

          <div className="db-field">
            <label className="db-field-label">Email *</label>
            <input className={`db-field-input${errors.email ? ' db-err' : ''}`}
              type="email" value={form.email} placeholder="client@example.com"
              onChange={e => set('email', e.target.value)} />
          </div>

          <div className="db-field">
            <label className="db-field-label">State *</label>
            <select className={`db-field-input${errors.state ? ' db-err' : ''}`}
              value={form.state} onChange={e => set('state', e.target.value)}>
              <option value="">Select state…</option>
              {US_STATES.map(s => (
                <option key={s.abbr} value={s.abbr}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="db-field">
            <label className="db-field-label">Location *</label>
            <ToggleGroup field="location" options={[['Zoom', 'Zoom'], ['Phone Call', 'Phone Call']]} />
          </div>

          <div className="db-field">
            <label className="db-field-label">Lead Type *</label>
            <ToggleGroup field="leadType" options={[
              ['mortgage_protection', 'Mortgage Protection'],
              ['final_expense',       'Final Expense'],
              ['veteran',             'Veteran'],
            ]} />
          </div>

          <div className="db-field">
            <label className="db-field-label">Tobacco Status *</label>
            <ToggleGroup field="tobacco" options={[['yes', 'Yes'], ['no', 'No']]} />
          </div>

          {showMortgage && (
            <div className="db-mortgage-block">
              <div className="db-mortgage-heading">Mortgage Information</div>

              <div className="db-field">
                <label className="db-field-label">Loan Balance ($) *</label>
                <input className={`db-field-input${errors.mortgageBalance ? ' db-err' : ''}`}
                  type="number" value={form.mortgageBalance} placeholder="e.g. 285000"
                  onChange={e => set('mortgageBalance', e.target.value)} />
              </div>

              <div className="db-field">
                <label className="db-field-label">Monthly Payment ($) *</label>
                <input className={`db-field-input${errors.mortgagePayment ? ' db-err' : ''}`}
                  type="number" value={form.mortgagePayment} placeholder="e.g. 1850"
                  onChange={e => set('mortgagePayment', e.target.value)} />
              </div>

              <div className="db-field">
                <label className="db-field-label">Term *</label>
                <select className={`db-field-input${errors.mortgageTerm ? ' db-err' : ''}`}
                  value={form.mortgageTerm} onChange={e => set('mortgageTerm', e.target.value)}>
                  <option value="">Select term…</option>
                  <option value="15">15 years</option>
                  <option value="20">20 years</option>
                  <option value="30">30 years</option>
                </select>
              </div>
            </div>
          )}

          <div className="db-field-pair">
            <div className="db-field">
              <label className="db-field-label">Date *</label>
              <input className={`db-field-input${errors.date ? ' db-err' : ''}`}
                type="date" value={form.date} min={today}
                onChange={e => set('date', e.target.value)} />
            </div>
            <div className="db-field">
              <label className="db-field-label">Time *</label>
              <input className={`db-field-input${errors.time ? ' db-err' : ''}`}
                type="time" value={form.time}
                onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          <div className="db-field">
            <label className="db-field-label">Age *</label>
            <input className={`db-field-input${errors.age ? ' db-err' : ''}`}
              type="number" value={form.age} min="18" max="99" placeholder="e.g. 54"
              onChange={e => set('age', e.target.value)} />
          </div>

          <div className="db-field">
            <label className="db-field-label">Phone Number *</label>
            <input className={`db-field-input${errors.phone ? ' db-err' : ''}`}
              type="tel" value={form.phone} placeholder="(555) 000-0000"
              onChange={e => set('phone', e.target.value)} />
          </div>

          <div className="db-field">
            <label className="db-field-label">Extra Information</label>
            <textarea className="db-field-input db-textarea"
              value={form.notes} rows={3}
              placeholder="Any additional notes about this client…"
              onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="db-modal-actions">
            <button type="button" className="db-btn-cancel" onClick={onCancel}>Cancel</button>
            <button type="submit" className="db-btn-save">Save Appointment</button>
          </div>

        </form>
      </div>
    </div>
  )
}

// ── Appointment Stats Panel (Fix 4) ─────────────────────────────────────────
function AppointmentStatsPanel({ soldAppts, followUpAppts }) {
  const [filter, setFilter] = useState('all')

  const filteredSold = useMemo(() => filterByApptPeriod(soldAppts, filter), [soldAppts, filter])
  const filteredFU   = useMemo(() => filterByApptPeriod(followUpAppts, filter), [followUpAppts, filter])

  const totalAppts  = filteredSold.length + filteredFU.length
  const policiesSold = filteredSold.length
  const followUpCnt  = filteredFU.length

  return (
    <div className="db-glass db-appt-stats-panel">
      <div className="db-appt-stats-head">
        <div className="db-appt-stats-title">Appointments</div>
        <div className="db-appt-filter-pills">
          {APPT_FILTER_OPTS.map(f => (
            <button key={f.key}
              className={`db-appt-filter-pill${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="db-appt-stats-boxes">
        <div className="db-appt-stat-box">
          <div className="db-appt-stat-num">{totalAppts}</div>
          <div className="db-appt-stat-label">Total Appointments</div>
        </div>
        <div className="db-appt-stat-box">
          <div className="db-appt-stat-num" style={{ color: '#22d3ee' }}>{policiesSold}</div>
          <div className="db-appt-stat-label">Policies Sold</div>
        </div>
        <div className="db-appt-stat-box">
          <div className="db-appt-stat-num" style={{ color: '#a78bfa' }}>{followUpCnt}</div>
          <div className="db-appt-stat-label">Follow Up</div>
        </div>
      </div>
    </div>
  )
}

// ── Calendar View (Fix 6) ────────────────────────────────────────────────────
const CAL_SERVICES = [
  {
    id: 'google',
    label: 'Google Calendar',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple Calendar',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <circle cx="12" cy="16" r="2"/>
      </svg>
    ),
  },
  {
    id: 'calendly',
    label: 'Calendly',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
]

function CalendarView({ scheduled, onNew }) {
  const [calFilter, setCalFilter] = useState('week')

  const filtered = useMemo(() => {
    const sorted = [...scheduled].sort((a, b) => {
      const ad = new Date(`${a.date || '9999-12-31'}T${a.time || '00:00'}`)
      const bd = new Date(`${b.date || '9999-12-31'}T${b.time || '00:00'}`)
      return ad - bd
    })
    if (calFilter === 'day')   return sorted.filter(a => isApptToday(a))
    if (calFilter === 'week')  return sorted.filter(a => isApptThisWeek(a))
    if (calFilter === 'month') return sorted.filter(a => isApptThisMonth(a))
    if (calFilter === 'year')  return sorted.filter(a => isApptThisYear(a))
    return sorted
  }, [scheduled, calFilter])

  return (
    <div className="db-glass db-calendar-view">
      {/* Header */}
      <div className="db-cal-view-head">
        <div className="db-cal-view-title">Schedule</div>
        <div className="db-cal-view-pills">
          {CAL_FILTER_OPTS.map(f => (
            <button key={f.key}
              className={`db-cal-view-pill${calFilter === f.key ? ' active' : ''}`}
              onClick={() => setCalFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Connect buttons */}
      <div className="db-cal-connects">
        {CAL_SERVICES.map(svc => (
          <button key={svc.id} className="db-cal-connect-btn" disabled title="Coming soon">
            <span className="db-cal-connect-icon">{svc.icon}</span>
            <span className="db-cal-connect-label">{svc.label}</span>
            <span className="db-cal-connect-tag">Connect</span>
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="db-cal-event-list">
        {filtered.length === 0 ? (
          <div className="db-appt-empty" style={{ padding: '20px 0' }}>
            No appointments {calFilter === 'day' ? 'today' : `this ${calFilter}`}
          </div>
        ) : (
          filtered.map((a, i) => (
            <div key={a.id || i} className="db-cal-event-item">
              <div className="db-cal-event-time">
                {a.time ? fmtTime(a.time) : <span style={{ color: '#333' }}>—</span>}
                {a.date && <div className="db-cal-event-date">{fmtApptDate(a.date)}</div>}
              </div>
              <div className="db-cal-event-body">
                <div className="db-cal-event-name">{a.name}</div>
                <div className="db-cal-event-meta">
                  {a.leadType && (
                    <span className="db-mini-badge">{LEAD_LABELS[a.leadType] || a.leadType}</span>
                  )}
                  {a.location && (
                    <span className="db-cal-loc-tag">{a.location}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="db-add-btn" onClick={onNew}>+ New Appointment</button>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard({ agentInfo, onNewAppointment, onChangeAgent, onGoToClients, onClientClick }) {
  const [chartFilter,  setChartFilter]  = useState('all')
  const [tooltip,      setTooltip]      = useState(null)
  const [showApptForm, setShowApptForm] = useState(false)
  const [scheduled,    setScheduled]    = useState(loadScheduled)
  const wrapRef = useRef(null)

  // All sold appointments + follow-ups (for stats)
  const soldAppts      = useMemo(loadSoldAppts, [])
  const followUpAppts  = useMemo(loadFollowUpAppts, [])
  const reachedResults = useMemo(loadReachedResults, [])

  // Policies Sold = every record in ffl_appointments (all were marked as sold)
  const policiesSold = soldAppts.length

  // Total Appointments = unique appointment sessions that reached Step 7.
  // Deduplication: collect all unique session IDs across the three stores.
  // Records with apptSessionId use that as the key; historical records without one
  // fall back to a prefixed store-specific ID so they're always counted distinctly.
  const total = useMemo(() => {
    const ids = new Set()
    soldAppts.forEach(a =>
      ids.add(a.apptSessionId || `ffl-${a.id}`)
    )
    followUpAppts.forEach(f =>
      ids.add(f.apptSessionId || `fu-${f.id}`)
    )
    reachedResults.forEach(r =>
      ids.add(r.sessionId)
    )
    return ids.size
  }, [soldAppts, followUpAppts, reachedResults])

  // Fix 5: All-time AP and commission
  const agentLevel = agentInfo?.contractLevel ?? 100
  const allTimeAP   = soldAppts.reduce((s, a) => s + (parseFloat(a.monthlyPremium) || 0) * 12, 0)
  const allTimeComm = soldAppts.reduce((s, a) => {
    const ap  = (parseFloat(a.monthlyPremium) || 0) * 12
    const pct = (a.commissionPct > 0 ? a.commissionPct : agentLevel)
    const fac = a.carrierId === 'ETHOS' ? 1 : 9 / 12
    return s + ap * (pct / 100) * fac
  }, 0)

  const chartData = useMemo(() =>
    filterByPeriod(soldAppts, chartFilter)
      .filter(a => a.monthlyPremium)
      .sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt)),
    [soldAppts, chartFilter]
  )

  const pts   = useMemo(() => computePoints(chartData), [chartData])
  const paths = useMemo(() => buildPaths(pts), [pts])
  const maxAP = pts.length ? pts[0].maxAP : 5000
  const totalAP = chartData.reduce((s, a) => s + (parseFloat(a.monthlyPremium) || 0) * 12, 0)

  // Scheduled appointments
  const futureAppts = scheduled.filter(isFuture)

  // Recent clients from sold appointments
  const recent = [...soldAppts].reverse().slice(0, 5)

  const handleDotEnter = useCallback((e, pt) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wRect = wrap.getBoundingClientRect()
    const dRect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      x: dRect.left - wRect.left + dRect.width / 2,
      y: dRect.top  - wRect.top,
      pt,
    })
  }, [])

  function handleSaveAppt(appt) {
    const updated = [...scheduled, appt]
    saveScheduled(updated)
    setScheduled(updated)
    setShowApptForm(false)
  }

  // Stat boxes with per-box colors (Fix 3)
  const STATS = [
    { label: 'Total Appointments', value: total,            color: '#ffffff', clickable: false },
    { label: 'Annual Premium',     value: fmt(allTimeAP),   color: '#4caf84', clickable: false },
    { label: 'Commission Paid',    value: fmt(allTimeComm), color: '#22d3ee', clickable: false },
    { label: 'Policies Sold',      value: policiesSold,     color: '#7c3aed', clickable: true  },
  ]

  return (
    <div className="db-root animate-in">

      {/* ── Header ── */}
      <div className="db-header">
        <div className="db-eyebrow">FFL Intelligence — Agent Dashboard</div>
        <h1 className="db-title">Welcome back, {agentInfo.name.split(' ')[0]}</h1>
        <p className="db-subtitle">
          Contract level: {agentInfo.contractLevel}%
          {' · '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Button row: same 4-column grid as stat row, button in col 4 only ── */}
      <div className="db-stat-btn-row">
        <button className="db-cta db-cta-stat" onClick={onNewAppointment}>
          + Start New Appointment
        </button>
      </div>

      {/* ── All 4 equal stat cards ── */}
      <div className="db-stat-row">
        {STATS.map(s => {
          const isClickable = s.clickable && onGoToClients
          return (
            <div
              key={s.label}
              className={`db-glass db-stat-card${isClickable ? ' db-stat-clickable' : ''}`}
              onClick={isClickable ? onGoToClients : undefined}
              title={isClickable ? 'View all clients' : undefined}
            >
              <div className="db-stat-num" style={{ color: s.color }}>{s.value}</div>
              <div className="db-stat-label">{s.label}</div>
              {isClickable && <div className="db-stat-link-hint">View Clients →</div>}
            </div>
          )
        })}
      </div>

      {/* ── Fix 4: Appointments stats + chart side by side ── */}
      <div className="db-chart-appt-row">

        {/* Left: Appointment Stats Panel */}
        <AppointmentStatsPanel soldAppts={soldAppts} followUpAppts={followUpAppts} />

        {/* Right: Annual Premium chart */}
        <div className="db-glass db-chart-card">
          <div className="db-chart-head">
            <div>
              <div className="db-chart-title">Annual Premium</div>
              {totalAP > 0 && <div className="db-chart-total">{fmt(totalAP)} total AP</div>}
            </div>
            <div className="db-pills">
              {FILTER_OPTS.map(f => (
                <button key={f.key}
                  className={`db-pill${chartFilter === f.key ? ' active' : ''}`}
                  onClick={() => setChartFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {pts.length === 0 ? (
            <div className="db-chart-wrap db-chart-wrap-empty" ref={wrapRef}>
              <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" className="db-chart-svg">
                <YLabels maxAP={5000} />
                <line x1={PAD.left} y1={CH - PAD.bottom} x2={CW - PAD.right} y2={CH - PAD.bottom}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <line x1={PAD.left} y1={CH - PAD.bottom} x2={CW - PAD.right} y2={CH - PAD.bottom}
                  stroke="rgba(34,211,238,0.15)" strokeWidth="2" strokeDasharray="8 5" />
              </svg>
              <div className="db-chart-empty-overlay">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ opacity: 0.25 }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span className="db-chart-empty-overlay-text">
                  {chartFilter === 'week'  ? 'No sales recorded this week'  :
                   chartFilter === 'month' ? 'No sales recorded this month' :
                   chartFilter === 'year'  ? 'No sales recorded this year'  :
                   'No sales recorded yet'}
                </span>
              </div>
            </div>
          ) : (
            <div className="db-chart-wrap" ref={wrapRef} onMouseLeave={() => setTooltip(null)}>
              <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" className="db-chart-svg">
                <defs>
                  <linearGradient id="dbAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"    />
                  </linearGradient>
                  <linearGradient id="dbLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <YLabels maxAP={maxAP} />
                <line x1={PAD.left} y1={CH - PAD.bottom} x2={CW - PAD.right} y2={CH - PAD.bottom}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d={paths.area} fill="url(#dbAreaGrad)" />
                <path d={paths.line} stroke="url(#dbLineGrad)" strokeWidth="2"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="db-dot-layer">
                {pts.map((pt, i) => (
                  <div key={i} className="db-dot"
                    style={{
                      left: `${(pt.x / CW) * 100}%`,
                      top:  `${(pt.y / CH) * 100}%`,
                      cursor: onClientClick ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => handleDotEnter(e, pt)}
                    onClick={() => onClientClick && pt.appt?.id && onClientClick(pt.appt.id)}
                    title={onClientClick ? `View ${pt.appt?.clientName || 'client'} in Clients` : undefined}
                  />
                ))}
              </div>

              {tooltip && (
                <div className="db-tooltip" style={{
                  left: Math.min(tooltip.x, (wrapRef.current?.offsetWidth ?? 400) - 200),
                  top:  tooltip.y - 8,
                  transform: 'translate(-50%, -100%)',
                }}>
                  <div className="db-tt-name">{tooltip.pt.appt.clientName || 'Unknown Client'}</div>
                  <div className="db-tt-row"><span>Carrier</span><span>{tooltip.pt.appt.carrier || '—'}</span></div>
                  {tooltip.pt.appt.planCode && (
                    <div className="db-tt-row"><span>Product</span><span>{tooltip.pt.appt.planCode}</span></div>
                  )}
                  <div className="db-tt-row"><span>Coverage</span><span>{fmt(tooltip.pt.appt.face)}</span></div>
                  <div className="db-tt-row"><span>Monthly</span><span>${parseFloat(tooltip.pt.appt.monthlyPremium || 0).toFixed(2)}</span></div>
                  <div className="db-tt-ap"><span>Annual Premium</span><span>{fmt(tooltip.pt.ap)}</span></div>
                  <div className="db-tt-date">{fmtDate(tooltip.pt.appt.savedAt)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Fix 6: Unified Calendar View ── */}
      <div className="db-section-heading">My Appointments</div>
      <CalendarView scheduled={futureAppts} onNew={() => setShowApptForm(true)} />

      {/* ── Bottom row ── */}
      <div className="db-bottom-row">

        {/* Fix 8: Active Agents In Downline — no count shown, overlay only */}
        <div className="db-glass db-agents-card">
          <div className="db-agents-eyebrow">Active Agents In Downline</div>
          <div className="db-agents-plan-overlay">
            <span className="db-agents-plan-lock">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </span>
            <span className="db-agents-plan-text">Agency Plan Required</span>
          </div>
        </div>

        <div className="db-glass db-recent-card">
          <div className="db-section-title">Recent Clients</div>
          {recent.length === 0 ? (
            <div className="db-appt-empty" style={{ padding: '24px 0' }}>
              No clients yet. Start your first appointment above.
            </div>
          ) : recent.map((a, i) => (
            <div key={a.id || i} className="db-recent-item">
              <div>
                <div className="db-recent-name">
                  {a.clientName || 'Unknown'}
                  {a.leadType && (
                    <span className="db-mini-badge" style={{ marginLeft: 8 }}>
                      {LEAD_LABELS[a.leadType] || a.leadType}
                    </span>
                  )}
                </div>
                <div className="db-recent-meta">
                  {a.carrier        && <span>{a.carrier}</span>}
                  {a.face           && <span>{fmt(a.face)}</span>}
                  {a.monthlyPremium && <span className="db-recent-prem">${parseFloat(a.monthlyPremium).toFixed(2)}/mo</span>}
                </div>
              </div>
              <div className="db-recent-time">{timeAgo(a.savedAt)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fix 9: No footer / switch agent button */}

      {/* ── New Appointment Modal ── */}
      {showApptForm && (
        <NewApptModal
          onSave={handleSaveAppt}
          onCancel={() => setShowApptForm(false)}
        />
      )}
    </div>
  )
}
