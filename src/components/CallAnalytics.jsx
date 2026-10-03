import { useState, useMemo, useRef } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────────
const DISPOSITIONS = [
  { label: 'Voicemail',        color: '#a1734a' },
  { label: 'Hung Up',          color: '#f97316' },
  { label: 'Wrong Number',     color: '#e05c5c' },
  { label: 'No English',       color: '#e05c5c' },
  { label: 'Under 90 Seconds', color: '#3b82f6' },
  { label: 'Over 90 Seconds',  color: '#3b82f6' },
  { label: 'Showed Numbers',   color: '#ec4899' },
  { label: 'Interested',       color: '#22d3ee' },
  { label: 'Not Interested',   color: '#e05c5c' },
  { label: 'Callback',         color: '#f59e0b' },
  { label: 'Appointment Set',  color: '#4caf84' },
  { label: 'Sold',             color: '#4caf84' },
]

const CONTACT_SET = new Set([
  'Over 90 Seconds','Under 90 Seconds','Showed Numbers',
  'Interested','Not Interested','Callback','Appointment Set','Sold',
])

const RANGES = [
  { id: 'today', label: 'Today'    },
  { id: 'week',  label: 'Week'     },
  { id: 'month', label: 'Month'    },
  { id: 'year',  label: 'Year'     },
  { id: 'all',   label: 'All Time' },
]

// ── PRNG ───────────────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed >>> 0
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296 }
}

// ── Seed demo data ─────────────────────────────────────────────────────────────
function seedDemoData() {
  try {
    const el = localStorage.getItem('ffl_call_logs')
    if (el && JSON.parse(el).length > 0) return
    const ell = localStorage.getItem('ffl_leads')
    if (ell && JSON.parse(ell).length > 0) return
  } catch { return }

  const rng = seededRng(42)
  const now = new Date()

  const FN = ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles','Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen','Lisa','Nancy','Betty','Dorothy','Sandra','Margaret','Ashley','Kimberly','Donna','Carol']
  const LN = ['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Anderson','Taylor','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez','Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','Hernandez','King','Wright']
  const STATES = ['TX','FL','CA','NY','PA','OH','GA','NC','MI','NJ','VA','WA','AZ','MA','TN','IN','MO','MD','WI','CO','MN','SC','AL','LA','KY']

  const VSEED = [
    { name: 'LeadTree',     w: 33, cr: 0.17 },
    { name: 'Direct Mail',  w: 21, cr: 0.11 },
    { name: 'Digital Media',w: 21, cr: 0.08 },
    { name: 'Referral',     w: 17, cr: 0.22 },
    { name: 'TV Spot',      w: 8,  cr: 0.05 },
  ]
  let cumW = 0; VSEED.forEach(v => { cumW += v.w; v._w = cumW })

  function pickVendor() { const r = rng()*100; return VSEED.find(v => r <= v._w) || VSEED[0] }
  function pickHour() {
    const r = rng()
    if (r < 0.22) return 10 + Math.floor(rng()*2)
    if (r < 0.44) return 17 + Math.floor(rng()*2)
    if (r < 0.74) return 9  + Math.floor(rng()*9)
    return 8 + Math.floor(rng()*12)
  }

  const leads = Array.from({ length: 120 }, (_, i) => {
    const daysAgo = Math.floor(rng()*89)
    const rec = new Date(now)
    rec.setDate(rec.getDate() - daysAgo)
    rec.setHours(Math.floor(rng()*24), Math.floor(rng()*60), 0, 0)
    const v = pickVendor()
    return {
      id: `sd-${i}`, firstName: FN[Math.floor(rng()*FN.length)],
      lastName: LN[Math.floor(rng()*LN.length)],
      phone: `(${Math.floor(rng()*900)+100}) ${Math.floor(rng()*900)+100}-${Math.floor(rng()*9000)+1000}`,
      email: null, state: STATES[Math.floor(rng()*STATES.length)],
      vendor: v.name, age: 35 + Math.floor(rng()*30),
      receivedAt: rec.toISOString(), dispositions: [], notes: null, _cr: v.cr,
    }
  })

  const logs = []; let lid = 0
  leads.forEach(lead => {
    if (rng() < 0.25) { delete lead._cr; return }
    const daysAgo = (now - new Date(lead.receivedAt)) / 86400000
    const trendBoost = Math.max(0, (90 - daysAgo) / 90) * 0.04
    const ar = rng()
    const attempts = ar < 0.08 ? 1+Math.floor(rng()*2)
      : ar < 0.22 ? 3+Math.floor(rng()*2)
      : ar < 0.46 ? 5+Math.floor(rng()*2)
      : ar < 0.74 ? 7+Math.floor(rng()*2)
      : 9+Math.floor(rng()*3)

    let contacted = false
    let callDate = new Date(lead.receivedAt)
    for (let a = 0; a < attempts; a++) {
      if (a > 0) { callDate = new Date(callDate); callDate.setDate(callDate.getDate() + Math.floor(rng()*3)+1) }
      const dow = callDate.getDay()
      if ((dow===0||dow===6) && rng()>0.28) callDate.setDate(callDate.getDate()+(dow===0?1:2))
      callDate.setHours(pickHour(), Math.floor(rng()*60), 0, 0)
      if (callDate > now) { callDate = new Date(now); callDate.setMinutes(callDate.getMinutes()-30) }

      const cr = lead._cr + trendBoost
      const isContact = !contacted && rng() < cr
      let dispositions = []
      if (isContact) {
        contacted = true
        const r2 = rng()
        if (r2 < 0.04)      dispositions = ['Sold']
        else if (r2 < 0.16) dispositions = ['Appointment Set']
        else if (r2 < 0.30) dispositions = ['Interested']
        else if (r2 < 0.48) dispositions = ['Callback']
        else if (r2 < 0.62) dispositions = ['Not Interested']
        else if (r2 < 0.80) dispositions = ['Over 90 Seconds']
        else                dispositions = ['Showed Numbers']
      } else {
        const r2 = rng()
        if (r2 < 0.50)      dispositions = ['Voicemail']
        else if (r2 < 0.72) dispositions = ['Hung Up']
        else if (r2 < 0.86) dispositions = ['Under 90 Seconds']
        else if (r2 < 0.94) dispositions = ['Wrong Number']
        else                dispositions = []
      }
      logs.push({ id:`sl-${lid++}`, leadId:lead.id, agentId:null, dispositions, notes:null, durationSec:null, loggedAt:callDate.toISOString() })
    }
    const allDisps = logs.filter(l => l.leadId===lead.id).flatMap(l => l.dispositions)
    lead.dispositions = [...new Set(allDisps)]
    delete lead._cr
  })

  try {
    localStorage.setItem('ffl_leads', JSON.stringify(leads))
    localStorage.setItem('ffl_call_logs', JSON.stringify(logs))
  } catch(e) {}
}

