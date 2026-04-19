import { useState } from 'react'

export default function FollowUpModal({ onSave, onBack }) {
  const [note, setNote] = useState('')

  return (
    <div className="db-overlay" onClick={onBack}>
      <div className="followup-modal" onClick={e => e.stopPropagation()}>

        <div className="followup-modal-header">
          <div className="followup-modal-title">Not Sold — Save for Follow Up</div>
          <div className="followup-modal-sub">
            All entered data will be saved to your follow-up list. No policy will be recorded.
          </div>
        </div>

        <div className="followup-modal-body">
          <label className="field-label" style={{ display: 'block', marginBottom: 8 }}>
            Reason for follow up at a later date
          </label>
          <textarea
            className="field-input"
            style={{ minHeight: 120, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. Client was interested but wanted to think it over. Call back in 30 days."
            value={note}
            onChange={e => setNote(e.target.value)}
            autoFocus
          />
        </div>

        <div className="followup-modal-footer">
          <button className="btn btn-ghost" onClick={onBack}>Go Back</button>
          <button className="btn btn-followup" onClick={() => onSave(note)}>
            Save for Follow Up
          </button>
        </div>

      </div>
    </div>
  )
}
