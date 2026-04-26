import { useState } from 'react'
import AgentSetup          from './components/AgentSetup.jsx'
import Clients             from './components/Clients.jsx'
import Dashboard           from './components/Dashboard.jsx'
import Earnings            from './components/Earnings.jsx'
import FollowUp            from './components/FollowUp.jsx'
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
      beneficiaries: [{ name: '', relationship: '', percentage: '100' }],
      tobacco: false, tobaccoType: '',
      heightFt: '5', heightIn: '6', weight: '',
    },
    conditions: {},
    medications: [],
    financial: {
      occupation: '', income: '', ssi: '', bills: '',
      feDesiredCoverage: '',
      finalDisposition: '',
      hasMortgage: false,
      mortgageBalance: '', mortgagePayment: '', yearsRemaining: '', homeValue: '', equity: '',
      hasInsurance: false,
      insCompany: '', insCoverage: '', insPremium: '', insYear: '',
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

function loadFollowUpCount() {
  try { return JSON.parse(localStorage.getItem('follow_up_appointments') || '[]').length }
  catch { return 0 }
}

// Returns list of human-readable field names that must be filled before underwriting.
function getRequiredMissing(formData) {
  const missing = []
  if (!formData.leadType)              missing.push('Lead Type (Step 1)')
  if (!formData.clientInfo?.age)       missing.push('Age (Step 2)')
  if (!formData.clientInfo?.sex)       missing.push('Sex (Step 2)')
  if (!formData.clientInfo?.state)     missing.push('State (Step 2)')
  // tobacco defaults to false = Non-Tobacco, always considered answered
  const isFEorVet = formData.leadType === 'final_expense' || formData.leadType === 'veteran'
  if (isFEorVet && !formData.financial?.finalDisposition) {
    missing.push('Method of Final Disposition (Step 5)')
  }
  return missing
}

export default function App() {
  const [agentInfo,        setAgentInfo]        = useState(loadAgent)
  const [showDashboard,    setShowDashboard]    = useState(true)
  const [showClients,      setShowClients]      = useState(false)
  const [showFollowUps,    setShowFollowUps]    = useState(false)
  const [showEarnings,     setShowEarnings]     = useState(false)
  const [highlightClientId, setHighlightClientId] = useState(null)
  const [step,             setStep]             = useState(1)
  const [formData,         setFormData]         = useState(initForm)
  const [results,          setResults]          = useState(null)
  const [appScreen,        setAppScreen]        = useState(null)  // null | 'application' | 'summary'
  const [selectedApp,      setSelectedApp]      = useState(null)
  const [declinedKeys,     setDeclinedKeys]     = useState(() => new Set())
  const [showFollowUp,     setShowFollowUp]     = useState(false)
  const [reqWarning,       setReqWarning]       = useState([])
  const [editingClientId,  setEditingClientId]  = useState(null)
  // Track how the appointment flow was launched so Cancel returns correctly
  const [cancelContext,    setCancelContext]    = useState('dashboard') // 'dashboard' | 'clients' | 'followups'
  // ID of the follow-up record being resumed (null = fresh appointment)
  const [activeFollowUpId, setActiveFollowUpId] = useState(null)
  // Badge count for sidebar — updated on save/delete
  const [followUpCount,    setFollowUpCount]    = useState(loadFollowUpCount)

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

  // ── New Appointment ────────────────────────────────────────────────────────
  // If activeFollowUpId is set and we're on the summary screen, the agent just
  // sold a follow-up client — remove them from follow_up_appointments.
  function handleNewAppointment() {
    if (activeFollowUpId && appScreen === 'summary') {
      try {
        const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
        const updated  = existing.filter(r => r.id !== activeFollowUpId)
        localStorage.setItem('follow_up_appointments', JSON.stringify(updated))
        setFollowUpCount(updated.length)
      } catch {}
    }
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
    setShowFollowUps(false)
    setEditingClientId(null)
    setCancelContext('dashboard')
    setActiveFollowUpId(null)
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
        beneficiaries:   clientRecord.beneficiaries?.length
          ? clientRecord.beneficiaries
          : clientRecord.beneficiaryName
            ? [{ name: clientRecord.beneficiaryName, relationship: '', percentage: '100' }]
            : [{ name: '', relationship: '', percentage: '100' }],
        tobacco:         clientRecord.tobacco          || false,
        tobaccoType:     '',
        heightFt: '5', heightIn: '6', weight: '',
      },
      conditions:      {},
      medications:     [],
      financial: {
        occupation: '', income: '', ssi: '', bills: '',
        feDesiredCoverage: '',
        finalDisposition: '',
        hasMortgage: false,
        mortgageBalance: '', mortgagePayment: '', yearsRemaining: '', homeValue: '', equity: '',
        hasInsurance: false,
        insCompany: '', insCoverage: '', insPremium: '', insYear: '',
        k401: '', stocks: '', savings: '',
        notes: '',
      },
      monthlyExpenses: { ...INIT_BILLS },
    }
    setFormData(preFilledForm)
    setEditingClientId(clientRecord.id)
    setCancelContext('clients')      // Cancel returns to Clients, no warning
    setActiveFollowUpId(null)
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setShowDashboard(false)
    setShowClients(false)
    setShowFollowUps(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Resume a follow-up client (pre-fill entire saved formData) ─────────────
  function handleResumeFollowUp(record) {
    // Update lastContacted in localStorage immediately
    try {
      const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
      const updated  = existing.map(r =>
        r.id === record.id ? { ...r, lastContacted: new Date().toISOString() } : r
      )
      localStorage.setItem('follow_up_appointments', JSON.stringify(updated))
    } catch {}

    setFormData(record.formData ? { ...record.formData } : initForm())
    setActiveFollowUpId(record.id)
    setCancelContext('followups')    // Cancel returns to Follow Up, no warning
    setEditingClientId(null)
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setShowDashboard(false)
    setShowClients(false)
    setShowFollowUps(false)
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
  // Behavior differs by context:
  //   'clients'   → return to Clients, no warning (data saved in Clients)
  //   'followups' → return to Follow Up, no warning (data saved in Follow Up)
  //   'dashboard' → confirm dialog, return to Dashboard on confirm
  function handleCancel() {
    if (cancelContext === 'clients') {
      setFormData(initForm())
      setResults(null)
      setStep(1)
      setAppScreen(null)
      setSelectedApp(null)
      setDeclinedKeys(new Set())
      setReqWarning([])
      setShowFollowUp(false)
      setActiveFollowUpId(null)
      setCancelContext('dashboard')
      setShowClients(true)
      setShowDashboard(false)
      setShowFollowUps(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (cancelContext === 'followups') {
      setFormData(initForm())
      setResults(null)
      setStep(1)
      setAppScreen(null)
      setSelectedApp(null)
      setDeclinedKeys(new Set())
      setReqWarning([])
      setShowFollowUp(false)
      setActiveFollowUpId(null)
      setCancelContext('dashboard')
      setShowFollowUps(true)
      setShowDashboard(false)
      setShowClients(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      if (window.confirm('Are you sure you want to cancel? All appointment data will be lost.')) {
        setFormData(initForm())
        setResults(null)
        setStep(1)
        setAppScreen(null)
        setSelectedApp(null)
        setDeclinedKeys(new Set())
        setReqWarning([])
        setShowFollowUp(false)
        setActiveFollowUpId(null)
        setCancelContext('dashboard')
        setShowDashboard(true)
        setShowClients(false)
        setShowFollowUps(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  // ── Save to Follow Up from Appointment Summary ─────────────────────────────
  function handleSaveApptToFollowUp({ note, priority, nextContactDate }) {
    try {
      const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
      const newNote  = { date: new Date().toISOString(), text: note || '' }
      const quoteSnapshot = selectedApp ? {
        carrier:        selectedApp.rec?.name || null,
        product:        selectedApp.rec?.product?.name || selectedApp.rec?.productLabel || null,
        coverage:       selectedApp.face || null,
        monthlyPremium: selectedApp.monthlyPremium ? parseFloat(selectedApp.monthlyPremium) : (selectedApp.rec?.monthlyPremium?.mid || null),
        planCode:       selectedApp.planCode || null,
        dateEnforced:   selectedApp.dateEnforced || null,
        tier:           selectedApp.rec?.tier || null,
        commissionPct:  selectedApp.rec?.commissionPct || null,
      } : null
      const record = {
        id:              Date.now(),
        savedAt:         new Date().toISOString(),
        currentStep:     7,
        agentName:       agentInfo?.name || '',
        agentLevel:      agentInfo?.contractLevel || '',
        formData:        { ...formData },
        priority,
        nextContactDate,
        lastContacted:   null,
        notes:           [newNote],
        quoteSnapshot,
      }
      existing.push(record)
      localStorage.setItem('follow_up_appointments', JSON.stringify(existing))
      setFollowUpCount(existing.length)
    } catch (e) {
      console.error('Failed to save follow-up from summary:', e)
    }
    setFormData(initForm())
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setActiveFollowUpId(null)
    setCancelContext('dashboard')
    setShowDashboard(true)
    setShowClients(false)
    setShowFollowUps(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Not Sold / Follow Up ───────────────────────────────────────────────────
  function handleOpenFollowUp() {
    setShowFollowUp(true)
  }

  function handleSaveFollowUp({ note, priority, nextContactDate }) {
    // Capture context before resetting — determines where to return after save
    const returnToFollowUps = cancelContext === 'followups'

    try {
      const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
      const newNote  = { date: new Date().toISOString(), text: note || '' }

      // Snapshot the top approved carrier if results exist (agent reached Step 7)
      const topRec = results?.approved?.[0] ?? null
      const quoteSnapshot = topRec ? {
        carrier:        topRec.name,
        product:        topRec.product?.name || topRec.productLabel || null,
        coverage:       topRec.recommendedFace || null,
        monthlyPremium: topRec.monthlyPremium?.mid || null,
      } : null

      if (activeFollowUpId) {
        // Update the existing follow-up record — add note to timeline
        const updated = existing.map(r => {
          if (r.id !== activeFollowUpId) return r
          return {
            ...r,
            priority,
            nextContactDate,
            lastContacted: new Date().toISOString(),
            notes:         [newNote, ...(r.notes || [])],
            formData:      { ...formData },
            quoteSnapshot: quoteSnapshot ?? r.quoteSnapshot ?? null,
          }
        })
        localStorage.setItem('follow_up_appointments', JSON.stringify(updated))
        setFollowUpCount(updated.length)
      } else {
        // Create a new follow-up record
        const record = {
          id:              Date.now(),
          savedAt:         new Date().toISOString(),
          currentStep:     step,
          agentName:       agentInfo?.name || '',
          agentLevel:      agentInfo?.contractLevel || '',
          formData:        { ...formData },
          priority,
          nextContactDate,
          lastContacted:   null,
          notes:           [newNote],
          quoteSnapshot,
        }
        existing.push(record)
        localStorage.setItem('follow_up_appointments', JSON.stringify(existing))
        setFollowUpCount(existing.length)
      }
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
    setActiveFollowUpId(null)
    setCancelContext('dashboard')
    // Return to Follow Up section if that's where the agent came from; otherwise Dashboard
    setShowFollowUps(returnToFollowUps)
    setShowDashboard(!returnToFollowUps)
    setShowClients(false)
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

  const sidebarActiveView  = showFollowUps ? 'followups' : showEarnings ? 'earnings' : showClients ? 'clients' : showDashboard ? 'dashboard' : 'appointment'
  const sidebarCurrentStep = (!showDashboard && !showClients && !showFollowUps && !showEarnings && appScreen === null && step >= 1) ? step : null

  function handleGoToClients() {
    setShowClients(true)
    setShowDashboard(false)
    setShowFollowUps(false)
    setShowEarnings(false)
    setHighlightClientId(null)
    setAppScreen(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Called when user clicks a dot on the Dashboard chart — navigate to client card
  function handleClientClick(clientId) {
    setHighlightClientId(clientId)
    setShowClients(true)
    setShowDashboard(false)
    setShowFollowUps(false)
    setShowEarnings(false)
    setAppScreen(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleGoToFollowUps() {
    setShowFollowUps(true)
    setShowDashboard(false)
    setShowClients(false)
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
    if (view === 'dashboard')   { setShowDashboard(true);  setShowClients(false); setShowFollowUps(false); setShowEarnings(false); setAppScreen(null) }
    if (view === 'clients')     { setShowClients(true);    setShowDashboard(false); setShowFollowUps(false); setShowEarnings(false); setHighlightClientId(null); setAppScreen(null) }
    if (view === 'followups')   { setShowFollowUps(true);  setShowDashboard(false); setShowClients(false);  setShowEarnings(false); setAppScreen(null) }
    if (view === 'earnings')    { setShowEarnings(true);   setShowDashboard(false); setShowClients(false);  setShowFollowUps(false); setAppScreen(null) }
    if (view === 'appointment') { handleNewAppointment() }
  }

  // ── Earnings ───────────────────────────────────────────────────────────────
  if (showEarnings && appScreen === null) {
    return (
      <div className="app">
        <Sidebar
          agentInfo={agentInfo}
          activeView={sidebarActiveView}
          currentStep={sidebarCurrentStep}
          onNavigate={handleSidebarNavigate}
          onChangeAgent={handleChangeAgent}
          followUpCount={followUpCount}
        />
        <div className="app-body">
          <AppHeader title="Earnings" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <Earnings onGoToClients={handleGoToClients} />
          </main>
        </div>
      </div>
    )
  }

  // ── Follow Up page ─────────────────────────────────────────────────────────
  if (showFollowUps && appScreen === null) {
    return (
      <div className="app">
        <Sidebar
          agentInfo={agentInfo}
          activeView={sidebarActiveView}
          currentStep={sidebarCurrentStep}
          onNavigate={handleSidebarNavigate}
          onChangeAgent={handleChangeAgent}
          followUpCount={followUpCount}
        />
        <div className="app-body">
          <AppHeader title="Follow Up" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <FollowUp
              onResumeFollowUp={handleResumeFollowUp}
              onNewAppointment={handleNewAppointment}
              onCountChange={setFollowUpCount}
            />
          </main>
        </div>
      </div>
    )
  }

  // ── Clients ────────────────────────────────────────────────────────────────
  if (showClients && appScreen === null) {
    return (
      <div className="app">
        <Sidebar
          agentInfo={agentInfo}
          activeView={sidebarActiveView}
          currentStep={sidebarCurrentStep}
          onNavigate={handleSidebarNavigate}
          onChangeAgent={handleChangeAgent}
          followUpCount={followUpCount}
        />
        <div className="app-body">
          <AppHeader title="Clients" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <Clients
              onEdit={handleEditClient}
              onNewAppointment={handleNewAppointment}
              highlightClientId={highlightClientId}
              onHighlightClear={() => setHighlightClientId(null)}
            />
          </main>
        </div>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  if (showDashboard && appScreen === null) {
    return (
      <div className="app">
        <Sidebar
          agentInfo={agentInfo}
          activeView={sidebarActiveView}
          currentStep={sidebarCurrentStep}
          onNavigate={handleSidebarNavigate}
          onChangeAgent={handleChangeAgent}
          followUpCount={followUpCount}
        />
        <div className="app-body">
          <AppHeader title="Dashboard" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <Dashboard
              agentInfo={agentInfo}
              onNewAppointment={handleNewAppointment}
              onChangeAgent={handleChangeAgent}
              onGoToClients={handleGoToClients}
              onClientClick={handleClientClick}
            />
          </main>
        </div>
      </div>
    )
  }

  // ── Application review ─────────────────────────────────────────────────────
  if (appScreen === 'application' && selectedApp) {
    return (
      <div className="app">
        <Sidebar
          agentInfo={agentInfo}
          activeView={sidebarActiveView}
          currentStep={sidebarCurrentStep}
          onNavigate={handleSidebarNavigate}
          onChangeAgent={handleChangeAgent}
          followUpCount={followUpCount}
        />
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
        <Sidebar
          agentInfo={agentInfo}
          activeView={sidebarActiveView}
          currentStep={sidebarCurrentStep}
          onNavigate={handleSidebarNavigate}
          onChangeAgent={handleChangeAgent}
          followUpCount={followUpCount}
        />
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
              onSaveToFollowUp={handleSaveApptToFollowUp}
            />
          </main>
        </div>
      </div>
    )
  }

  // ── Main step flow ─────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Sidebar
        agentInfo={agentInfo}
        activeView={sidebarActiveView}
        currentStep={sidebarCurrentStep}
        onNavigate={handleSidebarNavigate}
        onChangeAgent={handleChangeAgent}
        followUpCount={followUpCount}
      />
      <div className="app-body">
        <AppHeader title={`Step ${step} of 7`} agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
        <main className="app-main">
          {step <= 7 && (
            <ProgressBar currentStep={step} labels={STEP_LABELS} onStepClick={handleStepClick} hasResults={!!results} />
          )}

          {/* Required fields warning */}
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
