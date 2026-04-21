import { useState } from 'react'

function addDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function toDisplayDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

function fromDisplayDate(display) {
  if (!display) return ''
  const parts = display.replace(/[^0-9/]/g, '').split('/')
  if (parts.length !== 3) return ''
  const [m, d, y] = parts
  if (!m || !d || !y || y.length !== 4) return ''
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

const PRIORITY_DAYS = { hot: 30, warm: 60, cold: 90 }

export default function FollowUpModal({ onSave, onBack }) {
  const [priority,        setPriority]        = useState('warm')
  const [dateDisplay,     setDateDisplay]     = useState(toDisplayDate(addDays(60)))
  const [note,            setNote]            = useState('')
  const [priorityError,   setPriorityError]   = useState(false)

  function handlePriority(p) {
    setPriority(p)
    setPriorityError(false)
    setDateDisplay(toDisplayDate(addDays(PRIORITY_DAYS[p])))
  }

  function handleDateInput(val) {
    // Allow digits and slashes only, auto-insert slashes
    let cleaned = val.replace(/[^0-9/]/g, '')
    // Auto-insert slashes as user types raw digits
    const digits = cleaned.replace(/\//g, '')
    if (cleaned.length > dateDisplay.length && !cleaned.includes('/')) {
      if (digits.length === 2 || digits.length === 4) {
        cleaned = digits.slice(0,2) + '/' + digits.slice(2,4) + (digits.length > 4 ? '/' + digits.slice(4) : '')
      }
    }
    setDateDisplay(cleaned)
  }

  function handleSave() {
    if (!priority) { setPriorityError(true); return }
    const isoDate = fromDisplayDate(dateDisplay) || addDays(PRIORITY_DAYS[priority] || 60)
    onSave({ note: note.trim(), priority, nextContactDate: isoDate })
  }

  const priorityLabel = priority === 'hot' ? '30-day follow up' : priority === 'warm' ? '60-day follow up' : '90-day follow up'

  return (
    <div className="db-overlay" onClick={onBack}>
      <div className="followup-modal" onClick={e => e.stopPropagation()}>

        <div className="followup-modal-header">
          <div className="followup-modal-title">Not Sold — Save for Follow Up</div>
          <div className="followup-modal-sub">
            Client data is saved. Select a priority and next contact date.
          </div>
        </div>

        <div className="followup-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Priority */}
          <div>
            <label className="field-label" style={{ display: 'block', marginBottom: 8 }}>
              Priority *
            </label>
            <div className="fu-priority-row">
              {['hot','warm','cold'].map(p => (
                <button
                  key={p}
                  type="button"
                  className={`fu-priority-btn ${p}${priority === p ? ' active' : ''}`}
                  onClick={() => handlePriority(p)}
                >
                  {p === 'hot' ? 'Hot — 30 Days' : p === 'warm' ? 'Warm — 60 Days' : 'Cold — 90 Days'}
                </button>
              ))}
            </div>
            {priority && (
              <div className="fu-priority-hint">{priorityLabel} — next contact date auto-set below</div>
            )}
            {priorityError && (
              <div style={{ fontSize: 12, color: '#e05c5c', marginTop: 4 }}>Please select a priority.</div>
            )}
          </div>

          {/* Next Contact Date */}
          <div>
            <label className="field-label" style={{ display: 'block', marginBottom: 8 }}>
              Next Contact Date
            </label>
            <input
              className="field-input"
              type="text"
              placeholder="MM/DD/YYYY"
              value={dateDisplay}
              maxLength={10}
              onChange={e => handleDateInput(e.target.value)}
            />
          </div>

          {/* Note */}
          <div>
            <label className="field-label" style={{ display: 'block', marginBottom: 8 }}>
              Note (optional)
            </label>
            <textarea
              className="field-input"
              style={{ minHeight: 96, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              placeholder="Add a note (optional) — e.g. Client was interested but wanted to think it over."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

        </div>

        <div className="followup-modal-footer">
          <button className="btn btn-ghost" onClick={onBack}>Go Back</button>
          <button className="btn btn-followup" onClick={handleSave}>
            Save for Follow Up
          </button>
        </div>

      </div>
    </div>
  )
}
