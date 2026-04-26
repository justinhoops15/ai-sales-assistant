import { useState, useMemo, useRef, useCallback } from 'react'

// ── localStorage helpers ──────────────────────────────────────────────────────
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

// ── Formatters ────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
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
function fmtTickY(v) {
  if (v >= 100000) return `$${(v / 1000).toFixed(0)}k`
  if (v >= 10000)  return `$${(v / 1000).toFixed(0)}k`
  if (v >= 1000)   return `$${(v / 1000).toFixed(1)}k`
  return v > 0 ? `$${Math.round(v)}` : ''
}

// ── Commission / AP ───────────────────────────────────────────────────────────
function calcCommission(appt) {
  const ap  = (parseFloat(appt.monthlyPremium) || 0) * 12
  const p   = appt.commissionPct || 0
  const fac = appt.carrierId === 'ETHOS' ? 1 : 9 / 12
  return ap * (p / 100) * fac
}
function calcAP(appt) {
  return (parseFloat(appt.monthlyPremium) || 0) * 12
}

// ── Date helpers (Monday-based weeks) ────────────────────────────────────────
function getWeekKey(iso) {
  const d = new Date(iso)
  const day = d.getDay() // 0=Sun
  const mon = new Date(d)
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  mon.setHours(0, 0, 0, 0)
  return mon.toISOString().slice(0, 10)
}
function weekLabel(mondayKey) {
  const mon = new Date(mondayKey + 'T00:00:00')
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const f = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${f(mon)} – ${f(sun)}`
}
function getMonthKey(iso) {
  return iso.slice(0, 7)
}
function isThisWeek(iso) {
  if (!iso) return false
  const d = new Date(iso), now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  mon.setHours(0, 0, 0, 0)
  return d >= mon
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

// ── Carrier logo mapping ──────────────────────────────────────────────────────
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

// ── Persistency parsers ───────────────────────────────────────────────────────
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
function mthsInForce(dateEnforced) {
  const start = parseMDY(dateEnforced)
  if (!start) return 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let c = 0
  for (let i = 0; i < 12; i++) { if (addMonths(start, i) <= today) c++; else break }
  return c
}

// ── Production Chart (full-featured) ─────────────────────────────────────────
const GCW = 640, GCH = 155
const GPAD = { top: 14, right: 14, bottom: 32, left: 52 }

function ProductionChart({ points, color = '#7c3aed', fmtTip = v => fmt(v) }) {
  const [hovered, setHovered] = useState(null)
  const wrapRef = useRef(null)

  const handleDotEnter = useCallback((e, i, pt) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wr = wrap.getBoundingClientRect()
    const er = e.currentTarget.getBoundingClientRect()
    setHovered({ i, x: er.left - wr.left + er.width / 2, y: er.top - wr.top, pt })
  }, [])

  if (!points.length) {
    return <div className="earn-chart-empty">No data yet — sales will appear here as you close policies.</div>
  }

  const vals = points.map(p => p.y)
  const maxV = Math.max(...vals) * 1.18 || 1
  const xR   = GCW - GPAD.left - GPAD.right
  const yR   = GCH - GPAD.top  - GPAD.bottom
  const avg  = vals.reduce((a, b) => a + b, 0) / vals.length
  const avgY = GCH - GPAD.bottom - (avg / maxV) * yR

  const svgPts = points.map((p, i) => ({
    x:   GPAD.left + (i / Math.max(points.length - 1, 1)) * xR,
    y:   GCH - GPAD.bottom - (p.y / maxV) * yR,
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
    + ` L ${svgPts[svgPts.length - 1].x} ${GCH - GPAD.bottom}`
    + ` L ${svgPts[0].x} ${GCH - GPAD.bottom} Z`

  const gradId = `pgrd-${color.replace('#', '')}`
  const yTicks = [0.25, 0.5, 0.75, 1.0].map(f => ({ v: maxV * f, y: GCH - GPAD.bottom - f * yR }))

  // Show ≤6 x-labels
  const xStep = Math.max(1, Math.ceil(svgPts.length / 6))

  return (
    <div className="earn-prod-outer" ref={wrapRef} onMouseLeave={() => setHovered(null)}>
      <svg viewBox={`0 0 ${GCW} ${GCH}`} preserveAspectRatio="none" className="earn-prod-svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={GPAD.left} y1={t.y} x2={GCW - GPAD.right} y2={t.y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={GPAD.left - 5} y={t.y + 4} textAnchor="end"
              fontSize="10" fill="#444" fontFamily="inherit">
              {fmtTickY(t.v)}
            </text>
          </g>
        ))}
        {/* Baseline */}
        <line x1={GPAD.left} y1={GCH - GPAD.bottom}
              x2={GCW - GPAD.right} y2={GCH - GPAD.bottom}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        {/* Area fill */}
        <path d={area} fill={`url(#${gradId})`} />
        {/* Line */}
        <path d={line} stroke={color} strokeWidth="2"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Red average dashed line */}
        <line x1={GPAD.left} y1={avgY} x2={GCW - GPAD.right} y2={avgY}
          stroke="#e05c5c" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.65" />
        {/* X-axis labels */}
        {svgPts.map((p, i) =>
          i % xStep === 0 && (
            <text key={i} x={p.x} y={GCH - 6} textAnchor="middle"
              fontSize="9" fill="#444" fontFamily="inherit">
              {p.lbl}
            </text>
          )
        )}
        {/* Visible dots (non-interactive) */}
        {svgPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={hovered?.i === i ? 5 : 3.5}
            fill={color} opacity={hovered?.i === i ? 1 : 0.85}
            pointerEvents="none" />
        ))}
      </svg>

      {/* Invisible DOM dot hit zones */}
      <div className="earn-prod-dot-layer">
        {svgPts.map((p, i) => (
          <div key={i}
            className={`earn-prod-dot${hovered?.i === i ? ' active' : ''}`}
            style={{ left: `${(p.x / GCW) * 100}%`, top: `${(p.y / GCH) * 100}%` }}
            onMouseEnter={e => handleDotEnter(e, i, p)}
          />
        ))}
      </div>

      {/* Floating tooltip */}
      {hovered && (
        <div className="earn-graph-tooltip"
          style={{
            left: Math.min(Math.max(hovered.x, 80), (wrapRef.current?.offsetWidth ?? 400) - 80),
            top:  hovered.y - 10,
            transform: 'translate(-50%, -100%)',
          }}>
          <div className="earn-gtt-label">{hovered.pt.lbl}</div>
          <div className="earn-gtt-val">{fmtTip(hovered.pt.val)}</div>
        </div>
      )}
    </div>
  )
}

