import { useState } from 'react'
import { FFL_LEVELS } from '../data/compensation.js'

export default function AgentSetup({ onComplete }) {
  const [name,          setName]          = useState('')
  const [contractLevel, setContractLevel] = useState(100)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onComplete({ name: name.trim(), contractLevel })
  }

  return (
    <div className="setup-page">
      <div className="setup-card">

        {/* Brand */}
        <div className="setup-mark">
          <div className="setup-brand-name">FFL Intelligence</div>
          <div className="setup-tagline">Life Insurance Sales Assistant</div>
        </div>

        <hr className="section-divider" />

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="field" style={{ marginBottom: 20 }}>
            <label className="field-label" htmlFor="agent-name">Your Name</label>
            <input
              id="agent-name"
              type="text"
              placeholder="First Last"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              autoComplete="off"
              className="field-input"
            />
          </div>

          {/* Contract Level */}
          <div className="field" style={{ marginBottom: 28 }}>
            <label className="field-label">FFL Contract Level</label>
            <p style={{ fontSize: 12, color: '#555555', marginBottom: 12 }}>
              Sets your commission rate across all carrier products.
            </p>
            <div className="level-grid">
              {FFL_LEVELS.map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setContractLevel(lvl)}
                  className={`level-btn${contractLevel === lvl ? ' selected' : ''}`}
                >
                  {lvl}%
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}
          >
            Begin Appointment
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#555555', marginTop: 20 }}>
          All data stays on this device — nothing is transmitted externally.
        </p>
      </div>
    </div>
  )
}
