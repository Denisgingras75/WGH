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
    background: 'var(--color-bg)',
    border: '1.5px solid var(--color-divider)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        Restaurant Info
      </h3>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(508) 555-1234"
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Website</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Facebook</label>
        <input
          type="url"
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
          placeholder="https://facebook.com/..."
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Instagram</label>
        <input
          type="url"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          placeholder="https://instagram.com/..."
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={inputStyle}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
