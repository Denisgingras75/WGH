import { memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DishSearch } from '../DishSearch'
import { DishListItem } from '../DishListItem'
import { EmptyState } from '../EmptyState'
import { LocationBanner } from '../LocationBanner'
import { LocalListsSection, Top10Carousel } from './'
import { Masthead } from './Masthead'

export const HomeListMode = memo(function HomeListMode({
  listScrollRef,
  searchQuery,
  searchLoading,
  rankedLoading,
  activeDishes,
  allRankedDishes,
  radius,
  permissionState,
  requestLocation,
  onSearchChange,
  onRadiusSheetOpen,
  onCategoryChange,
  onLocalListExpanded,
}) {
  var navigate = useNavigate()
  var carouselRef = useRef(null)

  return (
    <div
      className="fixed inset-0 flex flex-col home-shell"
      style={{ zIndex: 1 }}
    >
      {/* Fixed header: editorial masthead + search */}
      <div className="home-shell-header" style={{ flexShrink: 0, zIndex: 10 }}>
        <Masthead onTownClick={onRadiusSheetOpen} />
        {/* Search bar */}
        <div className="px-5 pt-3 pb-2">
          <div style={{
            borderRadius: '14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
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
          /* Editorial home — Local Lists strip + Top 10 carousel of dishes */
          <>
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
