function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 6 5 9 10 3"/>
    </svg>
  )
}

export default function ProgressBar({ currentStep, labels, onStepClick, hasResults }) {
  return (
    <div className="progress-wrapper">
      <div className="progress-track">
        {labels.map((label, i) => {
          const num      = i + 1
          const isDone   = num < currentStep
          const isActive = num === currentStep
          const isStep7  = num === 7
          const isLocked = isStep7 && !hasResults

          let stepClass = 'progress-step'
          if (isDone)    stepClass += ' completed'
          if (isActive)  stepClass += ' active'
          if (isLocked)  stepClass += ' locked'
          if (!isLocked) stepClass += ' clickable'

          return (
            <div
              key={label}
              className={stepClass}
              onClick={() => !isLocked && onStepClick && onStepClick(num)}
              role="button"
              tabIndex={isLocked ? -1 : 0}
              aria-disabled={isLocked}
              onKeyDown={e => {
                if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onStepClick && onStepClick(num)
                }
              }}
            >
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
