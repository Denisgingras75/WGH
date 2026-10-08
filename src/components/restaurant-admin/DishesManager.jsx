import { useState } from 'react'
import { MAIN_CATEGORIES } from '../../constants/categories'
import { MenuImportWizard } from './MenuImportWizard'

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
const EMPTY_STYLE = {
  background: 'var(--color-surface)',
  border: '1px dashed var(--color-divider-strong)',
  borderRadius: 'var(--radius-lg)',
}

export function DishesManager({ restaurantId, dishes, onAdd, onUpdate, onDelete, onBulkAdd, restaurantName }) {
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function resetForm() {
    setName('')
    setCategory('')
    setPrice('')
    setPhotoUrl('')
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(dish) {
    setEditingId(dish.id)
    setName(dish.name || '')
    setCategory(dish.category || '')
    setPrice(dish.price ? String(dish.price) : '')
    setPhotoUrl(dish.photo_url || '')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || (!editingId && !category)) return

    setSubmitting(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          name: name.trim(),
          price: price || null,
          photoUrl: photoUrl || null,
          category,
        })
      } else {
        await onAdd({
          restaurantId,
          name: name.trim(),
          category,
          price: price || null,
          photoUrl: photoUrl || null,
        })
      }
      resetForm()
    } catch {
      // Parent handles error display via setMessage
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

  // Show import wizard
  if (showImport) {
    return (
      <div>
        <MenuImportWizard
          restaurantName={restaurantName}
          onBulkAdd={onBulkAdd}
          onClose={() => setShowImport(false)}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Import Menu Button (primary) */}
      {!showForm && (
        <button
          onClick={() => setShowImport(true)}
          className="btn w-full py-3 text-sm mb-3"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
        >
          Import Menu
        </button>
      )}

      {/* Add/Edit Form Toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 transition-colors mb-4"
          style={EMPTY_STYLE}
        >
          <span className="text-sm" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>+ Add Dish</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4 p-4" style={PANEL_STYLE}>
          <h3 className="mb-3" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
            {editingId ? 'Edit Dish' : 'New Dish'}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dish name"
              required
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required={!editingId}
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            >
              <option value="">Select category...</option>
              {MAIN_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
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
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Photo URL"
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
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Dish'}
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

      {/* Dishes grouped by category */}
      {categoryKeys.map((cat) => (
        <div key={cat} className="mb-4">
          <h3 className="eyebrow mb-2">
            {cat}
          </h3>
          <div className="space-y-1.5">
            {grouped[cat].map((dish) => (
              <div
                key={dish.id}
                className="p-3 transition-colors"
                style={{
                  background: editingId === dish.id ? 'var(--color-highlight-muted)' : 'var(--color-card)',
                  border: editingId === dish.id ? 'var(--border-default)' : 'var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                      {dish.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    {dish.price && (
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                        ${Number(dish.price).toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => handleEdit(dish)}
                      className="text-xs px-2.5 py-1"
                      style={{ ...PILL_BTN_STYLE, color: 'var(--color-ink)' }}
                    >
                      Edit
                    </button>
                    {dish.total_votes > 0 ? (
                      <span
                        title="Locked — this dish has ratings from the community. Contact support to remove."
                        className="text-xs px-2 py-1 inline-flex items-center gap-1"
                        style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Locked
                      </span>
                    ) : confirmDeleteId === dish.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(dish.id)}
                          className="text-xs px-2.5 py-1"
                          style={{ ...PILL_BTN_STYLE, color: 'var(--color-danger)' }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2.5 py-1"
                          style={{ ...PILL_BTN_STYLE, color: 'var(--color-text-secondary)' }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(dish.id)}
                        className="text-xs px-2.5 py-1"
                        style={{ ...PILL_BTN_STYLE, color: 'var(--color-danger)' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {dishes.length === 0 && !showForm && (
        <div className="text-center py-8 px-4" style={EMPTY_STYLE}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            No dishes yet. Import your menu or add one manually!
          </p>
        </div>
      )}
    </div>
  )
}
