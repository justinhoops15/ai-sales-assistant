import { useState } from 'react'
import AgentSetup          from './components/AgentSetup.jsx'
import Clients             from './components/Clients.jsx'
import Dashboard           from './components/Dashboard.jsx'
import FollowUpModal       from './components/FollowUpModal.jsx'
import ProgressBar         from './components/ProgressBar.jsx'
import Sidebar             from './components/Sidebar.jsx'
import Step1LeadType       from './components/Step1LeadType.jsx'
import Step2ClientInfo     from './components/Step2ClientInfo.jsx'
import Step3Conditions     from './components/Step3Conditions.jsx'
import Step4Medications    from './components/Step4Medications.jsx'
import Step5Financial      from './components/Step5Financial.jsx'
import Step6Bills          from './components/Step6Bills.jsx'
import Step7Results        from './components/Step7Results.jsx'
import ApplicationScreen   from './components/ApplicationScreen.jsx'
import AppointmentSummary  from './components/AppointmentSummary.jsx'
import { runUnderwriting } from './engine/underwritingEngine.js'

const STEP_LABELS = [
  'Lead Type', 'Client Info', 'Conditions',
  'Medications', 'Financial', 'Monthly Bills', 'Results',
]

const INIT_BILLS = {
  mortgage: '', car: '', utilities: '', cableInternet: '',
  cellPhones: '', gasoline: '', carInsurance: '', foodGroceries: '',
  healthInsurance: '', lifeInsurance: '', loans: '', creditCards: '',
  extras: '',
}

function initForm() {
  return {
    leadType: null,
    clientInfo: {
      firstName: '', lastName: '', age: '', sex: '',
      state: '',
      dateOfBirth: '', phoneNumber: '',
      maritalStatus: '', spouseName: '',
      beneficiaryName: '',
      tobacco: false, tobaccoType: '',
      heightFt: '5', heightIn: '6', weight: '',
    },
    conditions: {},
    medications: [],
    financial: {
      occupation: '', income: '', ssi: '', bills: '',
      feDesiredCoverage: '',
      hasMortgage: false,
      mortgageBalance: '', mortgagePayment: '', yearsRemaining: '', homeValue: '', equity: '',
      hasInsurance: false, workInsurance: '', privateInsurance: '',
      k401: '', stocks: '', savings: '',
      notes: '',
    },
    monthlyExpenses: { ...INIT_BILLS },
  }
}

