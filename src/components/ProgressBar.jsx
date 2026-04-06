function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 6 5 9 10 3"/>
    </svg>
  )
}

export default function ProgressBar({ currentStep, labels }) {
  return (
    <div className="progress-wrapper">
      <div className="progress-track">
        {labels.map((label, i) => {
          const num      = i + 1
          const isDone   = num < currentStep
          const isActive = num === currentStep
          let stepClass  = 'progress-step'
          if (isDone)   stepClass += ' completed'
          if (isActive) stepClass += ' active'
          return (
            <div key={label} className={stepClass}>
              <div className="progress-dot">
                {isDone ? <CheckIcon /> : num}
              </div>
              <span className="progress-label">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
