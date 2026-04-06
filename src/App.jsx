import { useState } from 'react'
import AgentSetup          from './components/AgentSetup.jsx'
import Dashboard           from './components/Dashboard.jsx'
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

export default function App() {
  const [agentInfo,      setAgentInfo]      = useState(loadAgent)
  const [showDashboard,  setShowDashboard]  = useState(true)
  const [step,           setStep]           = useState(1)
  const [formData,       setFormData]       = useState(initForm)
  const [results,        setResults]        = useState(null)
  const [appScreen,      setAppScreen]      = useState(null)  // null | 'application' | 'summary'
  const [selectedApp,    setSelectedApp]    = useState(null)
  const [declinedKeys,   setDeclinedKeys]   = useState(() => new Set())

  function handleAgentSetup(info) {
    localStorage.setItem('ffl_agent', JSON.stringify(info))
    setAgentInfo(info)
  }

  function update(key, val) {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  function handleNext() {
    if (step === 6) {
      const out = runUnderwriting(formData, agentInfo?.contractLevel ?? 100)
      setResults(out)
    }
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
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
    setShowDashboard(false)
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

  if (!agentInfo) {
    return <AgentSetup onComplete={handleAgentSetup} />
  }

  const clientName = [formData.clientInfo.firstName, formData.clientInfo.lastName]
    .filter(Boolean).join(' ') || null

  const filteredResults = results ? {
    approved: results.approved.filter(r => !declinedKeys.has(r.resultKey)),
    declined: results.declined,
  } : null

  const sidebarActiveView  = showDashboard ? 'dashboard' : 'appointment'
  const sidebarCurrentStep = (!showDashboard && appScreen === null && step >= 1) ? step : null

  function handleSidebarNavigate(view) {
    if (view === 'dashboard') { setShowDashboard(true); setAppScreen(null) }
    if (view === 'appointment') { handleNewAppointment() }
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  if (showDashboard && appScreen === null) {
    return (
      <div className="app">
        <Sidebar agentInfo={agentInfo} activeView={sidebarActiveView} currentStep={sidebarCurrentStep} onNavigate={handleSidebarNavigate} onChangeAgent={handleChangeAgent} />
        <div className="app-body">
          <AppHeader title="Dashboard" agentInfo={agentInfo} onChangeAgent={handleChangeAgent} />
          <main className="app-main">
            <Dashboard agentInfo={agentInfo} onNewAppointment={handleNewAppointment} onChangeAgent={handleChangeAgent} />
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
              onPreApproved={({ planCode, monthlyPremium }) => {
                setSelectedApp(prev => ({ ...prev, planCode, monthlyPremium }))
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
            <ProgressBar currentStep={step} labels={STEP_LABELS} />
          )}

          {step === 1 && (
            <Step1LeadType value={formData.leadType} onChange={v => update('leadType', v)} onNext={handleNext} />
          )}
          {step === 2 && (
            <Step2ClientInfo data={formData.clientInfo} onChange={v => update('clientInfo', v)} onNext={handleNext} onBack={handleBack} />
          )}
          {step === 3 && (
            <Step3Conditions data={formData.conditions} onChange={v => update('conditions', v)} onNext={handleNext} onBack={handleBack} />
          )}
          {step === 4 && (
            <Step4Medications data={formData.medications} conditions={formData.conditions} onChange={v => update('medications', v)} onNext={handleNext} onBack={handleBack} />
          )}
          {step === 5 && (
            <Step5Financial data={formData.financial} leadType={formData.leadType} onChange={v => update('financial', v)} onNext={handleNext} onBack={handleBack} />
          )}
          {step === 6 && (
            <Step6Bills data={formData.monthlyExpenses} onChange={v => update('monthlyExpenses', v)} monthlyIncome={Number(formData.financial.income) || 0} onNext={handleNext} onBack={handleBack} />
          )}
          {step === 7 && filteredResults && (
            <Step7Results results={filteredResults} formData={formData} agentInfo={agentInfo} clientName={clientName} onNewAppointment={handleNewAppointment} onBack={handleBack} onSelectApplication={handleSelectApplication} />
          )}
        </main>
      </div>
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
