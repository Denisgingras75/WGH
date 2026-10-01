import { memo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DishSearch } from '../DishSearch'
import { DishListItem } from '../DishListItem'
import { EmptyState } from '../EmptyState'
import { DishRowSkeleton } from '../Skeleton'
import { LocationBanner } from '../LocationBanner'
import { LocalListsSection } from './LocalListsSection'
import { Top10Carousel } from './Top10Carousel'
import { RadiusChip } from './RadiusChip'
import { useLocalsAggregate } from '../../hooks/useLocalsAggregate'
import { getUserMessage } from '../../utils/errorHandler'

export const HomeListMode = memo(function HomeListMode({
  listScrollRef,
  searchQuery,
  searchLoading,
  searchError,
  rankedLoading,
  rankedErrorMessage,
  onRetry,
  activeDishes,
  allRankedDishes,
  initialCategory,
  topRestaurant,
  mostVotedDish,
  bestValueMeal,
  bestIceCream,
  radius,
  permissionState,
  requestLocation,
  onSearchChange,
  onRadiusSheetOpen,
  onCategoryChange,
}) {
  var carouselRef = useRef(null)
  var localsAggregateData = useLocalsAggregate()
  var localsAggregate = localsAggregateData.aggregate

  // Chalkboard tap → switch the carousel to that category, then bring it into view.
  // The list scrolls inside listScrollRef (not the window), so scroll that element.
  var handleCategorySelect = useCallback(function (cat) {
    if (carouselRef.current) {
      carouselRef.current.scrollToCategory(cat)
    }
    setTimeout(function () {
      var scroller = listScrollRef.current
      var el = document.getElementById('top10-carousel')
      if (!scroller || !el) return
      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      var top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 8
      scroller.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }, 100)
  }, [listScrollRef])

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'var(--color-bg)',
        zIndex: 1,
      }}
    >
      {/* Fixed header: brand + search */}
      <div style={{ flexShrink: 0, background: 'var(--color-bg)', zIndex: 10, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Brand header — decorative; Map.jsx renders the page's sr-only h1 */}
        <div className="text-center pt-4 pb-1">
          <p aria-hidden="true" style={{
            fontFamily: "'Amatic SC', cursive",
            fontSize: '42px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.04em',
            lineHeight: 1,
            margin: 0,
          }}>
            What's <span style={{ color: 'var(--color-primary)' }}>Good</span> Here
          </p>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: '5px 0 0',
          }}>
            Top-rated dishes near you
          </p>
        </div>
        {/* Search bar */}
        <div className="px-4 pt-2 pb-2">
          <DishSearch
            placeholder="What are you craving?"
            onSearchChange={onSearchChange}
            initialQuery={searchQuery}
            rightSlot={<RadiusChip radius={radius} onOpen={onRadiusSheetOpen} inSearchBar />}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={listScrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'calc(128px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
        }}
      >
        {/* Location banner — scrolls away with the list */}
        {permissionState === 'prompt' && (
          <div className="px-4 pt-2">
            <LocationBanner
              permissionState={permissionState}
              requestLocation={requestLocation}
              message="Enable location to find the best food near you"
            />
          </div>
        )}

        {(searchQuery && searchLoading) || (!searchQuery && rankedLoading) ? (
          <div className="px-4 pt-4"><DishRowSkeleton count={6} /></div>
        ) : searchQuery ? (
          /* Search results — flat list */
          <div className="px-4 pt-2 pb-4">
            <h2 className="mb-3" style={{
              fontFamily: "'Amatic SC', cursive",
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.02em',
              lineHeight: 1.1,
            }}>
              Results
            </h2>
            {activeDishes && activeDishes.length > 0 ? (
              <div>
                {activeDishes.map(function (dish, i) {
                  return (
                    <DishListItem
                      key={dish.dish_id}
                      dish={dish}
                      rank={i + 1}
                      showDistance
                      isLast={i === activeDishes.length - 1}
                    />
                  )
                })}
              </div>
            ) : searchError ? (
              <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>
                {getUserMessage(searchError, 'searching dishes')}
              </p>
            ) : (
              <EmptyState emoji="🔍" title={'No dishes found for “' + searchQuery + '”'} />
            )}
          </div>
        ) : activeDishes && activeDishes.length > 0 ? (
          /* Homepage v4 layout — chalkboards, local lists, top 10 carousel */
          <>
            {/* Editorial stories — A-frame chalkboard horizontal scroll */}
            <ChalkboardSection
              topRestaurant={topRestaurant}
              mostVotedDish={mostVotedDish}
              bestValueMeal={bestValueMeal}
              bestIceCream={bestIceCream}
              localsAggregate={localsAggregate}
              onExpandCategory={handleCategorySelect}
            />

            {/* Local Lists — horizontal scroll above the food icon tabs */}
            <LocalListsSection />

            {/* Top 10 carousel — swipe between Near You, Pizza, Burgers, etc. */}
            <div id="top10-carousel">
              <Top10Carousel
                ref={carouselRef}
                dishes={allRankedDishes}
                initialCategory={initialCategory}
                onCategoryChange={onCategoryChange}
              />
            </div>
          </>
        ) : rankedErrorMessage ? (
          /* Load failed and nothing cached — offer a retry instead of "no dishes" */
          <div className="px-4 py-6 text-center">
            <p role="alert" className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {rankedErrorMessage}
            </p>
            <button
              type="button"
              onClick={function () { onRetry() }}
              className="mt-3 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="px-4 pt-4">
            <EmptyState
              emoji="🍽️"
              title="No dishes found nearby"
              subtitle={radius !== 0 ? 'Try a wider search radius' : undefined}
              action={radius !== 0 ? (
                <button
                  type="button"
                  onClick={onRadiusSheetOpen}
                  className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                >
                  Change radius
                </button>
              ) : undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
})

// Chalkboard styles — module-level constants (no re-creation per render)
var BOARD_OUTER = { flexShrink: 0, width: '175px' }
var BOARD_OUTER_WIDE = { flexShrink: 0, width: '185px' }
var COUNT_BADGE = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(196, 138, 18, 0.2)', color: 'var(--color-accent-gold)', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', marginTop: '4px' }
var BOARD_SURFACE = { position: 'relative', background: '#363B3F', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }
var BOARD_FRAME = { position: 'absolute', inset: '3px', border: '2.5px solid #1A1D1F', borderRadius: '2px', pointerEvents: 'none', zIndex: 2 }
var BOARD_DUST = { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.03) 0%, transparent 60%)', pointerEvents: 'none' }
var BOARD_CONTENT = { position: 'relative', zIndex: 1, padding: '8px 10px 9px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }
var CHALK_BRIGHT = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.88)', fontWeight: 700 }
var CHALK_MED = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.55)', fontWeight: 700 }
var CHALK_FAINT = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.45)', fontWeight: 700 }
var CHALK_BIG = { fontFamily: "'Amatic SC', cursive", color: 'rgba(255,255,255,0.88)' }
var CHALK_CTA = { fontFamily: "'Amatic SC', cursive", color: 'var(--color-primary)' }
var CHALK_LINE = { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0', width: '36px' }

var BOARD_ICON_STYLE = { display: 'inline-block', verticalAlign: 'middle', width: '20px', height: '20px', objectFit: 'contain', marginRight: '3px' }

function ChalkboardCard({ tag, title, titleSize, sub, stat, cta, onClick, icon, bottomIcon }) {
  return (
    <button
      onClick={onClick}
      className="active:scale-[0.97] transition-transform"
      style={BOARD_OUTER}
    >
      <div style={BOARD_SURFACE}>
        <div style={BOARD_FRAME} />
        <div style={BOARD_DUST} />
        <div style={BOARD_CONTENT}>
          <p style={Object.assign({}, CHALK_FAINT, { fontSize: '14px', margin: 0 })}>
            {icon && <img src={icon} alt="" loading="lazy" decoding="async" style={BOARD_ICON_STYLE} />}
            <span>{tag}</span>
          </p>
          <p style={Object.assign({}, CHALK_BIG, { fontSize: titleSize || '30px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{title}</p>
          {sub && <p style={Object.assign({}, CHALK_MED, { fontSize: '15px', margin: 0 })}>{sub}</p>}
          <div style={CHALK_LINE} />
          {stat && <p style={Object.assign({}, CHALK_BRIGHT, { fontSize: '16px', margin: 0 })}>{stat}</p>}
          {stat && <div style={CHALK_LINE} />}
          <p style={Object.assign({}, CHALK_CTA, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{cta}</p>
          {bottomIcon && <img src={bottomIcon} alt="" loading="lazy" decoding="async" style={ICE_CREAM_MELTING_STYLE} />}
        </div>
      </div>
    </button>
  )
}

var ICE_CREAM_MELTING_STYLE = { display: 'block', margin: '4px auto -2px', width: '40px', height: '40px', objectFit: 'contain' }

function LocalsChalkboardCard({ tag, title, titleSize, sub, countText, cta, onClick }) {
  return (
    <button
      onClick={onClick}
      className="active:scale-[0.97] transition-transform"
      style={BOARD_OUTER_WIDE}
    >
      <div style={BOARD_SURFACE}>
        <div style={BOARD_FRAME} />
        <div style={BOARD_DUST} />
        <div style={BOARD_CONTENT}>
          <p style={Object.assign({}, CHALK_FAINT, { fontSize: '13px', margin: 0 })}>{tag}</p>
          <p style={Object.assign({}, CHALK_BIG, { fontSize: titleSize || '30px', fontWeight: 700, lineHeight: 0.95, margin: '2px 0 0' })}>{title}</p>
          {sub && <p style={Object.assign({}, CHALK_MED, { fontSize: '15px', margin: 0 })}>{sub}</p>}
          <div style={CHALK_LINE} />
          {countText && <span style={COUNT_BADGE}>{countText}</span>}
          {countText && <div style={{ marginTop: '4px' }} />}
          <p style={Object.assign({}, CHALK_CTA, { fontSize: '18px', fontWeight: 700, margin: 0 })}>{cta}</p>
        </div>
      </div>
    </button>
  )
}

// "$14.50" stays "$14.50" (not rounded up to "$15" under a "<$15" claim); whole dollars drop the cents
function formatPrice(price) {
  var p = Number(price)
  return '$' + (p % 1 === 0 ? p.toFixed(0) : p.toFixed(2))
}

function ChalkboardSection({ topRestaurant, mostVotedDish, bestValueMeal, bestIceCream, localsAggregate, onExpandCategory }) {
  var navigate = useNavigate()

  var hour = new Date().getHours()
  var timeCallout = hour < 11
    ? { category: 'breakfast', icon: '/categories/icons/breakfast.webp', tag: 'good morning', title: 'Breakfast', sub: 'on the island', stat: '#1 searched morning food', cta: 'best breakfasts \u2192' }
    : hour < 18
      ? { category: 'lobster roll', icon: '/categories/icons/lobster-roll.webp', tag: '#1 searched on MV', title: 'Lobster Roll', sub: '', stat: '', cta: 'find the best one \u2192' }
      : { category: 'pizza', icon: '/categories/icons/pizza.webp', tag: 'tonight', title: 'Pizza', sub: '', stat: '', cta: 'find the best pizza \u2192' }

  return (
    <div
      className="flex gap-3 overflow-x-auto mt-2 scrollbar-hide"
      style={{
        padding: '0 16px 0',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x pan-y',
      }}
    >
      {/* Board 1: Time of day */}
      <ChalkboardCard
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
        <ChalkboardCard
          icon="/categories/icons/star.png"
          tag={'highest rated restaurant'}
          title={topRestaurant.name}
          sub={'avg dish rating ' + topRestaurant.avg}
          cta={'see the menu \u2192'}
          onClick={function () { navigate('/restaurants/' + topRestaurant.id) }}
        />
      )}

      {/* Board 3: Chowder */}
      <ChalkboardCard
        icon="/categories/icons/chowder.webp"
        tag={'the great debate'}
        title="Chowder"
        sub="ranked by the people"
        cta={'see the rankings \u2192'}
        onClick={function () { onExpandCategory('chowder') }}
      />

      {/* Board 4: Most Talked About */}
      {mostVotedDish && (
        <ChalkboardCard
          icon="/categories/icons/speech-bubble.png"
          tag={'most talked about'}
          title={mostVotedDish.dish_name || mostVotedDish.name}
          titleSize="28px"
          sub={mostVotedDish.restaurant_name}
          stat={(mostVotedDish.total_votes || 0) + ' votes'}
          cta={'see why \u2192'}
          onClick={function () { navigate('/dish/' + mostVotedDish.dish_id) }}
        />
      )}

      {/* Board 5: Best Meal Under $15 */}
      {bestValueMeal && (
        <ChalkboardCard
          icon="/categories/icons/money-bag.png"
          tag={'best value'}
          title={bestValueMeal.dish_name || bestValueMeal.name}
          titleSize="28px"
          sub={bestValueMeal.restaurant_name}
          stat={formatPrice(bestValueMeal.price) + ' \u00B7 rated ' + Number(bestValueMeal.avg_rating || 0).toFixed(1)}
          cta={'best meal under $15 \u2192'}
          onClick={function () { navigate('/dish/' + bestValueMeal.dish_id) }}
        />
      )}

      {/* Board 6: Best Ice Cream — clean cone top, melting cone bottom */}
      {bestIceCream && (
        <ChalkboardCard
          icon="/categories/icons/ice-cream-clean.png"
          tag={'island scoops'}
          title={bestIceCream.dish_name || bestIceCream.name}
          titleSize="28px"
          sub={bestIceCream.restaurant_name}
          stat={(bestIceCream.total_votes || 0) + ' votes \u00B7 rated ' + Number(bestIceCream.avg_rating || 0).toFixed(1)}
          cta={'best ice cream \u2192'}
          onClick={function () { navigate('/dish/' + bestIceCream.dish_id) }}
          bottomIcon="/categories/icons/ice-cream-melting.png"
        />
      )}

      {/* Board 7: Locals Agree — most-appearing dish */}
      {localsAggregate && localsAggregate.top_dish_id && localsAggregate.total_lists >= 2 && (
        <LocalsChalkboardCard
          tag={'\uD83C\uDFC6 locals agree'}
          title={localsAggregate.top_dish_name}
          sub={localsAggregate.top_dish_restaurant_name}
          countText={'On ' + localsAggregate.top_dish_list_count + ' of ' + localsAggregate.total_lists + ' local lists'}
          cta={'see why \u2192'}
          onClick={function () { navigate('/dish/' + localsAggregate.top_dish_id) }}
        />
      )}

      {/* Board 8: Island Favorite — most-appearing restaurant */}
      {localsAggregate && localsAggregate.top_restaurant_id && localsAggregate.total_lists >= 2 && (
        <LocalsChalkboardCard
          tag={'\uD83D\uDCCD island favorite'}
          title={localsAggregate.top_restaurant_name}
          sub={localsAggregate.top_restaurant_town || ''}
          countText={localsAggregate.top_restaurant_list_count >= localsAggregate.total_lists ? 'On every local list' : 'On ' + localsAggregate.top_restaurant_list_count + ' of ' + localsAggregate.total_lists + ' local lists'}
          cta={'see the menu \u2192'}
          onClick={function () { navigate('/restaurants/' + localsAggregate.top_restaurant_id) }}
        />
      )}
    </div>
  )
}
