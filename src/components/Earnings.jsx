import { useState, useMemo, useRef } from 'react'

// ── localStorage helpers ─────────────────────────────────────────────────────
function loadAppointments() {
  try { return JSON.parse(localStorage.getItem('ffl_appointments') || '[]') } catch { return [] }
}
function loadChargebacks() {
  try { return JSON.parse(localStorage.getItem('chargeback_records') || '[]') } catch { return [] }
}
function loadFollowUps() {
  try { return JSON.parse(localStorage.getItem('follow_up_appointments') || '[]') } catch { return [] }
}
function loadGoals() {
  try {
    const s = localStorage.getItem('agent_goals')
    return s ? JSON.parse(s) : { weeklyAP: '', monthlyAP: '' }
  } catch { return { weeklyAP: '', monthlyAP: '' } }
}
function saveGoals(g) {
  try { localStorage.setItem('agent_goals', JSON.stringify(g)) } catch {}
}
function saveChargebacks(records) {
  try { localStorage.setItem('chargeback_records', JSON.stringify(records)) } catch {}
}

// ── Number formatters ────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}
function fmtD(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + n.toFixed(2)
}
function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return iso }
}
function pct(n, d) {
  if (!d) return 0
  return Math.min(100, Math.round((n / d) * 100))
}

