import { useState, useEffect, useRef } from 'react'
import {
  LOGO_AMER, LOGO_TRANS, LOGO_AMAM, LOGO_MOO, LOGO_FORE,
  LOGO_AETNA, LOGO_ETHOS, LOGO_JH, LOGO_CORE, LOGO_PROS,
} from '../data/carrierLogos'
import { CONNECTOR_LOGOS } from '../data/connectorLogos'

// ── localStorage helpers ──────────────────────────────────────────────────────
function load(key, fallback) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback }
  catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Constants ─────────────────────────────────────────────────────────────────
const US_TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern Time (ET)'           },
  { value: 'America/Chicago',     label: 'Central Time (CT)'           },
  { value: 'America/Denver',      label: 'Mountain Time (MT)'          },
  { value: 'America/Phoenix',     label: 'Mountain Time – AZ (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)'           },
  { value: 'America/Anchorage',   label: 'Alaska Time (AKT)'           },
  { value: 'Pacific/Honolulu',    label: 'Hawaii Time (HT)'            },
]

const US_STATES_FULL = [
  { abbr: 'AL', name: 'Alabama'       }, { abbr: 'AK', name: 'Alaska'         },
  { abbr: 'AZ', name: 'Arizona'       }, { abbr: 'AR', name: 'Arkansas'       },
  { abbr: 'CA', name: 'California'    }, { abbr: 'CO', name: 'Colorado'       },
  { abbr: 'CT', name: 'Connecticut'   }, { abbr: 'DE', name: 'Delaware'       },
  { abbr: 'FL', name: 'Florida'       }, { abbr: 'GA', name: 'Georgia'        },
  { abbr: 'HI', name: 'Hawaii'        }, { abbr: 'ID', name: 'Idaho'          },
  { abbr: 'IL', name: 'Illinois'      }, { abbr: 'IN', name: 'Indiana'        },
  { abbr: 'IA', name: 'Iowa'          }, { abbr: 'KS', name: 'Kansas'         },
  { abbr: 'KY', name: 'Kentucky'      }, { abbr: 'LA', name: 'Louisiana'      },
  { abbr: 'ME', name: 'Maine'         }, { abbr: 'MD', name: 'Maryland'       },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan'       },
  { abbr: 'MN', name: 'Minnesota'     }, { abbr: 'MS', name: 'Mississippi'    },
  { abbr: 'MO', name: 'Missouri'      }, { abbr: 'MT', name: 'Montana'        },
  { abbr: 'NE', name: 'Nebraska'      }, { abbr: 'NV', name: 'Nevada'         },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey'     },
  { abbr: 'NM', name: 'New Mexico'    }, { abbr: 'NY', name: 'New York'       },
  { abbr: 'NC', name: 'North Carolina'}, { abbr: 'ND', name: 'North Dakota'   },
  { abbr: 'OH', name: 'Ohio'          }, { abbr: 'OK', name: 'Oklahoma'       },
  { abbr: 'OR', name: 'Oregon'        }, { abbr: 'PA', name: 'Pennsylvania'   },
  { abbr: 'RI', name: 'Rhode Island'  }, { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota'  }, { abbr: 'TN', name: 'Tennessee'      },
  { abbr: 'TX', name: 'Texas'         }, { abbr: 'UT', name: 'Utah'           },
  { abbr: 'VT', name: 'Vermont'       }, { abbr: 'VA', name: 'Virginia'       },
  { abbr: 'WA', name: 'Washington'    }, { abbr: 'WV', name: 'West Virginia'  },
  { abbr: 'WI', name: 'Wisconsin'     }, { abbr: 'WY', name: 'Wyoming'        },
]

const COMP_TIERS = [65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140,145]

const CARRIERS = [
  { id: 'TRANS', name: 'Transamerica',         logo: LOGO_TRANS },
  { id: 'AMER',  name: 'Americo',              logo: LOGO_AMER  },
  { id: 'AMAM',  name: 'American Amicable',    logo: LOGO_AMAM  },
  { id: 'MOO',   name: 'Mutual of Omaha',      logo: LOGO_MOO   },
  { id: 'FORE',  name: 'Foresters',            logo: LOGO_FORE  },
  { id: 'AETNA', name: 'Aetna',                logo: LOGO_AETNA },
  { id: 'ETHOS', name: 'Ethos',                logo: LOGO_ETHOS },
  { id: 'JH',    name: 'John Hancock',         logo: LOGO_JH    },
  { id: 'CORE',  name: 'Corebridge Financial', logo: LOGO_CORE  },
  { id: 'PROS',  name: 'Prosperity Life',      logo: LOGO_PROS  },
]

const MOCK_INVOICES = [
  { date: 'Apr 1, 2026',  total: '$49.00', status: 'Paid'       },
  { date: 'Mar 1, 2026',  total: '$49.00', status: 'Paid'       },
  { date: 'Feb 1, 2026',  total: '$49.00', status: 'Paid'       },
  { date: 'Jan 1, 2026',  total: '$49.00', status: 'Processing' },
  { date: 'Dec 1, 2025',  total: '$49.00', status: 'Failed'     },
  { date: 'Nov 1, 2025',  total: '$49.00', status: 'Paid'       },
]

const PLANS = [
  {
    id: 'solo', name: 'Solo', price: 'Coming Soon', seats: 1,
    features: ['1 agent seat', 'Full appointment flow', 'Underwriting engine', 'Clients & earnings tracking'],
  },
  {
    id: 'team', name: 'Team', price: 'Coming Soon', seats: 5, current: true,
    features: ['Up to 5 agent seats', 'Everything in Solo', 'Team dashboard', 'Downline production view'],
  },
  {
    id: 'agency', name: 'Agency', price: 'Coming Soon', seats: 25,
    features: ['Up to 25 agent seats', 'Everything in Team', 'Agency branding', 'Priority support'],
  },
]

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="settings-toast settings-toast-success">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 7 5.5 10.5 12 3.5"/>
      </svg>
      {message}
    </div>
  )
}

