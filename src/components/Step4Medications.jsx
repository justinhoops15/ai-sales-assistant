import { useState } from 'react'
import { searchMedications } from '../data/medications.js'
import { getMedicationsForConditions } from '../data/conditionMedications.js'

const CARRIER_SHORT = {
  mutual_of_omaha:   'MOO',
  transamerica:      'TRAN',
  foresters:         'FOR',
  americo:           'AME',
  american_amicable: 'AAIG',
  aetna:             'AETNA',
  ethos:             'ETHOS',
  john_hancock:      'JH',
  corebridge:        'CORE',
  prosperity_life:   'PLG',
  north_american:    'NAC',
}

function shortName(id) {
  return CARRIER_SHORT[id] || id.slice(0, 4).toUpperCase()
}

export default function Step4Medications({ data, conditions, onChange, onNext, onBack, onCancel, onFollowUp }) {
  const [query,        setQuery]        = useState('')
  const [suggestions,  setSuggestions]  = useState([])
  const [open,         setOpen]         = useState(false)
  const [showCondSugg, setShowCondSugg] = useState(false)

  const conditionGroups = getMedicationsForConditions(conditions || {})

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    setShowCondSugg(false)
    if (q.length >= 2) {
      setSuggestions(searchMedications(q))
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  function handleFocus() {
    if (query.length === 0 && conditionGroups.length > 0) {
      setShowCondSugg(true)
      setOpen(false)
    }
  }

  function handleBlur() {
    setTimeout(() => { setOpen(false); setShowCondSugg(false) }, 180)
  }

  function addFromList(med) {
    if (!data.find(m => m.name === med.name)) onChange([...data, { ...med, custom: false }])
    setQuery(''); setOpen(false); setShowCondSugg(false)
  }

  function addByName(name) {
    const found = searchMedications(name).find(m => m.name.toLowerCase() === name.toLowerCase())
    if (found) {
      addFromList(found)
    } else {
      if (!data.find(m => m.name.toLowerCase() === name.toLowerCase())) {
        onChange([...data, {
          name,
          conditionHint: null,
          severity: 'low',
          flaggedCarriers: [],
          note: 'Not in database — review with carrier underwriting.',
          custom: true,
        }])
      }
      setShowCondSugg(false)
    }
  }

  function addCustom() {
    const q = query.trim()
    if (!q) return
    addByName(q)
    setQuery(''); setOpen(false)
  }

  function remove(idx) {
    onChange(data.filter((_, i) => i !== idx))
  }

  const hasFlagged = data.some(m => m.flaggedCarriers?.length > 0)

  return (
    <div className="animate-in">
      <div className="step-header">
        <div className="step-eyebrow">Step 4 of 7</div>
        <h1 className="step-title">Medications</h1>
        <p className="step-subtitle">
          Search medications to see which carriers may flag them.
          {conditionGroups.length > 0 && ' Click the search bar for suggestions based on selected conditions.'}
        </p>
      </div>

      <div className="card">
        <div className="section-eyebrow">Search</div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder={
                conditionGroups.length > 0
                  ? 'Click to see condition-based suggestions, or type to search...'
                  : 'e.g. Metformin, Eliquis, Lantus...'
              }
              value={query}
              onChange={handleInput}
              onFocus={handleFocus}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              onBlur={handleBlur}
              autoComplete="off"
              className="field-input"
              style={{ flex: 1 }}
            />
            {query.trim() && (
              <button className="btn btn-ghost" onClick={addCustom} style={{ flexShrink: 0 }}>
                + Add
              </button>
            )}
          </div>

          {/* Standard search dropdown */}
          {open && suggestions.length > 0 && (
            <div className="med-dropdown">
              {suggestions.map((med, i) => (
                <div
                  key={i}
                  className="med-dropdown-item"
                  onMouseDown={() => addFromList(med)}
                >
                  <div className="med-item-name">{med.name}</div>
                  {med.flaggedCarriers?.length > 0 ? (
                    <div className="med-item-note" style={{ color: '#fbbf24' }}>
                      Flags {med.flaggedCarriers.length} carrier{med.flaggedCarriers.length !== 1 ? 's' : ''} · {med.note}
                    </div>
                  ) : (
                    <div className="med-item-note" style={{ color: '#4caf84' }}>Generally accepted by all carriers</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Condition-based suggestions */}
          {showCondSugg && conditionGroups.length > 0 && (
            <div className="med-dropdown" style={{ maxHeight: 380 }}>
              <div style={{ padding: '8px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888888', fontWeight: 600, borderBottom: '1px solid #2a2a2a' }}>
                Suggested based on selected conditions
              </div>
              {conditionGroups.map(({ condition, medications }) => (
                <div key={condition}>
                  <div style={{ padding: '8px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#555555', fontWeight: 600 }}>
                    {condition}
                  </div>
                  {medications.map((medName, i) => {
                    const alreadyAdded = data.some(m => m.name.toLowerCase() === medName.toLowerCase())
                    return (
                      <div
                        key={i}
                        className="med-dropdown-item"
                        style={{ opacity: alreadyAdded ? 0.4 : 1, cursor: alreadyAdded ? 'default' : 'pointer' }}
                        onMouseDown={() => !alreadyAdded && addByName(medName)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, color: '#ffffff' }}>{medName}</span>
                          {alreadyAdded && (
                            <span style={{ fontSize: 11, color: '#4caf84' }}>Added</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Added medications */}
        {data.length > 0 && (
          <div>
            <div className="section-eyebrow">Added ({data.length})</div>
            <div className="med-added-list">
              {data.map((med, idx) => (
                <div key={idx} className="med-chip">
                  <div className="med-chip-left">
                    <div className="med-chip-name" style={{ color: med.flaggedCarriers?.length > 0 ? '#fbbf24' : '#ffffff' }}>
                      {med.name}
                      {med.custom && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#555555', fontWeight: 400 }}>(custom)</span>
                      )}
                    </div>
                    {med.flaggedCarriers?.length > 0 ? (
                      <div>
                        <div className="med-flags-row" style={{ marginBottom: 4 }}>
                          {med.flaggedCarriers.slice(0, 5).map((c, i) => (
                            <span key={i} className="med-flag-tag">{shortName(c)}</span>
                          ))}
                          {med.flaggedCarriers.length > 5 && (
                            <span style={{ fontSize: 11, color: '#555555' }}>
                              +{med.flaggedCarriers.length - 5} more
                            </span>
                          )}
                        </div>
                        <div className="med-chip-hint">{med.note}</div>
                      </div>
                    ) : (
                      <div className="med-chip-hint" style={{ color: '#4caf84' }}>No carrier flags</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="med-chip-remove"
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.length === 0 && (
          <p style={{ fontSize: 13, color: '#555555', marginTop: 8 }}>
            No medications added. Flagged medications reduce confidence scores but do not automatically decline a carrier.
          </p>
        )}

        {hasFlagged && (
          <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 16 }}>
            Flagged medications may indicate undisclosed conditions. These are factored into confidence ratings on the results page.
          </p>
        )}
      </div>

      <div className="step-actions">
        <div className="step-actions-left">
          <button className="btn btn-secondary" onClick={onBack}>Back</button>
          <button className="btn btn-cancel"   onClick={onCancel}>Cancel</button>
          <button className="btn btn-followup" onClick={onFollowUp}>Not Sold / Follow Up</button>
        </div>
        <button className="btn btn-primary" onClick={onNext}>Continue</button>
      </div>
    </div>
  )
}
