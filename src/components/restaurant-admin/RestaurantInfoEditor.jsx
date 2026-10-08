import { useState } from 'react'

/**
 * RestaurantInfoEditor - Editable contact/social fields for restaurant managers
 */
export function RestaurantInfoEditor({ restaurant, onUpdate }) {
  const [phone, setPhone] = useState(restaurant?.phone || '')
  const [websiteUrl, setWebsiteUrl] = useState(restaurant?.website_url || '')
  const [facebookUrl, setFacebookUrl] = useState(restaurant?.facebook_url || '')
  const [instagramUrl, setInstagramUrl] = useState(restaurant?.instagram_url || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({
        phone,
        website_url: websiteUrl,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--color-surface-elevated)',
    border: 'var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '16px',
  }

  return (
    <div className="space-y-4">
      <h3 style={{ fontSize: '20px', color: 'var(--color-text-primary)' }}>
        Restaurant Info
      </h3>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(508) 555-1234"
          className="w-full px-4 py-2.5 focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>Website</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2.5 focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>Facebook</label>
        <input
          type="url"
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
          placeholder="https://facebook.com/..."
          className="w-full px-4 py-2.5 focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>Instagram</label>
        <input
          type="url"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          placeholder="https://instagram.com/..."
          className="w-full px-4 py-2.5 focus:outline-none"
          style={inputStyle}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn w-full py-3 text-sm"
        style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
