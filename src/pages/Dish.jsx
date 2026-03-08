import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { capture } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'
import { logger } from '../utils/logger'
import { getCompatColor } from '../utils/formatters'
import { shareOrCopy, buildDishShareData } from '../utils/share'
import { toast } from 'sonner'
import { dishesApi } from '../api/dishesApi'
import { followsApi } from '../api/followsApi'
import { dishPhotosApi } from '../api/dishPhotosApi'
import { votesApi } from '../api/votesApi'
import { useFavorites } from '../hooks/useFavorites'
import { ReviewFlow } from '../components/ReviewFlow'
import { PhotoUploadConfirmation } from '../components/PhotoUploadConfirmation'
import { LoginModal } from '../components/Auth/LoginModal'
import { VariantSelector } from '../components/VariantPicker'
import { CategoryIcon } from '../components/home/CategoryIcons'
import { PhotoUploadButton } from '../components/PhotoUploadButton'
import { TrustBadge, TrustSummary } from '../components/TrustBadge'
import { ValueBadge } from '../components/browse/ValueBadge'
import { CATEGORY_INFO } from '../constants/categories'
import { MIN_VOTES_FOR_RANKING } from '../constants/app'
import { getRatingColor, formatScore10 } from '../utils/ranking'
import { formatRelativeTime } from '../utils/formatters'
import { ThumbsUpIcon } from '../components/ThumbsUpIcon'
import { ThumbsDownIcon } from '../components/ThumbsDownIcon'
import { HearingIcon } from '../components/HearingIcon'
import { EarIconTooltip } from '../components/EarIconTooltip'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../lib/storage'
import { useLocationContext } from '../context/LocationContext'
import { calculateDistance } from '../utils/distance'

/**
 * Transform raw dish data from API to component format
 */
function transformDish(data) {
  return {
    dish_id: data.id,
    dish_name: data.name,
    restaurant_id: data.restaurant_id,
    restaurant_name: data.restaurants?.name || 'Unknown',
    restaurant_town: data.restaurants?.town,
    restaurant_address: data.restaurants?.address,
    restaurant_lat: data.restaurants?.lat,
    restaurant_lng: data.restaurants?.lng,
    category: data.category,
    price: data.price,
    photo_url: data.photo_url,
    total_votes: data.total_votes || 0,
    yes_votes: data.yes_votes || 0,
    percent_worth_it: data.total_votes > 0
      ? Math.round((data.yes_votes / data.total_votes) * 100)
      : 0,
    avg_rating: data.avg_rating,
    parent_dish_id: data.parent_dish_id,
    has_variants: data.has_variants,
    value_percentile: data.value_percentile,
    website_url: data.restaurants?.website_url,
  }
}

