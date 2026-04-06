function IllustrationHouse({ active }) {
  const accent  = active ? '#a78bfa' : '#555555'
  const fill    = active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)'
  const stroke  = active ? '#a78bfa' : '#444444'
  return (
    <svg width="72" height="64" viewBox="0 0 72 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground */}
      <rect x="8" y="54" width="56" height="3" rx="1.5" fill={active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)'} />
      {/* Main house body */}
      <rect x="14" y="32" width="44" height="22" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* Roof */}
      <path d="M10 34L36 12L62 34" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M36 12L36 34" stroke={stroke} strokeWidth="1" strokeDasharray="2 2" />
      {/* Door */}
      <rect x="30" y="40" width="12" height="14" rx="1.5" fill={active ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'} stroke={stroke} strokeWidth="1.2" />
      <circle cx="39.5" cy="47" r="1" fill={accent} />
      {/* Left window */}
      <rect x="17" y="37" width="9" height="8" rx="1" fill={active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'} stroke={stroke} strokeWidth="1.2" />
      <line x1="21.5" y1="37" x2="21.5" y2="45" stroke={stroke} strokeWidth="0.8" />
      <line x1="17" y1="41" x2="26" y2="41" stroke={stroke} strokeWidth="0.8" />
      {/* Right window */}
      <rect x="46" y="37" width="9" height="8" rx="1" fill={active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'} stroke={stroke} strokeWidth="1.2" />
      <line x1="50.5" y1="37" x2="50.5" y2="45" stroke={stroke} strokeWidth="0.8" />
      <line x1="46" y1="41" x2="55" y2="41" stroke={stroke} strokeWidth="0.8" />
      {/* Chimney */}
      <rect x="50" y="16" width="7" height="10" rx="1" fill={fill} stroke={stroke} strokeWidth="1.2" />
      {/* Smoke puffs */}
      <circle cx="52" cy="13" r="2" fill={active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'} />
      <circle cx="55" cy="10" r="1.5" fill={active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.05)'} />
    </svg>
  )
}

function IllustrationHeart({ active }) {
  const accent = active ? '#a78bfa' : '#555555'
  const fill   = active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.05)'
  const stroke = active ? '#a78bfa' : '#444444'
  return (
    <svg width="72" height="64" viewBox="0 0 72 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Large heart */}
      <path
        d="M36 52C36 52 12 38 12 22C12 15.37 17.37 10 24 10C28.2 10 31.9 12.2 34 15.5C36.1 12.2 39.8 10 44 10C50.63 10 56 15.37 56 22C56 38 36 52 36 52Z"
        fill={fill} stroke={accent} strokeWidth="1.8" strokeLinejoin="round"
      />
      {/* Inner pulse line */}
      <path d="M20 28H27L30 22L33 34L36 26L39 30L41 28H52" stroke={active ? '#c4b5fd' : '#3a3a3a'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Small family dots */}
      <circle cx="28" cy="44" r="3.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <circle cx="36" cy="47" r="3.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <circle cx="44" cy="44" r="3.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
      {/* Connecting arc under */}
      <path d="M25 47C25 47 30 52 36 52C42 52 47 47 47 47" stroke={stroke} strokeWidth="1" strokeDasharray="2 2" fill="none" />
    </svg>
  )
}

function IllustrationShield({ active }) {
  const accent = active ? '#a78bfa' : '#555555'
  const fill   = active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.05)'
  const stroke = active ? '#a78bfa' : '#444444'
  return (
    <svg width="72" height="64" viewBox="0 0 72 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield body */}
      <path
        d="M36 8L14 16V34C14 45 24 54 36 58C48 54 58 45 58 34V16L36 8Z"
        fill={fill} stroke={accent} strokeWidth="1.8" strokeLinejoin="round"
      />
      {/* Inner shield */}
      <path
        d="M36 14L20 20.5V34C20 42 27.5 49 36 52C44.5 49 52 42 52 34V20.5L36 14Z"
        fill={active ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)'} stroke={stroke} strokeWidth="1" strokeLinejoin="round"
      />
      {/* Star / emblem */}
      <path
        d="M36 22L38.4 29.2H46L40 33.6L42.4 40.8L36 36.4L29.6 40.8L32 33.6L26 29.2H33.6L36 22Z"
        fill={active ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'} stroke={accent} strokeWidth="1" strokeLinejoin="round"
      />
      {/* Side laurels / lines */}
      <path d="M10 32C10 32 11 28 14 26" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      <path d="M10 36C10 36 11 40 14 42" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      <path d="M62 32C62 32 61 28 58 26" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      <path d="M62 36C62 36 61 40 58 42" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

const LEAD_TYPES = [
  {
    id:          'mortgage_protection',
    Illustration: IllustrationHouse,
    title:       'Mortgage Protection',
    desc:        "Term life matched to the client's mortgage payoff date. Protects the home if the client passes away.",
  },
  {
    id:          'final_expense',
    Illustration: IllustrationHeart,
    title:       'Final Expense',
    desc:        'Whole life for burial, medical bills, and legacy. Ages 40–89. $2k–$50k. No exam required.',
  },
  {
    id:          'veteran',
    Illustration: IllustrationShield,
    title:       'Veteran',
    desc:        'Term or permanent coverage for veterans and active duty. Veteran-friendly underwriting. No war exclusions.',
  },
]

export default function Step1LeadType({ value, onChange, onNext }) {
  return (
    <div className="animate-in">
      <div className="step-header">
        <div className="step-eyebrow">Step 1 of 7</div>
        <h1 className="step-title">What type of appointment is this?</h1>
        <p className="step-subtitle">
          Select a lead type to load the correct carriers, products, and underwriting logic.
        </p>
      </div>

      <div className="lead-grid">
        {LEAD_TYPES.map(lt => {
          const active = value === lt.id
          return (
            <div
              key={lt.id}
              role="button"
              tabIndex={0}
              onClick={() => onChange(lt.id)}
              onKeyDown={e => e.key === 'Enter' && onChange(lt.id)}
              className={`lead-card${active ? ' selected' : ''}`}
            >
              <span className="lead-icon">
                <lt.Illustration active={active} />
              </span>
              <div className="lead-title">{lt.title}</div>
              <div className="lead-desc">{lt.desc}</div>
            </div>
          )
        })}
      </div>

      <div className="step-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onNext} disabled={!value}>
          Continue
        </button>
      </div>
    </div>
  )
}
