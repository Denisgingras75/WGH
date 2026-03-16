import { CaretLeft, CaretRight, ShareNetwork, MapPin, ArrowSquareOut, ShoppingBag, BookOpenText, Phone } from '@phosphor-icons/react'
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
    order_url: data.restaurants?.order_url,
    toast_slug: data.restaurants?.toast_slug,
    restaurant_phone: data.restaurants?.phone,
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
  const [showReviewForm, setShowReviewForm] = useState(false)

  const { isFavorite, toggleFavorite } = useFavorites(user?.id)

  // Auto-expand review form for logged-in users (they may have an existing vote)
  useEffect(function () {
    if (user) setShowReviewForm(true)
  }, [user])

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
            className="mx-4 -mt-5 rounded p-5 space-y-3"
            style={{ background: 'var(--color-surface-elevated)', border: '1.5px solid var(--color-divider)', borderRadius: '4px' }}
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
    <div className="min-h-screen pb-6" style={{ background: 'var(--color-bg)' }}>
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
          <CaretLeft size={20} weight="bold" />
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
            <ShareNetwork size={18} weight="duotone" />
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

          {/* Photo Hero — full width, or skip if no photos */}
          {allPhotos.length > 0 && (
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                position: 'relative',
                background: 'var(--color-surface)',
              }}
            >
              <img
                src={allPhotos[0].photo_url}
                alt={dish.dish_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={function(e) { e.target.parentElement.style.display = 'none' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '80px',
                background: 'linear-gradient(transparent, var(--color-bg))',
              }} />
            </div>
          )}

          {/* Verdict Card */}
          <div
            className="mx-3 rounded px-4 py-4"
            style={{
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-divider)',
              marginTop: '12px',
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
                <CaretLeft size={16} weight="bold" />
                {parentDish.name}
              </button>
            )}

            {/* Name + Price */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <CategoryIcon categoryId={dish.category} dishName={dish.dish_name} size={24} />
                <h1
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontWeight: 900,
                    fontSize: '22px',
                    letterSpacing: '-0.02em',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.15,
                    margin: 0,
                  }}
                >
                  {dish.dish_name}
                </h1>
              </div>
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
                <CaretRight size={12} weight="bold" />
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
                  <MapPin size={12} weight="fill" />
                  {distanceLabel ? distanceLabel + ' \u00b7 ' : ''}{dish.restaurant_town || 'See on map'}
                </button>
              ) : dish.restaurant_town ? (
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                  {dish.restaurant_town}
                </span>
              ) : null}
            </div>

            {/* Score Block — editorial verdict */}
            {isRanked && dish.avg_rating ? (
              <div className="mt-4 pt-4 pb-3" style={{ borderTop: '2px solid var(--color-text-primary)', borderBottom: '1px solid var(--color-divider)' }}>
                <div className="text-center">
                  <span
                    style={{
                      fontFamily: 'var(--font-headline)',
                      fontWeight: 900,
                      fontSize: '56px',
                      lineHeight: 1,
                      color: getRatingColor(dish.avg_rating),
                      fontVariantNumeric: 'tabular-nums',
                      display: 'block',
                    }}
                  >
                    {formatScore10(dish.avg_rating)}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-tertiary)',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
                    out of 10
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {dish.percent_worth_it}% would reorder
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>&middot;</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    {dish.total_votes} vote{dish.total_votes === 1 ? '' : 's'}
                  </span>
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
              {/* Order Now (Toast or order_url) or See Menu (website) */}
              {(dish.toast_slug || dish.order_url) ? (
                <a
                  href={dish.toast_slug ? 'https://order.toasttab.com/online/' + dish.toast_slug : dish.order_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={function () { capture('order_clicked', {
                    dish_id: dish.dish_id,
                    dish_name: dish.dish_name,
                    restaurant_id: dish.restaurant_id,
                    restaurant_name: dish.restaurant_name,
                    source: dish.toast_slug ? 'toast' : 'order_url',
                  }) }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-all active:scale-[0.97]"
                  style={{
                    background: 'var(--color-accent-orange)',
                    color: 'white',
                  }}
                >
                  <ShoppingBag size={16} weight="duotone" />
                  Order Now
                </a>
              ) : dish.website_url ? (
                <a
                  href={dish.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-all active:scale-[0.97]"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                  }}
                >
                  <BookOpenText size={16} weight="duotone" />
                  See Menu
                </a>
              ) : null}

              {/* Directions */}
              <a
                href={dish.restaurant_lat && dish.restaurant_lng
                  ? 'https://www.google.com/maps/dir/?api=1&destination=' + dish.restaurant_lat + ',' + dish.restaurant_lng
                  : 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent((dish.restaurant_address || (dish.restaurant_name + ', ' + (dish.restaurant_town || "Martha's Vineyard") + ', MA')))
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-all active:scale-[0.97]"
                style={{
                  background: 'var(--color-accent-gold)',
                  color: 'var(--color-bg)',
                }}
              >
                <MapPin size={16} weight="fill" />
                Directions
              </a>

              {/* Call */}
              {dish.restaurant_phone && (
                <a
                  href={'tel:' + dish.restaurant_phone}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-all active:scale-[0.97]"
                  style={{
                    background: 'var(--color-emerald)',
                    color: 'white',
                  }}
                >
                  <Phone size={16} weight="duotone" />
                  Call
                </a>
              )}
            </div>
          </div>

          {/* Smart Snippet — editorial pull-quote */}
          {smartSnippet && smartSnippet.review_text && (
            <div
              className="mx-3 mt-4 p-4 rounded"
              style={{
                background: 'rgba(44,36,22,0.04)',
                borderLeft: '3px solid var(--color-primary)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-primary)', lineHeight: 1.5, fontFamily: 'var(--font-headline)', fontStyle: 'italic' }}>
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

          {/* Friends who rated this — social proof */}
          {friendsVotes.length > 0 && (
            <>
            <div className="px-3 pt-4 pb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>Friends' Takes</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-divider)' }} />
            </div>
            <div
              className="mx-3 p-4 rounded"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-divider)' }}
            >
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
            </>
          )}

          {/* ═══════════════════════════════════════════
              LAYER 3: YOUR REVIEW + EVIDENCE
              Rate this dish, then reviews/photos.
              Lazy-loaded when user scrolls near.
              ═══════════════════════════════════════════ */}

          {/* Rate This Dish — collapsible */}
          <div className="px-3 pt-3">
            {!showReviewForm ? (
              <button
                onClick={function() { setShowReviewForm(true) }}
                className="w-full"
                style={{
                  padding: '14px',
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-bg)',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-headline)',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Rate This Dish
              </button>
            ) : (
              <div
                className="p-4 rounded"
                style={{
                  background: 'var(--color-surface-elevated)',
                  border: '1.5px solid var(--color-divider)',
                  borderRadius: '4px',
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
            )}
          </div>

          {/* ═══════════════════════════════════════════
              LAYER 4: THE EVIDENCE
              Reviews, photos. Supporting context.
              Lazy-loaded when user scrolls near.
              ═══════════════════════════════════════════ */}
          <div ref={evidenceSentinelRef} aria-hidden="true" />
          <div className="px-3 pt-4 pb-4">

            {/* Evidence skeleton while secondary data loads */}
            {!shouldLoadEvidence && (
              <div className="space-y-3 animate-pulse" role="status" aria-label="Loading details">
                <div className="h-20 rounded" style={{ background: 'var(--color-divider)' }} />
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map(function (i) { return <div key={i} className="aspect-square rounded-lg" style={{ background: 'var(--color-divider)' }} /> })}
                </div>
                <div className="h-16 rounded" style={{ background: 'var(--color-divider)' }} />
              </div>
            )}

            {/* Reviews feed */}
            {reviews.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>What People Are Saying</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-divider)' }} />
                  <TrustSummary
                    verifiedCount={reviews.filter(function (r) { return r.trust_badge === 'human_verified' || r.trust_badge === 'trusted_reviewer' }).length}
                    aiCount={reviews.filter(function (r) { return r.trust_badge === 'ai_estimated' }).length}
                  />
                </div>
                <div>
                  {reviews.map(function (review) {
                    return (
                      <div
                        key={review.id}
                        className="py-4"
                        style={{ borderBottom: '1px solid var(--color-divider)' }}
                      >
                        <div className="flex items-start gap-3">
                          <Link to={'/user/' + review.user_id} className="flex-shrink-0">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
                              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                            >
                              {review.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link to={'/user/' + review.user_id} className="min-w-0">
                                <span className="block truncate" style={{ fontFamily: 'var(--font-headline)', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                  @{review.profiles?.display_name || 'Anonymous'}
                                </span>
                              </Link>
                              {review.rating_10 && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span style={{ fontFamily: 'var(--font-headline)', fontSize: '22px', fontWeight: 900, color: getRatingColor(review.rating_10), lineHeight: 1 }}>
                                    {formatScore10(review.rating_10)}
                                  </span>
                                  <span style={{ opacity: 0.5 }}>{review.would_order_again ? <ThumbsUpIcon size={14} /> : <ThumbsDownIcon size={14} />}</span>
                                </div>
                              )}
                              {!review.rating_10 && (
                                <span style={{ opacity: 0.5 }}>{review.would_order_again ? <ThumbsUpIcon size={14} /> : <ThumbsDownIcon size={14} />}</span>
                              )}
                            </div>
                            <span className="block" style={{ fontSize: '10px', fontStyle: 'italic', color: 'var(--color-text-tertiary)', marginTop: '1px' }}>
                              {formatRelativeTime(review.review_created_at)}
                            </span>
                            {review.review_text && (
                              <p className="mt-2 mb-0" style={{ fontFamily: 'var(--font-headline)', fontStyle: 'italic', fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-primary)', borderLeft: '2px solid var(--color-divider)', paddingLeft: '12px', margin: '8px 0 0 0' }}>
                                {review.review_text}
                              </p>
                            )}
                            <div style={{ marginTop: '4px' }}>
                              <TrustBadge type={review.trust_badge} />
                            </div>
                          </div>
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
                className="mb-4 p-4 rounded text-center"
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-divider)' }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  No written reviews yet — be the first to share your thoughts!
                </p>
              </div>
            )}

            {/* Photos grid */}
            {displayPhotos.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontFamily: 'var(--font-headline)', fontSize: '15px', fontWeight: 700, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>Photos</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-divider)' }} />
                </div>
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
