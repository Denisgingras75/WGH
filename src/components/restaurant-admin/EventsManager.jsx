import { useState, useEffect, useRef } from 'react'
import { EVENT_TYPES } from '../../constants/eventTypes'
import { EmptyState } from '../EmptyState'
import { CARD_STYLE, INPUT_CLASS, INPUT_STYLE, LABEL_CLASS, LABEL_STYLE, PRIMARY_BUTTON_CLASS, ROW_ACTION_CLASS, SECONDARY_BUTTON_CLASS, SECONDARY_BUTTON_STYLE } from '../../constants/styles'

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
  const formRef = useRef(null)

  useEffect(() => {
    if (!showForm) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    formRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [showForm, editingId])

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
    if (submitting) return
    if (!eventName.trim() || !eventDate) return

    setSubmitting(true)
    try {
      const ok = editingId
        ? await onUpdate(editingId, {
          event_name: eventName.trim(),
          description: description.trim() || null,
          event_date: eventDate,
          start_time: startTime || null,
          end_time: endTime || null,
          event_type: eventType,
          recurring_pattern: recurringPattern || null,
        })
        : await onAdd({
          restaurantId,
          eventName: eventName.trim(),
          description: description.trim() || null,
          eventDate,
          startTime: startTime || null,
          endTime: endTime || null,
          eventType,
          recurringPattern: recurringPattern || null,
        })
      if (ok) resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  const activeEvents = events.filter(e => e.is_active)
  const inactiveEvents = events.filter(e => !e.is_active)

  return (
    <div>
      {/* Add/Edit Form Toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full mb-4 ${PRIMARY_BUTTON_CLASS}`}
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
        >
          + Add event
        </button>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mb-4 rounded-xl p-4"
          style={{ ...CARD_STYLE, scrollMarginTop: 'calc(84px + env(safe-area-inset-top))' }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {editingId ? 'Edit event' : 'New event'}
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="event-name" className={LABEL_CLASS} style={LABEL_STYLE}>Event name</label>
              <input
                id="event-name"
                type="text"
                autoComplete="off"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Jazz Night with The Trio"
                required
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label htmlFor="event-description" className={LABEL_CLASS} style={LABEL_STYLE}>Description</label>
              <input
                id="event-description"
                type="text"
                autoComplete="off"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label htmlFor="event-type" className={LABEL_CLASS} style={LABEL_STYLE}>Type</label>
              <select
                id="event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="event-date" className={LABEL_CLASS} style={LABEL_STYLE}>Date</label>
                <input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="event-repeats" className={LABEL_CLASS} style={LABEL_STYLE}>Repeats</label>
                <select
                  id="event-repeats"
                  value={recurringPattern}
                  onChange={(e) => setRecurringPattern(e.target.value)}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                >
                  <option value="">One-time</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="event-start" className={LABEL_CLASS} style={LABEL_STYLE}>Start time</label>
                <input
                  id="event-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="event-end" className={LABEL_CLASS} style={LABEL_STYLE}>End time</label>
                <input
                  id="event-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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
                {submitting ? 'Saving…' : editingId ? 'Update' : 'Add event'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-4" style={CARD_STYLE}>
          {activeEvents.map((event, index) => (
            <div
              key={event.id}
              className="px-4 py-2 flex flex-wrap items-start justify-between gap-x-2"
              style={{
                background: editingId === event.id ? 'var(--color-primary-muted)' : 'transparent',
                borderBottom: index < activeEvents.length - 1 ? '1px solid var(--color-divider)' : 'none',
              }}
            >
              <div className="flex-1 min-w-[10rem] py-1">
                <p className="font-semibold text-sm break-words" style={{ color: 'var(--color-text-primary)' }}>
                  {event.event_name}
                </p>
                {event.description && (
                  <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--color-text-secondary)' }}>
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
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
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {event.recurring_pattern}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 -mr-3 ml-auto">
                <button
                  onClick={() => handleEdit(event)}
                  className={ROW_ACTION_CLASS}
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeactivate(event.id)}
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

      {/* Inactive Events */}
      {inactiveEvents.length > 0 && (
        <div>
          <h3 className="mb-2" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
            Inactive
          </h3>
          <div className="rounded-xl overflow-hidden" style={CARD_STYLE}>
            {inactiveEvents.map((event, index) => (
              <div
                key={event.id}
                className="px-4 py-2 flex items-center justify-between gap-2"
                style={{ borderBottom: index < inactiveEvents.length - 1 ? '1px solid var(--color-divider)' : 'none' }}
              >
                <p className="flex-1 min-w-0 font-medium text-sm line-through break-words" style={{ color: 'var(--color-text-tertiary)' }}>
                  {event.event_name}
                </p>
                <button
                  onClick={() => onUpdate(event.id, { is_active: true })}
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
      {events.length === 0 && !showForm && (
        <EmptyState emoji="🎶" title="No events yet" subtitle="Add your first event above" />
      )}
    </div>
  )
}
