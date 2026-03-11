import { useNavigate } from 'react-router-dom'
import { DishListItem } from '../DishListItem'

export function LocalListCard({ items }) {
  var navigate = useNavigate()

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
          <h3 style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {listTitle}
          </h3>
          {listDescription && (
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
              marginTop: '4px',
            }}>
              {listDescription}
            </p>
          )}
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
                  style={{
                    marginTop: '-4px',
                    paddingLeft: '56px',
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
