import { memo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BROWSE_CATEGORIES } from '../../constants/categories'
import { DishSearch } from '../DishSearch'
import { DishListItem } from '../DishListItem'
import { EmptyState } from '../EmptyState'
import { LocationBanner } from '../LocationBanner'
import { Wordmark } from '../Wordmark'
import { DishThumb } from '../DishThumb'
import { LocalListsSection, Top10Carousel } from './'
import { useLocalsAggregate } from '../../hooks/useLocalsAggregate'

export const HomeListMode = memo(function HomeListMode({
  listScrollRef,
  searchQuery,
  searchLoading,
  rankedLoading,
  activeDishes,
  allRankedDishes,
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
  onCategoryChange,
  onLocalListExpanded,
}) {
  var navigate = useNavigate()
  var carouselRef = useRef(null)
  var localsAggregateData = useLocalsAggregate()
  var localsAggregate = localsAggregateData.aggregate

  var handleCategorySelect = useCallback(function (cat) {
    onExpandedCategoryChange(cat)
    if (carouselRef.current) {
      carouselRef.current.scrollToCategory(cat)
    }
    setTimeout(function () {
      var el = document.getElementById('top10-carousel')
      if (el) {
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        var offset = el.getBoundingClientRect().top + window.scrollY - 8
        window.scrollTo({ top: offset, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
      }
    }, 100)
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
        <div className="text-center pt-5 pb-1">
          <Wordmark as="h1" size={38} />
          <p className="eyebrow" style={{ margin: '10px 0 0' }}>
            Top-rated dishes near you
          </p>
        </div>
        {/* Search bar */}
        <div className="px-4 pt-3 pb-3">
          <div>
            <DishSearch
              loading={false}
              placeholder="What are you craving?"
              onSearchChange={onSearchChange}
              initialQuery={searchQuery}
              rightSlot={
                <button
                  onClick={function (e) { e.stopPropagation(); onRadiusSheetOpen() }}
                  aria-label={radius === 0 ? 'Showing dishes everywhere' : 'Search radius: ' + radius + ' miles'}
                  className="flex items-center gap-1 px-2.5 py-1 font-bold flex-shrink-0"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'var(--color-highlight)',
                    color: 'var(--color-ink)',
                    border: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                  }}
                >
                  {radius === 0 ? 'All' : radius + ' mi'}
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25}>
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
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 500,
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
            {/* Editorial picks — guide cards, horizontal scroll */}
            <GuideSection
              topRestaurant={topRestaurant}
              mostVotedDish={mostVotedDish}
              bestValueMeal={bestValueMeal}
              bestIceCream={bestIceCream}
              localsAggregate={localsAggregate}
              onExpandCategory={function (cat) {
                onExpandedCategoryChange(cat)
                if (carouselRef.current) {
                  carouselRef.current.scrollToCategory(cat)
                }
                setTimeout(function () {
                  var el = document.getElementById('top10-carousel')
                  if (el) {
                    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    var offset = el.getBoundingClientRect().top + window.scrollY - 8
                    window.scrollTo({ top: offset, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
                  }
                }, 100)
              }}
            />

            {/* Local Lists — horizontal scroll above the food icon tabs */}
            <LocalListsSection onListExpanded={onLocalListExpanded} />

            {/* Top 10 carousel — swipe between Near You, Pizza, Burgers, etc. */}
            <div id="top10-carousel">
              <Top10Carousel ref={carouselRef} dishes={allRankedDishes} onCategoryChange={onCategoryChange} />
            </div>
          </>
        ) : (
          <div className="px-4 pt-4">
            <EmptyState emoji="🍽️" title="No dishes found nearby" />
          </div>
        )}
      </div>
    </div>
  )
})

// Guide cards — editorial picks as quiet gallery tiles: image on top
// (the dish photo when one exists), caption below. Module-level constants.
var GUIDE_CARD = { flexShrink: 0, width: '152px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }
var GUIDE_TILE = { width: '152px', height: '176px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-category-strip)', position: 'relative' }
var GUIDE_ICON = { position: 'absolute', inset: 0, margin: 'auto', width: '62%', height: '62%', objectFit: 'contain' }
var GUIDE_MONOGRAM = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '64px', fontWeight: 400, color: 'var(--color-text-secondary)' }
var GUIDE_TAG = { margin: 0 }
var GUIDE_TITLE = { fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 500, lineHeight: 1.12, color: 'var(--color-text-primary)', margin: '3px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
var GUIDE_SUB = { fontSize: '13px', color: 'var(--color-text-secondary)', margin: '3px 0 0', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
var GUIDE_STAT = { fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '2px 0 0' }

function GuideCard({ tag, title, sub, stat, cta, onClick, icon, dish, monogram }) {
  return (
    <button onClick={onClick} className="press" style={GUIDE_CARD} aria-label={title + (cta ? ', ' + cta : '')}>
      <div style={GUIDE_TILE}>
        {dish ? (
          <DishThumb dish={dish} fill radius="0" iconScale={0.62} />
        ) : icon ? (
          <img src={icon} alt="" style={GUIDE_ICON} />
        ) : (
          <span aria-hidden="true" style={GUIDE_MONOGRAM}>{(monogram || title || '?').charAt(0)}</span>
        )}
      </div>
      <div style={{ minWidth: 0, width: '100%' }}>
        <p className="eyebrow" style={GUIDE_TAG}>{tag}</p>
        <p style={GUIDE_TITLE}>{title}</p>
        {sub && <p style={GUIDE_SUB}>{sub}</p>}
        {stat && <p style={GUIDE_STAT}>{stat}</p>}
      </div>
    </button>
  )
}

function GuideSection({ topRestaurant, mostVotedDish, bestValueMeal, bestIceCream, localsAggregate, onExpandCategory }) {
  var navigate = useNavigate()

  var hour = new Date().getHours()
  var timeCallout = hour < 11
    ? { category: 'breakfast', icon: '/categories/icons/breakfast.webp', tag: 'good morning', title: 'Breakfast', sub: 'on the island', stat: '#1 searched morning food', cta: 'best breakfasts \u2192' }
    : hour < 18
      ? { category: 'lobster roll', icon: '/categories/icons/lobster-roll.webp', tag: '#1 searched on MV', title: 'Lobster Roll', sub: '', stat: '', cta: 'find the best one \u2192' }
      : { category: 'pizza', icon: '/categories/icons/pizza.webp', tag: 'tonight', title: 'Pizza', sub: '', stat: '', cta: 'find the best pizza \u2192' }

  return (
    <div
      className="flex gap-3 overflow-x-auto"
      style={{
        padding: '14px 16px 8px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        touchAction: 'pan-x pan-y',
      }}
    >
      {/* Board 1: Time of day */}
      <GuideCard
        icon={timeCallout.icon}
        tag={timeCallout.tag}
        title={timeCallout.title}
        sub={timeCallout.sub}
        stat={timeCallout.stat}
        cta={timeCallout.cta}
        onClick={function () { onExpandCategory(timeCallout.category) }}
      />

      {/* Board 2: Top Restaurant */}
      {topRestaurant && (
        <GuideCard
          monogram={topRestaurant.name}
          tag={'highest rated restaurant'}
          title={topRestaurant.name}
          sub={'avg dish rating ' + topRestaurant.avg}
          cta={'see the menu \u2192'}
          onClick={function () { navigate('/restaurants/' + topRestaurant.id) }}
        />
      )}

      {/* Board 3: Chowder */}
      <GuideCard
        icon="/categories/icons/chowder.webp"
        tag={'the great debate'}
        title="Chowder"
        sub="ranked by the people"
        cta={'see the rankings \u2192'}
        onClick={function () { onExpandCategory('chowder') }}
      />

      {/* Board 4: Most Talked About */}
      {mostVotedDish && (
        <GuideCard
          dish={mostVotedDish}
          tag={'most talked about'}
          title={mostVotedDish.dish_name || mostVotedDish.name}
                    sub={mostVotedDish.restaurant_name}
          stat={(mostVotedDish.total_votes || 0) + ' votes'}
          cta={'see why \u2192'}
          onClick={function () { navigate('/dish/' + mostVotedDish.dish_id) }}
        />
      )}

      {/* Board 5: Best Meal Under $15 */}
      {bestValueMeal && (
        <GuideCard
          dish={bestValueMeal}
          tag={'best value'}
          title={bestValueMeal.dish_name || bestValueMeal.name}
                    sub={bestValueMeal.restaurant_name}
          stat={'$' + Number(bestValueMeal.price).toFixed(0) + ' \u00B7 rated ' + Number(bestValueMeal.avg_rating || 0).toFixed(1)}
          cta={'best meal under $15 \u2192'}
          onClick={function () { navigate('/dish/' + bestValueMeal.dish_id) }}
        />
      )}

      {/* Board 6: Best Ice Cream — clean cone top, melting cone bottom */}
      {bestIceCream && (
        <GuideCard
          dish={bestIceCream}
          tag={'island scoops'}
          title={bestIceCream.dish_name || bestIceCream.name}
                    sub={bestIceCream.restaurant_name}
          stat={(bestIceCream.total_votes || 0) + ' votes \u00B7 rated ' + Number(bestIceCream.avg_rating || 0).toFixed(1)}
          cta={'best ice cream \u2192'}
          onClick={function () { navigate('/dish/' + bestIceCream.dish_id) }}
        />
      )}

      {/* Board 7: Locals Agree — most-appearing dish */}
      {localsAggregate && localsAggregate.top_dish_id && localsAggregate.total_lists >= 2 && (
        <GuideCard
          tag={'locals agree'}
          dish={{ dish_name: localsAggregate.top_dish_name }}
          title={localsAggregate.top_dish_name}
          sub={localsAggregate.top_dish_restaurant_name}
          stat={'On ' + localsAggregate.top_dish_list_count + ' of ' + localsAggregate.total_lists + ' local lists'}
          cta={'see why \u2192'}
          onClick={function () { navigate('/dish/' + localsAggregate.top_dish_id) }}
        />
      )}

      {/* Board 8: Island Favorite — most-appearing restaurant */}
      {localsAggregate && localsAggregate.top_restaurant_id && localsAggregate.total_lists >= 2 && (
        <GuideCard
          tag={'island favorite'}
          title={localsAggregate.top_restaurant_name}
          sub={localsAggregate.top_restaurant_town || ''}
          stat={localsAggregate.top_restaurant_list_count >= localsAggregate.total_lists ? 'On every local list' : 'On ' + localsAggregate.top_restaurant_list_count + ' of ' + localsAggregate.total_lists + ' local lists'}
          cta={'see the menu \u2192'}
          onClick={function () { navigate('/restaurants/' + localsAggregate.top_restaurant_id) }}
        />
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
