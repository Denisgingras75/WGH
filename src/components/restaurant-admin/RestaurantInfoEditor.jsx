import { useState } from 'react'
import { sanitizeUrl } from '../../utils/sanitize'
import { INPUT_CLASS, INPUT_STYLE, LABEL_CLASS, LABEL_STYLE } from '../../constants/styles'

const URL_FIELDS = [
  { key: 'website_url', id: 'info-website', label: 'Website', placeholder: 'https://...' },
  { key: 'facebook_url', id: 'info-facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram_url', id: 'info-instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
]

// "www.myplace.com" → "https://www.myplace.com". The public restaurant page only
// renders absolute http(s) links (sanitizeUrl), so a bare domain would silently vanish.
function normalizeUrl(value) {
  const trimmed = value.trim()
  return trimmed && !/^https?:\/\//i.test(trimmed) ? 'https://' + trimmed : trimmed
}

/**
 * RestaurantInfoEditor - Editable contact/social fields for restaurant managers
 */
export function RestaurantInfoEditor({ restaurant, onUpdate }) {
  const [values, setValues] = useState({
    phone: restaurant?.phone || '',
    website_url: restaurant?.website_url || '',
    facebook_url: restaurant?.facebook_url || '',
    instagram_url: restaurant?.instagram_url || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function setField(key, value) {
    setValues(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  async function handleSave() {
    if (saving) return

    const normalized = { ...values }
    const nextErrors = {}
    for (const { key } of URL_FIELDS) {
      normalized[key] = normalizeUrl(values[key])
      if (normalized[key] && !sanitizeUrl(normalized[key])) {
        nextErrors[key] = 'Enter a full web address, like https://example.com'
      }
    }
    setValues(normalized)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await onUpdate(normalized)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSave() }}
      noValidate
      className="rounded-xl p-4 space-y-4"
      style={{ background: 'var(--color-card)', border: '1px solid var(--color-divider)' }}
    >
      <h2
        style={{
          fontFamily: "'Amatic SC', cursive",
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1.1,
          color: 'var(--color-text-primary)',
        }}
      >
        Contact &amp; social
      </h2>

      <div>
        <label htmlFor="info-phone" className={LABEL_CLASS} style={LABEL_STYLE}>Phone</label>
        <input
          id="info-phone"
          type="tel"
          autoComplete="off"
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
          placeholder="(508) 555-1234"
          className={INPUT_CLASS}
          style={INPUT_STYLE}
        />
      </div>

      {URL_FIELDS.map(({ key, id, label, placeholder }) => (
        <div key={key}>
          <label htmlFor={id} className={LABEL_CLASS} style={LABEL_STYLE}>{label}</label>
          <input
            id={id}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={values[key]}
            onChange={(e) => setField(key, e.target.value)}
            placeholder={placeholder}
            aria-invalid={errors[key] ? true : undefined}
            aria-describedby={errors[key] ? `${id}-error` : undefined}
            className={INPUT_CLASS}
            style={errors[key] ? { ...INPUT_STYLE, borderColor: 'var(--color-danger)' } : INPUT_STYLE}
          />
          {errors[key] && (
            <p id={`${id}-error`} role="alert" className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>
              {errors[key]}
            </p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-text-on-primary)',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
