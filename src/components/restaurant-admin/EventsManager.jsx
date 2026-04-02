import { useState } from 'react'
import { EVENT_TYPES } from '../../constants/eventTypes'

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
          className="w-full py-3 rounded-xl border-2 border-dashed transition-all mb-4"
          style={{ borderColor: 'var(--color-divider)', color: 'var(--color-primary)' }}
        >
          <span className="font-semibold text-sm">+ Add Event</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-xl border" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-divider)' }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {editingId ? 'Edit Event' : 'New Event'}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name (e.g., Jazz Night with The Trio)"
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
            />
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
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
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
              />
              <select
                value={recurringPattern}
                onChange={(e) => setRecurringPattern(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
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
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="End time"
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Event'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-elevated)' }}
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
              className="p-3 rounded-xl border"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-divider)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {event.event_name}
                  </p>
                  {event.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(var(--color-primary-rgb), 0.15)',
                        color: 'var(--color-primary)',
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
                      <span className="text-xs" style={{ color: 'var(--color-accent-gold)' }}>
                        {event.recurring_pattern}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeactivate(event.id)}
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ color: 'var(--color-danger)' }}
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
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Inactive
          </p>
          <div className="space-y-2 opacity-50">
            {inactiveEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-xl border flex items-center justify-between"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-divider)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-through" style={{ color: 'var(--color-text-secondary)' }}>
                    {event.event_name}
                  </p>
                </div>
                <button
                  onClick={() => onUpdate(event.id, { is_active: true })}
                  className="text-xs font-medium px-2 py-1 rounded"
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
      {events.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No events yet. Add your first one!
          </p>
        </div>
      )}
    </div>
  )
}
