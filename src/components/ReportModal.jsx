import { useState } from 'react'
import { toast } from 'sonner'
import { reportsApi, REPORT_REASONS, REPORT_DETAILS_MAX_LENGTH } from '../api/reportsApi'
import { capture } from '../lib/analytics'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getUserFacingMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { INPUT_CLASS, INPUT_STYLE } from '../constants/styles'

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
      // Reset loading directly — handleClose() here is the stale closure from
      // the render where loading was false, and the modal stays mounted in
      // every caller, so it must reopen in a clean state.
      setLoading(false)
      onClose()
      setReason('')
      setDetails('')
    } catch (error) {
      logger.error('ReportModal: submit failed', error)
      // Backend text is shown only when reportsApi flags it as user-facing
      // (e.g. "You already reported this"); network errors get the classified message.
      toast.error(getUserFacingMessage(error, 'submitting your report'))
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
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="relative rounded-3xl max-w-md w-full shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-surface-elevated)', maxHeight: 'calc(100dvh - 32px)' }}
      >
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-8 pt-8 pb-4">
          <h2
            id="report-modal-title"
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Report this {targetKind}
          </h2>
          <p
            className="text-sm leading-relaxed mb-5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Let us know what's wrong. Reports go to our moderation team and stay private.
          </p>

          <fieldset className="mb-4" disabled={loading}>
            <legend className="sr-only">Reason</legend>
            <div className="space-y-2">
              {REPORT_REASONS.map((value) => (
                <label
                  key={value}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    border: `1px solid ${reason === value ? 'var(--color-primary)' : 'var(--color-divider)'}`,
                    background: reason === value ? 'var(--color-primary-muted)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {REASON_LABELS[value]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="report-details"
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Details <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="report-details"
              aria-describedby="report-details-count"
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, REPORT_DETAILS_MAX_LENGTH))}
              placeholder="Anything else we should know?"
              rows={3}
              disabled={loading}
              className={INPUT_CLASS + ' resize-none'}
              style={INPUT_STYLE}
            />
            <div
              id="report-details-count"
              className="text-xs mt-1 text-right"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {details.length} / {REPORT_DETAILS_MAX_LENGTH}
            </div>
          </div>
        </div>

        <div
          className="flex gap-3 px-8 pt-4 pb-8"
          style={{ borderTop: '1px solid var(--color-divider)' }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
              fontSize: '15px',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
            style={{
              background: canSubmit ? 'var(--color-primary)' : 'var(--color-surface)',
              color: canSubmit ? 'var(--color-text-on-primary)' : 'var(--color-text-tertiary)',
              fontSize: '15px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}
