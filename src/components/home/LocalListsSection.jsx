import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLocalLists } from '../../hooks/useLocalLists'
import { useLocalListDetail } from '../../hooks/useLocalListDetail'

// Menu card styles — module-level constants
var MENU_CARD = {
  flexShrink: 0, width: '270px', scrollSnapAlign: 'start',
  background: '#FFFDF8', borderRadius: '3px', padding: '20px 16px 14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.07)',
  border: '1px solid rgba(0,0,0,0.04)', position: 'relative',
}
var CURATOR_AVATAR = {
  width: '32px', height: '32px', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0,
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
}
var CURATOR_NAME = { fontFamily: "'Amatic SC', cursive", fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }
var CURATOR_TAGLINE = { fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '1px', fontStyle: 'italic' }
var RESTAURANT_HEADER = { fontFamily: "'Amatic SC', cursive", fontSize: '18px', fontWeight: 700, color: 'var(--color-accent-gold)', letterSpacing: '0.02em', marginBottom: '3px' }
var DISH_NAME_STYLE = { fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }
var DISH_DOTS = { flex: 1, borderBottom: '1px dotted var(--color-divider)', minWidth: '12px', alignSelf: 'baseline', marginBottom: '3px' }
var DISH_RATING_STYLE = { fontSize: '13px', fontWeight: 700, color: 'var(--color-rating)', flexShrink: 0 }
var MENU_FOOTER = { borderTop: '1px solid var(--color-divider)', paddingTop: '10px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

// Rotating avatar colors for curators
var AVATAR_COLORS = ['var(--color-primary)', 'var(--color-accent-gold)', 'var(--color-rating)', '#3B82F6', '#9333EA']

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
    <div style={MENU_CARD} className="active:scale-[0.98] transition-transform">
      {/* Curator header */}
      <div className="flex items-center gap-2.5" style={{ marginBottom: '10px' }}>
        {list.avatar_url ? (
          <img src={list.avatar_url} alt="" className="rounded-full" style={{ width: '32px', height: '32px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
        ) : (
          <div style={Object.assign({}, CURATOR_AVATAR, { background: avatarColor })}>{initial}</div>
        )}
        <div>
          <p style={CURATOR_NAME}>{list.display_name}</p>
          {list.curator_tagline && <p style={CURATOR_TAGLINE}>{list.curator_tagline}</p>}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--color-divider)', marginBottom: '10px' }} />

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
        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
          {restaurantCount > 0 ? restaurantCount + ' restaurant' + (restaurantCount === 1 ? '' : 's') + ' \u00B7 ' : ''}{dishCount} dish{dishCount === 1 ? '' : 'es'}
        </span>
        <button
          onClick={function () { navigate('/user/' + list.user_id) }}
          style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}
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
    <div style={{ padding: '8px 0 24px' }}>
      {/* Section header — centered with flanking lines */}
      <div className="flex items-center gap-4" style={{ padding: '0 20px', marginBottom: '4px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-divider)' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Amatic SC', cursive", fontSize: '26px', fontWeight: 700,
            color: 'var(--color-text-primary)', whiteSpace: 'nowrap', lineHeight: 1.1,
          }}>
            A Local's Guide to <span style={{ color: 'var(--color-primary)' }}>Martha's Vineyard</span>
          </p>
        </div>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-divider)' }} />
      </div>
      <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', padding: '2px 20px 14px' }}>
        Curated by people who live here
      </p>

      {/* Horizontal scroll of menu cards */}
      <div
        className="flex overflow-x-auto"
        style={{
          gap: '14px', padding: '0 20px 8px',
          scrollSnapType: 'x mandatory',
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
