import { useState } from 'react'
import { EVENT_TYPES } from '../../constants/eventTypes'

const INPUT_STYLE = {
  background: 'var(--color-surface-elevated)',
  border: 'var(--border-ink)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontSize: '16px',
}
const PANEL_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-ink)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-hard)',
}
const PILL_BTN_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-ink-thin)',
  borderRadius: 'var(--radius-pill)',
  fontWeight: 700,
}
const ROW_STYLE = {
  background: 'var(--color-card)',
  border: 'var(--border-ink)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-hard-sm)',
}
const INACTIVE_ROW_STYLE = {
  background: 'var(--color-surface)',
  border: '2px dashed var(--color-divider)',
  borderRadius: 'var(--radius-lg)',
}
const EMPTY_STYLE = {
  background: 'var(--color-surface)',
  border: '2px dashed var(--color-text-tertiary)',
  borderRadius: 'var(--radius-lg)',
}

export function EventsManager({ restaurantId, events, onAdd, onUpdate, onDeactivate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [eventName, setEventName] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [eventType, setEventType] = useState('live_music')
  const [recurringPattern, setRecurringPattern] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function resetForm() {
    setEventName('')
    setDescription('')
    setEventDate('')
    setStartTime('')
    setEndTime('')
    setEventType('live_music')
    setRecurringPattern('')
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(event) {
    setEditingId(event.id)
    setEventName(event.event_name || '')
    setDescription(event.description || '')
    setEventDate(event.event_date || '')
    setStartTime(event.start_time ? event.start_time.slice(0, 5) : '')
    setEndTime(event.end_time ? event.end_time.slice(0, 5) : '')
    setEventType(event.event_type || 'live_music')
    setRecurringPattern(event.recurring_pattern || '')
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!eventName.trim() || !eventDate) return

    setSubmitting(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          event_name: eventName.trim(),
          description: description.trim() || null,
          event_date: eventDate,
          start_time: startTime || null,
          end_time: endTime || null,
          event_type: eventType,
          recurring_pattern: recurringPattern || null,
        })
      } else {
        await onAdd({
          restaurantId,
          eventName: eventName.trim(),
          description: description.trim() || null,
          eventDate,
          startTime: startTime || null,
          endTime: endTime || null,
          eventType,
          recurringPattern: recurringPattern || null,
        })
      }
      resetForm()
    } catch {
      // Parent handles error display via setMessage
    } finally {
      setSubmitting(false)
    }
  }

  const activeEvents = events.filter(e => e.is_active)
  const inactiveEvents = events.filter(e => !e.is_active)

  function formatEventDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return null
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return m === '00' ? `${hour12}${ampm}` : `${hour12}:${m}${ampm}`
  }

  return (
    <div>
      {/* Add/Edit Form Toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 transition-colors mb-4"
          style={EMPTY_STYLE}
        >
          <span className="text-sm" style={{ fontWeight: 800, color: 'var(--color-ink)' }}>+ Add Event</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4 p-4" style={PANEL_STYLE}>
          <h3 className="mb-3" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
            {editingId ? 'Edit Event' : 'New Event'}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name (e.g., Jazz Night with The Trio)"
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
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2"
              style={INPUT_STYLE}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="flex-1 min-w-0 px-3 py-2"
                style={INPUT_STYLE}
              />
              <select
                value={recurringPattern}
                onChange={(e) => setRecurringPattern(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2"
                style={INPUT_STYLE}
              >
                <option value="">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex gap-3">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Start time"
                className="flex-1 min-w-0 px-3 py-2"
                style={INPUT_STYLE}
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="End time"
                className="flex-1 min-w-0 px-3 py-2"
                style={INPUT_STYLE}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-ink flex-1 py-2 text-sm"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Event'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-ink px-4 py-2 text-sm"
                style={{ background: 'var(--color-card)', color: 'var(--color-ink)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="space-y-2 mb-4">
          {activeEvents.map((event) => (
            <div
              key={event.id}
              className="p-3"
              style={ROW_STYLE}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                    {event.event_name}
                  </p>
                  {event.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        background: 'var(--color-butter)',
                        border: 'var(--border-ink-thin)',
                        color: 'var(--color-ink)',
                      }}
                    >
                      {EVENT_TYPES.find(t => t.value === event.event_type)?.label || event.event_type}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatEventDate(event.event_date)}
                    </span>
                    {event.start_time && (
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {formatTime(event.start_time)}
                      </span>
                    )}
                    {event.recurring_pattern && (
                      <span className="text-xs" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                        {event.recurring_pattern}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-xs px-2.5 py-1"
                    style={{ ...PILL_BTN_STYLE, color: 'var(--color-ink)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeactivate(event.id)}
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

      {/* Inactive Events */}
      {inactiveEvents.length > 0 && (
        <div>
          <p className="eyebrow mb-2">
            Inactive
          </p>
          <div className="space-y-2 opacity-50">
            {inactiveEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 flex items-center justify-between"
                style={INACTIVE_ROW_STYLE}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {event.event_name}
                  </p>
                </div>
                <button
                  onClick={() => onUpdate(event.id, { is_active: true })}
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
      {events.length === 0 && !showForm && (
        <div className="text-center py-8 px-4" style={EMPTY_STYLE}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            No events yet. Add your first one!
          </p>
        </div>
      )}
    </div>
  )
}
