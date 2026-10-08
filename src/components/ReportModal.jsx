import { useState } from 'react'
import { toast } from 'sonner'
import { reportsApi, REPORT_REASONS, REPORT_DETAILS_MAX_LENGTH } from '../api/reportsApi'
import { capture } from '../lib/analytics'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getUserMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'

const REASON_LABELS = {
  spam: 'Spam',
  hate_speech: 'Hate speech',
  harassment: 'Harassment or bullying',
  misinformation: 'Misinformation',
  inappropriate_content: 'Inappropriate content',
  impersonation: 'Impersonation',
  other: 'Something else',
}

const TARGET_LABEL_BY_TYPE = {
  review: 'review',
  photo: 'photo',
  dish: 'dish',
  user: 'user',
}

export function ReportModal({ isOpen, onClose, target }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    if (loading) return
    onClose()
    setReason('')
    setDetails('')
  }

  const modalRef = useFocusTrap(isOpen, handleClose)

  if (!isOpen || !target) return null

  const targetKind = TARGET_LABEL_BY_TYPE[target.type] || 'content'
  const canSubmit = !!reason && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await reportsApi.submitReport({
        targetType: target.type,
        targetId: target.id,
        reason,
        details: details.trim() ? details : null,
      })
      capture('report_submitted', {
        target_type: target.type,
        reason,
        has_details: !!details.trim(),
      })
      toast.success("Thanks. We'll review this.")
      handleClose()
    } catch (error) {
      logger.error('ReportModal: submit failed', error)
      // Surface the backend's specific message when it's a user-facing one
      // (e.g. "You already reported this", "Cannot report your own content",
      // rate-limit text). Fall back to the generic classifier otherwise.
      toast.error(error.message || getUserMessage(error, 'submitting your report'))
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in-up"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'var(--color-backdrop)' }}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="relative max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-card)', border: 'var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-float)' }}
      >
        <div className="p-6">
          <h2
            id="report-modal-title"
            className="mb-2"
            style={{ fontSize: '24px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}
          >
            Report this {targetKind}
          </h2>
          <p
            className="text-sm leading-relaxed mb-5"
            style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}
          >
            Let us know what's wrong. Reports go to our moderation team and stay private.
          </p>

          <fieldset className="mb-4" disabled={loading}>
            <legend className="sr-only">Reason</legend>
            <div className="space-y-2">
              {REPORT_REASONS.map((value) => (
                <label
                  key={value}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{
                    border: reason === value ? 'var(--border-subtle)' : '1px solid var(--color-divider)',
                    borderRadius: 'var(--radius-md)',
                    background: reason === value ? 'var(--color-highlight-muted)' : 'var(--color-card)',
                  }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--color-ink)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: reason === value ? 600 : 500 }}>
                    {REASON_LABELS[value]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block mb-5">
            <span
              className="text-sm mb-2 block"
              style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}
            >
              Details <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>(optional)</span>
            </span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, REPORT_DETAILS_MAX_LENGTH))}
              placeholder="Anything else we should know?"
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 resize-none focus:outline-none"
              style={{
                background: 'var(--color-surface-elevated)',
                border: 'var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: '16px',
                color: 'var(--color-text-primary)',
              }}
            />
            <div
              className="text-xs mt-1 text-right"
              style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}
            >
              {details.length} / {REPORT_DETAILS_MAX_LENGTH}
            </div>
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn flex-1 px-5 py-3"
              style={{
                background: 'var(--color-card)',
                color: 'var(--color-ink)',
                fontSize: '15px',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn flex-1 px-5 py-3"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-text-on-primary)',
                fontSize: '15px',
              }}
            >
              {loading ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
