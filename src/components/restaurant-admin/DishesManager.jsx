import { useState, useEffect, useRef } from 'react'
import { ALL_CATEGORIES } from '../../constants/categories'
import { sanitizeUrl } from '../../utils/sanitize'
import { EmptyState } from '../EmptyState'
import { MenuImportWizard } from './MenuImportWizard'
import { CARD_STYLE, INPUT_CLASS, INPUT_STYLE, LABEL_CLASS, LABEL_STYLE, PRIMARY_BUTTON_CLASS, ROW_ACTION_CLASS, SECONDARY_BUTTON_CLASS, SECONDARY_BUTTON_STYLE } from '../../constants/styles'

export function DishesManager({ restaurantId, dishes, onAdd, onUpdate, onDelete, onBulkAdd, restaurantName }) {
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const formRef = useRef(null)

  // Bring the form into view when it opens or switches to another dish —
  // Edit on a row far down the list otherwise looks like it did nothing.
  useEffect(() => {
    if (!showForm) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    formRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [showForm, editingId])

  function resetForm() {
    setName('')
    setCategory('')
    setPrice('')
    setPhotoUrl('')
    setFormError(null)
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(dish) {
    setEditingId(dish.id)
    setName(dish.name || '')
    setCategory(dish.category || '')
    setPrice(dish.price != null ? String(dish.price) : '')
    setPhotoUrl(dish.photo_url || '')
    setFormError(null)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    if (!name.trim() || (!editingId && !category)) return

    if (photoUrl.trim() && !sanitizeUrl(photoUrl)) {
      setFormError('Photo URL must start with http:// or https://')
      return
    }
    setFormError(null)

    setSubmitting(true)
    try {
      const ok = editingId
        ? await onUpdate(editingId, {
          name: name.trim(),
          price: price || null,
          photoUrl: photoUrl || null,
          // Blank select must never overwrite the stored category with ''
          category: category || undefined,
        })
        : await onAdd({
          restaurantId,
          name: name.trim(),
          category,
          price: price || null,
          photoUrl: photoUrl || null,
        })
      if (ok) resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(dishId) {
    setConfirmDeleteId(null)
    if (onDelete) {
      await onDelete(dishId)
    }
  }

  // Group dishes by category
  const grouped = {}
  for (const dish of dishes) {
    const cat = dish.category || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(dish)
  }
  const categoryKeys = Object.keys(grouped).sort()
  const categoryIsUnlisted = category && !ALL_CATEGORIES.some(c => c.id === category)

  // Show import wizard
  if (showImport) {
    return (
      <MenuImportWizard
        restaurantName={restaurantName}
        onBulkAdd={onBulkAdd}
        onClose={() => setShowImport(false)}
      />
    )
  }

  return (
    <div>
      {!showForm ? (
        <div className="space-y-2 mb-4">
          <button
            onClick={() => setShowImport(true)}
            className={`w-full ${PRIMARY_BUTTON_CLASS}`}
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Import menu
          </button>
          <button
            onClick={() => setShowForm(true)}
            className={`w-full ${SECONDARY_BUTTON_CLASS}`}
            style={SECONDARY_BUTTON_STYLE}
          >
            + Add dish
          </button>
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mb-4 rounded-xl p-4"
          style={{ ...CARD_STYLE, scrollMarginTop: 'calc(84px + env(safe-area-inset-top))' }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {editingId ? 'Edit dish' : 'New dish'}
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="dish-name" className={LABEL_CLASS} style={LABEL_STYLE}>Dish name</label>
              <input
                id="dish-name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lobster Roll"
                required
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="dish-category" className={LABEL_CLASS} style={LABEL_STYLE}>Category</label>
                <select
                  id="dish-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required={!editingId}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                >
                  <option value="">Select category…</option>
                  {categoryIsUnlisted && <option value={category}>{category}</option>}
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="dish-price" className={LABEL_CLASS} style={LABEL_STYLE}>Price</label>
                <input
                  id="dish-price"
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
            </div>
            <div>
              <label htmlFor="dish-photo-url" className={LABEL_CLASS} style={LABEL_STYLE}>Photo URL</label>
              <input
                id="dish-photo-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={photoUrl}
                onChange={(e) => { setPhotoUrl(e.target.value); setFormError(null) }}
                placeholder="https://..."
                aria-describedby="dish-photo-url-help"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
              <p id="dish-photo-url-help" className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Use a Supabase storage or Unsplash link. Other hosts won't display.
              </p>
            </div>
            {formError && (
              <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>{formError}</p>
            )}
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
                {submitting ? 'Saving…' : editingId ? 'Update' : 'Add dish'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Dishes grouped by category */}
      {categoryKeys.map((cat) => {
        const meta = ALL_CATEGORIES.find(c => c.id === cat)
        const group = grouped[cat]
        return (
          <div key={cat} className="mb-4">
            <h3 className="mb-2" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
              {meta ? `${meta.emoji} ${meta.label}` : cat}
            </h3>
            <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
              {group.map((dish, index) => {
                const locked = dish.total_votes > 0
                return (
                  <div
                    key={dish.id}
                    className="px-4 py-2 flex items-center justify-between gap-2"
                    style={{
                      background: editingId === dish.id ? 'var(--color-primary-muted)' : 'transparent',
                      borderBottom: index < group.length - 1 ? '1px solid var(--color-divider)' : 'none',
                    }}
                  >
                    <div className="flex-1 min-w-0 py-1">
                      <p className="font-semibold text-sm break-words" style={{ color: 'var(--color-text-primary)' }}>
                        {dish.name}
                      </p>
                      {dish.price != null && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          ${Number(dish.price).toFixed(2)}
                        </p>
                      )}
                      {locked && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                          Has ratings, so it can't be removed
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 -mr-3 flex-shrink-0">
                      {confirmDeleteId === dish.id ? (
                        <>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className={ROW_ACTION_CLASS}
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            No
                          </button>
                          <button
                            onClick={() => handleDelete(dish.id)}
                            className={ROW_ACTION_CLASS}
                            style={{ color: 'var(--color-danger)' }}
                          >
                            Confirm
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(dish)}
                            className={ROW_ACTION_CLASS}
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Edit
                          </button>
                          {locked ? (
                            <span
                              className="inline-flex items-center gap-1 px-3 text-sm font-semibold"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Locked
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(dish.id)}
                              className={ROW_ACTION_CLASS}
                              style={{ color: 'var(--color-danger)' }}
                            >
                              Remove
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Empty State */}
      {dishes.length === 0 && !showForm && (
        <EmptyState emoji="🍽️" title="No dishes yet" subtitle="Import your menu or add a dish above" />
      )}
    </div>
  )
}