// ── Utilities ──────────────────────────────────────────────────────────────────
function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
}

function getRangeBounds(id, now = new Date()) {
  const s = new Date(now), ps = new Date(now), pe = new Date(now)
  switch (id) {
    case 'today':
      s.setHours(0,0,0,0); pe.setHours(0,0,0,0)
      ps.setDate(ps.getDate()-1); ps.setHours(0,0,0,0)
      return { start:s, end:new Date(now), prevStart:ps, prevEnd:pe }
    case 'week':
      s.setDate(s.getDate()-7); pe.setDate(pe.getDate()-7); ps.setDate(ps.getDate()-14)
      return { start:s, end:new Date(now), prevStart:ps, prevEnd:pe }
    case 'month':
      s.setDate(s.getDate()-30); pe.setDate(pe.getDate()-30); ps.setDate(ps.getDate()-60)
      return { start:s, end:new Date(now), prevStart:ps, prevEnd:pe }
    case 'year':
      s.setFullYear(s.getFullYear()-1); pe.setFullYear(pe.getFullYear()-1); ps.setFullYear(ps.getFullYear()-2)
      return { start:s, end:new Date(now), prevStart:ps, prevEnd:pe }
    default:
      return { start:new Date(0), end:new Date(now), prevStart:null, prevEnd:null }
  }
}

function filterLogs(logs, start, end) {
  return logs.filter(l => { const d = new Date(l.loggedAt); return d >= start && d <= end })
}

function pct(a, b) { return b ? Math.round((a/b)*100) : 0 }

