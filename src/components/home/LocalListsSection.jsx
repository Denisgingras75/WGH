import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLocalLists } from '../../hooks/useLocalLists'
import { useLocalListDetail } from '../../hooks/useLocalListDetail'
import { DishListItem } from '../DishListItem'

function ExpandableListCard({ list }) {
  var [expanded, setExpanded] = useState(false)
  var navigate = useNavigate()
  var { items, loading } = useLocalListDetail(expanded ? list.user_id : null)

  var initial = (list.display_name || '?').charAt(0).toUpperCase()
  var previewText = list.preview_dishes
    ? list.preview_dishes.join(', ')
    : ''

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-divider)',
      }}
    >
      {/* Header — tap to expand/collapse */}
      <button
        onClick={function () { setExpanded(!expanded) }}
        className="w-full text-left active:scale-[0.98]"
        style={{
          padding: '14px 16px',
          cursor: 'pointer',
          transition: 'transform 100ms ease',
          background: 'transparent',
          border: 'none',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {list.avatar_url ? (
            <img
              src={list.avatar_url}
              alt=""
              className="flex-shrink-0 rounded-full"
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: '16px',
              }}
            >
              {initial}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.01em',
            }}>
              {list.display_name}
            </p>
            {list.curator_tagline && (
              <p
                className="truncate"
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '1px',
                }}
              >
                {list.curator_tagline}
              </p>
            )}
            {!expanded && (
              <p
                className="truncate"
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '2px',
                }}
              >
                {previewText}
              </p>
            )}
          </div>

          {/* Taste match badge */}
          {list.compatibility_pct != null && (
            <div
              className="flex-shrink-0 rounded-full"
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
                background: list.compatibility_pct >= 80
                  ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--color-accent-gold) 15%, transparent)',
                color: list.compatibility_pct >= 80
                  ? 'var(--color-success)'
                  : 'var(--color-accent-gold)',
              }}
            >
              {list.compatibility_pct}% match
            </div>
          )}

          {/* Chevron */}
          <div className="flex-shrink-0" style={{
            fontSize: '18px',
            color: 'var(--color-text-tertiary)',
            transition: 'transform 200ms ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            &#x25BE;
          </div>
        </div>
      </button>

      {/* Expanded dish list */}
      {expanded && (
        <div>
          {loading ? (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Loading...</span>
            </div>
          ) : items.length > 0 ? (
            items.map(function (item, i) {
              var dish = {
                dish_id: item.dish_id,
                id: item.dish_id,
                dish_name: item.dish_name,
                restaurant_name: item.restaurant_name,
                restaurant_id: item.restaurant_id,
                avg_rating: item.avg_rating,
                total_votes: item.total_votes,
                category: item.category,
              }
              return (
                <div key={item.dish_id}>
                  <DishListItem
                    dish={dish}
                    rank={item.position}
                    hideVotes
                    onClick={function () { navigate('/dish/' + item.dish_id) }}
                    isLast={i === items.length - 1}
                  />
                  {item.note && (
                    <div
                      className="px-4 pb-2"
                      style={{ marginTop: '-4px', paddingLeft: '56px' }}
                    >
                      <p style={{
                        fontSize: '12px',
                        fontStyle: 'italic',
                        color: 'var(--color-text-secondary)',
                        lineHeight: '1.4',
                      }}>
                        &ldquo;{item.note}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          ) : null}
        </div>
      )}
    </div>
  )
}

export function LocalListsSection() {
  var { user } = useAuth()
  var { lists, loading } = useLocalLists(user ? user.id : null)

  if (loading || lists.length === 0) return null

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="px-4 mb-3">
        <h2 style={{
          fontSize: '17px',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Local Lists
        </h2>
        <p style={{
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          marginTop: '2px',
        }}>
          What islanders want you to try
        </p>
      </div>

      {/* Expandable cards */}
      <div className="px-4 flex flex-col" style={{ gap: '10px' }}>
        {lists.map(function (list) {
          return <ExpandableListCard key={list.list_id} list={list} />
        })}
      </div>
    </div>
  )
}
