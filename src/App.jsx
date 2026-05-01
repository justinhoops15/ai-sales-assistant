import { useState, useRef, useEffect } from 'react'
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

/** Generate a stable unique ID for each appointment session */
function genSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Save a record to all_appointments_reached_results when step 7 produces
 * carrier recommendations. This tracks appointments regardless of final outcome
 * (sold, follow-up, or cancelled). Idempotent — same sessionId never saved twice.
 */
function saveReachedResults(sessionId, formData) {
  try {
    const existing = JSON.parse(localStorage.getItem('all_appointments_reached_results') || '[]')
    if (existing.some(r => r.sessionId === sessionId)) return // already logged this session
    const clientName = [formData.clientInfo?.firstName, formData.clientInfo?.lastName]
      .filter(Boolean).join(' ') || ''
    existing.push({ sessionId, savedAt: new Date().toISOString(), clientName })
    localStorage.setItem('all_appointments_reached_results', JSON.stringify(existing))
  } catch (e) {
    console.error('[Appointments] Failed to save reached-results record:', e)
  }
}

function getRequiredMissing(formData) {
  const missing = []
  if (!formData.leadType)              missing.push('Lead Type (Step 1)')
  if (!formData.clientInfo?.age)       missing.push('Age (Step 2)')
  if (!formData.clientInfo?.sex)       missing.push('Sex (Step 2)')
  if (!formData.clientInfo?.state)     missing.push('State (Step 2)')
  const isFEorVet = formData.leadType === 'final_expense' || formData.leadType === 'veteran'
  if (isFEorVet && !formData.financial?.finalDisposition) {
    missing.push('Method of Final Disposition (Step 5)')
  }
  return missing
}