// ── Stats Grid (below personal charts) ───────────────────────────────────────
function StatsGrid({ items }) {
  return (
    <div className="earn-stats-grid">
      {items.map(s => (
        <div key={s.label} className="earn-stat-cell">
          <div className="earn-stat-cell-val" style={{ color: s.color || '#ffffff' }}>{s.value}</div>
          <div className="earn-stat-cell-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Circular Progress ─────────────────────────────────────────────────────────
function CircleProgress({ value, size = 120, color = '#7c3aed', label, sublabel }) {
  const r      = (size - 12) / 2
  const circ   = 2 * Math.PI * r
  const prog   = Math.min(Math.max(value, 0), 100) / 100
  const offset = circ * (1 - prog)

  return (
    <div className="earn-circle-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.65s ease' }} />
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle"
          fontSize={18} fontWeight="700" fill="#fff" fontFamily="inherit">
          {Math.round(value)}%
        </text>
        {sublabel && (
          <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
            fontSize="9" fill="#555" fontFamily="inherit">
            {sublabel}
          </text>
        )}
      </svg>
      {label && <div className="earn-circle-label">{label}</div>}
    </div>
  )
}

// ── Stat Box ──────────────────────────────────────────────────────────────────
const PERIOD_OPTS = [
  { key: 'week',  label: 'Week'     },
  { key: 'month', label: 'Month'    },
  { key: 'year',  label: 'Year'     },
  { key: 'all',   label: 'All Time' },
]

function StatBox({ title, value, subtitle, color = '#22d3ee', expanded, onToggle, filter, onFilter, children }) {
  return (
    <div className={`earn-stat-box${expanded ? ' earn-stat-box-expanded' : ''}`}>
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

// ── Resolve Modal ─────────────────────────────────────────────────────────────
function ResolveModal({ cb, onResolve, onCancel }) {
  const [paid, setPaid] = useState(String(cb.amountPaidBack || ''))
  return (
    <div className="db-overlay" onClick={onCancel}>
      <div className="db-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Resolve Chargeback</h2>
          <button className="db-modal-close" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 8, lineHeight: 1.6 }}>
            Recording that <strong style={{ color: '#fff' }}>{cb.clientName}</strong>'s
            chargeback debt has been paid off.
          </p>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
            Note: Resolving a chargeback marks it as paid for bookkeeping purposes only.
            The chargeback amount (<strong style={{ color: '#e05c5c' }}>{fmt(cb.chargebackAmount)}</strong>)
            remains permanently deducted from your Net Earnings — the money cannot be recovered.
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

// ═════════════════════════════════════════════════════════════════════════════
// Main Earnings Component
// ═════════════════════════════════════════════════════════════════════════════
export default function Earnings({ onGoToClients }) {
  const [appointments, setAppointments] = useState(loadAppointments)
  const [chargebacks,  setChargebacks]  = useState(loadChargebacks)
  const [followUps]                     = useState(loadFollowUps)
  const [goals,        setGoals]        = useState(loadGoals)
  const [goalDraft,    setGoalDraft]    = useState(null)
  const [expandedStat, setExpandedStat] = useState(null)
  const [statFilters,  setStatFilters]  = useState(['all', 'all', 'all', 'all'])
  const [resolveTarget, setResolveTarget] = useState(null)

  // ── Chargeback lookup ──────────────────────────────────────────────────────
  const cbMap = useMemo(() => {
    const m = {}
    chargebacks.forEach(cb => { m[cb.clientId] = cb })
    return m
  }, [chargebacks])

  // ── Commission / AP helpers ────────────────────────────────────────────────
  function apptForPeriod(period) {
    return filterPeriod(appointments, period)
  }

  // Gross commission earned in period
  function totalCommForPeriod(period) {
    return apptForPeriod(period).reduce((s, a) => s + calcCommission(a), 0)
  }

  // Submitted AP (all policies in period — including chargebacked)
  function submittedAPForPeriod(period) {
    return apptForPeriod(period).reduce((s, a) => s + calcAP(a), 0)
  }

  // Outstanding chargeback losses (owed - paid) for Chargeback Losses box display
  function cbOutstandingForPeriod(period) {
    return filterPeriod(chargebacks, period, 'chargebackedAt')
      .reduce((s, cb) => s + Math.max(0, (cb.chargebackAmount || 0) - (cb.amountPaidBack || 0)), 0)
  }

  // FULL chargeback amounts (permanent deduction from net — resolution does NOT recover this)
  function cbTotalForPeriod(period) {
    return filterPeriod(chargebacks, period, 'chargebackedAt')
      .reduce((s, cb) => s + (cb.chargebackAmount || 0), 0)
  }

  // Net = gross commission - FULL chargeback amount (resolution doesn't change this)
  function netForPeriod(period) {
    return totalCommForPeriod(period) - cbTotalForPeriod(period)
  }

  const sf = statFilters

  // ── Persistency ───────────────────────────────────────────────────────────
  const persistency = useMemo(() => {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12)
    const cohort = appointments.filter(a => a.savedAt && new Date(a.savedAt) <= cutoff)
    if (!cohort.length) return null
    const active = cohort.filter(a => !cbMap[a.id]).length
    return { rate: pct(active, cohort.length), active, total: cohort.length }
  }, [appointments, cbMap])

  const simpleActivePct = useMemo(() => {
    if (!appointments.length) return null
    const active = appointments.filter(a => !cbMap[a.id]).length
    return { rate: pct(active, appointments.length), active, total: appointments.length }
  }, [appointments, cbMap])

  // ── Closing rate ──────────────────────────────────────────────────────────
  const closingRate = useMemo(() => {
    const sold   = appointments.length
    const worked = followUps.filter(f => (f.currentStep || 0) >= 7).length
    const total  = sold + worked
    if (!total) return null
    return { rate: pct(sold, total), sold, worked }
  }, [appointments, followUps])

  // ── Weekly production data ────────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (!a.savedAt) return
      const k = getWeekKey(a.savedAt)
      if (!map[k]) map[k] = { ap: 0, count: 0 }
      map[k].ap    += calcAP(a)
      map[k].count += 1
    })
    const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    const points  = entries.slice(-12).map(([k, v]) => ({
      label: weekLabel(k),
      y:     v.ap,
      count: v.count,
    }))
    const totalAP    = entries.reduce((s, [, v]) => s + v.ap, 0)
    const numWeeks   = entries.length || 1
    const weeklyAvg  = totalAP / numWeeks
    const bestWeek   = Math.max(0, ...entries.map(([, v]) => v.ap))
    const wtdKey     = getWeekKey(new Date().toISOString())
    const wtd        = map[wtdKey]?.ap || 0
    const appsWTD    = map[wtdKey]?.count || 0
    const totalApps  = appointments.length
    const avgPerApp  = totalApps > 0 ? totalAP / totalApps : 0
    return { points, weeklyAvg, bestWeek, wtd, appsWTD, avgPerApp, numWeeks }
  }, [appointments])

  // ── Monthly production data ───────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (!a.savedAt) return
      const k = getMonthKey(a.savedAt)
      if (!map[k]) map[k] = { ap: 0, count: 0 }
      map[k].ap    += calcAP(a)
      map[k].count += 1
    })
    const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    const points  = entries.slice(-12).map(([k, v]) => {
      const [yr, mo] = k.split('-')
      const d = new Date(Number(yr), Number(mo) - 1, 1)
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        y:     v.ap,
        count: v.count,
      }
    })
    const totalAP    = entries.reduce((s, [, v]) => s + v.ap, 0)
    const numMonths  = entries.length || 1
    const monthlyAvg = totalAP / numMonths
    const bestMonth  = Math.max(0, ...entries.map(([, v]) => v.ap))
    const mtdKey     = getMonthKey(new Date().toISOString())
    const mtd        = map[mtdKey]?.ap || 0
    const appsMTD    = map[mtdKey]?.count || 0
    const totalApps  = appointments.length
    const avgPerApp  = totalApps > 0 ? totalAP / totalApps : 0
    return { points, monthlyAvg, bestMonth, mtd, appsMTD, avgPerApp, numMonths }
  }, [appointments])

  // ── Goal progress ─────────────────────────────────────────────────────────
  const weeklyActualAP  = weeklyData.wtd
  const monthlyActualAP = monthlyData.mtd

  // ── Chargeback tracker grouped by carrier ─────────────────────────────────
  const cbByCarrier = useMemo(() => {
    const map = {}
    chargebacks.forEach(cb => {
      const appt = appointments.find(a => a.id === cb.clientId)
      const carrierId   = appt?.carrierId   || 'UNKNOWN'
      const carrierName = appt?.carrier     || 'Unknown'
      if (!map[carrierId]) map[carrierId] = { carrierId, carrierName, records: [] }
      map[carrierId].records.push({
        ...cb,
        resolved:      cb.resolved      || false,
        amountPaidBack: cb.amountPaidBack || 0,
      })
    })
    return Object.values(map).sort((a, b) => b.records.length - a.records.length)
  }, [chargebacks, appointments])

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  // ── Box 0: Commission breakdown by carrier ────────────────────────────────
  const commByCarrier = useMemo(() => {
    const map = {}
    filterPeriod(appointments, sf[0]).forEach(a => {
      const k = a.carrier || 'Unknown'
      if (!map[k]) map[k] = 0
      map[k] += calcCommission(a)
    })
    return Object.entries(map).sort(([, a], [, b]) => b - a)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, sf[0]])

  // ── Box 1: All submitted policies for period ──────────────────────────────
  const submittedPolicies = useMemo(() => {
    return filterPeriod(appointments, sf[1])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, cbMap, sf[1]])

  // ── Box 2: Chargebacks for period ────────────────────────────────────────
  const cbFiltered = useMemo(() => {
    return filterPeriod(chargebacks, sf[2], 'chargebackedAt')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargebacks, sf[2]])

  // ── Box 3: Net breakdown ──────────────────────────────────────────────────
  const netBreakdown = useMemo(() => {
    const period = sf[3]
    const gross  = totalCommForPeriod(period)
    const losses = cbTotalForPeriod(period)
    const net    = gross - losses
    return { gross, losses, net }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, chargebacks, sf[3]])

  // ── All-time header stats ─────────────────────────────────────────────────
  const totalComm   = appointments.reduce((s, a) => s + calcCommission(a), 0)
  const totalCBLoss = chargebacks.reduce((s, cb) => s + (cb.chargebackAmount || 0), 0)

  // Weekly stats grid items
  const weeklyStats = [
    { label: 'WTD Production',      value: fmt(weeklyData.wtd),           color: '#22d3ee' },
    { label: 'Avg AP / App',         value: fmt(weeklyData.avgPerApp),     color: '#ffffff' },
    { label: 'Apps This Week',       value: weeklyData.appsWTD,            color: '#ffffff' },
    { label: 'Best Week',            value: fmt(weeklyData.bestWeek),      color: '#a78bfa' },
    { label: 'Weekly Average',       value: fmt(weeklyData.weeklyAvg),     color: '#ffffff' },
    { label: 'Closing Rate',         value: closingRate ? `${closingRate.rate}%` : '—', color: '#4caf84' },
  ]

  // Monthly stats grid items
  const monthlyStats = [
    { label: 'MTD Production',       value: fmt(monthlyData.mtd),          color: '#7c3aed' },
    { label: 'Avg AP / App',          value: fmt(monthlyData.avgPerApp),    color: '#ffffff' },
    { label: 'Apps This Month',       value: monthlyData.appsMTD,           color: '#ffffff' },
    { label: 'Best Month',            value: fmt(monthlyData.bestMonth),    color: '#a78bfa' },
    { label: 'Monthly Average',       value: fmt(monthlyData.monthlyAvg),   color: '#ffffff' },
    { label: 'Closing Rate',          value: closingRate ? `${closingRate.rate}%` : '—', color: '#4caf84' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="earn-root animate-in">

      {/* ── Header ── */}
      <div className="earn-header">
        <div className="earn-eyebrow">Financial Performance</div>
        <h1 className="earn-title">Earnings</h1>
        <p className="earn-subtitle">
          All-time commission:{' '}
          <span className="earn-hi">{fmt(totalComm)}</span>
          {totalCBLoss > 0 && (
            <> · chargeback losses: <span className="earn-danger">{fmt(totalCBLoss)}</span></>
          )}
        </p>
      </div>

      {/* ── 4 Stat Boxes ── */}
      <div className="earn-stat-grid">

        {/* 0: Commission Earned */}
        <StatBox
          title="Commission Earned"
          value={fmt(totalCommForPeriod(sf[0]))}
          subtitle="9-mo advance · 12-mo for Ethos"
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

        {/* 1: Submitted Annual Premium */}
        <StatBox
          title="Submitted Annual Premium"
          value={fmt(submittedAPForPeriod(sf[1]))}
          subtitle={`${submittedPolicies.length} ${submittedPolicies.length === 1 ? 'policy' : 'policies'} submitted`}
          color="#4caf84"
          expanded={expandedStat === 1}
          onToggle={() => toggleStat(1)}
          filter={sf[1]}
          onFilter={v => setStatFilter(1, v)}
        >
          <div className="earn-detail-label">All submitted policies (annual premium)</div>
          {submittedPolicies.length === 0
            ? <div className="earn-detail-empty">No policies submitted this period.</div>
            : submittedPolicies.map(a => {
              const isCB = !!cbMap[a.id]
              return (
                <div key={a.id} className="earn-detail-row">
                  <div className="earn-detail-key">
                    {a.clientName || 'Unknown'}
                    <span className="earn-detail-carrier"> · {a.carrier}</span>
                    {isCB && <span className="earn-cb-tag"> CB</span>}
                  </div>
                  <span className="earn-detail-val" style={{ color: isCB ? '#e05c5c' : '#4caf84' }}>
                    {fmt(calcAP(a))}
                  </span>
                </div>
              )
            })
          }
        </StatBox>

        {/* 2: Chargeback Losses */}
        <StatBox
          title="Chargeback Losses"
          value={fmt(cbOutstandingForPeriod(sf[2]))}
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
              const outstanding = Math.max(0, (cb.chargebackAmount || 0) - (cb.amountPaidBack || 0))
              return (
                <div key={cb.id} className="earn-detail-row">
                  <div className="earn-detail-key">
                    {cb.clientName}
                    <span className="earn-cb-date"> · {fmtDate(cb.chargebackedAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="earn-detail-val" style={{ color: '#e05c5c' }}>
                      −{fmt(outstanding)}
                    </span>
                    {cb.resolved
                      ? <span className="earn-resolved-badge">Resolved</span>
                      : <button className="earn-resolve-btn" onClick={() => setResolveTarget(cb)}>
                          Resolve
                        </button>
                    }
                  </div>
                </div>
              )
            })
          }
        </StatBox>

        {/* 3: Net Earnings */}
        <StatBox
          title="Net Earnings"
          value={fmt(netForPeriod(sf[3]))}
          subtitle="Commission minus all chargeback amounts"
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
              <span>Chargeback Deductions</span>
              <span style={{ color: '#e05c5c' }}>−{fmt(netBreakdown.losses)}</span>
            </div>
            <div className="earn-net-divider" />
            <div className="earn-net-row earn-net-total">
              <span>Net</span>
              <span style={{ color: netBreakdown.net >= 0 ? '#a78bfa' : '#e05c5c' }}>
                {fmt(netBreakdown.net)}
              </span>
            </div>
            <div className="earn-net-note">
              Resolving a chargeback marks it as paid but does not recover the deduction.
            </div>
          </div>
        </StatBox>
      </div>

      {/* ── Goal Setter + Circles ── */}
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
              <div className="earn-goal-item">
                <div className="earn-goal-item-head">
                  <span className="earn-goal-item-label">Weekly AP (WTD)</span>
                  <span className="earn-goal-item-vals">
                    <span style={{ color: '#22d3ee' }}>{fmt(weeklyActualAP)}</span>
                    {goals.weeklyAP && (
                      <span className="earn-goal-sep"> / {fmt(Number(goals.weeklyAP))}</span>
                    )}
                  </span>
                </div>
                {goals.weeklyAP
                  ? <div className="earn-goal-bar-wrap">
                      <div className="earn-goal-bar" style={{
                        width: `${Math.min(100, pct(weeklyActualAP, Number(goals.weeklyAP)))}%`,
                        background: weeklyActualAP >= Number(goals.weeklyAP) ? '#4caf84' : '#22d3ee',
                      }} />
                    </div>
                  : <div className="earn-goal-unset">No goal set — click Edit Goals to add one</div>
                }
              </div>

              <div className="earn-goal-item">
                <div className="earn-goal-item-head">
                  <span className="earn-goal-item-label">Monthly AP (MTD)</span>
                  <span className="earn-goal-item-vals">
                    <span style={{ color: '#7c3aed' }}>{fmt(monthlyActualAP)}</span>
                    {goals.monthlyAP && (
                      <span className="earn-goal-sep"> / {fmt(Number(goals.monthlyAP))}</span>
                    )}
                  </span>
                </div>
                {goals.monthlyAP
                  ? <div className="earn-goal-bar-wrap">
                      <div className="earn-goal-bar" style={{
                        width: `${Math.min(100, pct(monthlyActualAP, Number(goals.monthlyAP)))}%`,
                        background: monthlyActualAP >= Number(goals.monthlyAP) ? '#4caf84' : '#7c3aed',
                      }} />
                    </div>
                  : <div className="earn-goal-unset">No goal set — click Edit Goals to add one</div>
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
                  {data.active} active · {data.total - data.active} chargebacked
                </div>
                {!persistency && appointments.length > 0 && (
                  <div className="earn-circle-note">
                    Persistency data grows as your policies age. Check back as your book of business matures.
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
                  {closingRate.sold} sold · {closingRate.worked} not sold
                </div>
              </>
            )
          }
        </div>
      </div>

      {/* ── Production Graphs ── */}
      <div className="earn-graphs-section-head">
        <div className="earn-section-title">Production Graphs</div>
        <div className="earn-graphs-note">Dashed red line = period average · Hover dots for detail</div>
      </div>

      {/* Row 1: Personal graphs */}
      <div className="earn-graphs-row">

        {/* Personal Weekly AP */}
        <div className="earn-glass earn-graph-card">
          <div className="earn-graph-label">Personal — Weekly Annual Premium</div>
          <ProductionChart
            points={weeklyData.points}
            color="#22d3ee"
            fmtTip={v => fmt(v)}
          />
          <StatsGrid items={weeklyStats} />
        </div>

        {/* Personal Monthly AP */}
        <div className="earn-glass earn-graph-card">
          <div className="earn-graph-label">Personal — Monthly Annual Premium</div>
          <ProductionChart
            points={monthlyData.points}
            color="#7c3aed"
            fmtTip={v => fmt(v)}
          />
          <StatsGrid items={monthlyStats} />
        </div>
      </div>

      {/* Row 2: Team placeholders */}
      <div className="earn-graphs-row">
        <div className="earn-glass earn-graph-card earn-graph-placeholder">
          <div className="earn-graph-label">Team — Weekly Production</div>
          <div className="earn-placeholder-body">
            <div className="earn-placeholder-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <circle cx="10" cy="9" r="4"/><circle cx="20" cy="9" r="3"/>
                <path d="M2 22c0-4 3.5-7 8-7s8 3 8 7"/><path d="M22 22c0-3-1.5-5-4-6.2" opacity="0.6"/>
              </svg>
            </div>
            <div className="earn-placeholder-title">Team Plan Required</div>
            <div className="earn-placeholder-sub">Upgrade to see team-wide weekly production data.</div>
          </div>
        </div>

        <div className="earn-glass earn-graph-card earn-graph-placeholder">
          <div className="earn-graph-label">Team — Monthly Production</div>
          <div className="earn-placeholder-body">
            <div className="earn-placeholder-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <circle cx="10" cy="9" r="4"/><circle cx="20" cy="9" r="3"/>
                <path d="M2 22c0-4 3.5-7 8-7s8 3 8 7"/><path d="M22 22c0-3-1.5-5-4-6.2" opacity="0.6"/>
              </svg>
            </div>
            <div className="earn-placeholder-title">Team Plan Required</div>
            <div className="earn-placeholder-sub">Upgrade to see team-wide monthly production data.</div>
          </div>
        </div>
      </div>

      {/* ── Chargeback Carrier Tracker ── */}
      <div className="earn-section-head" style={{ marginTop: 40 }}>
        <div className="earn-section-title">Chargeback Carrier Tracker</div>
        <div className="earn-graphs-note">
          {chargebacks.length} total chargeback{chargebacks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {chargebacks.length === 0 ? (
        <div className="earn-glass earn-cb-empty">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor"
            strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
            <circle cx="16" cy="16" r="13"/>
            <polyline points="10,16 14,20 22,12"/>
          </svg>
          <div style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
            No chargebacks on record — great work!
          </div>
        </div>
      ) : (
        <div className="earn-cb-grid">
          {cbByCarrier.map(({ carrierId, carrierName, records }) => {
            const logoFile   = CARRIER_LOGOS[carrierId]
            const totalOwed  = records.reduce((s, cb) =>
              s + Math.max(0, (cb.chargebackAmount || 0) - (cb.amountPaidBack || 0)), 0)
            const resolved   = records.filter(cb => cb.resolved).length
            const pending    = records.length - resolved

            return (
              <div key={carrierId} className="earn-glass earn-cb-carrier-card">
                <div className="earn-cb-carrier-head">
                  {logoFile
                    ? <img
                        src={`/logos/${logoFile}`}
                        alt={carrierName}
                        className="earn-cb-logo"
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextSibling.style.display = 'flex'
                        }}
                      />
                    : null
                  }
                  <div className="earn-cb-logo-fallback"
                    style={{ display: logoFile ? 'none' : 'flex' }}>
                    {(carrierId || '?').slice(0, 3)}
                  </div>
                  <div>
                    <div className="earn-cb-carrier-name">{carrierName}</div>
                    <div className="earn-cb-carrier-sub">
                      {records.length} chargeback{records.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="earn-cb-carrier-total">
                    <span className="earn-cb-carrier-owed">{fmt(totalOwed)}</span>
                    <span className="earn-cb-carrier-owed-label">outstanding</span>
                  </div>
                </div>

                <div className="earn-cb-badges">
                  {pending  > 0 && <span className="earn-cb-badge earn-cb-badge-pending">{pending} pending</span>}
                  {resolved > 0 && <span className="earn-cb-badge earn-cb-badge-resolved">{resolved} resolved</span>}
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