// ── Password Modal ────────────────────────────────────────────────────────────
function PasswordModal({ onClose }) {
  const [form,   setForm]   = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [done,   setDone]   = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.current)              errs.current = 'Required'
    if (form.next.length < 8)       errs.next    = 'Minimum 8 characters'
    if (form.next !== form.confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-head">
          <h3 className="settings-modal-title">Change Password</h3>
          <button className="settings-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        {done ? (
          <div className="settings-modal-success">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#4caf84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="14" cy="14" r="12"/><polyline points="8 14 12 18 20 10"/>
            </svg>
            <span>Password updated successfully</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="settings-modal-form" noValidate>
            <FieldWrap label="Current Password" error={errors.current}>
              <input type="password" className={`stg-input${errors.current ? ' stg-input-err' : ''}`}
                value={form.current} onChange={e => set('current', e.target.value)}
                placeholder="Enter current password" autoComplete="current-password" />
            </FieldWrap>
            <FieldWrap label="New Password" error={errors.next} hint="Minimum 8 characters">
              <input type="password" className={`stg-input${errors.next ? ' stg-input-err' : ''}`}
                value={form.next} onChange={e => set('next', e.target.value)}
                placeholder="Enter new password" autoComplete="new-password" />
            </FieldWrap>
            <FieldWrap label="Confirm New Password" error={errors.confirm}>
              <input type="password" className={`stg-input${errors.confirm ? ' stg-input-err' : ''}`}
                value={form.confirm} onChange={e => set('confirm', e.target.value)}
                placeholder="Confirm new password" autoComplete="new-password" />
            </FieldWrap>
            <div className="settings-modal-actions">
              <button type="button" className="stg-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="stg-btn-primary">Update Password</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Cancel Subscription Confirm Modal ─────────────────────────────────────────
function CancelConfirmModal({ onClose }) {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-head">
          <h3 className="settings-modal-title" style={{ color: '#e05c5c' }}>Cancel Subscription</h3>
          <button className="settings-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div className="settings-modal-form">
          <div className="stg-delete-warn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#e05c5c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2L18.5 17H1.5L10 2Z"/>
              <line x1="10" y1="8" x2="10" y2="12"/>
              <circle cx="10" cy="14.5" r="0.6" fill="#e05c5c" stroke="none"/>
            </svg>
            <span>Are you sure you want to cancel? You will lose access to all features and data at the end of your billing period.</span>
          </div>
          <div className="settings-modal-actions">
            <button type="button" className="stg-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="stg-btn-delete" onClick={onClose}>Confirm Cancellation</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Manage Plan Modal ─────────────────────────────────────────────────────────
function ManagePlanModal({ onClose }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (showCancelConfirm) {
    return <CancelConfirmModal onClose={() => setShowCancelConfirm(false)} />
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal stg-manage-plan-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-head">
          <h3 className="settings-modal-title">Manage Plan</h3>
          <button className="settings-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div className="stg-manage-plan-body">
          <div className="stg-plans-grid">
            {PLANS.map(plan => (
              <div key={plan.id} className={`stg-plan-col${plan.current ? ' stg-plan-current' : ''}`}>
                {plan.current && <div className="stg-plan-current-badge">Current Plan</div>}
                <div className="stg-plan-col-name">{plan.name}</div>
                <div className="stg-plan-col-price">Coming Soon</div>
                <div className="stg-plan-col-seats">{plan.seats === 1 ? '1 seat' : `Up to ${plan.seats} seats`}</div>
                <ul className="stg-plan-features">
                  {plan.features.map((f, i) => (
                    <li key={i}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 5.5 4 8.5 10 2.5"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <button
                    className={`${plan.id === 'agency' ? 'stg-btn-primary' : 'stg-btn-purple'} stg-plan-cta`}
                    onClick={() => alert('Stripe billing integration coming soon.')}>
                    {plan.id === 'agency' ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="stg-cancel-sub-row">
            <button type="button" className="stg-cancel-sub-link"
              onClick={() => setShowCancelConfirm(true)}>
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared FieldWrap ──────────────────────────────────────────────────────────
function FieldWrap({ label, error, hint, children, readOnly }) {
  return (
    <div className="stg-field">
      <label className="stg-label">
        {label}
        {readOnly && <span className="stg-read-tag">read-only</span>}
      </label>
      {children}
      {hint  && !error && <span className="stg-hint">{hint}</span>}
      {error && <span className="stg-error">{error}</span>}
    </div>
  )
}

// ── Verified Badge ────────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <span className="stg-verified">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#4caf84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1.5 5 4 7.5 8.5 2.5"/>
      </svg>
      Verified
    </span>
  )
}

function SectionHead({ children }) {
  return <div className="stg-card-head">{children}</div>
}

// ── Searchable States ─────────────────────────────────────────────────────────
function SearchableStates({ selectedAbbrs, onToggle }) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const wrapRef = useRef(null)

  const results = US_STATES_FULL.filter(s =>
    !selectedAbbrs.includes(s.abbr) &&
    (s.name.toLowerCase().includes(query.toLowerCase()) ||
     s.abbr.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 8)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(abbr) {
    onToggle(abbr)
    setQuery('')
  }

  return (
    <div className="stg-state-search-wrap" ref={wrapRef}>
      <div className="stg-state-search-input-row">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.4 }}>
          <circle cx="5.5" cy="5.5" r="4.5"/><line x1="9" y1="9" x2="12" y2="12"/>
        </svg>
        <input
          className="stg-state-search-input"
          type="text"
          placeholder="Search states…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (results.length > 0 || query.length > 0) && (
        <div className="stg-state-search-results">
          {results.length === 0 ? (
            <div className="stg-state-search-empty">No states match "{query}"</div>
          ) : results.map(s => (
            <button key={s.abbr} type="button" className="stg-state-search-item"
              onMouseDown={e => { e.preventDefault(); select(s.abbr) }}>
              <span className="stg-state-search-abbr">{s.abbr}</span>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {selectedAbbrs.length > 0 && (
        <div className="stg-state-tags" style={{ marginTop: 10 }}>
          {selectedAbbrs.map(abbr => (
            <span key={abbr} className="stg-state-tag stg-state-tag-purple">
              {abbr}
              <button type="button" className="stg-state-tag-remove"
                onClick={() => onToggle(abbr)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab 1: Personal Profile ───────────────────────────────────────────────────
function TabProfile({ agentInfo, onToast }) {
  const nameParts = (agentInfo?.name || '').split(' ')
  const defaults = {
    firstName: nameParts[0] || '',
    lastName:  nameParts.slice(1).join(' ') || '',
    email:     'agent@fflintelligence.com',
    cellPhone: '',
    workPhone: '',
    dob:       '',
    timezone:  'America/New_York',
  }
  const [form,     setForm]     = useState(() => load('userProfile', defaults))
  const [errors,   setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)
  const [twoFa,    setTwoFa]    = useState(() => load('twoFaEnabled', true))

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.cellPhone.trim()) e.cellPhone = 'Required'
    if (!form.timezone)         e.timezone  = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave(ev) {
    ev.preventDefault()
    if (!validate()) return
    save('userProfile', form)
    onToast('Changes saved successfully')
  }

  function toggleTwoFa() {
    const next = !twoFa; setTwoFa(next); save('twoFaEnabled', next)
  }

  return (
    <div className="stg-tab-body">
      <form onSubmit={handleSave} noValidate>
        <div className="stg-card">
          <SectionHead>Personal Information</SectionHead>

          <div className="stg-grid-2">
            <FieldWrap label="First Name *" error={errors.firstName}>
              <input className={`stg-input${errors.firstName ? ' stg-input-err' : ''}`}
                value={form.firstName} onChange={e => set('firstName', e.target.value)}
                placeholder="First name" />
            </FieldWrap>
            <FieldWrap label="Last Name *" error={errors.lastName}>
              <input className={`stg-input${errors.lastName ? ' stg-input-err' : ''}`}
                value={form.lastName} onChange={e => set('lastName', e.target.value)}
                placeholder="Last name" />
            </FieldWrap>
          </div>

          <div className="stg-grid-2">
            <FieldWrap label="Cell Phone *" error={errors.cellPhone} hint="Format: XXX-XXX-XXXX">
              <div className="stg-input-readonly-row">
                <input className={`stg-input${errors.cellPhone ? ' stg-input-err' : ''}`}
                  value={form.cellPhone} onChange={e => set('cellPhone', e.target.value)}
                  placeholder="555-000-0000" />
                {form.cellPhone.length >= 10 && <VerifiedBadge />}
              </div>
            </FieldWrap>
            <FieldWrap label="Work Phone" hint="Optional">
              <input className="stg-input" value={form.workPhone}
                onChange={e => set('workPhone', e.target.value)}
                placeholder="555-000-0000" />
            </FieldWrap>
          </div>

          <div className="stg-grid-2">
            <FieldWrap label="Date of Birth" hint="Optional">
              <input type="date" className="stg-input" value={form.dob}
                onChange={e => set('dob', e.target.value)} />
            </FieldWrap>
            <FieldWrap label="Timezone *" error={errors.timezone}>
              <select className={`stg-input stg-select${errors.timezone ? ' stg-input-err' : ''}`}
                value={form.timezone} onChange={e => set('timezone', e.target.value)}>
                <option value="">Select timezone…</option>
                {US_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </FieldWrap>
          </div>
        </div>

        <div className="stg-form-footer">
          <button type="submit" className="stg-btn-primary">Save Changes</button>
        </div>
      </form>

      {/* Account Security */}
      <div className="stg-card">
        <SectionHead>Account Security</SectionHead>

        <div className="stg-security-row">
          <div className="stg-security-row-left">
            <div className="stg-security-row-label">Email Address</div>
            <div className="stg-security-row-val">{form.email}<VerifiedBadge /></div>
          </div>
          <button type="button" className="stg-btn-ghost"
            onClick={() => alert('Email change coming soon.')}>
            Change Email
          </button>
        </div>

        <div className="stg-security-divider" />

        <div className="stg-security-row">
          <div className="stg-security-row-left">
            <div className="stg-security-row-label">Password</div>
            <div className="stg-security-row-val stg-pass-dots">••••••••••••</div>
          </div>
          <button type="button" className="stg-btn-ghost" onClick={() => setShowPass(true)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="9" height="6" rx="1"/>
              <path d="M4.5 6V4.5a2 2 0 014 0V6"/>
              <circle cx="6.5" cy="9" r="0.8" fill="currentColor" stroke="none"/>
            </svg>
            Change Password
          </button>
        </div>

        <div className="stg-security-divider" />

        <div className="stg-security-row">
          <div className="stg-security-row-left">
            <div className="stg-security-row-label">2-Step Verification</div>
            <div className="stg-security-row-hint">Add an extra layer of security to your account during login</div>
          </div>
          <button type="button"
            className={`stg-toggle${twoFa ? ' stg-toggle-on' : ''}`}
            onClick={toggleTwoFa}>
            <span className="stg-toggle-thumb" />
          </button>
        </div>
      </div>

      {showPass && <PasswordModal onClose={() => setShowPass(false)} />}
    </div>
  )
}

// ── Tab 2: Agency Profile ─────────────────────────────────────────────────────
function TabAgency({ onToast }) {
  const MOCK_CODE  = 'FFL-2025-JHX4'
  const MOCK_SEATS = { used: 3, total: 5 }
  const defaults   = { agencyName: '', logoUrl: null }
  const [form,     setForm]     = useState(() => load('agencyProfile', defaults))
  const [errors,   setErrors]   = useState({})
  const [copied,   setCopied]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  function handleCopy() {
    navigator.clipboard.writeText(MOCK_CODE).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  function processFile(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return }
    if (!['image/png','image/jpeg','image/gif'].includes(file.type)) { alert('PNG, JPG, or GIF only'); return }
    const reader = new FileReader()
    reader.onload = e => setForm(f => ({ ...f, logoUrl: e.target.result }))
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0])
  }

  function handleSave(ev) {
    ev.preventDefault()
    if (!form.agencyName.trim()) { setErrors({ agencyName: 'Required' }); return }
    setErrors({})
    save('agencyProfile', form)
    onToast('Changes saved successfully')
  }

  const seatsPct = Math.round((MOCK_SEATS.used / MOCK_SEATS.total) * 100)

  return (
    <div className="stg-tab-body">
      <form onSubmit={handleSave} noValidate>
        <div className="stg-card">
          <SectionHead>Agency Details</SectionHead>

          <FieldWrap label="Agency Name *" error={errors.agencyName}>
            <input className={`stg-input${errors.agencyName ? ' stg-input-err' : ''}`}
              value={form.agencyName} onChange={e => setForm(f => ({ ...f, agencyName: e.target.value }))}
              placeholder="Enter agency name" />
          </FieldWrap>

          <FieldWrap label="Agency Logo">
            {form.logoUrl ? (
              <div className="stg-logo-preview">
                <img src={form.logoUrl} alt="Agency logo" className="stg-logo-img" />
                <button type="button" className="stg-btn-danger-sm"
                  onClick={() => setForm(f => ({ ...f, logoUrl: null }))}>Remove Logo</button>
              </div>
            ) : (
              <div
                className={`stg-drop-zone${dragging ? ' stg-drop-zone-active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <rect x="2" y="2" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/>
                  <polyline points="2 15 7 10 10 13 14 9 20 15"/>
                </svg>
                <span className="stg-drop-label">Drag & drop or click to upload</span>
                <span className="stg-drop-hint">PNG, JPG, GIF — max 5MB</span>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif"
                  style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
              </div>
            )}
          </FieldWrap>

          <FieldWrap label="Agency Partner Code" readOnly>
            <div className="stg-input-readonly-row">
              <input className="stg-input stg-input-readonly stg-mono" value={MOCK_CODE} readOnly />
              <button type="button" className={`stg-copy-btn${copied ? ' stg-copy-btn-done' : ''}`}
                onClick={handleCopy} title="Copy to clipboard">
                {copied ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#4caf84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1.5 6.5 5 10 11.5 3"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="7.5" height="7.5" rx="1"/>
                    <path d="M2.5 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1.5"/>
                  </svg>
                )}
              </button>
            </div>
            <span className="stg-hint">Share this code with agents so they can join your agency.</span>
          </FieldWrap>
        </div>

        <div className="stg-card stg-card-teal">
          <SectionHead>Seats</SectionHead>
          <div className="stg-seats-row">
            <span className="stg-seats-label">Seats Used</span>
            <span className="stg-seats-count">
              <span style={{ color: '#4caf84' }}>{MOCK_SEATS.used}</span>
              <span style={{ color: '#555555' }}> / {MOCK_SEATS.total}</span>
            </span>
          </div>
          <div className="stg-seats-bar"><div className="stg-seats-fill" style={{ width: `${seatsPct}%` }} /></div>
          <div className="stg-seats-avail">
            <span className="stg-seats-avail-label">Seats Available</span>
            <span className="stg-seats-avail-num">{MOCK_SEATS.total - MOCK_SEATS.used}</span>
          </div>
        </div>

        <div className="stg-card">
          <SectionHead>Current Plan</SectionHead>
          <div className="stg-plan-info-row">
            <div>
              <div className="stg-plan-name">Team Plan</div>
              <div className="stg-plan-meta">5 seats included · Renews May 1, 2027</div>
            </div>
            <span className="stg-plan-badge">Active</span>
          </div>
          <p className="stg-hint" style={{ marginTop: 12 }}>
            To change your plan, visit the <strong>Plan / Billing</strong> tab.
          </p>
        </div>

        <div className="stg-form-footer">
          <button type="submit" className="stg-btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  )
}

// ── Tab 3: Contracting ────────────────────────────────────────────────────────
function TabContracting({ agentInfo, onToast }) {
  const defaultContracting = { npn: '', states: [], compTier: String(agentInfo?.contractLevel || 100) }
  const [form,       setForm]       = useState(() => load('contracting', defaultContracting))
  const [errors,     setErrors]     = useState({})
  const [contracted, setContracted] = useState(() => load('contractedCarriers', []))
  const [miniToast,  setMiniToast]  = useState(null)

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }

  function toggleState(abbr) {
    setForm(f => ({
      ...f,
      states: f.states.includes(abbr) ? f.states.filter(x => x !== abbr) : [...f.states, abbr],
    }))
  }

  function toggleCarrier(name) {
    setContracted(prev => {
      const next = prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
      save('contractedCarriers', next)
      setMiniToast(prev.includes(name) ? `${name} deselected` : `${name} selected`)
      setTimeout(() => setMiniToast(null), 2000)
      return next
    })
  }

  function handleSave(ev) {
    ev.preventDefault()
    const e = {}
    if (!form.npn.trim()) e.npn = 'NPN number is required'
    if (!form.compTier)   e.compTier = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    save('contracting', form)
    onToast('Changes saved successfully')
  }

  return (
    <div className="stg-tab-body">
      {miniToast && <div className="stg-mini-toast">{miniToast}</div>}
      <form onSubmit={handleSave} noValidate>
        <div className="stg-card">
          <SectionHead>Contracting Details</SectionHead>

          <FieldWrap label="NPN Number *" error={errors.npn}>
            <input className={`stg-input${errors.npn ? ' stg-input-err' : ''}`}
              value={form.npn} onChange={e => setField('npn', e.target.value)}
              placeholder="Enter your NPN number" />
          </FieldWrap>

          <FieldWrap label="Licensed States" hint="Informational only — search and select all states you are licensed in">
            <SearchableStates selectedAbbrs={form.states} onToggle={toggleState} />
          </FieldWrap>

          <FieldWrap label="Compensation Tier *" error={errors.compTier}>
            <select className={`stg-input stg-select${errors.compTier ? ' stg-input-err' : ''}`}
              value={form.compTier} onChange={e => setField('compTier', e.target.value)}>
              <option value="">Select tier…</option>
              {COMP_TIERS.map(t => <option key={t} value={String(t)}>{t}%</option>)}
            </select>
          </FieldWrap>
        </div>

        <div className="stg-card">
          <SectionHead>Contracted Carriers</SectionHead>
          <p className="stg-section-sub">Select the carriers you are contracted with. Changes save automatically.</p>
          <div className="stg-carrier-grid">
            {CARRIERS.map(c => {
              const isOn = contracted.includes(c.name)
              return (
                <div key={c.id} className={`stg-carrier-card${isOn ? ' stg-carrier-on' : ''}`}
                  onClick={() => toggleCarrier(c.name)}>
                  <div className="stg-carrier-logo-wrap">
                    <img src={c.logo} alt={c.name} className="stg-carrier-logo" />
                  </div>
                  <div className="stg-carrier-name">{c.name}</div>
                  <div className="stg-carrier-check-row">
                    <div className={`stg-carrier-check${isOn ? ' checked' : ''}`}>
                      {isOn && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4.5 3.5 7 8 2"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="stg-form-footer">
          <button type="submit" className="stg-btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  )
}


// ── Tab 6: Connectors ────────────────────────────────────────────────────────
const CONNECTOR_DEFS = [
  {
    key: 'gmail',
    name: 'Gmail',
    desc: 'Track policy status and carrier emails automatically.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="3.5" width="15" height="11" rx="1.5"/>
        <polyline points="1.5 5 9 10 16.5 5"/>
      </svg>
    ),
  },
  {
    key: 'outlook',
    name: 'Outlook',
    desc: 'Track policy status and carrier emails automatically.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="3.5" width="15" height="11" rx="1.5"/>
        <path d="M9 3.5v11"/>
        <polyline points="1.5 5 9 10 16.5 5"/>
      </svg>
    ),
  },
  {
    key: 'bank',
    name: 'Bank',
    desc: 'Match deposits to expected commission, flag underpayments.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="9 1.5 16.5 6 1.5 6"/>
        <line x1="3.5" y1="6" x2="3.5" y2="13"/>
        <line x1="7" y1="6" x2="7" y2="13"/>
        <line x1="11" y1="6" x2="11" y2="13"/>
        <line x1="14.5" y1="6" x2="14.5" y2="13"/>
        <line x1="1.5" y1="13" x2="16.5" y2="13"/>
        <line x1="1.5" y1="15.5" x2="16.5" y2="15.5"/>
      </svg>
    ),
  },
  {
    key: 'googleCalendar',
    name: 'Google Calendar',
    desc: 'Sync appointments both ways.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="3" width="15" height="13.5" rx="1.5"/>
        <line x1="5" y1="1.5" x2="5" y2="5"/>
        <line x1="13" y1="1.5" x2="13" y2="5"/>
        <line x1="1.5" y1="7.5" x2="16.5" y2="7.5"/>
        <rect x="5" y="10" width="3" height="3" rx="0.5"/>
      </svg>
    ),
  },
  {
    key: 'outlookCalendar',
    name: 'Outlook Calendar',
    desc: 'Sync appointments both ways.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="3" width="15" height="13.5" rx="1.5"/>
        <line x1="5" y1="1.5" x2="5" y2="5"/>
        <line x1="13" y1="1.5" x2="13" y2="5"/>
        <line x1="1.5" y1="7.5" x2="16.5" y2="7.5"/>
        <path d="M5.5 11h7"/>
        <path d="M5.5 13.5h4"/>
      </svg>
    ),
  },
  {
    key: 'appleCalendar',
    name: 'Apple Calendar',
    desc: 'Subscribe to your RevTron appointments.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="3" width="15" height="13.5" rx="1.5"/>
        <line x1="5" y1="1.5" x2="5" y2="5"/>
        <line x1="13" y1="1.5" x2="13" y2="5"/>
        <line x1="1.5" y1="7.5" x2="16.5" y2="7.5"/>
        <circle cx="9" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    key: 'calendly',
    name: 'Calendly',
    desc: 'Let clients book open slots on your calendar.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="7.5"/>
        <polyline points="9 5 9 9 12.5 11"/>
      </svg>
    ),
  },
  {
    key: 'zoom',
    name: 'Zoom',
    desc: 'Auto-create meeting links for booked appointments.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4.5" width="11" height="9" rx="1.5"/>
        <polyline points="12 7.5 17 4.5 17 13.5 12 10.5"/>
      </svg>
    ),
  },
  {
    key: 'discord',
    name: 'Discord',
    desc: 'Auto-post sales and leaderboards to your server.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.5 3C13.5 3 11.8 2 9 2C6.2 2 4.5 3 4.5 3C4.5 3 2 6.5 2 10.5C2 10.5 3.5 12.5 6 13C6 13 6.5 12.5 7 12C5.5 11.5 5 10.5 5 10.5C5 10.5 5.5 10.8 6.5 11C8.5 11.5 11 11.3 12 10.8C12 10.8 11.5 11.5 10 12C10.5 12.5 11 13 11 13C13.5 12.5 15 10.5 15 10.5C15 6.5 12.5 3 12.5 3L13.5 3Z"/>
        <circle cx="7" cy="9" r="1"/>
        <circle cx="11" cy="9" r="1"/>
      </svg>
    ),
  },
  {
    key: 'slack',
    name: 'Slack',
    desc: 'Auto-post sales and leaderboards to your workspace.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 1.5C6 2.3 5.3 3 4.5 3S3 2.3 3 1.5 3.7 0 4.5 0 6 0.7 6 1.5Z"/>
        <line x1="4.5" y1="3" x2="4.5" y2="10.5"/>
        <line x1="1.5" y1="6" x2="10.5" y2="6"/>
        <path d="M12 6C12 5.2 12.7 4.5 13.5 4.5S15 5.2 15 6 14.3 7.5 13.5 7.5 12 6.8 12 6Z"/>
        <line x1="13.5" y1="7.5" x2="13.5" y2="15"/>
        <line x1="7.5" y1="12" x2="16.5" y2="12"/>
        <path d="M0 13.5C0 12.7 0.7 12 1.5 12S3 12.7 3 13.5 2.3 15 1.5 15 0 14.3 0 13.5Z"/>
        <path d="M12 16.5C12 15.7 12.7 15 13.5 15S15 15.7 15 16.5 14.3 18 13.5 18 12 17.3 12 16.5Z"/>
        <line x1="3" y1="13.5" x2="12" y2="13.5"/>
        <line x1="1.5" y1="12" x2="1.5" y2="4.5"/>
      </svg>
    ),
  },
  {
    key: 'phone',
    name: 'Phone',
    desc: 'Call leads in-app with a local number.',
    soon: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2h4l1.5 4-2.5 1.5c1 2 2.5 3.5 4.5 4.5L12 9.5l4 1.5v4C16 16.5 14.5 18 13 18 6.5 17.5 0.5 11.5 0 5 0 3.5 1.5 2 3 2Z"/>
      </svg>
    ),
  },
]

const CONN_DEFAULTS = CONNECTOR_DEFS.reduce((acc, c) => {
  acc[c.key] = { connected: false }
  return acc
}, {})

function ConnectorModal({ type, connector, onClose, onConfirmDisconnect }) {
  if (type === 'connect') {
    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="settings-modal-head">
            <h3 className="settings-modal-title">Connect {connector.name}</h3>
            <button className="settings-modal-close" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
              </svg>
            </button>
          </div>
          <div className="settings-modal-form">
            <div className="conn-modal-body">
              <p className="conn-modal-desc">{connector.desc}</p>
              <p className="conn-modal-soon">Not available yet — coming in a future update.</p>
            </div>
            <div className="settings-modal-actions">
              <button type="button" className="stg-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="stg-btn-primary" disabled style={{ opacity: 0.4, cursor: 'default' }}>Confirm</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-head">
          <h3 className="settings-modal-title">Disconnect {connector.name}?</h3>
          <button className="settings-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>
        <div className="settings-modal-form">
          <p className="conn-modal-desc">RevTron will stop receiving updates from this source.</p>
          <div className="settings-modal-actions">
            <button type="button" className="stg-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="stg-btn-primary" onClick={onConfirmDisconnect}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabConnectors({ onToast }) {
  const [state, setState] = useState(() => load('ffl_connectors', CONN_DEFAULTS))
  const [modal, setModal] = useState(null) // { type: 'connect'|'disconnect', key }

  function openConnect(key) { setModal({ type: 'connect', key }) }
  function openDisconnect(key) { setModal({ type: 'disconnect', key }) }
  function closeModal() { setModal(null) }

  function handleDisconnect() {
    const key = modal.key
    const next = { ...state, [key]: { connected: false } }
    setState(next)
    save('ffl_connectors', next)
    setModal(null)
    const name = CONNECTOR_DEFS.find(c => c.key === key)?.name || key
    onToast(`${name} disconnected`)
  }

  const activeConnector = modal ? CONNECTOR_DEFS.find(c => c.key === modal.key) : null

  return (
    <div className="stg-tab-body">
      <div className="conn-header">
        <h2 className="conn-header-title">Connectors</h2>
        <p className="conn-header-sub">Connect your accounts so RevTron can detect updates automatically.</p>
      </div>

      <div className="conn-grid">
        {CONNECTOR_DEFS.map(c => {
          const connected = !c.soon && state[c.key]?.connected
          const pill = c.soon ? 'soon' : connected ? 'connected' : 'disconnected'
          const pillLabel = c.soon ? 'Soon' : connected ? 'Connected' : 'Not Connected'

          return (
            <div key={c.key} className="conn-card">
              <div className="conn-card-row1">
                <div className="conn-card-left">
                  <div className="conn-logo-slot">
                    {CONNECTOR_LOGOS[c.key]
                      ? <img src={CONNECTOR_LOGOS[c.key]} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : c.icon}
                  </div>
                  <span className="conn-name">{c.name}</span>
                </div>
                {c.soon ? (
                  <button className="conn-btn conn-btn-soon" disabled>Connect</button>
                ) : connected ? (
                  <button className="conn-btn conn-btn-disconnect" onClick={() => openDisconnect(c.key)}>Disconnect</button>
                ) : (
                  <button className="conn-btn conn-btn-connect" onClick={() => openConnect(c.key)}>Connect</button>
                )}
              </div>
              <p className="conn-desc">{c.desc}</p>
              <div className="conn-pill-row">
                <span className={`conn-pill conn-pill-${pill}`}>{pillLabel}</span>
              </div>
            </div>
          )
        })}
      </div>

      {modal && activeConnector && (
        <ConnectorModal
          type={modal.type}
          connector={activeConnector}
          onClose={closeModal}
          onConfirmDisconnect={handleDisconnect}
        />
      )}
    </div>
  )
}

// ── Tab 5: Plan / Billing ─────────────────────────────────────────────────────
function TabBilling({ isAgencyOwner, onToast }) {
  const [showManagePlan, setShowManagePlan] = useState(false)
  const [autoRenewal,    setAutoRenewal]    = useState(() => load('billingSettings', { autoRenewal: true }).autoRenewal !== false)

  const STATUS_STYLES = {
    Paid:       { color: '#4caf84', bg: 'rgba(76,175,132,0.1)',  border: 'rgba(76,175,132,0.2)'  },
    Processing: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)'  },
    Failed:     { color: '#e05c5c', bg: 'rgba(224,92,92,0.1)',  border: 'rgba(224,92,92,0.2)'   },
  }

  if (!isAgencyOwner) {
    return (
      <div className="stg-tab-body">
        <div className="stg-card stg-card-teal">
          <SectionHead>Your Plan</SectionHead>
          <div className="stg-plan-readonly-grid">
            <div className="stg-plan-readonly-item"><span className="stg-label">Agency</span><span className="stg-plan-readonly-val">JH Financial</span></div>
            <div className="stg-plan-readonly-item"><span className="stg-label">Plan Tier</span><span className="stg-plan-readonly-val">Team Plan</span></div>
            <div className="stg-plan-readonly-item"><span className="stg-label">Seat Status</span><span className="stg-plan-readonly-val">You are 1 of 5 seats on the Team Plan</span></div>
            <div className="stg-plan-readonly-item"><span className="stg-label">Agency Owner</span><span className="stg-plan-readonly-val">Justin H.</span></div>
          </div>
        </div>
        <p className="stg-contact-msg">Contact your agency owner to make changes to this plan.</p>
      </div>
    )
  }

  return (
    <div className="stg-tab-body">

      {/* Current Plan Card */}
      <div className="stg-card stg-card-teal">
        <SectionHead>Current Plan</SectionHead>
        <div className="stg-plan-info-row">
          <div>
            <div className="stg-plan-name">Team Plan</div>
            <div className="stg-plan-meta">5 seats included · Renews May 1, 2027</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="stg-plan-badge">Active</span>
            <button type="button" className="stg-btn-primary stg-btn-sm"
              onClick={() => setShowManagePlan(true)}>
              Manage Plan
            </button>
          </div>
        </div>
      </div>

      {/* Log Out of All Devices */}
      <div className="stg-card">
        <div className="stg-security-row" style={{ padding: 0 }}>
          <div className="stg-security-row-left">
            <div className="stg-security-row-label">Log Out of All Devices</div>
            <div className="stg-security-row-hint">End all active sessions across every device</div>
          </div>
          <button type="button" className="stg-btn-danger-outline"
            onClick={() => alert('You have been logged out of all other devices.')}>
            Log Out of All Devices
          </button>
        </div>
      </div>

      {/* Invoices */}
      <div className="stg-card">
        <SectionHead>Invoices</SectionHead>
        <div className="stg-billing-table-wrap">
          <table className="stg-billing-table">
            <thead>
              <tr><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((row, i) => {
                const st = STATUS_STYLES[row.status] || STATUS_STYLES.Paid
                return (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td style={{ color: '#ffffff', fontWeight: 500 }}>{row.total}</td>
                    <td>
                      <span className="stg-status-badge"
                        style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <button className="stg-view-link"
                        onClick={() => alert('Invoice view coming soon.')}>
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal */}
      <div className="stg-card">
        <SectionHead>Renewal Info</SectionHead>
        <div className="stg-renewal-row">
          <div>
            <div className="stg-renewal-label">Next Billing Date</div>
            <div className="stg-renewal-date">May 1, 2027</div>
          </div>
          <div className="stg-renewal-toggle-wrap">
            <span className="stg-renewal-toggle-label">Auto-Renewal</span>
            <button type="button"
              className={`stg-toggle${autoRenewal ? ' stg-toggle-on' : ''}`}
              onClick={() => setAutoRenewal(v => !v)}>
              <span className="stg-toggle-thumb" />
            </button>
          </div>
        </div>
        {!autoRenewal && (
          <div className="stg-renewal-warn">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 1L12.5 11.5H0.5L6.5 1Z"/>
              <line x1="6.5" y1="5" x2="6.5" y2="8"/>
              <circle cx="6.5" cy="10" r="0.5" fill="currentColor"/>
            </svg>
            Your subscription will end on May 1, 2027.
          </div>
        )}
      </div>

      <div className="stg-form-footer">
        <button type="button" className="stg-btn-primary"
          onClick={() => { save('billingSettings', { autoRenewal }); onToast('Changes saved successfully') }}>
          Save Changes
        </button>
      </div>

      {showManagePlan && <ManagePlanModal onClose={() => setShowManagePlan(false)} />}
    </div>
  )
}

// ── Main Settings Component ───────────────────────────────────────────────────
export default function Settings({ agentInfo }) {
  const isAgencyOwner = agentInfo?.isAgencyOwner === true

  const ALL_TABS = [
    { id: 'profile',     label: 'Personal Profile'            },
    { id: 'agency',      label: 'Agency Profile', ownerOnly: true },
    { id: 'contracting', label: 'Contracting'                 },
    { id: 'billing',     label: 'Plan / Billing'              },
    { id: 'connectors',  label: 'Connectors'                  },
  ]
  const visibleTabs = ALL_TABS.filter(t => !t.ownerOnly || isAgencyOwner)

  const [activeTab, setActiveTab] = useState(visibleTabs[0].id)
  const [toast,     setToast]     = useState(null)
  const toastTimer  = useRef(null)

  function showToast(msg) {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  return (
    <div className="stg-root animate-in">
      <div className="stg-page-header">
        <div className="stg-page-eyebrow">Account Management</div>
        <h1 className="stg-page-title">Settings</h1>
        <p className="stg-page-sub">
          Manage your profile, agency details, contracting, and billing.
        </p>
      </div>

      <div className="stg-tab-bar">
        {visibleTabs.map(tab => (
          <button key={tab.id}
            className={`stg-tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile'     && <TabProfile     agentInfo={agentInfo}         onToast={showToast} />}
      {activeTab === 'agency'      && <TabAgency                                     onToast={showToast} />}
      {activeTab === 'contracting' && <TabContracting agentInfo={agentInfo}         onToast={showToast} />}
      {activeTab === 'billing'     && <TabBilling     isAgencyOwner={isAgencyOwner} onToast={showToast} />}
      {activeTab === 'connectors'  && <TabConnectors                                 onToast={showToast} />}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
