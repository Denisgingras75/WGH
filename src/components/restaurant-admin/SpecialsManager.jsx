import { useState, useEffect, useRef } from 'react'
import { validateUserContent } from '../../lib/reviewBlocklist'
import { EmptyState } from '../EmptyState'
import { CARD_STYLE, INPUT_CLASS, INPUT_STYLE, LABEL_CLASS, LABEL_STYLE, PRIMARY_BUTTON_CLASS, ROW_ACTION_CLASS, SECONDARY_BUTTON_CLASS, SECONDARY_BUTTON_STYLE } from '../../constants/styles'

/**
 * Parse a natural language special into structured fields.
 * Zero API cost — pure client-side regex extraction.
 * e.g., "Half-price oysters until 6pm" → { dealName, price, expiresAt }
 */
function parseQuickSpecial(text) {
  const result = { dealName: text.trim(), price: null, expiresAt: null }

  // Extract price: $X or $X.XX
  const priceMatch = text.match(/\$(\d+(?:\.\d{1,2})?)/)
  if (priceMatch) {
    result.price = parseFloat(priceMatch[1])
  }

  // Extract time: "until Xpm", "til Xam", "through X:XX pm", "before X pm"
  const timeMatch = text.match(/(?:until|til|'til|through|before|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10)
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const period = timeMatch[3].toLowerCase()
    if (period === 'pm' && hours < 12) hours += 12
    if (period === 'am' && hours === 12) hours = 0

    // Set expiry to today at that time
    const now = new Date()
    const expires = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    // If time already passed today, set to tomorrow
    if (expires <= now) {
      expires.setDate(expires.getDate() + 1)
    }
    result.expiresAt = expires.toISOString() // UTC instant for the TIMESTAMPTZ column
  }

  return result
}

// ISO/TIMESTAMPTZ string → "YYYY-MM-DDTHH:mm" in the viewer's local time, for <input type="datetime-local">
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// datetime-local value (local wall time, no offset) → UTC ISO string, so 6pm means 6pm here
function toIsoOrNull(localValue) {
  return localValue ? new Date(localValue).toISOString() : null
}

function formatExpiry(iso) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function SpecialsManager({ restaurantId, specials, onAdd, onUpdate, onDeactivate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [dealName, setDealName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef(null)

  // Quick-add state
  const [quickText, setQuickText] = useState('')
  const [quickSubmitting, setQuickSubmitting] = useState(false)
  const [quickError, setQuickError] = useState(null)

  useEffect(() => {
    if (!showForm) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    formRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [showForm, editingId])

  function resetForm() {
    setDealName('')
    setDescription('')
    setPrice('')
    setExpiresAt('')
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(special) {
    setEditingId(special.id)
    setDealName(special.deal_name || '')
    setDescription(special.description || '')
    setPrice(special.price != null ? String(special.price) : '')
    setExpiresAt(toLocalInput(special.expires_at))
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    if (!dealName.trim()) return

    setSubmitting(true)
    try {
      const ok = editingId
        ? await onUpdate(editingId, {
          deal_name: dealName.trim(),
          description: description.trim() || null,
          price: price ? parseFloat(price) : null,
          expires_at: toIsoOrNull(expiresAt),
        })
        : await onAdd({
          restaurantId,
          dealName: dealName.trim(),
          description: description.trim() || null,
          price: price ? parseFloat(price) : null,
          expiresAt: toIsoOrNull(expiresAt),
        })
      if (ok) resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleQuickPost() {
    if (!quickText.trim() || quickSubmitting) return

    const contentError = validateUserContent(quickText, 'Special')
    if (contentError) {
      setQuickError(contentError)
      return
    }

    setQuickSubmitting(true)
    setQuickError(null)
    try {
      const parsed = parseQuickSpecial(quickText)
      const ok = await onAdd({
        restaurantId,
        dealName: parsed.dealName,
        description: null,
        price: parsed.price,
        expiresAt: parsed.expiresAt,
      })
      if (ok) setQuickText('')
    } finally {
      setQuickSubmitting(false)
    }
  }

  function handleQuickKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickPost()
    }
  }

  const activeSpecials = specials.filter(s => s.is_active)
  const inactiveSpecials = specials.filter(s => !s.is_active)
  const quickEmpty = !quickText.trim()

  return (
    <div>
      {/* Quick-Add Bar */}
      {!showForm && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              aria-label="Quick special"
              enterKeyHint="send"
              autoComplete="off"
              value={quickText}
              onChange={(e) => { setQuickText(e.target.value); setQuickError(null) }}
              onKeyDown={handleQuickKeyDown}
              placeholder="Half-price oysters until 6pm"
              aria-invalid={quickError ? true : undefined}
              aria-describedby={quickError ? 'quick-special-error' : undefined}
              className={`flex-1 min-w-0 ${INPUT_CLASS}`}
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={handleQuickPost}
              disabled={quickEmpty || quickSubmitting}
              className={`flex-shrink-0 ${PRIMARY_BUTTON_CLASS}`}
              style={quickEmpty
                ? { background: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }
                : { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: quickSubmitting ? 0.7 : 1 }
              }
            >
              {quickSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
          {quickError && (
            <p id="quick-special-error" role="alert" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
              {quickError}
            </p>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center min-h-[44px] text-sm font-semibold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            or use full form
          </button>
        </div>
      )}

      {/* Full Add/Edit Form */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mb-4 rounded-xl p-4"
          style={{ ...CARD_STYLE, scrollMarginTop: 'calc(84px + env(safe-area-inset-top))' }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {editingId ? 'Edit special' : 'New special'}
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="special-deal" className={LABEL_CLASS} style={LABEL_STYLE}>Deal</label>
              <input
                id="special-deal"
                type="text"
                autoComplete="off"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                placeholder="e.g., Half-Price Wings"
                required
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label htmlFor="special-description" className={LABEL_CLASS} style={LABEL_STYLE}>Description</label>
              <input
                id="special-description"
                type="text"
                autoComplete="off"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2 min-w-0">
                <label htmlFor="special-price" className={LABEL_CLASS} style={LABEL_STYLE}>Price</label>
                <input
                  id="special-price"
                  type="number"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="$"
                  step="0.01"
                  min="0"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>
              <div className="col-span-3 min-w-0">
                <label htmlFor="special-expires" className={LABEL_CLASS} style={LABEL_STYLE}>Expires</label>
                <input
                  id="special-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className={`flex-1 ${SECONDARY_BUTTON_CLASS}`}
                style={SECONDARY_BUTTON_STYLE}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 ${PRIMARY_BUTTON_CLASS}`}
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-on-primary)',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Saving…' : editingId ? 'Update' : 'Add special'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Active Specials */}
      {activeSpecials.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-4" style={CARD_STYLE}>
          {activeSpecials.map((special, index) => (
            <div
              key={special.id}
              className="px-4 py-2 flex flex-wrap items-start justify-between gap-x-2"
              style={{
                background: editingId === special.id ? 'var(--color-primary-muted)' : 'transparent',
                borderBottom: index < activeSpecials.length - 1 ? '1px solid var(--color-divider)' : 'none',
              }}
            >
              <div className="flex-1 min-w-[10rem] py-1">
                <p className="font-semibold text-sm break-words" style={{ color: 'var(--color-text-primary)' }}>
                  {special.deal_name}
                </p>
                {special.description && (
                  <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--color-text-secondary)' }}>
                    {special.description}
                  </p>
                )}
                {(special.price != null || special.expires_at) && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    {special.price != null && (
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(special.price).toFixed(2)}
                      </span>
                    )}
                    {special.expires_at && (
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        Until {formatExpiry(special.expires_at)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 -mr-3 ml-auto">
                <button
                  onClick={() => handleEdit(special)}
                  className={ROW_ACTION_CLASS}
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeactivate(special.id)}
                  className={ROW_ACTION_CLASS}
                  style={{ color: 'var(--color-danger)' }}
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inactive Specials */}
      {inactiveSpecials.length > 0 && (
        <div>
          <h3 className="mb-2" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
            Inactive
          </h3>
          <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
            {inactiveSpecials.map((special, index) => (
              <div
                key={special.id}
                className="px-4 py-2 flex items-center justify-between gap-2"
                style={{ borderBottom: index < inactiveSpecials.length - 1 ? '1px solid var(--color-divider)' : 'none' }}
              >
                <p className="flex-1 min-w-0 font-medium text-sm line-through break-words" style={{ color: 'var(--color-text-tertiary)' }}>
                  {special.deal_name}
                </p>
                <button
                  onClick={() => onUpdate(special.id, { is_active: true })}
                  className={`${ROW_ACTION_CLASS} -mr-3 flex-shrink-0`}
                  style={{ color: 'var(--color-primary)' }}
                >
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {specials.length === 0 && !showForm && (
        <EmptyState emoji="🏷️" title="No specials yet" subtitle="Type one above or use the full form" />
      )}
    </div>
  )
}
