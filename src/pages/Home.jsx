import { CaretDown, Plus } from '@phosphor-icons/react'
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationContext } from '../context/LocationContext'
import { useDishes } from '../hooks/useDishes'
import { useDishSearch } from '../hooks/useDishSearch'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { BROWSE_CATEGORIES } from '../constants/categories'
import { DishSearch } from '../components/DishSearch'
import { TownPicker } from '../components/TownPicker'
import { DishListItem } from '../components/DishListItem'
import { CategoryChips } from '../components/CategoryChips'
import { EmptyState } from '../components/EmptyState'
import { RadiusSheet } from '../components/LocationPicker'
import { LocationBanner } from '../components/LocationBanner'
import { AddRestaurantModal } from '../components/AddRestaurantModal'

export function Home() {
  var navigate = useNavigate()
  var { location, radius, setRadius, town, setTown, permissionState, requestLocation } = useLocationContext()

  var [selectedCategory, setSelectedCategory] = useState(null)
  var [townPickerOpen, setTownPickerOpen] = useState(false)
  var [searchQuery, setSearchQuery] = useState('')
  var [searchLimit, setSearchLimit] = useState(10)
  var [addModalOpen, setAddModalOpen] = useState(false)
  var [addModalQuery, setAddModalQuery] = useState('')
  var [showRadiusSheet, setShowRadiusSheet] = useState(false)

  var handleSearchChange = useCallback(function (q) {
    setSearchQuery(q)
    setSearchLimit(10)
    if (q) setSelectedCategory(null)
  }, [])

  var searchData = useDishSearch(searchQuery, searchLimit, town)
  var searchResults = searchData.results
  var searchLoading = searchData.loading

  var dishData = useDishes(location, radius, null, null, town)
  var dishes = dishData.dishes
  var loading = dishData.loading
  var error = dishData.error

  var rankSort = function (a, b) {
    var aRanked = (a.total_votes || 0) >= MIN_VOTES_FOR_RANKING
    var bRanked = (b.total_votes || 0) >= MIN_VOTES_FOR_RANKING
    if (aRanked && !bRanked) return -1
    if (!aRanked && bRanked) return 1
    return (b.avg_rating || 0) - (a.avg_rating || 0)
  }

  var rankedDishes = useMemo(function () {
    if (!dishes || dishes.length === 0) return []
    var filtered = dishes
    if (selectedCategory) {
      filtered = dishes.filter(function (d) {
        return d.category && d.category.toLowerCase() === selectedCategory
      })
    }
    return filtered.slice().sort(rankSort).slice(0, 20)
  }, [dishes, selectedCategory])

  var selectedCategoryLabel = selectedCategory
    ? BROWSE_CATEGORIES.find(function (c) { return c.id === selectedCategory })
    : null

  function renderDishSections(items, makeOnClick) {
    var top = items.slice(0, 3)
    var rest = items.slice(3)
    return (
      <>
        {top.length > 0 && (
          <div className="stagger-item" style={{ animationDelay: '100ms' }}>
            {/* Section divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '14px',
            }}>
              <span style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '18px',
                fontWeight: 700,
                fontStyle: 'italic',
                color: 'var(--color-primary)',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}>
                The Best
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'var(--color-divider)',
              }} />
            </div>
            <div className="flex flex-col" style={{ gap: '14px' }}>
              {top.map(function (dish, i) {
                return (
                  <div
                    key={dish.dish_id}
                    className="stagger-item"
                    style={{ animationDelay: (i * 80 + 150) + 'ms' }}
                  >
                    <DishListItem
                      dish={dish}
                      rank={i + 1}
                      showDistance
                      onClick={makeOnClick(dish)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div className="stagger-item" style={{ marginTop: '24px', animationDelay: '400ms' }}>
            {/* Section divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <span style={{
                fontFamily: 'var(--font-accent)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}>
                Also Worth Ordering
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: 'var(--color-divider)',
              }} />
            </div>
            <div style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-divider)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              {rest.map(function (dish, i) {
                return (
                  <DishListItem
                    key={dish.dish_id}
                    dish={dish}
                    rank={i + 4}
                    showDistance
                    isLast={i === rest.length - 1}
                    onClick={makeOnClick(dish)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>

      {/* ── EDITORIAL MASTHEAD ── */}
      <div style={{
        padding: '20px 20px 14px',
        textAlign: 'center',
        borderBottom: '3px double var(--color-text-primary)',
      }}>
        <p style={{
          fontSize: '9px',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginBottom: '6px',
        }}>
          Est. 2026 &middot; Martha&rsquo;s Vineyard
        </p>
        <h1 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: 'var(--color-text-primary)',
          lineHeight: 1,
        }}>
          What&rsquo;s Good Here
        </h1>
        <p style={{
          fontSize: '9px',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginTop: '6px',
        }}>
          A Dish-Level Food Guide
        </p>
      </div>

      {/* ── SEARCH ── */}
      <div className="px-5 pt-3 pb-3">
        <DishSearch
          loading={loading}
          placeholder="What are you craving?"
          town={town}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* ── LOCATION BANNER ── */}
      <div className="px-5">
        <LocationBanner
          permissionState={permissionState}
          requestLocation={requestLocation}
          message="Enable location to find the best food near you"
        />
      </div>

      {/* ── RADIUS CHIP ── */}
      <div className="px-5 pb-2">
        <button
          onClick={function () { setShowRadiusSheet(true) }}
          aria-label={'Search radius: ' + radius + ' miles'}
          className="flex items-center gap-1.5 px-3.5 py-1.5"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '2px',
            background: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-divider)',
          }}
        >
          {radius} mi
          <CaretDown size={10} weight="bold" />
        </button>
      </div>

      {/* ── CATEGORY CHIPS ── */}
      <CategoryChips
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        sticky
        maxVisible={23}
        townPickerOpen={townPickerOpen}
        townPicker={
          <TownPicker
            town={town}
            onTownChange={setTown}
            isOpen={townPickerOpen}
            onToggle={setTownPickerOpen}
          />
        }
      />

      {/* ── SECTION HEADER ── */}
      <div className="px-5 pt-3 pb-2">
        <h2 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '20px',
          fontWeight: 700,
          fontStyle: 'italic',
          color: 'var(--color-text-primary)',
          letterSpacing: '0.04em',
          lineHeight: 1.1,
        }}>
          {selectedCategoryLabel
            ? (town ? 'Best ' + selectedCategoryLabel.label + ' in ' + town : 'Best ' + selectedCategoryLabel.label)
            : (town ? 'Top Rated in ' + town : 'Top Rated Nearby')
          }
        </h2>
      </div>

      {/* ── DISH LIST ── */}
      <div className="px-5 pb-4">
        {searchQuery ? (
          searchLoading ? (
            <ListSkeleton />
          ) : searchResults.length > 0 ? (
            renderDishSections(searchResults, function (dish) {
              return function () { navigate('/dish/' + dish.dish_id) }
            })
          ) : (
            <EmptyState
              emoji="🔍"
              title={'No dishes found for \u201c' + searchQuery + '\u201d'}
            />
          )
        ) : loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="py-8 text-center">
            <p role="alert" style={{ fontSize: '14px', color: 'var(--color-danger)' }}>
              {error.message || error}
            </p>
          </div>
        ) : rankedDishes.length > 0 ? (
          renderDishSections(rankedDishes, function (dish) {
            return function () { navigate('/dish/' + dish.dish_id) }
          })
        ) : (
          <EmptyState
            emoji="🍽️"
            title={selectedCategory ? 'No ' + (selectedCategoryLabel ? selectedCategoryLabel.label : '') + ' rated yet' : 'No dishes found'}
          />
        )}
      </div>

      {/* ── CHECK IN FAB ── */}
      <button
        onClick={function () { setAddModalQuery(''); setAddModalOpen(true) }}
        className="fixed right-5 flex items-center gap-2 px-5 py-3.5 font-semibold active:scale-95 transition-all"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          zIndex: 40,
          borderRadius: '4px',
          background: 'var(--color-primary)',
          color: 'var(--color-text-on-primary)',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          boxShadow: '0 4px 12px rgba(196, 71, 42, 0.3)',
        }}
      >
        <Plus size={18} weight="bold" />
        Check In
      </button>

      <RadiusSheet
        isOpen={showRadiusSheet}
        onClose={function () { setShowRadiusSheet(false) }}
        radius={radius}
        onRadiusChange={setRadius}
      />

      <AddRestaurantModal
        isOpen={addModalOpen}
        onClose={function () { setAddModalOpen(false) }}
        initialQuery={addModalQuery}
      />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-2xl" style={{ height: '140px', background: 'var(--color-card)', border: '1px solid var(--color-divider)', marginBottom: '12px' }} />
      {[0, 1].map(function (i) {
        return <div key={i} className="rounded-xl" style={{ height: '100px', background: 'var(--color-card)', border: '1px solid var(--color-divider)', marginBottom: '12px' }} />
      })}
    </div>
  )
}
