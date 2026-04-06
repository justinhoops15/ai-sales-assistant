import { useMemo } from 'react'

const LEAD_LABELS = {
  mortgage_protection: 'Mortgage Protection',
  final_expense:       'Final Expense',
  veteran:             'Veteran',
}

function loadAppointments() {
  try {
    return JSON.parse(localStorage.getItem('ffl_appointments') || '[]')
  } catch { return [] }
}

function isThisMonth(isoString) {
  if (!isoString) return false
  const d = new Date(isoString)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function fmt(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Math.round(n).toLocaleString()
}

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff  = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Dashboard({ agentInfo, onNewAppointment, onChangeAgent }) {
  const appointments = useMemo(loadAppointments, [])

  const total     = appointments.length
  const thisMonth = appointments.filter(a => isThisMonth(a.savedAt)).length
  const recent    = [...appointments].reverse().slice(0, 5)

  const STATS = [
    { label: 'Total Appointments', value: total },
    { label: 'This Month',         value: thisMonth },
    { label: 'Policies Sold',      value: total },
  ]

  return (
    <div className="dashboard animate-in">

      {/* Welcome */}
      <div className="dashboard-welcome">
        <div className="dashboard-eyebrow">FFL Intelligence — Agent Dashboard</div>
        <h1 className="dashboard-title">Welcome back, {agentInfo.name.split(' ')[0]}</h1>
        <p className="dashboard-subtitle">
          Contract level: {agentInfo.contractLevel}%
          {' \u00b7 '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* CTA */}
      <button className="dashboard-cta" onClick={onNewAppointment}>
        Start New Appointment
      </button>

      {/* Stats */}
      <div className="stat-grid">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-number">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent clients */}
      <div className="recent-clients-card">
        <div className="recent-header">Recent Clients</div>
        {recent.length === 0 ? (
          <div className="recent-empty">
            No appointments saved yet. Start your first appointment above.
          </div>
        ) : (
          <div>
            {recent.map((appt, i) => (
              <div key={appt.id || i} className="recent-item">
                <div>
                  <div className="recent-client-name">
                    <span>{appt.clientName || 'Unknown Client'}</span>
                    {appt.leadType && (
                      <span className="recent-lead-badge">
                        {LEAD_LABELS[appt.leadType] || appt.leadType}
                      </span>
                    )}
                  </div>
                  <div className="recent-details">
                    {appt.carrier    && <span>{appt.carrier}</span>}
                    {appt.face       && <span>{fmt(appt.face)}</span>}
                    {appt.planCode   && <span>{appt.planCode}</span>}
                    {appt.tier       && <span>{appt.tier}</span>}
                    {appt.monthlyPremium && (
                      <span className="recent-detail-green">
                        ${parseFloat(appt.monthlyPremium).toFixed(2)}/mo
                      </span>
                    )}
                  </div>
                </div>
                <div className="recent-time">{timeAgo(appt.savedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <button className="dashboard-switch-btn" onClick={onChangeAgent}>
          Switch agent profile
        </button>
      </div>
    </div>
  )
}
