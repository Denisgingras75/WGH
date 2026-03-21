import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BROWSE_CATEGORIES } from '../../constants/categories'
import { DishSearch } from '../DishSearch'
import { DishListItem } from '../DishListItem'
import { CategoryChips } from '../CategoryChips'
import { EmptyState } from '../EmptyState'
import { LocationBanner } from '../LocationBanner'
import { LocalListsSection, CategoryExpand } from './'

export function HomeListMode({
  listScrollRef,
  searchQuery,
  searchLoading,
  rankedLoading,
  activeDishes,
  expandedCategory,
  topRestaurant,
  mostVotedDish,
  bestValueMeal,
  bestIceCream,
  radius,
  permissionState,
  requestLocation,
  onSearchChange,
  onRadiusSheetOpen,
  onExpandedCategoryChange,
  onLocalListExpanded,
}) {
  var navigate = useNavigate()

  var handleCategorySelect = useCallback(function (cat) {
    onExpandedCategoryChange(function (prev) { return prev === cat ? null : cat })
  }, [onExpandedCategoryChange])

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'var(--color-bg)',
        zIndex: 1,
      }}
    >
      {/* Fixed header: brand + search + chips */}
      <div style={{ flexShrink: 0, background: 'var(--color-bg)', zIndex: 10 }}>
        {/* Brand header */}
        <div className="text-center pt-4 pb-1">
          <h2 style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: '42px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.04em',
            lineHeight: 1,
            margin: 0,
          }}>
            What's <span style={{ color: 'var(--color-primary)' }}>Good</span> Here
          </h2>
          <p style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: '2px 0 0',
          }}>
            Dishes worth ordering again
          </p>
        </div>
        {/* Search bar */}
        <div className="px-4 pt-2 pb-2" style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            borderRadius: '14px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          }}>
            <DishSearch
              loading={false}
              placeholder="What are you craving?"
              onSearchChange={onSearchChange}
              initialQuery={searchQuery}
              rightSlot={
                <button
                  onClick={function (e) { e.stopPropagation(); onRadiusSheetOpen() }}
                  aria-label={radius === 0 ? 'Showing dishes everywhere' : 'Search radius: ' + radius + ' miles'}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold flex-shrink-0"
                  style={{
                    fontSize: '12px',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-divider)',
                    cursor: 'pointer',
                  }}
                >
                  {radius === 0 ? 'All' : radius + ' mi'}
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              }
            />
          </div>
        </div>

        {/* Location banner */}
        <div className="px-4">
          <LocationBanner
            permissionState={permissionState}
            requestLocation={requestLocation}
            message="Enable location to find the best food near you"
          />
        </div>

      </div>

      {/* Scrollable content */}
      <div
        ref={listScrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: '80px',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
        }}
      >
        {(searchQuery && searchLoading) || (!searchQuery && rankedLoading) ? (
          <div className="px-4 pt-4"><ListSkeleton /></div>
        ) : searchQuery ? (
          /* Search results — flat list */
          <div className="px-4 pt-2 pb-4">
            <h2 style={{
              fontFamily: "'Amatic SC', cursive",
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.02em',
              marginBottom: '8px',
            }}>
              Results
            </h2>
            {activeDishes && activeDishes.length > 0 ? (
              <div className="flex flex-col" style={{ gap: '2px' }}>
                {activeDishes.map(function (dish, i) {
                  return (
                    <DishListItem
                      key={dish.dish_id}
                      dish={dish}
                      rank={i + 1}
                      showDistance
                      onClick={function () { navigate('/dish/' + dish.dish_id) }}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState emoji="🔍" title={'No dishes found for \u201c' + searchQuery + '\u201d'} />
            )}
          </div>
        ) : activeDishes && activeDishes.length > 0 ? (
          /* Homepage v4 layout — category chips up top, vertical list */
          <>
            {/* Editorial stories — A-frame chalkboard horizontal scroll */}
            <ChalkboardSection
              topRestaurant={topRestaurant}
              mostVotedDish={mostVotedDish}
              bestValueMeal={bestValueMeal}
              bestIceCream={bestIceCream}
              onExpandCategory={function (cat) {
                onExpandedCategoryChange(cat)
                setTimeout(function () {
                  var el = document.getElementById('category-expand')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }}
            />

            {/* Browse by Category */}
            <div style={{ paddingTop: '2px', paddingBottom: 0 }}>
              <div className="flex items-center gap-3 px-4" style={{ paddingBottom: 0 }}>
                <div className="flex-1" style={{ height: '1.5px', background: 'linear-gradient(to right, transparent, var(--color-text-tertiary))' }} />
                <h2 style={{
                  fontFamily: "'Amatic SC', cursive",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  padding: '0 6px',
                }}>
                  Browse by Category
                </h2>
                <div className="flex-1" style={{ height: '1.5px', background: 'linear-gradient(to left, transparent, var(--color-text-tertiary))' }} />
              </div>
              <CategoryChips
                categories={BROWSE_CATEGORIES.filter(function (c) {
                  var hour = new Date().getHours()
                  var hideId = hour < 11 ? 'breakfast' : hour < 16 ? 'lobster roll' : 'pizza'
                  return c.id !== hideId
                })}
                selected={expandedCategory}
                onSelect={handleCategorySelect}
                maxVisible={22}
              />
            </div>

            {/* Dish list — Top Rated Nearby OR Category results */}
            {expandedCategory ? (
              <div id="category-expand">
                <CategoryExpand
                  categoryId={expandedCategory}
                  onClose={function () { onExpandedCategoryChange(null) }}
                />
              </div>
            ) : (
              <div className="pt-1">
                {/* Divider — separates editorial/browse from the rankings */}
                <div className="mx-4 mb-2" style={{
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--color-text-primary), var(--color-text-primary) 30%, transparent)',
                  opacity: 0.12,
                }} />

                {/* Scoreboard header */}
                <div className="px-4 flex items-baseline justify-between mb-1">
                  <h2 style={{
                    fontFamily: "'Amatic SC', cursive",
                    fontSize: '30px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}>
                    Top Rated Nearby
                  </h2>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--color-text-tertiary)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {Math.min(activeDishes.length, 10)} dishes
                  </span>
                </div>

                {/* Rankings */}
                <div className="px-3">
                  {activeDishes.slice(0, 10).map(function (dish, i) {
                    return (
                      <DishListItem
                        key={dish.dish_id || dish.id}
                        dish={dish}
                        rank={i + 1}
                        variant="ranked"
                        isLast={i === Math.min(activeDishes.length, 10) - 1}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Local Lists */}
            <LocalListsSection onListExpanded={onLocalListExpanded} />
          </>
        ) : (
          <div className="px-4 pt-4">
            <EmptyState emoji="🍽️" title="No dishes found nearby" />
          </div>
        )}
      </div>
    </div>
  )
}

function ChalkboardSection({ topRestaurant, mostVotedDish, bestValueMeal, bestIceCream, onExpandCategory }) {
  var navigate = useNavigate()

  var hour = new Date().getHours()
  var timeCallout = hour < 11
    ? { category: 'breakfast', tag: '\u2600\uFE0F good morning', title: 'Breakfast', sub: 'on the island', stat: 'ranked by locals', cta: 'best breakfasts \u2192' }
    : hour < 16
      ? { category: 'lobster roll', tag: '\uD83E\uDD9E top searched', title: 'Lobster Roll', sub: 'the hunt is on', stat: 'ranked by locals', cta: 'find the best one \u2192' }
      : { category: 'pizza', tag: '\uD83C\uDF55 tonight', title: 'Pizza', sub: 'on the island', stat: 'ranked by locals', cta: 'find the best pizza \u2192' }

  // Chalkboard styles — fill width, 2 per row, with A-frame legs
  var boardOuter = {
    flexShrink: 0,
    width: '175px',
  }
  var boardSurface = {
    position: 'relative',
    background: '#363B3F',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  }
  var boardFrame = {
    position: 'absolute',
    inset: '3px',
    border: '2.5px solid #1A1D1F',
    borderRadius: '2px',
    pointerEvents: 'none',
    zIndex: 2,
  }
  var boardDust = {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.03) 0%, transparent 60%)',
    pointerEvents: 'none',
  }
  var boardContent = {
    position: 'relative',
    zIndex: 1,
    padding: '8px 10px 9px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }
  var chalkBright = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.88)', fontWeight: 700 }
  var chalkMed = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.55)', fontWeight: 700 }
  var chalkFaint = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.45)', fontWeight: 700 }
  var chalkBig = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.88)' }
  var chalkCta = { fontFamily: "'Amatic SC', cursive", color: 'var(--color-primary)' }
  var chalkLine = { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0', width: '36px' }
  var legStyle = { width: '2.5px', height: '10px', background: '#6B7280', borderRadius: '0 0 1.5px 1.5px' }

  return (
    <div
      className="flex gap-3 overflow-x-auto mt-2"
      style={{
        padding: '0 16px 0',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        touchAction: 'pan-x pan-y',
      }}
    >
      {/* Board 1: Time of day */}
      <button
        onClick={function () { onExpandCategory(timeCallout.category) }}
        className="active:scale-[0.97] transition-transform"
        style={boardOuter}
      >
        <div style={boardSurface}>
          <div style={boardFrame} />
          <div style={boardDust} />
          <div style={boardContent}>
            <p style={Object.assign({}, chalkFaint, { fontSize: '14px', margin: 0 })}>{timeCallout.tag}</p>
            <p style={Object.assign({}, chalkBig, { fontSize: '30px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{timeCallout.title}</p>
            <p style={Object.assign({}, chalkMed, { fontSize: '16px', margin: 0 })}>{timeCallout.sub}</p>
            <div style={chalkLine} />
            <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{timeCallout.stat}</p>
            <div style={chalkLine} />
            <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{timeCallout.cta}</p>
          </div>
        </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div style={Object.assign({}, legStyle, { transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
            <div style={Object.assign({}, legStyle, { transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
          </div>
      </button>

      {/* Board 2: Top Restaurant */}
      {topRestaurant && (
        <button
          onClick={function () { navigate('/restaurants/' + topRestaurant.id) }}
          className="active:scale-[0.97] transition-transform"
          style={boardOuter}
        >
          <div style={boardSurface}>
            <div style={boardFrame} />
            <div style={boardDust} />
            <div style={boardContent}>
              <p style={Object.assign({}, chalkFaint, { fontSize: '14px', letterSpacing: '0.03em', textTransform: 'uppercase', margin: 0 })}>{'\u2605 everything is good \u2605'}</p>
              <p style={Object.assign({}, chalkBig, { fontSize: '30px', fontWeight: 700, lineHeight: 0.95, margin: '3px 0 0' })}>{topRestaurant.name}</p>
              <p style={Object.assign({}, chalkMed, { fontSize: '15px', margin: 0 })}>Menemsha</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{'avg rating ' + topRestaurant.avg}</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{'see the menu \u2192'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div style={Object.assign({}, legStyle, { transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
            <div style={Object.assign({}, legStyle, { transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
          </div>
        </button>
      )}

      {/* Board 3: Most Talked About */}
      {mostVotedDish && (
        <button
          onClick={function () { navigate('/dish/' + mostVotedDish.dish_id) }}
          className="active:scale-[0.97] transition-transform"
          style={boardOuter}
        >
          <div style={boardSurface}>
            <div style={boardFrame} />
            <div style={boardDust} />
            <div style={boardContent}>
              <p style={Object.assign({}, chalkFaint, { fontSize: '14px', margin: 0 })}>{'\uD83D\uDCAC most talked about'}</p>
              <p style={Object.assign({}, chalkBig, { fontSize: '28px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{mostVotedDish.dish_name || mostVotedDish.name}</p>
              <p style={Object.assign({}, chalkMed, { fontSize: '15px', margin: 0 })}>{mostVotedDish.restaurant_name}</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{(mostVotedDish.total_votes || 0) + ' votes \u00B7 94%'}</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{'see why \u2192'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div style={Object.assign({}, legStyle, { transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
            <div style={Object.assign({}, legStyle, { transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
          </div>
        </button>
      )}

      {/* Board 4: Best Meal Under $15 */}
      {bestValueMeal && (
        <button
          onClick={function () { navigate('/dish/' + bestValueMeal.dish_id) }}
          className="active:scale-[0.97] transition-transform"
          style={boardOuter}
        >
          <div style={boardSurface}>
            <div style={boardFrame} />
            <div style={boardDust} />
            <div style={boardContent}>
              <p style={Object.assign({}, chalkFaint, { fontSize: '14px', margin: 0 })}>{'\uD83D\uDCB0 best value'}</p>
              <p style={Object.assign({}, chalkBig, { fontSize: '28px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{bestValueMeal.dish_name || bestValueMeal.name}</p>
              <p style={Object.assign({}, chalkMed, { fontSize: '15px', margin: 0 })}>{bestValueMeal.restaurant_name}</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{'$' + Number(bestValueMeal.price).toFixed(0) + ' \u00B7 rated ' + (Number(bestValueMeal.avg_rating).toFixed(1))}</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{'best meal under $15 \u2192'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div style={Object.assign({}, legStyle, { transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
            <div style={Object.assign({}, legStyle, { transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
          </div>
        </button>
      )}

      {/* Board 5: Best Ice Cream */}
      {bestIceCream && (
        <button
          onClick={function () { navigate('/dish/' + bestIceCream.dish_id) }}
          className="active:scale-[0.97] transition-transform"
          style={boardOuter}
        >
          <div style={boardSurface}>
            <div style={boardFrame} />
            <div style={boardDust} />
            <div style={boardContent}>
              <p style={Object.assign({}, chalkFaint, { fontSize: '14px', margin: 0 })}>{'\uD83C\uDF66 island scoops'}</p>
              <p style={Object.assign({}, chalkBig, { fontSize: '28px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{bestIceCream.dish_name || bestIceCream.name}</p>
              <p style={Object.assign({}, chalkMed, { fontSize: '15px', margin: 0 })}>{bestIceCream.restaurant_name}</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkBright, { fontSize: '16px', margin: 0 })}>{(bestIceCream.total_votes || 0) + ' votes \u00B7 rated ' + (Number(bestIceCream.avg_rating || 0).toFixed(1))}</p>
              <div style={chalkLine} />
              <p style={Object.assign({}, chalkCta, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{'best ice cream \u2192'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div style={Object.assign({}, legStyle, { transform: 'rotate(6deg)', transformOrigin: 'top center' })} />
            <div style={Object.assign({}, legStyle, { transform: 'rotate(-6deg)', transformOrigin: 'top center' })} />
          </div>
        </button>
      )}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      {[0, 1, 2, 3].map(function (i) {
        return (
          <div key={i} className="flex items-center gap-3 py-3 px-3">
            <div className="w-7 h-5 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="w-6 h-6 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="flex-1">
              <div className="h-4 w-28 rounded mb-1" style={{ background: 'var(--color-divider)' }} />
              <div className="h-3 w-20 rounded" style={{ background: 'var(--color-divider)' }} />
            </div>
            <div className="h-5 w-8 rounded" style={{ background: 'var(--color-divider)' }} />
          </div>
        )
      })}
    </div>
  )
}