export function Dish() {
  const { dishId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { location } = useLocationContext()

  const [dish, setDish] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Variant state
  const [variants, setVariants] = useState([])
  const [parentDish, setParentDish] = useState(null)
  const [isVariant, setIsVariant] = useState(false)

  const [photoUploaded, setPhotoUploaded] = useState(null)
  const [featuredPhoto, setFeaturedPhoto] = useState(null)
  const [communityPhotos, setCommunityPhotos] = useState([])
  const [allPhotos, setAllPhotos] = useState([])
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [friendsVotes, setFriendsVotes] = useState([])
  const [friendsCompat, setFriendsCompat] = useState({}) // { userId: compatibility_pct }
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [smartSnippet, setSmartSnippet] = useState(null)

  const { isFavorite, toggleFavorite } = useFavorites(user?.id)

  // Lazy-load evidence section — only fetch when user scrolls near it
  const [shouldLoadEvidence, setShouldLoadEvidence] = useState(false)
  const evidenceSentinelRef = useRef(null)

  const observerCallback = useCallback(function (entries) {
    if (entries[0].isIntersecting) {
      setShouldLoadEvidence(true)
    }
  }, [])

  useEffect(function () {
    var el = evidenceSentinelRef.current
    if (!el || shouldLoadEvidence) return
    var observer = new IntersectionObserver(observerCallback, {
      rootMargin: '200px',
    })
    observer.observe(el)
    return function () { observer.disconnect() }
  }, [dish, shouldLoadEvidence, observerCallback])

  // Ear icon tooltip — show once per device
  const [showEarTooltip, setShowEarTooltip] = useState(false)
  const tooltipChecked = useRef(false)

  useEffect(() => {
    if (dish && !tooltipChecked.current) {
      tooltipChecked.current = true
      if (!getStorageItem(STORAGE_KEYS.HAS_SEEN_EAR_TOOLTIP)) {
        setShowEarTooltip(true)
      }
    }
  }, [dish])

  function dismissEarTooltip() {
    setShowEarTooltip(false)
    setStorageItem(STORAGE_KEYS.HAS_SEEN_EAR_TOOLTIP, '1')
  }

  // Fetch dish data
  useEffect(() => {
    if (!dishId) return

    const fetchDish = async () => {
      try {
        setLoading(true)
        setError(null)
        setShouldLoadEvidence(false)

        const data = await dishesApi.getDishById(dishId)
        const transformedDish = transformDish(data)
        setDish(transformedDish)

        // Track dish view - valuable for restaurants!
        capture('dish_viewed', {
          dish_id: transformedDish.dish_id,
          dish_name: transformedDish.dish_name,
          restaurant_id: transformedDish.restaurant_id,
          restaurant_name: transformedDish.restaurant_name,
          category: transformedDish.category,
          price: transformedDish.price,
          avg_rating: transformedDish.avg_rating,
          total_votes: transformedDish.total_votes,
          percent_worth_it: transformedDish.percent_worth_it,
        })
      } catch (err) {
        logger.error('Error fetching dish:', err)
        setError('Dish not found')
      } finally {
        setLoading(false)
      }
    }

    fetchDish()
  }, [dishId])

  // Fetch variant data (if parent has variants, or if this dish is a variant)
  useEffect(() => {
    if (!dish) {
      setVariants([])
      setParentDish(null)
      setIsVariant(false)
      return
    }

    const fetchVariantData = async () => {
      // Check if this dish has variants (is a parent)
      if (dish.has_variants) {
        try {
          const variantData = await dishesApi.getVariants(dish.dish_id || dish.id)
          setVariants(variantData)
          setIsVariant(false)
          setParentDish(null)
        } catch (err) {
          logger.error('Failed to fetch variants:', err)
          setVariants([])
        }
      }
      // Check if this dish is a variant (has a parent)
      else if (dish.parent_dish_id) {
        try {
          const [siblings, parent] = await Promise.all([
            dishesApi.getSiblingVariants(dish.dish_id || dish.id),
            dishesApi.getParentDish(dish.dish_id || dish.id),
          ])
          setVariants(siblings)
          setParentDish(parent)
          setIsVariant(true)
        } catch (err) {
          logger.error('Failed to fetch sibling variants:', err)
          setVariants([])
          setParentDish(null)
        }
      } else {
        setVariants([])
        setParentDish(null)
        setIsVariant(false)
      }
    }

    fetchVariantData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-run on specific dish properties
  }, [dish?.dish_id, dish?.id, dish?.has_variants, dish?.parent_dish_id])

  // Fetch photos, reviews, and friends' votes — deferred until user scrolls near evidence section
  useEffect(() => {
    if (!dishId || !shouldLoadEvidence) return

    const fetchSecondaryData = async () => {
      setReviewsLoading(true)

      // Run all independent fetches in parallel
      const [photosResult, reviewsResult, friendsResult, snippetResult] = await Promise.allSettled([
        // Photos (3 calls, already parallelized internally)
        Promise.all([
          dishPhotosApi.getFeaturedPhoto(dishId),
          dishPhotosApi.getCommunityPhotos(dishId),
          dishPhotosApi.getAllVisiblePhotos(dishId),
        ]),
        // Reviews
        votesApi.getReviewsForDish(dishId, { limit: 20 }),
        // Friends' votes (only if user is logged in)
        user ? followsApi.getFriendsVotesForDish(dishId) : Promise.resolve([]),
        // Smart snippet (best review pull quote)
        votesApi.getSmartSnippetForDish(dishId),
      ])

      // Handle photos result
      if (photosResult.status === 'fulfilled') {
        const [featured, community, all] = photosResult.value
        setFeaturedPhoto(featured)
        setCommunityPhotos(community)
        setAllPhotos(all)
      } else {
        logger.error('Failed to fetch photos:', photosResult.reason)
      }

      // Handle reviews result
      if (reviewsResult.status === 'fulfilled') {
        setReviews(reviewsResult.value)
      } else {
        logger.error('Failed to fetch reviews:', reviewsResult.reason)
        setReviews([])
      }
      setReviewsLoading(false)

      // Handle friends' votes result
      if (friendsResult.status === 'fulfilled') {
        setFriendsVotes(friendsResult.value)
      } else {
        logger.error('Failed to fetch friends votes:', friendsResult.reason)
        setFriendsVotes([])
      }

      // Handle smart snippet result
      if (snippetResult.status === 'fulfilled') {
        setSmartSnippet(snippetResult.value)
      } else {
        logger.error('Failed to fetch smart snippet:', snippetResult.reason)
      }

    }

    fetchSecondaryData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishId, user, dish?.category, shouldLoadEvidence])

  // Fetch taste compatibility for each friend who voted
  useEffect(() => {
    if (!user || friendsVotes.length === 0) {
      setFriendsCompat({})
      return
    }

    async function fetchCompat() {
      try {
        const results = await Promise.allSettled(
          friendsVotes.map(fv => followsApi.getTasteCompatibility(fv.user_id))
        )
        const compatMap = {}
        friendsVotes.forEach((fv, i) => {
          if (results[i].status === 'fulfilled' && results[i].value?.compatibility_pct != null) {
            compatMap[fv.user_id] = results[i].value.compatibility_pct
          }
        })
        setFriendsCompat(compatMap)
      } catch (err) {
        logger.error('Failed to fetch friends compatibility:', err)
      }
    }

    fetchCompat()
  }, [user, friendsVotes])

  const handlePhotoUploaded = async (photo) => {
    setPhotoUploaded(photo)
    // Refresh photos
    try {
      const [featured, community, all] = await Promise.all([
        dishPhotosApi.getFeaturedPhoto(dishId),
        dishPhotosApi.getCommunityPhotos(dishId),
        dishPhotosApi.getAllVisiblePhotos(dishId),
      ])
      setFeaturedPhoto(featured)
      setCommunityPhotos(community)
      setAllPhotos(all)
    } catch (error) {
      logger.error('Failed to refresh photos after upload:', error)
    }
  }

  const handleVote = async () => {
    // Refetch dish data and reviews after voting
    try {
      const [data, reviewsData] = await Promise.all([
        dishesApi.getDishById(dishId),
        votesApi.getReviewsForDish(dishId, { limit: 20 }),
      ])
      const transformedDish = transformDish(data)
      setDish(transformedDish)
      setReviews(reviewsData)
    } catch (err) {
      logger.error('Failed to refresh dish data after vote:', err)
      // UI continues with stale data - vote was still recorded
    }
  }

  const handleLoginRequired = () => {
    setLoginModalOpen(true)
  }

  const handleToggleSave = async () => {
    if (!user) {
      setLoginModalOpen(true)
      return
    }
    await toggleFavorite(dishId)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else if (dish?.restaurant_id) {
      navigate(`/restaurants/${dish.restaurant_id}`)
    } else {
      navigate('/')
    }
  }

  const handleShare = async () => {
    const shareData = buildDishShareData(dish)
    const result = await shareOrCopy(shareData)

    capture('dish_shared', {
      dish_id: dish.dish_id,
      dish_name: dish.dish_name,
      restaurant_name: dish.restaurant_name,
      context: 'dish_page',
      method: result.method,
      success: result.success,
    })

    if (result.success && result.method !== 'native') {
      toast.success('Link copied!', { duration: 2000 })
    }
  }

  // Photos to display
  const displayPhotos = showAllPhotos ? allPhotos : communityPhotos.slice(0, 4)
  const hasMorePhotos = allPhotos.length > 4 && !showAllPhotos

  // Hero image — only use real photos, fall back to RestaurantAvatar placeholder

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-surface-elevated)' }}>
        <div className="animate-pulse">
          <div className="aspect-[4/3] w-full" style={{ background: 'var(--color-divider)' }} />
          <div
            className="mx-4 -mt-5 rounded-xl p-5 space-y-3"
            style={{ background: 'var(--color-surface-elevated)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div className="h-6 w-48 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="h-4 w-32 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="flex items-end justify-between pt-2">
              <div className="h-10 w-14 rounded" style={{ background: 'var(--color-divider)' }} />
              <div className="h-4 w-24 rounded" style={{ background: 'var(--color-divider)' }} />
            </div>
          </div>
          <div className="p-4 mt-4 space-y-3">
            <div className="h-4 w-48 rounded" style={{ background: 'var(--color-divider)' }} />
            <div className="h-4 w-32 rounded" style={{ background: 'var(--color-divider)' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !dish) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface-elevated)' }}>
        <div className="text-center p-4">
          <img
            src="/empty-plate.png"
            alt=""
            className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
          />
          <p className="font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Dish not found
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-5 py-2.5 text-sm font-bold rounded-lg card-press"
            style={{
              background: 'var(--color-primary)',
              color: '#FFFFFF',
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const isRanked = dish.total_votes >= MIN_VOTES_FOR_RANKING

  // Calculate distance from user to restaurant
  const distanceMiles = (location?.lat && dish.restaurant_lat)
    ? calculateDistance(location.lat, location.lng, dish.restaurant_lat, dish.restaurant_lng)
    : null
  const distanceLabel = distanceMiles != null
    ? distanceMiles < 0.2 ? 'Right here' : distanceMiles < 1 ? distanceMiles.toFixed(1) + ' mi walk' : distanceMiles.toFixed(1) + ' mi'
    : null
  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-3 py-2 flex items-center gap-2 top-bar"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1.5px solid var(--color-divider)',
        }}
      >
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {dish.dish_name}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleShare}
            aria-label="Share dish"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                if (showEarTooltip) dismissEarTooltip()
                handleToggleSave(e)
              }}
              aria-label={isFavorite?.(dishId) ? 'Remove from heard list' : 'Mark as heard it was good'}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              <HearingIcon size={24} active={isFavorite?.(dishId)} />
            </button>
            <EarIconTooltip visible={showEarTooltip} onDismiss={dismissEarTooltip} />
          </div>
        </div>
      </header>

      {/* Photo confirmation after upload */}
      {photoUploaded ? (
        <div className="p-4">
          <PhotoUploadConfirmation
            dishName={dish.dish_name}
            photoUrl={photoUploaded.photo_url}
            status={photoUploaded.analysisResults?.status}
            onRateNow={() => setPhotoUploaded(null)}
            onLater={() => setPhotoUploaded(null)}
          />
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════
              LAYER 1: THE VERDICT
              Score, consensus, distance. 2 seconds.
              ═══════════════════════════════════════════ */}

          {/* Category Icon Hero */}
          <div
            className="flex items-center justify-center"
            style={{
              height: '72px',
              background: 'var(--color-surface)',
            }}
          >
            <CategoryIcon categoryId={dish.category} dishName={dish.dish_name} size={48} />
          </div>

          {/* Verdict Card */}
          <div
            className="mx-3 rounded-xl px-4 py-4"
            style={{
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-divider)',
              marginTop: '8px',
              position: 'relative',
              zIndex: 5,
            }}
          >
            {/* Variant breadcrumb */}
            {isVariant && parentDish && (
              <button
                onClick={() => navigate('/dish/' + parentDish.id)}
                className="flex items-center gap-1 text-xs font-bold mb-3"
                style={{ color: 'var(--color-primary)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {parentDish.name}
              </button>
            )}

            {/* Name + Price */}
            <div className="flex items-start justify-between gap-3">
              <h1
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '22px',
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {dish.dish_name}
              </h1>
              {dish.price ? (
                <span className="flex-shrink-0 font-bold" style={{ color: 'var(--color-text-primary)', fontSize: '18px' }}>
                  ${Number(dish.price).toFixed(0)}
                </span>
              ) : null}
            </div>

            {/* Restaurant + Distance row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <button
                onClick={() => navigate('/restaurants/' + dish.restaurant_id)}
                className="flex items-center gap-1"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {dish.restaurant_name}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {(dish.restaurant_lat && dish.restaurant_lng) ? (
                <button
                  onClick={function () {
                    navigate('/', { state: { focusDish: dish.dish_id } })
                  }}
                  className="flex items-center gap-1"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-accent-gold)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {distanceLabel ? distanceLabel + ' \u00b7 ' : ''}{dish.restaurant_town || 'See on map'}
                </button>
              ) : dish.restaurant_town ? (
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                  {dish.restaurant_town}
                </span>
              ) : null}
            </div>

            {/* Score Block — the whole point */}
            {isRanked && dish.avg_rating ? (
              <div className="flex items-end justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: '40px',
                      lineHeight: 1,
                      color: getRatingColor(dish.avg_rating),
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatScore10(dish.avg_rating)}
                  </span>
                </div>
                <div className="text-right space-y-1" style={{ minWidth: '120px' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {dish.percent_worth_it}% would reorder
                  </p>
                  <div style={{
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--color-divider, #e5e7eb)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: dish.percent_worth_it + '%',
                      borderRadius: '2px',
                      background: getRatingColor(dish.avg_rating),
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    {dish.total_votes} vote{dish.total_votes === 1 ? '' : 's'}
                  </p>
                  <ValueBadge valuePercentile={dish.value_percentile} />
                </div>
              </div>
            ) : dish.total_votes > 0 ? (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  {dish.total_votes} vote{dish.total_votes === 1 ? '' : 's'} — needs {MIN_VOTES_FOR_RANKING - dish.total_votes} more to rank
                </p>
              </div>
            ) : null}
          </div>

          {/* ═══════════════════════════════════════════
              LAYER 2: THE ACTION
              Get there or order online. 3 seconds.
              ═══════════════════════════════════════════ */}
          <div className="px-3 pt-3">
            <div className="flex gap-2">
              {/* Order online button */}
              {dish.website_url && (
                <a
                  href={dish.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => capture('order_link_clicked', {
                    dish_id: dish.dish_id,
                    dish_name: dish.dish_name,
                    restaurant_id: dish.restaurant_id,
                    restaurant_name: dish.restaurant_name,
                  })}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-text-on-primary)',
                  }}
                >
                  Order Online
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Review Flow */}
          <div className="p-4">
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'var(--color-surface-elevated)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
              }}
            >
              <ReviewFlow
                dishId={dish.dish_id}
                dishName={dish.dish_name}
                restaurantId={dish.restaurant_id}
                restaurantName={dish.restaurant_name}
                category={dish.category}
                price={dish.price}
                totalVotes={dish.total_votes}
                yesVotes={dish.yes_votes}
                percentWorthIt={dish.percent_worth_it}
                isRanked={isRanked}
                hasPhotos={allPhotos.length > 0}
                onVote={handleVote}
                onLoginRequired={handleLoginRequired}
                onPhotoUploaded={handlePhotoUploaded}
                onToggleFavorite={handleToggleSave}
                isFavorite={isFavorite?.(dishId)}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              LAYER 3: THE EVIDENCE
              Photos, reviews, social proof. For context.
              Lazy-loaded when user scrolls near.
              ═══════════════════════════════════════════ */}
          <div ref={evidenceSentinelRef} aria-hidden="true" />
          <div className="px-3 pt-4 pb-4">

            {/* Evidence skeleton while secondary data loads */}
            {!shouldLoadEvidence && (
              <div className="space-y-3 animate-pulse" role="status" aria-label="Loading details">
                <div className="h-20 rounded-xl" style={{ background: 'var(--color-divider)' }} />
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map(function (i) { return <div key={i} className="aspect-square rounded-lg" style={{ background: 'var(--color-divider)' }} /> })}
                </div>
                <div className="h-16 rounded-xl" style={{ background: 'var(--color-divider)' }} />
              </div>
            )}

            {/* Smart Snippet — the one-liner social proof */}
            {smartSnippet && smartSnippet.review_text && (
              <div
                className="mb-4 p-4 rounded-xl"
                style={{
                  background: 'var(--color-surface)',
                  borderLeft: '3px solid var(--color-accent-gold)',
                }}
              >
                <p className="text-sm italic" style={{ color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                  &ldquo;{smartSnippet.review_text}&rdquo;
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    — @{smartSnippet.profiles?.display_name || 'Anonymous'}
                  </span>
                  {smartSnippet.rating_10 && (
                    <span className="text-xs font-bold" style={{ color: getRatingColor(smartSnippet.rating_10) }}>
                      {formatScore10(smartSnippet.rating_10)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Photos grid */}
            {displayPhotos.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Photos ({displayPhotos.length})
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {displayPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setLightboxPhoto(photo.photo_url)}
                      aria-label={'View photo of ' + dish.dish_name}
                      className="aspect-square rounded-lg overflow-hidden active:scale-95 transition-transform"
                      style={{ border: '1.5px solid var(--color-divider)' }}
                    >
                      <img
                        src={photo.photo_url}
                        alt={dish.dish_name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={function (e) { e.target.parentElement.style.display = 'none' }}
                      />
                    </button>
                  ))}
                </div>
                {hasMorePhotos && (
                  <button
                    onClick={function () { setShowAllPhotos(true) }}
                    className="mt-3 text-sm font-bold"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    See all {allPhotos.length} photos
                  </button>
                )}
              </div>
            )}

            {/* Friends who rated this */}
            {friendsVotes.length > 0 && (
              <div
                className="mb-4 p-4 rounded-xl"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-divider)' }}
              >
                <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Friends who rated this
                </h3>
                <div className="space-y-3">
                  {friendsVotes.map(function (vote) {
                    var categoryLabel = CATEGORY_INFO[dish.category]?.label || dish.category
                    var expertiseLabel = vote.category_expertise === 'authority'
                      ? categoryLabel + ' Authority'
                      : vote.category_expertise === 'specialist'
                        ? categoryLabel + ' Specialist'
                        : null

                    return (
                      <Link
                        key={vote.user_id}
                        to={'/user/' + vote.user_id}
                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                        >
                          {vote.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {vote.display_name || 'Anonymous'}
                            </p>
                            {expertiseLabel && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                                style={{
                                  background: vote.category_expertise === 'authority' ? 'var(--color-primary-muted)' : 'var(--color-success-muted)',
                                  color: vote.category_expertise === 'authority' ? 'var(--color-purple)' : 'var(--color-blue)',
                                }}
                              >
                                {expertiseLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                            {vote.would_order_again ? <><ThumbsUpIcon size={20} /> Would order again</> : <><ThumbsDownIcon size={20} /> Would skip</>}
                            {friendsCompat[vote.user_id] != null && (
                              <span className="ml-1.5 font-medium" style={{ color: getCompatColor(friendsCompat[vote.user_id]) }}>
                                &middot; {friendsCompat[vote.user_id]}% match
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: getRatingColor(vote.rating_10) }}>
                            {formatScore10(vote.rating_10)}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Reviews feed */}
            {reviews.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Reviews ({reviews.length})
                  </h3>
                  <TrustSummary
                    verifiedCount={reviews.filter(function (r) { return r.trust_badge === 'human_verified' || r.trust_badge === 'trusted_reviewer' }).length}
                    aiCount={reviews.filter(function (r) { return r.trust_badge === 'ai_estimated' }).length}
                  />
                </div>
                <div className="space-y-2">
                  {reviews.map(function (review) {
                    return (
                      <div
                        key={review.id}
                        className="p-4 rounded-xl"
                        style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-divider)' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Link to={'/user/' + review.user_id} className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                            >
                              {review.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold block truncate" style={{ color: 'var(--color-text-primary)' }}>
                                @{review.profiles?.display_name || 'Anonymous'}
                              </span>
                              <span className="text-[11px] block" style={{ color: 'var(--color-text-tertiary)' }}>
                                {formatRelativeTime(review.review_created_at)}
                              </span>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span className="font-bold" style={{ fontSize: '18px', color: getRatingColor(review.rating_10) }}>
                              {review.rating_10 ? formatScore10(review.rating_10) : ''}
                            </span>
                            <span>{review.would_order_again ? <ThumbsUpIcon size={22} /> : <ThumbsDownIcon size={22} />}</span>
                          </div>
                        </div>
                        {review.review_text && (
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                            {review.review_text}
                          </p>
                        )}
                        <div className="mt-2">
                          <TrustBadge type={review.trust_badge} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No reviews message */}
            {!reviewsLoading && reviews.length === 0 && dish.total_votes > 0 && (
              <div
                className="mb-4 p-4 rounded-xl text-center"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-divider)' }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  No written reviews yet — be the first to share your thoughts!
                </p>
              </div>
            )}

            {/* Variant Selector */}
            {variants.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {isVariant ? 'Other flavors' : 'Available flavors'}
                </p>
                <VariantSelector
                  variants={variants}
                  currentDishId={dish.dish_id}
                  onSelect={function (variant) { navigate('/dish/' + variant.dish_id) }}
                />
              </div>
            )}

          </div>
        </>
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-label="Photo lightbox"
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
            onClick={() => setLightboxPhoto(null)}
            aria-label="Close lightbox"
          >
            &times;
          </button>
          <img
            src={lightboxPhoto}
            alt={dish.dish_name}
            className="max-w-full max-h-full object-contain"
            onError={() => {
              // Close lightbox if image fails to load
              setLightboxPhoto(null)
            }}
          />
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  )
}