function loadAgent() {
  try {
    const s = localStorage.getItem('ffl_agent')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

// Returns list of human-readable field names that must be filled before underwriting.
function getRequiredMissing(formData) {
  const missing = []
  if (!formData.leadType)              missing.push('Lead Type (Step 1)')
  if (!formData.clientInfo?.age)       missing.push('Age (Step 2)')
  if (!formData.clientInfo?.sex)       missing.push('Sex (Step 2)')
  if (!formData.clientInfo?.state)     missing.push('State (Step 2)')
  // tobacco defaults to false = Non-Tobacco, always considered answered
  return missing
}

export default function App() {
  const [agentInfo,      setAgentInfo]      = useState(loadAgent)
  const [showDashboard,  setShowDashboard]  = useState(true)
  const [step,           setStep]           = useState(1)
  const [formData,       setFormData]       = useState(initForm)
  const [results,        setResults]        = useState(null)
  const [appScreen,      setAppScreen]      = useState(null)  // null | 'application' | 'summary'
  const [selectedApp,    setSelectedApp]    = useState(null)
  const [declinedKeys,   setDeclinedKeys]   = useState(() => new Set())
  const [showFollowUp,    setShowFollowUp]    = useState(false)
  const [reqWarning,      setReqWarning]      = useState([])
  const [showClients,     setShowClients]     = useState(false)
  const [editingClientId, setEditingClientId] = useState(null)

  function handleAgentSetup(info) {
    localStorage.setItem('ffl_agent', JSON.stringify(info))
    setAgentInfo(info)
  }

  function update(key, val) {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  function handleNext() {
    if (step === 6) {
      const missing = getRequiredMissing(formData)
      if (missing.length > 0) {
        setReqWarning(missing)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      setReqWarning([])
      const out = runUnderwriting(formData, agentInfo?.contractLevel ?? 100)
      setResults(out)
    } else {
      setReqWarning([])
    }
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setReqWarning([])
    if (step === 1) {
      setShowDashboard(true)
    } else {
      setStep(s => s - 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleNewAppointment() {
    setFormData(initForm())
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setShowDashboard(false)
    setShowClients(false)
    setEditingClientId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Edit a client (pre-fill form with saved data) ──────────────────────────
  function handleEditClient(clientRecord) {
    const nameParts = (clientRecord.clientName || '').split(' ')
    const preFilledForm = {
      leadType: clientRecord.leadType || null,
      clientInfo: {
        firstName:       nameParts[0] || '',
        lastName:        nameParts.slice(1).join(' ') || '',
        age:             clientRecord.clientAge        || '',
        sex:             clientRecord.clientSex        || '',
        state:           clientRecord.clientState      || '',
        dateOfBirth:     clientRecord.clientDOB        || '',
        phoneNumber:     clientRecord.clientPhone      || '',
        maritalStatus:   clientRecord.maritalStatus    || '',
        spouseName:      clientRecord.spouseName       || '',
        beneficiaryName: clientRecord.beneficiaryName  || '',
        tobacco:         clientRecord.tobacco          || false,
        tobaccoType:     '',
        heightFt: '5', heightIn: '6', weight: '',
      },
      conditions:      {},
      medications:     [],
      financial: {
        occupation: '', income: '', ssi: '', bills: '',
        feDesiredCoverage: '',
        hasMortgage: false,
        mortgageBalance: '', mortgagePayment: '', yearsRemaining: '', homeValue: '', equity: '',
        hasInsurance: false, workInsurance: '', privateInsurance: '',
        k401: '', stocks: '', savings: '',
        notes: '',
      },
      monthlyExpenses: { ...INIT_BILLS },
    }
    setFormData(preFilledForm)
    setEditingClientId(clientRecord.id)
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setShowDashboard(false)
    setShowClients(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleChangeAgent() {
    if (window.confirm('Reset agent profile?')) {
      localStorage.removeItem('ffl_agent')
      setAgentInfo(null)
    }
  }

  function handleSelectApplication({ rec, face }) {
    setSelectedApp({ rec, face })
    setAppScreen('application')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleApplicationDeclined() {
    setDeclinedKeys(prev => new Set([...prev, selectedApp.rec.resultKey]))
    setAppScreen(null)
    setSelectedApp(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Cancel appointment ─────────────────────────────────────────────────────
  function handleCancel() {
    if (window.confirm('Are you sure you want to cancel? All appointment data will be lost.')) {
      setFormData(initForm())
      setResults(null)
      setStep(1)
      setAppScreen(null)
      setSelectedApp(null)
      setDeclinedKeys(new Set())
      setReqWarning([])
      setShowFollowUp(false)
      setShowDashboard(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Not Sold / Follow Up ───────────────────────────────────────────────────
  function handleOpenFollowUp() {
    setShowFollowUp(true)
  }

  function handleSaveFollowUp(note) {
    const record = {
      id:           Date.now(),
      savedAt:      new Date().toISOString(),
      followUpNote: note,
      currentStep:  step,
      agentName:    agentInfo?.name || '',
      agentLevel:   agentInfo?.contractLevel || '',
      formData:     { ...formData },
    }
    try {
      const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
      existing.push(record)
      localStorage.setItem('follow_up_appointments', JSON.stringify(existing))
    } catch (e) {
      console.error('Failed to save follow-up appointment:', e)
    }
    setFormData(initForm())
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setShowDashboard(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!agentInfo) {
    return <AgentSetup onComplete={handleAgentSetup} />
  }

  const clientName = [formData.clientInfo.firstName, formData.clientInfo.lastName]
    .filter(Boolean).join(' ') || null

  // allGraded2: true if every approved carrier resulted in a 2-year graded benefit
  const allGraded2 = results?.approved.length > 0 &&
    results.approved.every(r => r.waitingPeriod === 2)

  const filteredResults = results ? {
    approved:    results.approved.filter(r => !declinedKeys.has(r.resultKey)),
    declined:    results.declined,
    allGraded2,
  } : null

  const sidebarActiveView  = showClients ? 'clients' : showDashboard ? 'dashboard' : 'appointment'
  const sidebarCurrentStep = (!showDashboard && !showClients && appScreen === null && step >= 1) ? step : null

  function handleGoToClients() {
    setShowClients(true)
    setShowDashboard(false)
    setAppScreen(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStepClick(num) {
    // Step 7 only accessible when results exist
    if (num === 7 && !results) return
    setReqWarning([])
    setStep(num)
    setAppScreen(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSidebarNavigate(view) {
    if (view === 'dashboard')   { setShowDashboard(true); setShowClients(false); setAppScreen(null) }
    if (view === 'clients')     { setShowClients(true);   setShowDashboard(false); setAppScreen(null) }
    if (view === 'appointment') { handleNewAppointment() }
  }

  // ── Clients ────────────────────────────────────────────────────────────────
  if (showClients && appScreen === null) {
    return (
      <div className="app">
        <Sidebar agentInfo={agentInfo} activeView={sidebarActiveView} currentStep={sidebarCurrentStep} onNavigate={handleSidebarNavigate} onChangeAgent={handleChangeAgent} />
        <div className="app-body">
          <AppHeader title="Clients" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <Clients onEdit={handleEditClient} onNewAppointment={handleNewAppointment} />
          </main>
        </div>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  if (showDashboard && appScreen === null) {
    return (
      <div className="app">
        <Sidebar agentInfo={agentInfo} activeView={sidebarActiveView} currentStep={sidebarCurrentStep} onNavigate={handleSidebarNavigate} onChangeAgent={handleChangeAgent} />
        <div className="app-body">
          <AppHeader title="Dashboard" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <Dashboard agentInfo={agentInfo} onNewAppointment={handleNewAppointment} onChangeAgent={handleChangeAgent} onGoToClients={handleGoToClients} />
          </main>
        </div>
      </div>
    )
  }

  // ── Application review ─────────────────────────────────────────────────────
  if (appScreen === 'application' && selectedApp) {
    return (
      <div className="app">
        <Sidebar agentInfo={agentInfo} activeView={sidebarActiveView} currentStep={sidebarCurrentStep} onNavigate={handleSidebarNavigate} onChangeAgent={handleChangeAgent} />
        <div className="app-body">
          <AppHeader title="Application Review" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <ApplicationScreen
              application={selectedApp}
              clientName={clientName}
              onPreApproved={({ planCode, monthlyPremium, dateEnforced }) => {
                setSelectedApp(prev => ({ ...prev, planCode, monthlyPremium, dateEnforced }))
                setAppScreen('summary')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onDeclined={handleApplicationDeclined}
              onBack={() => { setAppScreen(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          </main>
        </div>
      </div>
    )
  }

  // ── Appointment summary ────────────────────────────────────────────────────
  if (appScreen === 'summary' && selectedApp) {
    return (
      <div className="app">
        <Sidebar agentInfo={agentInfo} activeView={sidebarActiveView} currentStep={sidebarCurrentStep} onNavigate={handleSidebarNavigate} onChangeAgent={handleChangeAgent} />
        <div className="app-body">
          <AppHeader title="Appointment Summary" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <AppointmentSummary
              application={selectedApp}
              clientName={clientName}
              formData={formData}
              agentInfo={agentInfo}
              editingClientId={editingClientId}
              onBack={() => { setAppScreen('application'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              onNewAppointment={handleNewAppointment}
            />
          </main>
        </div>
      </div>
    )
  }

  // ── Main step flow ─────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Sidebar agentInfo={agentInfo} activeView={sidebarActiveView} currentStep={sidebarCurrentStep} onNavigate={handleSidebarNavigate} onChangeAgent={handleChangeAgent} />
      <div className="app-body">
        <AppHeader title={`Step ${step} of 7`} agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
        <main className="app-main">
          {step <= 7 && (
            <ProgressBar currentStep={step} labels={STEP_LABELS} onStepClick={handleStepClick} hasResults={!!results} />
          )}

          {/* Required fields warning — shown when agent tries to run underwriting without completing them */}
          {reqWarning.length > 0 && (
            <div className="req-warning animate-in">
              <span className="req-warning-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2L14.5 13H1.5L8 2Z"/>
                  <line x1="8" y1="7" x2="8" y2="10"/>
                  <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
                </svg>
              </span>
              <div className="req-warning-text">
                <span className="req-warning-title">Required fields missing — cannot run underwriting:</span>
                <span className="req-warning-fields">
                  {reqWarning.map((f, i) => (
                    <span key={i} className="req-warning-field">{f}</span>
                  ))}
                </span>
              </div>
              <button className="req-warning-close" onClick={() => setReqWarning([])}>×</button>
            </div>
          )}

          {step === 1 && (
            <Step1LeadType value={formData.leadType} onChange={v => update('leadType', v)} onNext={handleNext} onCancel={handleCancel} onFollowUp={handleOpenFollowUp} />
          )}
          {step === 2 && (
            <Step2ClientInfo data={formData.clientInfo} onChange={v => update('clientInfo', v)} onNext={handleNext} onBack={handleBack} onCancel={handleCancel} onFollowUp={handleOpenFollowUp} />
          )}
          {step === 3 && (
            <Step3Conditions data={formData.conditions} onChange={v => update('conditions', v)} onNext={handleNext} onBack={handleBack} onCancel={handleCancel} onFollowUp={handleOpenFollowUp} />
          )}
          {step === 4 && (
            <Step4Medications data={formData.medications} conditions={formData.conditions} onChange={v => update('medications', v)} onNext={handleNext} onBack={handleBack} onCancel={handleCancel} onFollowUp={handleOpenFollowUp} />
          )}
          {step === 5 && (
            <Step5Financial data={formData.financial} leadType={formData.leadType} onChange={v => update('financial', v)} onNext={handleNext} onBack={handleBack} onCancel={handleCancel} onFollowUp={handleOpenFollowUp} />
          )}
          {step === 6 && (
            <Step6Bills data={formData.monthlyExpenses} onChange={v => update('monthlyExpenses', v)} monthlyIncome={Number(formData.financial.income) || 0} onNext={handleNext} onBack={handleBack} onCancel={handleCancel} onFollowUp={handleOpenFollowUp} />
          )}
          {step === 7 && filteredResults && (
            <Step7Results results={filteredResults} formData={formData} agentInfo={agentInfo} clientName={clientName} onNewAppointment={handleNewAppointment} onBack={handleBack} onSelectApplication={handleSelectApplication} onCancel={handleCancel} onFollowUp={handleOpenFollowUp} />
          )}
        </main>
      </div>

      {/* Follow-up modal — fixed overlay, always on top */}
      {showFollowUp && (
        <FollowUpModal
          onSave={handleSaveFollowUp}
          onBack={() => setShowFollowUp(false)}
        />
      )}
    </div>
  )
}

function AppHeader({ title, agentInfo, onChangeAgent }) {
  return (
    <header className="app-header">
      <span className="header-page-title">{title}</span>
      <div className="header-agent">
        <span className="agent-name-tag">{agentInfo.name}</span>
        <span className="agent-level-tag">{agentInfo.contractLevel}%</span>
        <button
          onClick={onChangeAgent}
          style={{ background: 'none', border: 'none', color: '#555555', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
        >change</button>
      </div>
    </header>
  )
}
