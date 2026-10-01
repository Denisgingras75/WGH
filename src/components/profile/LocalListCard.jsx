import { DishListItem } from '../DishListItem'
import { SectionHeader } from '../SectionHeader'

// Curator-note indent = DishListItem's name column (padding + rank + icon + gap)
var NOTE_INDENT_PODIUM = '126px'
var NOTE_INDENT_RANKED = '112px'
var NOTE_INDENT_UNRANKED = '84px'

export function LocalListCard({ items }) {
  if (!items || items.length === 0) return null

  var listTitle = items[0].title
  var listDescription = items[0].description

  return (
    <div className="px-4 pt-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-divider)',
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <SectionHeader level="h3" title={listTitle} subtitle={listDescription} />
        </div>

        {/* Dish list */}
        {items.map(function (item, i) {
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
          var hasRank = item.position != null
          var isPodiumRow = hasRank && item.position <= 3
          // The row owns the divider so the curator note sits above it, with its dish
          var showDivider = !isPodiumRow && i !== items.length - 1

          return (
            <div
              key={item.dish_id}
              style={{ borderBottom: showDivider ? '1px solid var(--color-divider)' : 'none' }}
            >
              <DishListItem
                dish={dish}
                rank={item.position}
                hideVotes
                isLast
              />
              {item.note && (
                <div
                  className="pb-2"
                  style={{
                    paddingLeft: isPodiumRow ? NOTE_INDENT_PODIUM : hasRank ? NOTE_INDENT_RANKED : NOTE_INDENT_UNRANKED,
                    paddingRight: '16px',
                  }}
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
        })}
      </div>
    </div>
  )
}
