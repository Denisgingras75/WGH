import { useState } from 'react'
import { validateUserContent } from '../../lib/reviewBlocklist'

const INPUT_STYLE = {
  background: 'var(--color-surface-elevated)',
  border: 'var(--border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: '16px',
}
const PANEL_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
}
const PILL_BTN_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-subtle)',
  borderRadius: 'var(--radius-pill)',
  fontWeight: 700,
}
const ROW_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
}
const INACTIVE_ROW_STYLE = {
  background: 'var(--color-surface)',
  border: '1px dashed var(--color-divider-strong)',
  borderRadius: 'var(--radius-lg)',
}
const EMPTY_STYLE = {
  background: 'var(--color-surface)',
  border: '1px dashed var(--color-divider-strong)',
  borderRadius: 'var(--radius-lg)',
}

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
    result.expiresAt = expires.toISOString().slice(0, 16) // datetime-local format
  }

  return result
}

export function SpecialsManager({ restaurantId, specials, onAdd, onUpdate, onDeactivate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [dealName, setDealName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Quick-add state
  const [quickText, setQuickText] = useState('')
  const [quickSubmitting, setQuickSubmitting] = useState(false)
  const [quickError, setQuickError] = useState(null)

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
    setPrice(special.price ? String(special.price) : '')
    setExpiresAt(special.expires_at ? special.expires_at.slice(0, 16) : '')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!dealName.trim()) return

    setSubmitting(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          deal_name: dealName.trim(),
          description: description.trim() || null,
          price: price ? parseFloat(price) : null,
          expires_at: expiresAt || null,
        })
      } else {
        await onAdd({
          restaurantId,
          dealName: dealName.trim(),
          description: description.trim() || null,
          price: price ? parseFloat(price) : null,
          expiresAt: expiresAt || null,
        })
      }
      resetForm()
    } catch {
      // Parent handles error display via setMessage
    } finally {
      setSubmitting(false)
    }
  }

  async function handleQuickPost() {
    if (!quickText.trim()) return

    const contentError = validateUserContent(quickText, 'Special')
    if (contentError) {
      setQuickError(contentError)
      return
    }

    setQuickSubmitting(true)
    setQuickError(null)
    try {
      const parsed = parseQuickSpecial(quickText)
      await onAdd({
        restaurantId,
        dealName: parsed.dealName,
        description: null,
        price: parsed.price,
        expiresAt: parsed.expiresAt,
      })
      setQuickText('')
    } catch {
      // Parent handles error display
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

  return (
    <div>
      {/* Quick-Add Bar */}
      {!showForm && (
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={quickText}
              onChange={(e) => { setQuickText(e.target.value); setQuickError(null) }}
              onKeyDown={handleQuickKeyDown}
              placeholder="Half-price oysters until 6pm"
              className="flex-1 min-w-0 px-3 py-2.5"
              style={{ ...INPUT_STYLE, boxShadow: 'var(--shadow-card)' }}
            />
            <button
              onClick={handleQuickPost}
              disabled={!quickText.trim() || quickSubmitting}
              className="btn px-4 py-2.5 text-sm"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              {quickSubmitting ? '...' : 'Post'}
            </button>
          </div>
          {quickError && (
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-danger)' }}>{quickError}</p>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="text-xs mt-2"
            style={{ color: 'var(--color-accent)', fontWeight: 700 }}
          >
            or use full form
          </button>
        </div>
      )}

      {/* Full Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4" style={PANEL_STYLE}>
          <h3 className="mb-3" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
            {editingId ? 'Edit Special' : 'New Special'}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="Deal name (e.g., Half-Price Wings)"
              required
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            />
            <div className="flex gap-3">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price ($)"
                step="0.01"
                min="0"
                className="flex-1 min-w-0 px-3 py-2"
                style={INPUT_STYLE}
              />
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2"
                style={INPUT_STYLE}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn flex-1 py-2 text-sm"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Special'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn px-4 py-2 text-sm"
                style={{ background: 'var(--color-card)', color: 'var(--color-ink)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Active Specials */}
      {activeSpecials.length > 0 && (
        <div className="space-y-2 mb-4">
          {activeSpecials.map((special) => (
            <div
              key={special.id}
              className="p-3"
              style={ROW_STYLE}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    {special.deal_name}
                  </p>
                  {special.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {special.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {special.price && (
                      <span className="text-sm" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--color-ink)' }}>
                        ${Number(special.price).toFixed(2)}
                      </span>
                    )}
                    {special.expires_at && (
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        Expires {new Date(special.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => handleEdit(special)}
                    className="text-xs px-2.5 py-1"
                    style={{ ...PILL_BTN_STYLE, color: 'var(--color-ink)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeactivate(special.id)}
                    className="text-xs px-2.5 py-1"
                    style={{ ...PILL_BTN_STYLE, color: 'var(--color-danger)' }}
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inactive Specials */}
      {inactiveSpecials.length > 0 && (
        <div>
          <p className="eyebrow mb-2">
            Inactive
          </p>
          <div className="space-y-2 opacity-50">
            {inactiveSpecials.map((special) => (
              <div
                key={special.id}
                className="p-3 flex items-center justify-between"
                style={INACTIVE_ROW_STYLE}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {special.deal_name}
                  </p>
                </div>
                <button
                  onClick={() => onUpdate(special.id, { is_active: true })}
                  className="text-xs px-2.5 py-1"
                  style={{ ...PILL_BTN_STYLE, color: 'var(--color-primary)' }}
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
        <div className="text-center py-8 px-4" style={EMPTY_STYLE}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            No specials yet. Type one above or use the full form!
          </p>
        </div>
      )}
    </div>
  )
}