function formatDuration(ms) {
  if (!ms || ms <= 0) return '—'
  const totalMin = Math.floor(ms/60000)
  const h = Math.floor(totalMin/60), m = totalMin%60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getTimeBuckets(id, logs, now = new Date()) {
  if (id === 'today') {
    const dayStart = new Date(now); dayStart.setHours(0,0,0,0)
    const buckets = Array.from({length:24},(_,h)=>({ label:h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`, h, count:0 }))
    logs.forEach(l => { const d=new Date(l.loggedAt); if(d>=dayStart&&d<=now) buckets[d.getHours()].count++ })
    return buckets
  }
  if (id === 'week') {
    const buckets = []
    for (let i=6; i>=0; i--) {
      const d=new Date(now); d.setDate(d.getDate()-i)
      buckets.push({ label:d.toLocaleDateString('en-US',{weekday:'short'}), date:d.toISOString().split('T')[0], count:0 })
    }
    logs.forEach(l => { const b=buckets.find(x=>x.date===l.loggedAt.split('T')[0]); if(b) b.count++ })
    return buckets
  }
  if (id === 'month') {
    const buckets = []
    for (let i=29; i>=0; i--) {
      const d=new Date(now); d.setDate(d.getDate()-i)
      buckets.push({ label:d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), date:d.toISOString().split('T')[0], count:0 })
    }
    logs.forEach(l => { const b=buckets.find(x=>x.date===l.loggedAt.split('T')[0]); if(b) b.count++ })
    return buckets
  }
  const months = id === 'year' ? 12 : 24
  const buckets = []
  for (let i=months-1; i>=0; i--) {
    const d=new Date(now); d.setMonth(d.getMonth()-i); d.setDate(1)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    buckets.push({ label:d.toLocaleDateString('en-US',{month:'short',year:'2-digit'}), key, count:0 })
  }
  logs.forEach(l => {
    const d=new Date(l.loggedAt)
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const b=buckets.find(x=>x.key===key); if(b) b.count++
  })
  return buckets
}

// Returns last N daily data points for sparklines
function getSparklineData(logs, days, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (days-1-i))
    const dayStr = d.toISOString().split('T')[0]
    const dl = logs.filter(l => l.loggedAt.startsWith(dayStr))
    const cl = dl.filter(l => l.dispositions.some(d => CONTACT_SET.has(d)))
    return {
      calls: dl.length,
      contacts: cl.length,
      cr: dl.length > 0 ? Math.round(cl.length/dl.length*100) : 0,
      appts: dl.filter(l => l.dispositions.includes('Appointment Set')).length,
      leadsContacted: new Set(cl.map(l => l.leadId)).size,
    }
  })
}

// ── Micro sparkline ────────────────────────────────────────────────────────────
function Sparkline({ values, color = '#7c3aed', width = 60, height = 24 }) {
  if (!values || values.length < 2) return null
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => {
    const x = (i / (values.length-1)) * (width-2) + 1
    const y = height - 1 - (v/max) * (height-4)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block', flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Delta pill ─────────────────────────────────────────────────────────────────
function DeltaPill({ curr, prev }) {
  if (prev === null || prev === undefined || (prev===0&&curr===0)) return null
  const diff = prev===0 ? 100 : Math.round(((curr-prev)/prev)*100)
  const up = diff >= 0
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:11, fontWeight:600, borderRadius:999, padding:'2px 7px',
      color:up?'#4caf84':'#e05c5c', background:up?'rgba(76,175,132,0.1)':'rgba(224,92,92,0.1)' }}>
      {up?'↑':'↓'} {Math.abs(diff)}%
    </span>
  )
}

// ── Line chart with hover tooltip ──────────────────────────────────────────────
function LineChart({ data, prevData }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  if (!data || data.length===0) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#333333', fontSize:13 }}>No data for this period.</div>
  )
  const W=600, H=180, pL=32, pR=12, pT=20, pB=30, cW=W-pL-pR, cH=H-pT-pB
  const allCounts = [...data.map(d=>d.count), ...(prevData||[]).map(d=>d.count)]
  const maxV = Math.max(1,...allCounts)
  const px = (i,len) => pL + (i/Math.max(len-1,1))*cW
  const py = v => pT + (1-v/maxV)*cH
  const toPath = pts => pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const pts = data.map((d,i)=>({x:px(i,data.length),y:py(d.count)}))
  const linePath = toPath(pts)
  const fillPath = pts.length>1 ? linePath+` L${pts[pts.length-1].x},${pT+cH} L${pL},${pT+cH} Z` : ''
  const prevPts = (prevData||[]).map((d,i)=>({x:px(i,prevData.length),y:py(d.count)}))
  const prevPath = prevPts.length>1 ? toPath(prevPts) : ''
  const showEvery = Math.max(1, Math.ceil(data.length/7))
  const zoneW = data.length>1 ? cW/(data.length-1) : cW
  const hi = hoverIdx

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'100%', display:'block' }}
      onMouseLeave={() => setHoverIdx(null)}>
      <defs>
        <linearGradient id="ca-fill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75,1.0].map(f => {
        const y = pT+(1-f)*cH
        return <g key={f}>
          <line x1={pL} y1={y} x2={W-pR} y2={y} stroke="#1a1a1a" strokeWidth="1"/>
          <text x={pL-4} y={y+4} fill="#444444" fontSize="9" textAnchor="end">{Math.round(f*maxV)}</text>
        </g>
      })}
      {fillPath && <path d={fillPath} fill="url(#ca-fill2)"/>}
      {prevPath && <path d={prevPath} stroke="#3a3a3a" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>}
      {pts.length>1 && <path d={linePath} stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
      {data.length<=14 && pts.map((p,i)=>(
        <circle key={i} cx={p.x} cy={p.y} r={i===hi?4.5:3} fill="#7c3aed" stroke="#0d0d0d" strokeWidth={i===hi?2:1.5}/>
      ))}
      {data.map((d,i)=>(
        i%showEvery===0 && <text key={i} x={pts[i].x} y={H-3} fill="#444444" fontSize="9" textAnchor="middle">{d.label}</text>
      ))}
      {/* Hover zones */}
      {data.map((d,i) => (
        <rect key={i} x={Math.max(pL,pts[i].x-zoneW/2)} y={pT} width={zoneW} height={cH} fill="transparent" style={{cursor:'crosshair'}}
          onMouseEnter={() => setHoverIdx(i)}/>
      ))}
      {/* Hover indicator */}
      {hi!==null && (
        <>
          <line x1={pts[hi].x} y1={pT} x2={pts[hi].x} y2={pT+cH} stroke="#3a3a3a" strokeWidth="1" strokeDasharray="3 2"/>
          <rect x={Math.min(pts[hi].x+8, W-pR-110)} y={pts[hi].y-28} rx="5" ry="5" width="102" height="22" fill="#1e1e1e" stroke="#3a3a3a" strokeWidth="1"/>
          <text x={Math.min(pts[hi].x+59, W-pR-4)} y={pts[hi].y-13} fill="#cccccc" fontSize="10" textAnchor="middle">
            {data[hi].count} calls · {data[hi].label}
          </text>
        </>
      )}
    </svg>
  )
}

// ── Disposition bars (tabular) ─────────────────────────────────────────────────
function DispositionBars({ logs }) {
  const counts = {}
  DISPOSITIONS.forEach(d => { counts[d.label]=0 })
  logs.forEach(l => l.dispositions.forEach(d => { if(counts[d]!==undefined) counts[d]++ }))
  const total = Object.values(counts).reduce((a,b)=>a+b,0)
  const items = DISPOSITIONS.map(d=>({...d,count:counts[d.label]||0})).filter(d=>d.count>0).sort((a,b)=>b.count-a.count)
  const maxC = items[0]?.count || 1
  if (!items.length) return (
    <div style={{ padding:'32px 0', textAlign:'center', color:'#444444', fontSize:13 }}>No dispositions in this period.</div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {items.map(item => (
        <div key={item.label}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5, gap:8 }}>
            <span style={{ fontSize:12, color:item.color, fontWeight:500, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>
            <span style={{ fontSize:11, color:'#888888', fontVariantNumeric:'tabular-nums', flexShrink:0 }}>
              <span style={{ color:'#cccccc', fontWeight:600 }}>{item.count.toLocaleString()}</span>
              {total>0 && <span style={{ color:'#555555' }}> / {pct(item.count,total)}%</span>}
            </span>
          </div>
          <div style={{ height:4, background:'#1a1a1a', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:999, width:`${pct(item.count,maxC)}%`, background:item.color, opacity:0.75, transition:'width 0.4s ease' }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Conversion funnel ──────────────────────────────────────────────────────────
function ConversionFunnel({ leads, logs, onNavigate }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const logsByLead = useMemo(() => {
    const m = {}
    logs.forEach(l => { if(!m[l.leadId]) m[l.leadId]=[]; m[l.leadId].push(l) })
    return m
  }, [logs])

  const total     = leads.length
  const called    = leads.filter(l => (logsByLead[l.id]||[]).length > 0).length
  const contacted = leads.filter(l => (logsByLead[l.id]||[]).some(lg => lg.dispositions.some(d => CONTACT_SET.has(d)))).length
  const interested= leads.filter(l => (logsByLead[l.id]||[]).some(lg => lg.dispositions.includes('Interested')||lg.dispositions.includes('Appointment Set')||lg.dispositions.includes('Sold'))).length
  const apptSet   = leads.filter(l => (logsByLead[l.id]||[]).some(lg => lg.dispositions.includes('Appointment Set')||lg.dispositions.includes('Sold'))).length
  const sold      = leads.filter(l => (logsByLead[l.id]||[]).some(lg => lg.dispositions.includes('Sold'))).length

  const STAGES = [
    { label:'Leads Received', value:total,     filter:null,         color:'#7c3aed' },
    { label:'Called',         value:called,    filter:'called',     color:'#6244cc' },
    { label:'Contacted',      value:contacted, filter:'contacted',  color:'#22d3ee' },
    { label:'Interested',     value:interested,filter:'interested', color:'#1bb5cc' },
    { label:'Appt Set',       value:apptSet,   filter:'appt_set',  color:'#4caf84' },
    { label:'Sold',           value:sold,      filter:'sold',       color:'#3d9e73' },
  ]

  return (
    <div className="ca-card" style={{ marginBottom:12 }}>
      <div className="ca-card-head">
        <span className="ca-card-title">Conversion Funnel</span>
        <span style={{ fontSize:11, color:'#555555' }}>{total.toLocaleString()} total leads</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {STAGES.map((stage, i) => {
          const barPct  = total > 0 ? Math.max(1, Math.round(stage.value/total*100)) : 1
          const dropOff = i > 0 ? STAGES[i-1].value - stage.value : 0
          const dropPct = i > 0 && STAGES[i-1].value > 0 ? Math.round(dropOff/STAGES[i-1].value*100) : 0
          const isHov   = hoveredIdx === i

          return (
            <div key={stage.label}>
              {i > 0 && dropOff > 0 && (
                <div style={{ display:'flex', alignItems:'center', paddingLeft:136, paddingTop:3, paddingBottom:3 }}>
                  <span style={{ fontSize:11, color:'#e05c5c', fontVariantNumeric:'tabular-nums' }}>
                    ↓ {dropOff.toLocaleString()} dropped ({dropPct}%)
                  </span>
                </div>
              )}
              <div
                style={{ display:'flex', alignItems:'center', gap:12, padding:'4px 0',
                  opacity: hoveredIdx!==null&&!isHov ? 0.45 : 1,
                  cursor: stage.filter ? 'pointer' : 'default',
                  transition:'opacity 150ms ease' }}
                onClick={() => stage.filter && onNavigate?.('leads', { type:stage.filter, label:stage.label })}
                onMouseEnter={e => { setHoveredIdx(i); setTooltip({ x:e.clientX, y:e.clientY, stage, barPct }) }}
                onMouseLeave={() => { setHoveredIdx(null); setTooltip(null) }}
              >
                <div style={{ width:120, flexShrink:0, textAlign:'right', fontSize:12, color: isHov?'#cccccc':'#888888', transition:'color 150ms' }}>
                  {stage.label}
                </div>
                <div style={{ flex:1, height:26, background:'#1a1a1a', borderRadius:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${barPct}%`, background:stage.color, borderRadius:5, transition:'width 0.5s ease' }}/>
                </div>
                <div style={{ width:90, flexShrink:0, fontSize:13, fontVariantNumeric:'tabular-nums' }}>
                  <span style={{ color:'#ffffff', fontWeight:600 }}>{stage.value.toLocaleString()}</span>
                  <span style={{ color:'#555555', fontSize:11, marginLeft:6 }}>{Math.round(stage.value/Math.max(1,total)*100)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {tooltip && (
        <div style={{ position:'fixed', left:tooltip.x+14, top:tooltip.y-36, background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#cccccc', pointerEvents:'none', zIndex:9999 }}>
          <div style={{ fontWeight:600, marginBottom:3 }}>{tooltip.stage.label}</div>
          <div style={{ color:'#888888' }}>{tooltip.stage.value.toLocaleString()} leads · {Math.round(tooltip.stage.value/Math.max(1,total)*100)}% of total</div>
          {tooltip.stage.filter && <div style={{ color:'#a78bfa', marginTop:4, fontSize:11 }}>Click to view in Leads ↗</div>}
        </div>
      )}
    </div>
  )
}

// ── Heatmap ────────────────────────────────────────────────────────────────────
function Heatmap({ logs }) {
  const [mode, setMode] = useState('volume')
  const [tooltip, setTooltip] = useState(null)

  const grid = useMemo(() => {
    const g = Array.from({length:7}, () => Array.from({length:24}, () => ({calls:0,contacts:0})))
    logs.forEach(l => {
      const d = new Date(l.loggedAt)
      const dow = (d.getDay()+6)%7
      const h = d.getHours()
      g[dow][h].calls++
      if (l.dispositions.some(d => CONTACT_SET.has(d))) g[dow][h].contacts++
    })
    return g
  }, [logs])

  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const fmtH = h => h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`

  function cellVal(cell) {
    if (mode==='volume') return cell.calls
    return cell.calls>0 ? Math.round(cell.contacts/cell.calls*100) : 0
  }
  const maxVal = Math.max(1, ...grid.flatMap(row => row.map(c => cellVal(c))))

  function cellColor(val) {
    if (val===0) return '#1a1a1a'
    const t = val/maxVal
    const r = Math.round(0x1a + (0x7c-0x1a)*t)
    const g = Math.round(0x1a + (0x3a-0x1a)*t)
    const b = Math.round(0x1a + (0xed-0x1a)*t)
    return `rgb(${r},${g},${b})`
  }

  const cells = grid.flatMap((row,di) => row.map((cell,hi) => ({di,hi,val:cellVal(cell),cell})))
  const best = cells.filter(c=>c.cell.calls>0).sort((a,b)=>b.val-a.val)[0]

  return (
    <div style={{ padding:'20px 24px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ fontSize:12, color:'#666666' }}>Call activity by day & hour (all-time)</span>
        <div style={{ display:'flex', gap:2, background:'#0a0a0a', border:'1px solid #2a2a2a', borderRadius:999, padding:3 }}>
          {['volume','contact'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ height:26, padding:'0 12px', borderRadius:999, border:'none', cursor:'pointer', fontSize:11, fontFamily:'inherit', background:mode===m?'#7c3aed':'transparent', color:mode===m?'#ffffff':'#888888', transition:'all 120ms ease' }}>
              {m==='volume'?'Call Volume':'Contact Rate'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'36px repeat(24,1fr)', gap:2, minWidth:580 }}>
          <div/>
          {Array.from({length:24},(_,h) => (
            <div key={h} style={{ fontSize:9, color:'#555555', textAlign:'center', paddingBottom:3 }}>
              {h%4===0?fmtH(h):''}
            </div>
          ))}
          {DAY_LABELS.map((day,di) => (
            <>
              <div key={`d${di}`} style={{ fontSize:10, color:'#666666', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6 }}>{day}</div>
              {grid[di].map((cell,hi) => {
                const val = cellVal(cell)
                return (
                  <div key={hi} style={{ height:18, borderRadius:2, background:cellColor(val), cursor:cell.calls>0?'pointer':'default' }}
                    onMouseEnter={e => cell.calls>0&&setTooltip({ x:e.clientX, y:e.clientY, di, hi, cell })}
                    onMouseLeave={() => setTooltip(null)}/>
                )
              })}
            </>
          ))}
        </div>
      </div>
      {tooltip && (
        <div style={{ position:'fixed', left:tooltip.x+12, top:tooltip.y-8, background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:6, padding:'6px 10px', fontSize:12, color:'#cccccc', pointerEvents:'none', zIndex:9999, whiteSpace:'nowrap' }}>
          {mode==='volume'
            ? `${DAY_LABELS[tooltip.di]} ${fmtH(tooltip.hi)}: ${tooltip.cell.calls} call${tooltip.cell.calls!==1?'s':''}`
            : `${DAY_LABELS[tooltip.di]} ${fmtH(tooltip.hi)}: ${Math.round(tooltip.cell.contacts/tooltip.cell.calls*100)}% contact (${tooltip.cell.contacts}/${tooltip.cell.calls})`}
        </div>
      )}
      {best && (
        <div style={{ marginTop:14, fontSize:12, color:'#666666', textAlign:'center' }}>
          Best calling window: <span style={{ color:'#cccccc' }}>{DAY_LABELS[best.di]} {fmtH(best.hi)}</span>
          {mode==='volume' ? ` — ${best.val} calls` : ` — ${best.val}% contact rate`}
        </div>
      )}
    </div>
  )
}

// ── Lead age table ─────────────────────────────────────────────────────────────
function LeadAgeTable({ leads, logs }) {
  const logsByLead = useMemo(() => {
    const m = {}
    logs.forEach(l => { if(!m[l.leadId]) m[l.leadId]=[]; m[l.leadId].push(l) })
    return m
  }, [logs])

  const BUCKETS = [
    { label:'Under 5 min', test: ms => ms < 300000 },
    { label:'Under 1 hr',  test: ms => ms < 3600000 },
    { label:'Same day',    test: ms => ms < 86400000 },
    { label:'1–3 days',   test: ms => ms < 259200000 },
    { label:'4+ days',    test: ms => ms >= 259200000 },
    { label:'Never',      test: ms => ms === null },
  ]
  const data = BUCKETS.map(b => ({ ...b, leads:0, contacts:0 }))

  leads.forEach(lead => {
    const ll = (logsByLead[lead.id]||[]).sort((a,b)=>new Date(a.loggedAt)-new Date(b.loggedAt))
    if (!ll.length) { data[5].leads++; return }
    const speed = lead.receivedAt ? new Date(ll[0].loggedAt)-new Date(lead.receivedAt) : null
    if (speed===null||speed<0) { data[5].leads++; return }
    const hasContact = ll.some(l => l.dispositions.some(d => CONTACT_SET.has(d)))
    for (let i=0; i<5; i++) {
      if (data[i].test(speed)) { data[i].leads++; if(hasContact) data[i].contacts++; break }
    }
  })

  const maxCR = Math.max(1, ...data.map(b => b.leads>0 ? Math.round(b.contacts/b.leads*100) : 0))
  const bestIdx = data.slice(0,5).reduce((best,b,i) => {
    const cr = b.leads>0 ? b.contacts/b.leads : 0
    return cr>(data[best].leads>0?data[best].contacts/data[best].leads:0) ? i : best
  }, 0)

  return (
    <div style={{ padding:'20px 24px 24px' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', padding:'0 0 12px', fontSize:11, color:'#555555', textTransform:'uppercase', letterSpacing:'0.5px' }}>Speed to First Call</th>
            <th style={{ textAlign:'right', padding:'0 16px 12px', fontSize:11, color:'#555555', textTransform:'uppercase', letterSpacing:'0.5px', fontVariantNumeric:'tabular-nums' }}>Leads</th>
            <th style={{ padding:'0 0 12px', fontSize:11, color:'#555555', textTransform:'uppercase', letterSpacing:'0.5px' }}>Contact Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b,i) => {
            const cr = b.leads>0 ? Math.round(b.contacts/b.leads*100) : null
            const isBest = i===bestIdx && b.leads>0
            return (
              <tr key={b.label} style={{ borderLeft: isBest?'3px solid #4caf84':'3px solid transparent' }}>
                <td style={{ padding:'9px 0 9px 8px', color:isBest?'#4caf84':'#888888', fontWeight:isBest?600:400 }}>{b.label}</td>
                <td style={{ textAlign:'right', padding:'9px 16px', color:'#888888', fontVariantNumeric:'tabular-nums' }}>{b.leads}</td>
                <td style={{ padding:'9px 0', minWidth:160 }}>
                  {cr!==null ? (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:4, background:'#1e1e1e', borderRadius:999, overflow:'hidden', maxWidth:80 }}>
                        <div style={{ height:'100%', width:`${Math.round(cr/maxCR*100)}%`, background:isBest?'#4caf84':'#7c3aed', borderRadius:999 }}/>
                      </div>
                      <span style={{ fontSize:12, color:isBest?'#4caf84':'#888888', fontVariantNumeric:'tabular-nums', minWidth:32, textAlign:'right' }}>{cr}%</span>
                    </div>
                  ) : <span style={{ color:'#333333', fontSize:12 }}>—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{ marginTop:16, fontSize:12, color:'#555555', lineHeight:1.5 }}>
        Leads called within the first hour are 9× more likely to result in contact than those called the next day.
      </div>
    </div>
  )
}

// ── Vendor table (upgraded) ────────────────────────────────────────────────────
function VendorTable({ leads, logs }) {
  const [sortKey, setSortKey] = useState('calls')
  const [sortDir, setSortDir] = useState(-1)

  function handleSort(k) {
    if (sortKey===k) setSortDir(d => -d)
    else { setSortKey(k); setSortDir(-1) }
  }

  const rows = useMemo(() => {
    const vm = {}
    leads.forEach(l => {
      const v = l.vendor||'Unknown'
      if (!vm[v]) vm[v] = { leads:0, calls:0, contacts:0, appts:0, sold:0, dailyMap:{} }
      vm[v].leads++
    })
    logs.forEach(l => {
      const v = leads.find(ld => ld.id===l.leadId)?.vendor||'Unknown'
      if (!vm[v]) return
      vm[v].calls++
      if (l.dispositions.some(d => CONTACT_SET.has(d))) vm[v].contacts++
      if (l.dispositions.includes('Appointment Set')) vm[v].appts++
      if (l.dispositions.includes('Sold')) vm[v].sold++
      const day = l.loggedAt.split('T')[0]
      vm[v].dailyMap[day] = (vm[v].dailyMap[day]||0)+1
    })
    return Object.entries(vm).map(([name,s]) => ({
      name, ...s,
      cr: s.calls>0 ? Math.round(s.contacts/s.calls*100) : 0,
      sparkData: Object.entries(s.dailyMap).sort((a,b)=>a[0]<b[0]?-1:1).slice(-7).map(e=>e[1]),
    }))
  }, [leads, logs])

  const sorted = [...rows].sort((a,b) => (b[sortKey]-a[sortKey])*sortDir)
  const maxCR = Math.max(1, ...rows.map(r=>r.cr))
  const bestCR = rows.filter(r=>r.calls>0).reduce((b,r)=>r.cr>b?r.cr:b, 0)
  const worstCR = rows.filter(r=>r.calls>0).reduce((b,r)=>r.cr<b?r.cr:b, Infinity)

  const SortIcon = ({k}) => sortKey!==k ? <span style={{color:'#333333'}}> ↕</span> : <span style={{color:'#7c3aed'}}>{sortDir===-1?' ↓':' ↑'}</span>

  return (
    <div className="ca-vendor-wrap">
      {sorted.length===0
        ? <div style={{ padding:'40px', textAlign:'center', color:'#555555', fontSize:13 }}>No vendor data.</div>
        : <table className="ca-vendor-table" style={{ tableLayout:'fixed' }}>
            <thead>
              <tr>
                <th style={{ width:'20%' }}>Vendor</th>
                <th style={{ width:'10%', textAlign:'right', cursor:'pointer' }} onClick={()=>handleSort('leads')}>Leads<SortIcon k="leads"/></th>
                <th style={{ width:'10%', textAlign:'right', cursor:'pointer' }} onClick={()=>handleSort('calls')}>Calls<SortIcon k="calls"/></th>
                <th style={{ width:'24%', cursor:'pointer' }} onClick={()=>handleSort('cr')}>Contact Rate<SortIcon k="cr"/></th>
                <th style={{ width:'10%', textAlign:'right', cursor:'pointer' }} onClick={()=>handleSort('appts')}>Appts<SortIcon k="appts"/></th>
                <th style={{ width:'10%', textAlign:'right', cursor:'pointer' }} onClick={()=>handleSort('sold')}>Sold<SortIcon k="sold"/></th>
                <th style={{ width:'16%' }}>7d Trend</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
                const isBest = r.cr===bestCR && bestCR>0 && r.calls>0
                const isWorst = r.cr===worstCR && sorted.filter(x=>x.calls>0).length>1 && r.calls>0 && !isBest
                return (
                  <tr key={r.name} style={{ borderLeft: isBest?'3px solid #4caf84':isWorst?'3px solid #e05c5c':'3px solid transparent' }}>
                    <td style={{ color:'#ffffff', fontWeight:500, paddingLeft: isBest||isWorst ? 5:8 }}>{r.name}</td>
                    <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.leads}</td>
                    <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{r.calls}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:4, background:'#1e1e1e', borderRadius:999, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.round(r.cr/maxCR*100)}%`, background:isBest?'#4caf84':isWorst?'#e05c5c':'#7c3aed', borderRadius:999 }}/>
                        </div>
                        <span style={{ minWidth:32, fontVariantNumeric:'tabular-nums', fontSize:12, textAlign:'right' }}>{r.calls>0?`${r.cr}%`:'—'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums', color:r.appts>0?'#4caf84':undefined }}>{r.appts}</td>
                    <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums', color:r.sold>0?'#4caf84':undefined, fontWeight:r.sold>0?600:undefined }}>{r.sold}</td>
                    <td><Sparkline values={r.sparkData} color={isBest?'#4caf84':isWorst?'#e05c5c':'#7c3aed'}/></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
      }
    </div>
  )
}

// ── Goals tab ──────────────────────────────────────────────────────────────────
function GoalsTab({ logs }) {
  const DEFAULTS = { calls:250, appts:10, sales:2 }
  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ffl_call_goals')||'null')||DEFAULTS } catch { return DEFAULTS }
  })
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0,0,0,0)
  const weekLogs = logs.filter(l => new Date(l.loggedAt) >= weekStart)
  const weekCalls = weekLogs.length
  const weekAppts = weekLogs.filter(l => l.dispositions.includes('Appointment Set')).length
  const weekSales = weekLogs.filter(l => l.dispositions.includes('Sold')).length

  const dow = now.getDay()
  const daysElapsed = Math.max(1, dow===0?7:dow)
  const pace = v => Math.round(v*7/daysElapsed)

  function saveGoals(g) { setGoals(g); try { localStorage.setItem('ffl_call_goals', JSON.stringify(g)) } catch {} }

  function getStatus(curr, goal) {
    const r = pace(curr)/goal
    if (r>=0.90) return 'On Track'
    if (r>=0.65) return 'At Risk'
    return 'Off Track'
  }
  function statusColor(s) { return s==='On Track'?'#4caf84':s==='At Risk'?'#f59e0b':'#e05c5c' }

  const metrics = [
    { key:'calls', label:'Calls / Week',        current:weekCalls, goal:goals.calls },
    { key:'appts', label:'Appointments / Week',  current:weekAppts, goal:goals.appts },
    { key:'sales', label:'Sales / Week',         current:weekSales, goal:goals.sales },
  ]

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ marginBottom:20, fontSize:12, color:'#555555' }}>
        Week of {weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} · {daysElapsed} of 7 days elapsed
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {metrics.map(m => {
          const fillPct = Math.min(100, Math.round(m.current/Math.max(1,m.goal)*100))
          const status  = getStatus(m.current, m.goal)
          const paceVal = pace(m.current)
          const isEditing = editing===m.key
          return (
            <div key={m.key}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, gap:12 }}>
                <span style={{ fontSize:13, color:'#cccccc', fontWeight:500 }}>{m.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:999, color:statusColor(status), background:`${statusColor(status)}18` }}>{status}</span>
                  {isEditing ? (
                    <div style={{ display:'flex', gap:4 }}>
                      <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus
                        style={{ width:64, height:26, background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:6, color:'#ffffff', fontSize:12, textAlign:'right', padding:'0 8px', fontFamily:'inherit' }}
                        onKeyDown={e=>{ if(e.key==='Enter'){saveGoals({...goals,[m.key]:parseInt(editVal)||m.goal});setEditing(null)} if(e.key==='Escape')setEditing(null) }}/>
                      <button onClick={()=>{saveGoals({...goals,[m.key]:parseInt(editVal)||m.goal});setEditing(null)}}
                        style={{ height:26, padding:'0 10px', background:'#7c3aed', border:'none', borderRadius:6, color:'#ffffff', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>Save</button>
                    </div>
                  ) : (
                    <span onClick={()=>{setEditing(m.key);setEditVal(String(m.goal))}}
                      style={{ fontSize:12, color:'#555555', cursor:'pointer', fontVariantNumeric:'tabular-nums' }}
                      title="Click to edit goal">Goal: {m.goal}</span>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                <div style={{ flex:1, height:6, background:'#1e1e1e', borderRadius:999, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${fillPct}%`, background:statusColor(status), borderRadius:999, transition:'width 0.4s ease' }}/>
                </div>
                <span style={{ fontSize:12, color:'#888888', fontVariantNumeric:'tabular-nums', minWidth:48, textAlign:'right' }}>{m.current} / {m.goal}</span>
              </div>
              <div style={{ fontSize:11, color:'#555555' }}>
                Pace: {paceVal} · {paceVal>=m.goal ? '✓ on track to hit goal' : `${m.goal-paceVal} behind target pace`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Activity stats ─────────────────────────────────────────────────────────────
function ActivityTab({ leads, logs, sparkData }) {
  const logsByLead = useMemo(() => {
    const m = {}
    logs.forEach(l => { if(!m[l.leadId]) m[l.leadId]=[]; m[l.leadId].push(l) })
    return m
  }, [logs])

  const speedTimes = leads.map(l => {
    const first = (logsByLead[l.id]||[]).sort((a,b)=>new Date(a.loggedAt)-new Date(b.loggedAt))[0]
    if (!first||!l.receivedAt) return null
    const t = new Date(first.loggedAt)-new Date(l.receivedAt)
    return t>0 ? t : null
  }).filter(Boolean).sort((a,b)=>a-b)
  const medianSpeed = speedTimes.length ? speedTimes[Math.floor(speedTimes.length/2)] : null

  const attempts = leads.map(l => {
    const ll = (logsByLead[l.id]||[]).sort((a,b)=>new Date(a.loggedAt)-new Date(b.loggedAt))
    const idx = ll.findIndex(lg => lg.dispositions.some(d=>CONTACT_SET.has(d)))
    return idx>=0 ? idx+1 : null
  }).filter(Boolean)
  const avgAttempts = attempts.length ? (attempts.reduce((a,b)=>a+b,0)/attempts.length).toFixed(1) : '—'

  const untouched = leads.filter(l=>!(logsByLead[l.id]||[]).length)
  const oldestDays = untouched.reduce((max,l) => !l.receivedAt?max:Math.max(max,Math.floor((Date.now()-new Date(l.receivedAt))/86400000)),0)

  const cbLeads = leads.filter(l=>(logsByLead[l.id]||[]).some(lg=>lg.dispositions.includes('Callback')))
  const cbFollowed = cbLeads.filter(l => {
    const ll=(logsByLead[l.id]||[]).sort((a,b)=>new Date(a.loggedAt)-new Date(b.loggedAt))
    const ci=ll.findIndex(lg=>lg.dispositions.includes('Callback'))
    return ci>=0&&ll.length>ci+1
  }).length

  const stats = [
    { value:formatDuration(medianSpeed), label:'Speed to Lead',          caption:'Median time to first call',    sparkVals:sparkData.map(d=>d.calls) },
    { value:avgAttempts,                  label:'Attempts to Contact',    caption:'Avg calls before contact',     sparkVals:sparkData.map(d=>d.contacts) },
    { value:String(untouched.length),     label:'Untouched Leads',       caption:oldestDays>0?`Oldest: ${oldestDays} day${oldestDays!==1?'s':''}`: 'All leads touched', sparkVals:null, alert:untouched.length>0 },
    { value:cbLeads.length>0?`${Math.round(cbFollowed/cbLeads.length*100)}%`:'—', label:'Callback Follow-Through', caption:cbLeads.length>0?`${cbFollowed} of ${cbLeads.length} followed up`:'No callbacks logged', sparkVals:sparkData.map(d=>d.cr) },
  ]

  return (
    <div className="ca-activity-grid">
      {stats.map(s => (
        <div key={s.label} className="ca-stat-block">
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
            <div className="ca-stat-value" style={s.alert?{color:'#e05c5c'}:{}}>{s.value}</div>
            {s.sparkVals && <Sparkline values={s.sparkVals} color="#7c3aed"/>}
          </div>
          <div className="ca-stat-label">{s.label}</div>
          <div className="ca-stat-caption">{s.caption}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CallAnalytics({ onNavigate }) {
  seedDemoData()

  const [range,           setRange]           = useState('week')
  const [activeTab,       setActiveTab]       = useState('activity')
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const allLogs  = useMemo(() => load('ffl_call_logs', []), [])
  const allLeads = useMemo(() => load('ffl_leads', []),     [])

  const now = new Date()
  const { start, end, prevStart, prevEnd } = getRangeBounds(range, now)
  const currLogs = filterLogs(allLogs, start, end)
  const prevLogs = prevStart ? filterLogs(allLogs, prevStart, prevEnd) : []

  // KPIs
  const totalCalls         = currLogs.length
  const prevTotalCalls     = prevLogs.length
  const leadsContacted     = new Set(currLogs.map(l=>l.leadId)).size
  const prevLeadsContacted = new Set(prevLogs.map(l=>l.leadId)).size
  const contactCalls       = currLogs.filter(l=>l.dispositions.some(d=>CONTACT_SET.has(d)))
  const contactRate        = pct(contactCalls.length, totalCalls)
  const prevContactCalls   = prevLogs.filter(l=>l.dispositions.some(d=>CONTACT_SET.has(d)))
  const prevContactRate    = prevLogs.length>0 ? pct(prevContactCalls.length, prevLogs.length) : null
  const appointmentsSet    = currLogs.filter(l=>l.dispositions.includes('Appointment Set')).length
  const prevAppts          = prevLogs.filter(l=>l.dispositions.includes('Appointment Set')).length

  // Sparkline data (14-day daily lookback)
  const sparkDays = useMemo(() => getSparklineData(allLogs, 14, now), [allLogs])

  // Banner counts (all-time)
  const logCountByLead = useMemo(() => {
    const m = {}; allLogs.forEach(l => { m[l.leadId]=(m[l.leadId]||0)+1 }); return m
  }, [allLogs])
  const untouchedCount = allLeads.filter(l=>!logCountByLead[l.id]).length
  const overdueCallbacks = allLeads.filter(l => {
    const cb = allLogs.filter(lg=>lg.leadId===l.id&&lg.dispositions.includes('Callback')).sort((a,b)=>new Date(b.loggedAt)-new Date(a.loggedAt))[0]
    return cb && (now-new Date(cb.loggedAt)) > 86400000
  }).length
  const needsDispCount = allLeads.filter(l => {
    const ll = allLogs.filter(lg=>lg.leadId===l.id)
    if (!ll.length) return false
    const last = ll.sort((a,b)=>new Date(b.loggedAt)-new Date(a.loggedAt))[0]
    return last.dispositions.length===0
  }).length
  const showBanner = !bannerDismissed && (untouchedCount>0||overdueCallbacks>0||needsDispCount>0)

  // Chart data
  const timeBuckets     = useMemo(() => getTimeBuckets(range, currLogs, now), [range, currLogs])
  const prevTimeBuckets = useMemo(() => prevStart ? getTimeBuckets(range, prevLogs, prevEnd) : [], [range, prevLogs, prevStart])

  // Last updated time
  const lastUpdated = now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})

  const TABS = [
    { id:'activity', label:'Activity'   },
    { id:'heatmap',  label:'Heatmap'    },
    { id:'leadage',  label:'Lead Age'   },
    { id:'byvendor', label:'By Vendor'  },
    { id:'goals',    label:'Goals'      },
  ]

  const KPI_ACCENT = ['#7c3aed','#3b82f6','#22d3ee','#4caf84']

  const kpis = [
    { label:'Total Calls',      context:null,                      value:totalCalls.toLocaleString(),       curr:totalCalls,      prev:prevTotalCalls,    color:null,        sparkVals:sparkDays.map(d=>d.calls),          accentColor:'#7c3aed' },
    { label:'Leads Contacted',  context:null,                      value:leadsContacted.toLocaleString(),   curr:leadsContacted,  prev:prevLeadsContacted,color:null,        sparkVals:sparkDays.map(d=>d.leadsContacted), accentColor:'#3b82f6' },
    { label:'Contact Rate',     context:'Industry avg 8–12%',      value:`${contactRate}%`,                 curr:contactRate,     prev:prevContactRate,   color:null,        sparkVals:sparkDays.map(d=>d.cr),             accentColor:'#22d3ee' },
    { label:'Appointments Set', context:null,                      value:appointmentsSet.toLocaleString(),  curr:appointmentsSet, prev:prevAppts,         color:'#4caf84',   sparkVals:sparkDays.map(d=>d.appts),          accentColor:'#4caf84' },
  ]

  return (
    <div className="ca-root animate-in">

      {/* Header */}
      <div className="ca-header">
        <div>
          <h1 className="ca-title">Call Analytics</h1>
          <p className="ca-sub">Calling activity, conversion, and lead quality breakdown.</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <span style={{ fontSize:10, color:'#888888' }}>Last updated: {lastUpdated}</span>
          <div className="ca-range-group">
            {RANGES.map(r => (
              <button key={r.id} className={`ca-range-btn${range===r.id?' active':''}`} onClick={()=>setRange(r.id)}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Action banner */}
      {showBanner && (
        <div className="ca-banner">
          <div className="ca-banner-left">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
              <circle cx="8" cy="8" r="7"/><line x1="8" y1="4.5" x2="8" y2="8.5"/><line x1="8" y1="11" x2="8" y2="11.5" strokeWidth="2"/>
            </svg>
            <span className="ca-banner-text">
              {untouchedCount>0 && <><button className="ca-banner-link" onClick={()=>onNavigate?.('leads',{type:'untouched',label:'Untouched leads'})}>{untouchedCount} lead{untouchedCount!==1?'s':''} untouched</button></>}
              {untouchedCount>0&&overdueCallbacks>0 && <span className="ca-banner-sep"> · </span>}
              {overdueCallbacks>0 && <><button className="ca-banner-link" onClick={()=>onNavigate?.('leads',{type:'overdue_callback',label:'Overdue callbacks'})}>{overdueCallbacks} callback{overdueCallbacks!==1?'s':''} overdue</button></>}
              {(untouchedCount>0||overdueCallbacks>0)&&needsDispCount>0 && <span className="ca-banner-sep"> · </span>}
              {needsDispCount>0 && <><button className="ca-banner-link" onClick={()=>onNavigate?.('leads',{type:'needs_disposition',label:'Needs Disposition'})}>{needsDispCount} need{needsDispCount===1?'s':''} disposition</button></>}
            </span>
          </div>
          <button className="ca-banner-dismiss" onClick={()=>setBannerDismissed(true)}>×</button>
        </div>
      )}

      {/* KPI row */}
      <div className="ca-kpi-row">
        {kpis.map((k,i) => (
          <div key={k.label} className="ca-kpi-card" style={{ borderTop:`2px solid ${k.accentColor}` }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
              <span className="ca-kpi-label">{k.label}</span>
              {k.context && <span style={{ fontSize:10, color:'#888888' }}>{k.context}</span>}
            </div>
            <div className="ca-kpi-value" style={k.color?{color:k.color}:{}}>{k.value}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:24, gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <DeltaPill curr={k.curr} prev={k.prev}/>
                {k.prev!==null&&k.prev!==undefined&&(k.curr!==0||k.prev!==0) &&
                  <span style={{ fontSize:11, color:'#555555' }}>vs prev</span>}
              </div>
              <Sparkline values={k.sparkVals} color={k.accentColor}/>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion funnel */}
      <ConversionFunnel leads={allLeads} logs={allLogs} onNavigate={onNavigate}/>

      {/* Chart row */}
      <div className="ca-chart-row">
        <div className="ca-card ca-chart-main">
          <div className="ca-card-head">
            <span className="ca-card-title">Calls Over Time</span>
            <div className="ca-legend">
              <span className="ca-legend-item"><span style={{width:8,height:8,borderRadius:'50%',background:'#7c3aed',flexShrink:0}}/>Current</span>
              {prevTimeBuckets.length>0 && <span className="ca-legend-item"><span style={{width:12,height:0,borderTop:'2px dashed #555555',flexShrink:0}}/>Previous</span>}
            </div>
          </div>
          <div style={{ height:180 }}>
            <LineChart data={timeBuckets} prevData={prevTimeBuckets.length>0?prevTimeBuckets:null}/>
          </div>
        </div>
        <div className="ca-card ca-chart-side">
          <div className="ca-card-head"><span className="ca-card-title">Disposition Breakdown</span></div>
          <DispositionBars logs={currLogs}/>
        </div>
      </div>

      {/* Tabbed panel */}
      <div className="ca-card ca-panel">
        <div className="ca-panel-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ca-panel-tab${activeTab===t.id?' active':''}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {activeTab==='activity' && <ActivityTab leads={allLeads} logs={allLogs} sparkData={sparkDays}/>}
        {activeTab==='heatmap'  && <Heatmap logs={allLogs}/>}
        {activeTab==='leadage'  && <LeadAgeTable leads={allLeads} logs={allLogs}/>}
        {activeTab==='byvendor' && <VendorTable leads={allLeads} logs={allLogs}/>}
        {activeTab==='goals'    && <GoalsTab logs={allLogs}/>}
      </div>

    </div>
  )
}