// ── Appointment Flow Modal Wrapper ─────────────────────────────────────────
// Provides the overlay container with Escape-key close. Step content is children.
function AppointmentFlowModal({ onClose, children }) {
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="apmt-overlay" onClick={onClose}>
      <div className="apmt-modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [agentInfo,          setAgentInfo]          = useState(loadAgent)
  const [showDashboard,      setShowDashboard]      = useState(true)
  const [showClients,        setShowClients]        = useState(false)
  const [showFollowUps,      setShowFollowUps]      = useState(false)
  const [showEarnings,       setShowEarnings]       = useState(false)
  const [highlightClientId,  setHighlightClientId]  = useState(null)
  const [step,               setStep]               = useState(1)
  const [formData,           setFormData]           = useState(initForm)
  const [results,            setResults]            = useState(null)
  const [appScreen,          setAppScreen]          = useState(null)
  const [selectedApp,        setSelectedApp]        = useState(null)
  const [declinedKeys,       setDeclinedKeys]       = useState(() => new Set())
  const [showFollowUp,       setShowFollowUp]       = useState(false)
  const [reqWarning,         setReqWarning]         = useState([])
  const [editingClientId,    setEditingClientId]    = useState(null)
  const [cancelContext,      setCancelContext]       = useState('dashboard')
  const [activeFollowUpId,   setActiveFollowUpId]   = useState(null)
  const [followUpCount,      setFollowUpCount]      = useState(loadFollowUpCount)
  // Appointment flow overlay — opened by Edit (Clients) and Follow Up (FollowUp)
  const [appointmentModal,   setAppointmentModal]   = useState(false)
  // Bump to force Clients / FollowUp to remount and reload data after modal closes
  const [refreshToken,       setRefreshToken]       = useState(0)
  // Ref to the modal body div — used for scrollTop inside modal
  const modalBodyRef = useRef(null)
  // Nav warning — shown when user tries to leave active new appointment flow
  const [navWarning,         setNavWarning]         = useState(false)
  const [navTarget,          setNavTarget]          = useState(null)
  // Unique ID for this appointment session — used to track step-7 reach in localStorage
  const [apptSessionId,      setApptSessionId]      = useState(genSessionId)
  // Prevent saving the same session to all_appointments_reached_results more than once
  const resultsLoggedRef = useRef(false)

  // ── Scroll helper ──────────────────────────────────────────────────────────
  // When the appointment modal is open, scroll its body. Otherwise scroll window.
  function scrollTop(behavior = 'smooth') {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0
    } else {
      window.scrollTo({ top: 0, behavior })
    }
  }

  // ── Reset all appointment flow state and close modal ───────────────────────
  function closeAppointmentModal() {
    setAppointmentModal(false)
    setFormData(initForm())
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setEditingClientId(null)
    setActiveFollowUpId(null)
    setCancelContext('dashboard')
    setApptSessionId(genSessionId())
    resultsLoggedRef.current = false
    setRefreshToken(t => t + 1)
  }

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
        scrollTop()
        return
      }
      setReqWarning([])
      const out = runUnderwriting(formData, agentInfo?.contractLevel ?? 100)
      setResults(out)
      // Track that this appointment reached step 7 with carrier recommendations
      if (out.approved.length > 0 && !resultsLoggedRef.current) {
        saveReachedResults(apptSessionId, formData)
        resultsLoggedRef.current = true
      }
    } else {
      setReqWarning([])
    }
    setStep(s => s + 1)
    scrollTop()
  }

  function handleBack() {
    setReqWarning([])
    if (step === 1) {
      if (appointmentModal) {
        closeAppointmentModal()
        return
      }
      setShowDashboard(true)
    } else {
      setStep(s => s - 1)
    }
    scrollTop()
  }

  // ── New Appointment ────────────────────────────────────────────────────────
  function handleNewAppointment() {
    if (activeFollowUpId && appScreen === 'summary') {
      try {
        const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
        const updated  = existing.filter(r => r.id !== activeFollowUpId)
        localStorage.setItem('follow_up_appointments', JSON.stringify(updated))
        setFollowUpCount(updated.length)
      } catch {}
    }
    // Reset appointment state
    setFormData(initForm())
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setEditingClientId(null)
    setCancelContext('dashboard')
    setActiveFollowUpId(null)
    // Fresh session ID for the new appointment so step-7 tracking starts clean
    setApptSessionId(genSessionId())
    resultsLoggedRef.current = false
    // Always leave current page view and go to step flow
    setAppointmentModal(false)
    setShowDashboard(false)
    setShowClients(false)
    setShowFollowUps(false)
    setShowEarnings(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Edit a client (opens modal overlay instead of navigating away) ─────────
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
    setCancelContext('clients')
    setActiveFollowUpId(null)
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    // Open modal overlay — Clients page stays in background
    setAppointmentModal(true)
  }

  // ── Resume a follow-up (opens modal overlay instead of navigating away) ────
  function handleResumeFollowUp(record) {
    try {
      const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
      const updated  = existing.map(r =>
        r.id === record.id ? { ...r, lastContacted: new Date().toISOString() } : r
      )
      localStorage.setItem('follow_up_appointments', JSON.stringify(updated))
    } catch {}

    setFormData(record.formData ? { ...record.formData } : initForm())
    setActiveFollowUpId(record.id)
    setCancelContext('followups')
    setEditingClientId(null)
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    // Open modal overlay — FollowUp page stays in background
    setAppointmentModal(true)
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
    scrollTop()
  }

  function handleApplicationDeclined() {
    setDeclinedKeys(prev => new Set([...prev, selectedApp.rec.resultKey]))
    setAppScreen(null)
    setSelectedApp(null)
    scrollTop()
  }

  // ── Cancel appointment ─────────────────────────────────────────────────────
  function handleCancel() {
    // When in appointment modal (from Edit or Follow Up), just close it
    if (appointmentModal) {
      closeAppointmentModal()
      return
    }
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
      // Show the nav-warning modal instead of window.confirm
      setNavTarget('dashboard')
      setNavWarning(true)
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
        apptSessionId:   apptSessionId,
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
    // Reset flow state
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

    if (appointmentModal) {
      // Close modal, stay on background page (Clients or FollowUps), refresh it
      setAppointmentModal(false)
      setRefreshToken(t => t + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Navigate to Follow Up section after saving from appointment summary
      setShowFollowUps(true)
      setShowDashboard(false)
      setShowClients(false)
      setShowEarnings(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Not Sold / Follow Up ───────────────────────────────────────────────────
  function handleOpenFollowUp() {
    setShowFollowUp(true)
  }

  function handleSaveFollowUp({ note, priority, nextContactDate }) {
    const returnToFollowUps = cancelContext === 'followups'

    try {
      const existing = JSON.parse(localStorage.getItem('follow_up_appointments') || '[]')
      const newNote  = { date: new Date().toISOString(), text: note || '' }
      const topRec = results?.approved?.[0] ?? null
      const quoteSnapshot = topRec ? {
        carrier:        topRec.name,
        product:        topRec.product?.name || topRec.productLabel || null,
        coverage:       topRec.recommendedFace || null,
        monthlyPremium: topRec.monthlyPremium?.mid || null,
      } : null

      if (activeFollowUpId) {
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
        const record = {
          id:              Date.now(),
          apptSessionId:   apptSessionId,
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

    // Reset flow state
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

    if (appointmentModal) {
      // Close modal, stay on background page, refresh it
      setAppointmentModal(false)
      setRefreshToken(t => t + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setShowFollowUps(returnToFollowUps)
      setShowDashboard(!returnToFollowUps)
      setShowClients(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // ── Guard: agent setup ─────────────────────────────────────────────────────
  if (!agentInfo) {
    return <AgentSetup onComplete={handleAgentSetup} />
  }

  const clientName = [formData.clientInfo.firstName, formData.clientInfo.lastName]
    .filter(Boolean).join(' ') || null

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
    if (num === 7 && !results) {
      // Auto-run underwriting when jumping to Step 7 without results
      const missing = getRequiredMissing(formData)
      if (missing.length > 0) {
        setReqWarning(missing)
        scrollTop()
        return
      }
      setReqWarning([])
      const out = runUnderwriting(formData, agentInfo?.contractLevel ?? 100)
      setResults(out)
      // Track that this appointment reached step 7 with carrier recommendations
      if (out.approved.length > 0 && !resultsLoggedRef.current) {
        saveReachedResults(apptSessionId, formData)
        resultsLoggedRef.current = true
      }
    } else {
      setReqWarning([])
    }
    setStep(num)
    setAppScreen(null)
    scrollTop()
  }

  // True when user is in a new appointment flow (not editing from clients/followups)
  function isInNewApptFlow() {
    return !showDashboard && !showClients && !showFollowUps && !showEarnings && !appointmentModal
  }

  function doNavigate(view) {
    if (view === 'dashboard')   { setShowDashboard(true);  setShowClients(false); setShowFollowUps(false); setShowEarnings(false); setAppScreen(null) }
    if (view === 'clients')     { setShowClients(true);    setShowDashboard(false); setShowFollowUps(false); setShowEarnings(false); setHighlightClientId(null); setAppScreen(null) }
    if (view === 'followups')   { setShowFollowUps(true);  setShowDashboard(false); setShowClients(false);  setShowEarnings(false); setAppScreen(null) }
    if (view === 'earnings')    { setShowEarnings(true);   setShowDashboard(false); setShowClients(false);  setShowFollowUps(false); setAppScreen(null) }
    if (view === 'appointment') { handleNewAppointment() }
  }

  function handleSidebarNavigate(view) {
    if (isInNewApptFlow()) {
      setNavTarget(view)
      setNavWarning(true)
      return
    }
    doNavigate(view)
  }

  function confirmNavLeave() {
    const dest = navTarget
    setNavWarning(false)
    setNavTarget(null)
    // Clear all appointment state
    setFormData(initForm())
    setResults(null)
    setStep(1)
    setAppScreen(null)
    setSelectedApp(null)
    setDeclinedKeys(new Set())
    setReqWarning([])
    setShowFollowUp(false)
    setEditingClientId(null)
    setActiveFollowUpId(null)
    setCancelContext('dashboard')
    doNavigate(dest)
  }

  // ── Required-fields warning banner (shared between modal and step flow) ────
  const reqWarningBanner = reqWarning.length > 0 && (
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
  )

  // ── Step flow JSX (used both in modal and in full-page render) ─────────────
  function renderStepContent() {
    if (appScreen === 'application' && selectedApp) {
      return (
        <ApplicationScreen
          application={selectedApp}
          clientName={clientName}
          onPreApproved={({ planCode, monthlyPremium, dateEnforced }) => {
            setSelectedApp(prev => ({ ...prev, planCode, monthlyPremium, dateEnforced }))
            setAppScreen('summary')
            scrollTop()
          }}
          onDeclined={handleApplicationDeclined}
          onBack={() => { setAppScreen(null); scrollTop() }}
        />
      )
    }
    if (appScreen === 'summary' && selectedApp) {
      return (
        <AppointmentSummary
          application={selectedApp}
          clientName={clientName}
          formData={formData}
          agentInfo={agentInfo}
          editingClientId={editingClientId}
          apptSessionId={apptSessionId}
          onBack={() => { setAppScreen('application'); scrollTop() }}
          onGoToClients={handleGoToClients}
          onSaveToFollowUp={handleSaveApptToFollowUp}
        />
      )
    }
    return (
      <>
        {reqWarningBanner}
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
      </>
    )
  }

  // ── APPOINTMENT MODAL — overlays Clients or FollowUp page ─────────────────
  if (appointmentModal) {
    const bgTitle = cancelContext === 'clients' ? 'Clients' : 'Follow Up'

    // What label to show in the modal top bar
    let modalStepLabel = null
    if (appScreen === 'application') modalStepLabel = 'Application Review'
    else if (appScreen === 'summary') modalStepLabel = 'Appointment Summary'

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
          {/* No agent badge during appointment flow */}
          <main className="app-main">
            {cancelContext === 'clients' ? (
              <Clients
                key={refreshToken}
                onEdit={handleEditClient}
                onNewAppointment={handleNewAppointment}
                highlightClientId={highlightClientId}
                onHighlightClear={() => setHighlightClientId(null)}
              />
            ) : (
              <FollowUp
                key={refreshToken}
                onResumeFollowUp={handleResumeFollowUp}
                onNewAppointment={handleNewAppointment}
                onCountChange={setFollowUpCount}
              />
            )}
          </main>
        </div>

        {/* Full-screen appointment flow overlay */}
        <AppointmentFlowModal onClose={closeAppointmentModal}>
          {/* Modal top bar: progress bar (steps) or screen title + close button */}
          <div className="apmt-modal-top">
            <div className="apmt-modal-top-inner">
              {appScreen === null && (
                <ProgressBar
                  currentStep={step}
                  labels={STEP_LABELS}
                  onStepClick={handleStepClick}
                  hasResults={!!results || !!editingClientId}
                />
              )}
              {modalStepLabel && (
                <span className="apmt-screen-label">{modalStepLabel}</span>
              )}
            </div>
            <button className="apmt-close-btn" onClick={closeAppointmentModal} title="Close (Esc)">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="4" x2="14" y2="14"/>
                <line x1="14" y1="4" x2="4" y2="14"/>
              </svg>
            </button>
          </div>

          {/* Scrollable step content */}
          <div className="apmt-modal-body" ref={modalBodyRef}>
            {renderStepContent()}
          </div>
        </AppointmentFlowModal>

        {/* FollowUpModal sits above appointment modal */}
        {showFollowUp && (
          <FollowUpModal
            onSave={handleSaveFollowUp}
            onBack={() => setShowFollowUp(false)}
          />
        )}
      </div>
    )
  }

  // ── Earnings ───────────────────────────────────────────────────────────────
  if (showEarnings) {
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
          <FloatingAgentBadge agentInfo={agentInfo} />
          <main className="app-main">
            <Earnings onGoToClients={handleGoToClients} />
          </main>
        </div>
      </div>
    )
  }

  // ── Follow Up page ─────────────────────────────────────────────────────────
  if (showFollowUps) {
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
          <FloatingAgentBadge agentInfo={agentInfo} />
          <main className="app-main">
            <FollowUp
              key={refreshToken}
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
  if (showClients) {
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
          <FloatingAgentBadge agentInfo={agentInfo} />
          <main className="app-main">
            <Clients
              key={refreshToken}
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
  if (showDashboard) {
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
          <FloatingAgentBadge agentInfo={agentInfo} />
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

  // ── Main step flow (full page — from Dashboard "New Appointment") ──────────
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
        {/* No agent badge during appointment flow */}
        <main className="app-main">
          {step <= 7 && appScreen === null && (
            <ProgressBar currentStep={step} labels={STEP_LABELS} onStepClick={handleStepClick} hasResults={!!results || !!editingClientId} />
          )}
          {renderStepContent()}
        </main>
      </div>

      {showFollowUp && (
        <FollowUpModal
          onSave={handleSaveFollowUp}
          onBack={() => setShowFollowUp(false)}
        />
      )}

      {/* Fix 7: Nav warning modal for new appointment flow */}
      {navWarning && (
        <NavWarningModal
          onStay={() => { setNavWarning(false); setNavTarget(null) }}
          onLeave={confirmNavLeave}
        />
      )}
    </div>
  )
}

// ── Floating Agent Badge (Fix 3) ──────────────────────────────────────────────
function FloatingAgentBadge({ agentInfo }) {
  return (
    <div className="floating-agent-badge">
      {agentInfo.agencyName && (
        <span className="fab-agency">{agentInfo.agencyName}</span>
      )}
      <span className="fab-name">{agentInfo.name}</span>
      <span className="fab-level">{agentInfo.contractLevel}%</span>
    </div>
  )
}

// ── Nav Warning Modal ────────────────────────────────────────────────────────
function NavWarningModal({ onStay, onLeave }) {
  return (
    <div className="db-overlay" onClick={onStay}>
      <div className="db-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="db-modal-head">
          <h2 className="db-modal-title">Leave Appointment?</h2>
          <button className="db-modal-close" onClick={onStay}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ fontSize: 14, color: '#888888', marginBottom: 22, lineHeight: 1.65 }}>
            Are you sure you want to leave? All unsaved appointment data will be lost.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="nav-warn-stay" onClick={onStay}>Stay</button>
            <button className="nav-warn-leave" onClick={onLeave}>Leave</button>
          </div>
        </div>
      </div>
    </div>
  )
}
