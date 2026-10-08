import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLocalLists } from '../../hooks/useLocalLists'
import { useLocalListDetail } from '../../hooks/useLocalListDetail'

// Menu card styles — module-level constants
var MENU_CARD = {
  flexShrink: 0, width: '272px', scrollSnapAlign: 'start',
  background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', padding: '16px 16px 12px',
  border: 'var(--border-ink)', boxShadow: 'var(--shadow-hard)', position: 'relative',
}
var CURATOR_AVATAR = {
  width: '36px', height: '36px', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: 'var(--color-text-on-primary)', flexShrink: 0,
  border: 'var(--border-ink)',
}
var CURATOR_NAME = { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.05 }
var CURATOR_TAGLINE = { fontSize: '11px', fontWeight: 600, color: 'var(--color-text-tertiary)', marginTop: '2px' }
var RESTAURANT_HEADER = { fontSize: '10.5px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px', textAlign: 'left' }
var DISH_NAME_STYLE = { fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
var DISH_DOTS = { flex: 1, borderBottom: '2px dotted var(--color-divider)', minWidth: '12px', alignSelf: 'baseline', marginBottom: '3px' }
var DISH_RATING_STYLE = { fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800, color: 'var(--color-rating)', flexShrink: 0 }
var MENU_FOOTER = { borderTop: '2px solid var(--color-ink)', paddingTop: '10px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

// Rotating avatar inks for curators
var AVATAR_COLORS = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-ink)', 'var(--color-rating)']

function MenuCard({ list, index }) {
  var navigate = useNavigate()
  var { items, loading } = useLocalListDetail(list.user_id)

  var initial = (list.display_name || '?').charAt(0).toUpperCase()
  var avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]

  // Group items by restaurant
  var groups = []
  var groupMap = {}
  if (items && items.length > 0) {
    items.forEach(function (item) {
      var rid = item.restaurant_id
      if (!groupMap[rid]) {
        groupMap[rid] = { restaurant_name: item.restaurant_name, restaurant_id: rid, dishes: [] }
        groups.push(groupMap[rid])
      }
      groupMap[rid].dishes.push(item)
    })
  }

  var restaurantCount = groups.length
  var dishCount = items ? items.length : (list.item_count || 0)

  return (
    <div style={MENU_CARD}>
      {/* Curator header */}
      <div className="flex items-center gap-2.5" style={{ marginBottom: '10px' }}>
        {list.avatar_url ? (
          <img src={list.avatar_url} alt="" className="rounded-full" style={{ width: '36px', height: '36px', objectFit: 'cover', flexShrink: 0, border: 'var(--border-ink)' }} />
        ) : (
          <div style={Object.assign({}, CURATOR_AVATAR, { background: avatarColor })}>{initial}</div>
        )}
        <div>
          <p style={CURATOR_NAME}>{list.display_name}</p>
          {list.curator_tagline && <p style={CURATOR_TAGLINE}>{list.curator_tagline}</p>}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: 'var(--color-ink)', marginBottom: '10px' }} />

      {/* Restaurant-grouped dishes */}
      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '8px 0' }}>Loading...</p>
      ) : groups.length > 0 ? (
        groups.slice(0, 3).map(function (group) {
          return (
            <div key={group.restaurant_id} style={{ marginBottom: '8px' }}>
              <button
                onClick={function (e) { e.stopPropagation(); navigate('/restaurants/' + group.restaurant_id) }}
                style={RESTAURANT_HEADER}
              >
                {group.restaurant_name}
              </button>
              {group.dishes.slice(0, 3).map(function (dish) {
                return (
                  <button
                    key={dish.dish_id}
                    onClick={function (e) { e.stopPropagation(); navigate('/dish/' + dish.dish_id) }}
                    className="flex items-baseline w-full text-left"
                    style={{ padding: '2px 0 2px 6px', gap: '6px' }}
                  >
                    <span style={DISH_NAME_STYLE}>{dish.dish_name}</span>
                    <span style={DISH_DOTS} />
                    <span style={DISH_RATING_STYLE}>{dish.avg_rating ? Number(dish.avg_rating).toFixed(1) : '\u2014'}</span>
                  </button>
                )
              })}
            </div>
          )
        })
      ) : null}

      {/* Footer */}
      <div style={MENU_FOOTER}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
          {restaurantCount > 0 ? restaurantCount + ' restaurant' + (restaurantCount === 1 ? '' : 's') + ' \u00B7 ' : ''}{dishCount} dish{dishCount === 1 ? '' : 'es'}
        </span>
        <button
          onClick={function () { navigate('/user/' + list.user_id) }}
          style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)' }}
        >
          {'See full list \u2192'}
        </button>
      </div>
    </div>
  )
}

export function LocalListsSection({ onListExpanded }) {
  var { user } = useAuth()
  var { lists, loading } = useLocalLists(user ? user.id : null)

  if (loading || lists.length === 0) return null

  return (
    <div style={{ padding: '20px 0 16px' }}>
      {/* Section header — eyebrow + display heading */}
      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <p className="eyebrow">Curated by people who live here</p>
        <h2 style={{ fontSize: '24px', lineHeight: 1.05, marginTop: '4px', color: 'var(--color-text-primary)' }}>
          A Local{'\u2019'}s Guide to <span style={{ color: 'var(--color-primary)' }}>the Vineyard</span>
        </h2>
      </div>

      {/* Horizontal scroll of menu cards */}
      <div
        className="flex overflow-x-auto"
        style={{
          gap: '14px', padding: '2px 16px 10px',
          scrollSnapType: 'x mandatory',
          scrollPaddingInline: '16px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {lists.map(function (list, i) {
          return <MenuCard key={list.list_id} list={list} index={i} />
        })}
      </div>
    </div>
  )
}
