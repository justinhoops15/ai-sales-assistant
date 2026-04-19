const STEPS = [
  'Lead Type', 'Client Info', 'Conditions',
  'Medications', 'Financial', 'Monthly Bills', 'Results',
]

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="6" height="6" rx="1"/>
      <rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14"/>
      <line x1="2" y1="8" x2="14" y2="8"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5"/>
      <path d="M1 13c0-2.5 2-4 5-4s5 1.5 5 4"/>
      <circle cx="12" cy="5" r="2" opacity="0.6"/>
      <path d="M14.5 13c0-1.8-1.2-3-3-3.5" opacity="0.6"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5 5 4 7.5 8.5 2.5"/>
    </svg>
  )
}

export default function Sidebar({ agentInfo, activeView, currentStep, onNavigate, onChangeAgent }) {
  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        FFL Intelligence
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">

        <button
          onClick={() => onNavigate('dashboard')}
          className={`sidebar-item${activeView === 'dashboard' ? ' active' : ''}`}
        >
          <span className="sidebar-item-icon"><IconGrid /></span>
          Dashboard
        </button>

        <button
          onClick={() => onNavigate('appointment')}
          className={`sidebar-item${activeView === 'appointment' && currentStep === null ? ' active' : ''}`}
        >
          <span className="sidebar-item-icon"><IconPlus /></span>
          New Appointment
        </button>

        <button
          onClick={() => onNavigate('clients')}
          className={`sidebar-item${activeView === 'clients' ? ' active' : ''}`}
        >
          <span className="sidebar-item-icon"><IconUsers /></span>
          Clients
        </button>

        {/* Step tracker */}
        {currentStep != null && (
          <>
            <div className="sidebar-section-label">Appointment</div>
            {STEPS.map((label, i) => {
              const stepNum  = i + 1
              const isDone   = stepNum < currentStep
              const isActive = stepNum === currentStep
              return (
                <div
                  key={stepNum}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 36,
                    paddingLeft: 28,
                    fontSize: 12,
                    width: '100%',
                    borderLeft: `3px solid ${isActive ? '#22d3ee' : 'transparent'}`,
                    background: isActive ? 'rgba(34,211,238,0.05)' : 'transparent',
                    color: isActive ? '#22d3ee' : isDone ? '#4caf84' : '#555555',
                    cursor: 'default',
                  }}
                >
                  <span style={{ width: 18, fontSize: 10, textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDone ? <IconCheck /> : stepNum}
                  </span>
                  {label}
                </div>
              )
            })}
          </>
        )}
      </nav>

      {/* Agent footer */}
      <div className="sidebar-footer">
        <div className="sidebar-agent-name">{agentInfo?.name || ''}</div>
        <div className="sidebar-agent-level">Level {agentInfo?.contractLevel}%</div>
        <button className="sidebar-change-btn" onClick={onChangeAgent}>
          switch agent
        </button>
      </div>
    </aside>
  )
}