// ── Commission ───────────────────────────────────────────────────────────────
function calcCommission(appt) {
  const ap  = (parseFloat(appt.monthlyPremium) || 0) * 12
  const p   = appt.commissionPct || 0
  const fac = appt.carrierId === 'ETHOS' ? 1 : 9 / 12
  return ap * (p / 100) * fac
}
function calcAP(appt) {
  return (parseFloat(appt.monthlyPremium) || 0) * 12
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function getWeekKey(iso) {
  const d = new Date(iso)
  const sun = new Date(d)
  sun.setDate(d.getDate() - d.getDay())
  return sun.toISOString().slice(0, 10)
}
function getMonthKey(iso) {
  return iso.slice(0, 7) // YYYY-MM
}
function isThisWeek(iso) {
  if (!iso) return false
  const d = new Date(iso), now = new Date()
  const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0, 0, 0, 0)
  return d >= ws
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
function filterPeriod(list, period, key = 'savedAt') {
  if (period === 'week')  return list.filter(a => isThisWeek(a[key]))
  if (period === 'month') return list.filter(a => isThisMonth(a[key]))
  if (period === 'year')  return list.filter(a => isThisYear(a[key]))
  return list
}

// ── Carrier logo mapping ─────────────────────────────────────────────────────
const CARRIER_LOGOS = {
  AMER:  'americo.png',
  TRANS: 'transamerica.png',
  AMAM:  'american-amicable.png',
  MOO:   'mutual-of-omaha.png',
  FORE:  'foresters.png',
  AETNA: 'aetna.png',
  ETHOS: 'ethos.png',
  JH:    'john-hancock.png',
  CORE:  'corebridge.png',
  PROS:  'prosperity.png',
  NAFA:  'north-american.png',
}

// ── Parsers for Clients.jsx persistency helper ───────────────────────────────
function parseMDY(str) {
  if (!str) return null
  const [m, d, y] = str.split('/')
  if (!m || !d || !y) return null
  const dt = new Date(Number(y), Number(m) - 1, Number(d))
  return isNaN(dt.getTime()) ? null : dt
}
function addMonths(date, n) {
  const d = new Date(date); d.setMonth(d.getMonth() + n); return d
}
function monthsInForce(dateEnforced) {
  const start = parseMDY(dateEnforced)
  if (!start) return 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let c = 0
  for (let i = 0; i < 12; i++) { if (addMonths(start, i) <= today) c++; else break }
  return c
}

// ── Mini SVG Area Chart ──────────────────────────────────────────────────────
const CW = 500, CH = 100
const PAD = { top: 12, right: 8, bottom: 24, left: 44 }

function MiniChart({ points, color = '#7c3aed', label = 'AP', fmtY = v => fmt(v) }) {
  if (!points.length) return (
    <div className="earn-chart-empty">No data for this period</div>
  )
  const vals  = points.map(p => p.y)
  const maxV  = Math.max(...vals) || 1
  const xR    = CW - PAD.left - PAD.right
  const yR    = CH - PAD.top  - PAD.bottom
  const avg   = vals.reduce((a, b) => a + b, 0) / vals.length
  const avgY  = CH - PAD.bottom - (avg / maxV) * yR

  const svgPts = points.map((p, i) => ({
    x: PAD.left + (i / Math.max(points.length - 1, 1)) * xR,
    y: CH - PAD.bottom - (p.y / maxV) * yR,
    lbl: p.label,
    val: p.y,
  }))

  let line = `M ${svgPts[0].x} ${svgPts[0].y}`
  for (let i = 1; i < svgPts.length; i++) {
    const pr = svgPts[i - 1], cu = svgPts[i]
    const cx = (pr.x + cu.x) / 2
    line += ` C ${cx} ${pr.y} ${cx} ${cu.y} ${cu.x} ${cu.y}`
  }
  const area = line
    + ` L ${svgPts[svgPts.length - 1].x} ${CH - PAD.bottom}`
    + ` L ${svgPts[0].x} ${CH - PAD.bottom} Z`

  const gradId = `earn-grad-${color.replace('#', '')}`

  // Y axis labels
  const yLabels = [0.25, 0.5, 0.75, 1].map(f => ({
    val: maxV * f,
    y: CH - PAD.bottom - f * yR,
  }))

  return (
    <div className="earn-chart-wrap">
      <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" className="earn-chart-svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        {yLabels.map((yl, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={yl.y} x2={CW - PAD.right} y2={yl.y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PAD.left - 4} y={yl.y + 4} textAnchor="end"
              fontSize="9" fill="#444" fontFamily="inherit">
              {yl.val >= 10000 ? `$${(yl.val/1000).toFixed(0)}k`
                : yl.val >= 1000 ? `$${(yl.val/1000).toFixed(1)}k`
                : yl.val > 0 ? `$${Math.round(yl.val)}` : ''}
            </text>
          </g>
        ))}
        <line x1={PAD.left} y1={CH - PAD.bottom} x2={CW - PAD.right} y2={CH - PAD.bottom}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} stroke={color} strokeWidth="1.5"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Average dashed line */}
        <line x1={PAD.left} y1={avgY} x2={CW - PAD.right} y2={avgY}
          stroke="#e05c5c" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        {/* X labels */}
        {svgPts.map((p, i) => (
          i % Math.max(1, Math.floor(svgPts.length / 5)) === 0 && (
            <text key={i} x={p.x} y={CH - 4} textAnchor="middle"
              fontSize="8" fill="#444" fontFamily="inherit">
              {p.lbl}
            </text>
          )
        ))}
        {/* Dots */}
        {svgPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0.9">
            <title>{p.lbl}: {fmtY(p.val)}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

// ── Circular Progress ────────────────────────────────────────────────────────
function CircleProgress({ value, max = 100, size = 120, color = '#7c3aed', label, sublabel }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const prog = Math.min(value, max) / max
  const offset = circ * (1 - prog)
  const display = max === 100 ? `${Math.round(value)}%` : `${Math.round(value)}/${max}`

  return (
    <div className="earn-circle-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={size/2} y={size/2 - 4} textAnchor="middle"
          fontSize={size > 110 ? 18 : 14} fontWeight="700" fill="#fff" fontFamily="inherit">
          {display}
        </text>
        {sublabel && (
          <text x={size/2} y={size/2 + 14} textAnchor="middle"
            fontSize="9" fill="#666" fontFamily="inherit">
            {sublabel}
          </text>
        )}
      </svg>
      {label && <div className="earn-circle-label">{label}</div>}
    </div>
  )
}

// ── Stat Box ─────────────────────────────────────────────────────────────────
const PERIOD_OPTS = [
  { key: 'week',  label: 'Week'     },
  { key: 'month', label: 'Month'    },
  { key: 'year',  label: 'Year'     },
  { key: 'all',   label: 'All Time' },
]

function StatBox({ title, value, subtitle, color = '#22d3ee', expanded, onToggle, filter, onFilter, children }) {
  return (
    <div className={`earn-stat-box${expanded ? ' earn-stat-box-expanded' : ''}`}
      style={{ '--stat-color': color }}>
      <div className="earn-stat-box-top" onClick={onToggle} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}>
        <div className="earn-stat-box-left">
          <div className="earn-stat-value" style={{ color }}>{value}</div>
          <div className="earn-stat-title">{title}</div>
          {subtitle && <div className="earn-stat-sub">{subtitle}</div>}
        </div>
        <div className="earn-stat-box-right" onClick={e => e.stopPropagation()}>
          <div className="earn-filter-pills">
            {PERIOD_OPTS.map(o => (
              <button key={o.key}
                className={`earn-filter-pill${filter === o.key ? ' active' : ''}`}
                onClick={() => onFilter(o.key)}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="earn-expand-icon" onClick={onToggle}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {expanded
                ? <polyline points="2,9 7,4 12,9" />
                : <polyline points="2,5 7,10 12,5" />}
            </svg>
          </div>
        </div>
      </div>
      {expanded && <div className="earn-stat-box-detail">{children}</div>}
    </div>
  )
}

// ── Chargeback Resolve Modal ─────────────────────────────────────────────────
function ResolveModal({ cb, onResolve, onCancel }) {
  const [paid, setPaid] = useState(String(cb.amountPaidBack || ''))

  return (
    <div className="db-overlay" onClick={onCancel}>
      <div className="db-modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Resolve Chargeback</h2>
          <button className="db-modal-close" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
            Enter how much has been paid back for{' '}
            <strong style={{ color: '#fff' }}>{cb.clientName}</strong>.
            Owed: <strong style={{ color: '#e05c5c' }}>{fmt(cb.chargebackAmount)}</strong>
          </p>
          <div className="db-field" style={{ marginBottom: 20 }}>
            <label className="db-field-label">Amount Paid Back ($)</label>
            <input className="db-field-input" type="number" min="0"
              value={paid} onChange={e => setPaid(e.target.value)}
              placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="db-btn-cancel" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            <button className="db-btn-save" style={{ flex: 2 }}
              onClick={() => onResolve(parseFloat(paid) || 0)}>
              Mark Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Earnings Component ──────────────────────────────────────────────────
export default function Earnings({ onGoToClients }) {
  const [appointments,  setAppointments]  = useState(loadAppointments)
  const [chargebacks,   setChargebacks]   = useState(loadChargebacks)
  const [followUps]                       = useState(loadFollowUps)
  const [goals,         setGoals]         = useState(loadGoals)
  const [goalDraft,     setGoalDraft]     = useState(null)   // null = not editing
  const [expandedStat,  setExpandedStat]  = useState(null)   // 0-3
  const [statFilters,   setStatFilters]   = useState(['all', 'all', 'all', 'all'])
  const [resolveTarget, setResolveTarget] = useState(null)   // chargeback to resolve

  // ── Build chargeback lookup ──────────────────────────────────────────────
  const cbMap = useMemo(() => {
    const m = {}
    chargebacks.forEach(cb => { m[cb.clientId] = cb })
    return m
  }, [chargebacks])

  // ── Commission helpers ───────────────────────────────────────────────────
  // All 4 stat boxes share the same filtered appointments
  function apptForPeriod(period) {
    return filterPeriod(appointments, period)
  }

  function totalCommForPeriod(period) {
    return apptForPeriod(period).reduce((s, a) => s + calcCommission(a), 0)
  }

  function activeAPForPeriod(period) {
    return apptForPeriod(period)
      .filter(a => !cbMap[a.id])
      .reduce((s, a) => s + calcAP(a), 0)
  }

  function cbLossesForPeriod(period) {
    // chargebacks have a chargebackedAt field
    const filtered = filterPeriod(chargebacks, period, 'chargebackedAt')
    return filtered.reduce((s, cb) => {
      const paid = cb.amountPaidBack || 0
      return s + Math.max(0, (cb.chargebackAmount || 0) - paid)
    }, 0)
  }

  function netForPeriod(period) {
    return totalCommForPeriod(period) - cbLossesForPeriod(period)
  }

  const sf = statFilters

  // ── Persistency calculation ──────────────────────────────────────────────
  const persistency = useMemo(() => {
    // Cohort = policies that are at least 12 months old
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12)
    const cohort = appointments.filter(a => a.savedAt && new Date(a.savedAt) <= cutoff)
    if (!cohort.length) return null
    const active = cohort.filter(a => !cbMap[a.id]).length
    return { rate: pct(active, cohort.length), active, total: cohort.length }
  }, [appointments, cbMap])

  // For display when not enough 12mo+ policies
  const simpleActivePct = useMemo(() => {
    if (!appointments.length) return null
    const active = appointments.filter(a => !cbMap[a.id]).length
    return { rate: pct(active, appointments.length), active, total: appointments.length }
  }, [appointments, cbMap])

  // ── Closing rate ─────────────────────────────────────────────────────────
  const closingRate = useMemo(() => {
    const sold = appointments.length
    // Follow-ups that reached step 7 (went through underwriting) count as "worked"
    const worked = followUps.filter(f => (f.currentStep || 0) >= 7).length
    const total = sold + worked
    if (!total) return null
    return { rate: pct(sold, total), sold, worked, total }
  }, [appointments, followUps])

  // ── Production graphs ────────────────────────────────────────────────────
  const weeklyAP = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (!a.savedAt) return
      const k = getWeekKey(a.savedAt)
      map[k] = (map[k] || 0) + calcAP(a)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, y]) => ({
      label: new Date(k + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      y,
    }))
  }, [appointments])

  const monthlyAP = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (!a.savedAt) return
      const k = getMonthKey(a.savedAt)
      map[k] = (map[k] || 0) + calcAP(a)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, y]) => {
      const [yr, mo] = k.split('-')
      const d = new Date(Number(yr), Number(mo) - 1, 1)
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        y,
      }
    })
  }, [appointments])

  const weeklyPolicies = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (!a.savedAt) return
      const k = getWeekKey(a.savedAt)
      map[k] = (map[k] || 0) + 1
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, y]) => ({
      label: new Date(k + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      y,
    }))
  }, [appointments])

  const monthlyComm = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (!a.savedAt) return
      const k = getMonthKey(a.savedAt)
      map[k] = (map[k] || 0) + calcCommission(a)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, y]) => {
      const [yr, mo] = k.split('-')
      const d = new Date(Number(yr), Number(mo) - 1, 1)
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        y,
      }
    })
  }, [appointments])

  // ── Goal progress ────────────────────────────────────────────────────────
  const weeklyActualAP  = useMemo(() => filterPeriod(appointments, 'week').reduce((s, a) => s + calcAP(a), 0), [appointments])
  const monthlyActualAP = useMemo(() => filterPeriod(appointments, 'month').reduce((s, a) => s + calcAP(a), 0), [appointments])

  // ── Chargeback tracker by carrier ────────────────────────────────────────
  const cbByCarrier = useMemo(() => {
    const map = {}
    chargebacks.forEach(cb => {
      const appt = appointments.find(a => a.id === cb.clientId)
      const carrierId = appt?.carrierId || 'UNKNOWN'
      const carrierName = appt?.carrier || cb.clientName || 'Unknown'
      if (!map[carrierId]) map[carrierId] = { carrierId, carrierName, records: [] }
      map[carrierId].records.push({ ...cb, resolved: cb.resolved || false, amountPaidBack: cb.amountPaidBack || 0 })
    })
    return Object.values(map).sort((a, b) => b.records.length - a.records.length)
  }, [chargebacks, appointments])

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleSaveGoals() {
    const g = { weeklyAP: goalDraft.weeklyAP, monthlyAP: goalDraft.monthlyAP }
    setGoals(g)
    saveGoals(g)
    setGoalDraft(null)
  }

  function handleResolve(paid) {
    const updated = chargebacks.map(cb =>
      cb.id === resolveTarget.id
        ? { ...cb, amountPaidBack: paid, resolved: paid >= (cb.chargebackAmount || 0) }
        : cb
    )
    setChargebacks(updated)
    saveChargebacks(updated)
    setResolveTarget(null)
  }

  function setStatFilter(idx, val) {
    setStatFilters(prev => prev.map((f, i) => i === idx ? val : f))
  }

  function toggleStat(idx) {
    setExpandedStat(prev => prev === idx ? null : idx)
  }

  // ── Carrier breakdown for stat box 0 ─────────────────────────────────────
  const commByCarrier = useMemo(() => {
    const period = sf[0]
    const map = {}
    apptForPeriod(period).forEach(a => {
      const k = a.carrier || 'Unknown'
      if (!map[k]) map[k] = 0
      map[k] += calcCommission(a)
    })
    return Object.entries(map).sort(([, a], [, b]) => b - a)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, cbMap, sf[0]])

  // ── Active policy list for stat box 1 ────────────────────────────────────
  const activePolicies = useMemo(() => {
    const period = sf[1]
    return apptForPeriod(period).filter(a => !cbMap[a.id])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, cbMap, sf[1]])

  // ── Chargeback list for stat box 2 ───────────────────────────────────────
  const cbFiltered = useMemo(() => {
    const period = sf[2]
    return filterPeriod(chargebacks, period, 'chargebackedAt')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargebacks, sf[2]])

  // ── Net breakdown for stat box 3 ──────────────────────────────────────────
  const netBreakdown = useMemo(() => {
    const period = sf[3]
    const gross = totalCommForPeriod(period)
    const losses = cbLossesForPeriod(period)
    const net = gross - losses
    return { gross, losses, net }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, chargebacks, cbMap, sf[3]])

  // ── Total all-time stats for header ──────────────────────────────────────
  const totalComm = appointments.reduce((s, a) => s + calcCommission(a), 0)
  const totalCBLoss = chargebacks.reduce((s, cb) => s + Math.max(0, (cb.chargebackAmount || 0) - (cb.amountPaidBack || 0)), 0)

  return (
    <div className="earn-root animate-in">

      {/* ── Header ── */}
      <div className="earn-header">
        <div>
          <div className="earn-eyebrow">Financial Performance</div>
          <h1 className="earn-title">Earnings</h1>
          <p className="earn-subtitle">
            All-time: <span className="earn-hi">{fmt(totalComm)}</span> commission ·{' '}
            <span className="earn-danger">{fmt(totalCBLoss)}</span> in chargeback losses
          </p>
        </div>
      </div>

      {/* ── 4 Stat Boxes ── */}
      <div className="earn-stat-grid">

        {/* Box 0: Total Commission */}
        <StatBox
          title="Commission Earned"
          value={fmt(totalCommForPeriod(sf[0]))}
          subtitle="9-mo advance basis (12-mo for Ethos)"
          color="#22d3ee"
          expanded={expandedStat === 0}
          onToggle={() => toggleStat(0)}
          filter={sf[0]}
          onFilter={v => setStatFilter(0, v)}
        >
          <div className="earn-detail-label">Breakdown by carrier</div>
          {commByCarrier.length === 0
            ? <div className="earn-detail-empty">No policies this period.</div>
            : commByCarrier.map(([carrier, comm]) => (
              <div key={carrier} className="earn-detail-row">
                <span className="earn-detail-key">{carrier}</span>
                <span className="earn-detail-val" style={{ color: '#22d3ee' }}>{fmt(comm)}</span>
              </div>
            ))
          }
        </StatBox>

        {/* Box 1: Active Policy AP */}
        <StatBox
          title="Active Policy Revenue"
          value={fmt(activeAPForPeriod(sf[1]))}
          subtitle={`${activePolicies.length} active ${activePolicies.length === 1 ? 'policy' : 'policies'}`}
          color="#4caf84"
          expanded={expandedStat === 1}
          onToggle={() => toggleStat(1)}
          filter={sf[1]}
          onFilter={v => setStatFilter(1, v)}
        >
          <div className="earn-detail-label">Active policies (annual premium)</div>
          {activePolicies.length === 0
            ? <div className="earn-detail-empty">No active policies this period.</div>
            : activePolicies.map(a => (
              <div key={a.id} className="earn-detail-row">
                <div className="earn-detail-key">{a.clientName || 'Unknown'}
                  <span className="earn-detail-carrier"> · {a.carrier}</span>
                </div>
                <span className="earn-detail-val" style={{ color: '#4caf84' }}>{fmt(calcAP(a))}</span>
              </div>
            ))
          }
        </StatBox>

        {/* Box 2: Chargeback Losses */}
        <StatBox
          title="Chargeback Losses"
          value={fmt(cbLossesForPeriod(sf[2]))}
          subtitle={`${cbFiltered.length} chargeback${cbFiltered.length !== 1 ? 's' : ''} this period`}
          color="#e05c5c"
          expanded={expandedStat === 2}
          onToggle={() => toggleStat(2)}
          filter={sf[2]}
          onFilter={v => setStatFilter(2, v)}
        >
          <div className="earn-detail-label">Chargeback details</div>
          {cbFiltered.length === 0
            ? <div className="earn-detail-empty">No chargebacks this period.</div>
            : cbFiltered.map(cb => {
              const owed = Math.max(0, (cb.chargebackAmount || 0) - (cb.amountPaidBack || 0))
              return (
                <div key={cb.id} className="earn-detail-row earn-detail-row-cb">
                  <div className="earn-detail-key">{cb.clientName}
                    <span className="earn-cb-date"> · {fmtDate(cb.chargebackedAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="earn-detail-val" style={{ color: '#e05c5c' }}>
                      −{fmt(owed)}
                    </span>
                    {cb.resolved
                      ? <span className="earn-resolved-badge">Resolved</span>
                      : <button className="earn-resolve-btn"
                          onClick={() => setResolveTarget(cb)}>
                          Resolve
                        </button>
                    }
                  </div>
                </div>
              )
            })
          }
        </StatBox>

        {/* Box 3: Net Earnings */}
        <StatBox
          title="Net Earnings"
          value={fmt(netForPeriod(sf[3]))}
          subtitle="Commission minus outstanding chargebacks"
          color={netForPeriod(sf[3]) >= 0 ? '#a78bfa' : '#e05c5c'}
          expanded={expandedStat === 3}
          onToggle={() => toggleStat(3)}
          filter={sf[3]}
          onFilter={v => setStatFilter(3, v)}
        >
          <div className="earn-net-breakdown">
            <div className="earn-net-row">
              <span>Gross Commission</span>
              <span style={{ color: '#22d3ee' }}>{fmt(netBreakdown.gross)}</span>
            </div>
            <div className="earn-net-row">
              <span>Chargeback Losses</span>
              <span style={{ color: '#e05c5c' }}>−{fmt(netBreakdown.losses)}</span>
            </div>
            <div className="earn-net-divider" />
            <div className="earn-net-row earn-net-total">
              <span>Net</span>
              <span style={{ color: netBreakdown.net >= 0 ? '#a78bfa' : '#e05c5c' }}>
                {fmt(netBreakdown.net)}
              </span>
            </div>
          </div>
        </StatBox>
      </div>

      {/* ── Goal Setter + Circles Row ── */}
      <div className="earn-mid-row">

        {/* Goal Setter */}
        <div className="earn-glass earn-goal-card">
          <div className="earn-section-head">
            <div className="earn-section-title">Goal Setter</div>
            {!goalDraft && (
              <button className="earn-edit-btn"
                onClick={() => setGoalDraft({ weeklyAP: goals.weeklyAP, monthlyAP: goals.monthlyAP })}>
                {goals.weeklyAP || goals.monthlyAP ? 'Edit Goals' : 'Set Goals'}
              </button>
            )}
          </div>

          {goalDraft ? (
            <div className="earn-goal-form">
              <div className="earn-goal-field">
                <label className="earn-goal-label">Weekly AP Goal ($)</label>
                <input className="earn-goal-input" type="number" min="0"
                  value={goalDraft.weeklyAP} placeholder="e.g. 3000"
                  onChange={e => setGoalDraft(d => ({ ...d, weeklyAP: e.target.value }))} />
              </div>
              <div className="earn-goal-field">
                <label className="earn-goal-label">Monthly AP Goal ($)</label>
                <input className="earn-goal-input" type="number" min="0"
                  value={goalDraft.monthlyAP} placeholder="e.g. 12000"
                  onChange={e => setGoalDraft(d => ({ ...d, monthlyAP: e.target.value }))} />
              </div>
              <div className="earn-goal-actions">
                <button className="earn-goal-cancel" onClick={() => setGoalDraft(null)}>Cancel</button>
                <button className="earn-goal-save"   onClick={handleSaveGoals}>Save Goals</button>
              </div>
            </div>
          ) : (
            <div className="earn-goal-progress-list">
              {/* Weekly */}
              <div className="earn-goal-item">
                <div className="earn-goal-item-head">
                  <span className="earn-goal-item-label">Weekly AP</span>
                  <span className="earn-goal-item-vals">
                    <span style={{ color: '#22d3ee' }}>{fmt(weeklyActualAP)}</span>
                    {goals.weeklyAP && <span className="earn-goal-sep">/ {fmt(Number(goals.weeklyAP))}</span>}
                  </span>
                </div>
                {goals.weeklyAP
                  ? <div className="earn-goal-bar-wrap">
                      <div className="earn-goal-bar"
                        style={{ width: `${Math.min(100, pct(weeklyActualAP, Number(goals.weeklyAP)))}%`,
                          background: weeklyActualAP >= Number(goals.weeklyAP) ? '#4caf84' : '#22d3ee' }} />
                    </div>
                  : <div className="earn-goal-unset">No goal set</div>
                }
              </div>
              {/* Monthly */}
              <div className="earn-goal-item">
                <div className="earn-goal-item-head">
                  <span className="earn-goal-item-label">Monthly AP</span>
                  <span className="earn-goal-item-vals">
                    <span style={{ color: '#7c3aed' }}>{fmt(monthlyActualAP)}</span>
                    {goals.monthlyAP && <span className="earn-goal-sep">/ {fmt(Number(goals.monthlyAP))}</span>}
                  </span>
                </div>
                {goals.monthlyAP
                  ? <div className="earn-goal-bar-wrap">
                      <div className="earn-goal-bar"
                        style={{ width: `${Math.min(100, pct(monthlyActualAP, Number(goals.monthlyAP)))}%`,
                          background: monthlyActualAP >= Number(goals.monthlyAP) ? '#4caf84' : '#7c3aed' }} />
                    </div>
                  : <div className="earn-goal-unset">No goal set</div>
                }
              </div>
            </div>
          )}
        </div>

        {/* Persistency */}
        <div className="earn-glass earn-circle-card">
          <div className="earn-section-title" style={{ marginBottom: 16 }}>Policy Persistency</div>
          {(() => {
            const data = persistency || simpleActivePct
            if (!data) return <div className="earn-detail-empty">No policies yet.</div>
            return (
              <>
                <CircleProgress
                  value={data.rate}
                  size={130}
                  color="#4caf84"
                  label={persistency ? '12-month cohort' : 'All policies'}
                  sublabel="active"
                />
                <div className="earn-circle-stats">
                  <span>{data.active} active · {data.total - data.active} chargebacked</span>
                </div>
                {!persistency && appointments.length > 0 && (
                  <div className="earn-circle-note">
                    12-month cohort data will appear once policies mature.
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Closing Rate */}
        <div className="earn-glass earn-circle-card">
          <div className="earn-section-title" style={{ marginBottom: 16 }}>Closing Rate</div>
          {!closingRate
            ? <div className="earn-detail-empty">No appointment data yet.</div>
            : (
              <>
                <CircleProgress
                  value={closingRate.rate}
                  size={130}
                  color="#7c3aed"
                  label="sold / worked"
                  sublabel="close rate"
                />
                <div className="earn-circle-stats">
                  <span>{closingRate.sold} sold · {closingRate.worked} not sold (step 7+)</span>
                </div>
              </>
            )
          }
        </div>
      </div>

      {/* ── Production Graphs 2×2 ── */}
      <div className="earn-section-head earn-graphs-head">
        <div className="earn-section-title">Production Graphs</div>
        <div className="earn-graphs-note">Dashed red line = average</div>
      </div>
      <div className="earn-graphs-grid">

        <div className="earn-glass earn-graph-card">
          <div className="earn-graph-label">Weekly Annual Premium</div>
          <MiniChart points={weeklyAP} color="#22d3ee" />
        </div>

        <div className="earn-glass earn-graph-card">
          <div className="earn-graph-label">Monthly Annual Premium</div>
          <MiniChart points={monthlyAP} color="#7c3aed" />
        </div>

        <div className="earn-glass earn-graph-card">
          <div className="earn-graph-label">Policies Sold per Week</div>
          <MiniChart
            points={weeklyPolicies}
            color="#4caf84"
            fmtY={v => `${v} ${v === 1 ? 'policy' : 'policies'}`}
          />
        </div>

        <div className="earn-glass earn-graph-card">
          <div className="earn-graph-label">Monthly Commission</div>
          <MiniChart points={monthlyComm} color="#a78bfa" />
        </div>
      </div>

      {/* ── Chargeback Carrier Tracker ── */}
      <div className="earn-section-head" style={{ marginTop: 36 }}>
        <div className="earn-section-title">Chargeback Carrier Tracker</div>
        <div className="earn-graphs-note">{chargebacks.length} total chargeback{chargebacks.length !== 1 ? 's' : ''}</div>
      </div>

      {chargebacks.length === 0 ? (
        <div className="earn-glass earn-cb-empty">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor"
            strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <circle cx="16" cy="16" r="13"/>
            <polyline points="10,16 14,20 22,12"/>
          </svg>
          <div style={{ marginTop: 12, color: '#555' }}>No chargebacks on record — great work!</div>
        </div>
      ) : (
        <div className="earn-cb-grid">
          {cbByCarrier.map(({ carrierId, carrierName, records }) => {
            const logoFile = CARRIER_LOGOS[carrierId]
            const totalOwed = records.reduce((s, cb) =>
              s + Math.max(0, (cb.chargebackAmount || 0) - (cb.amountPaidBack || 0)), 0)
            const resolved = records.filter(cb => cb.resolved).length
            const pending  = records.length - resolved

            return (
              <div key={carrierId} className="earn-glass earn-cb-carrier-card">
                <div className="earn-cb-carrier-head">
                  {logoFile
                    ? <img src={`/logos/${logoFile}`} alt={carrierName}
                        className="earn-cb-logo"
                        onError={e => { e.currentTarget.style.display = 'none' }}
                      />
                    : <div className="earn-cb-logo-fallback">{carrierId}</div>
                  }
                  <div>
                    <div className="earn-cb-carrier-name">{carrierName}</div>
                    <div className="earn-cb-carrier-sub">
                      {records.length} chargeback{records.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="earn-cb-carrier-total" style={{ marginLeft: 'auto' }}>
                    <span className="earn-cb-carrier-owed">{fmt(totalOwed)}</span>
                    <span className="earn-cb-carrier-owed-label">outstanding</span>
                  </div>
                </div>

                <div className="earn-cb-badges">
                  {pending > 0 && (
                    <span className="earn-cb-badge earn-cb-badge-pending">{pending} pending</span>
                  )}
                  {resolved > 0 && (
                    <span className="earn-cb-badge earn-cb-badge-resolved">{resolved} resolved</span>
                  )}
                </div>

                <div className="earn-cb-records">
                  {records.map(cb => {
                    const owed = Math.max(0, (cb.chargebackAmount || 0) - (cb.amountPaidBack || 0))
                    return (
                      <div key={cb.id} className="earn-cb-record">
                        <div className="earn-cb-record-name">{cb.clientName}</div>
                        <div className="earn-cb-record-meta">
                          {fmtDate(cb.chargebackedAt)} · Month {cb.monthAtChargeback}
                        </div>
                        <div className="earn-cb-record-right">
                          {cb.resolved
                            ? <span className="earn-resolved-badge">Resolved</span>
                            : (
                              <>
                                <span className="earn-cb-owed">{fmt(owed)}</span>
                                <button className="earn-resolve-btn"
                                  onClick={() => setResolveTarget(cb)}>
                                  Resolve
                                </button>
                              </>
                            )
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Resolve Modal ── */}
      {resolveTarget && (
        <ResolveModal
          cb={resolveTarget}
          onResolve={handleResolve}
          onCancel={() => setResolveTarget(null)}
        />
      )}
    </div>
  )
}
