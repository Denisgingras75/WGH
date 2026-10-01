import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { restaurantsApi } from '../api/restaurantsApi'
import { dishesApi } from '../api/dishesApi'
import { votesApi } from '../api/votesApi'
import { createClassifiedError, getUserMessage } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { buildDishSections } from '../utils/menuSections'
import { setBackButtonInterceptor, clearBackButtonInterceptor } from '../utils/backButtonInterceptor'
import { validateUserContent } from '../lib/reviewBlocklist'
import { useDishes } from '../hooks/useDishes'
import { useDishPhotos } from '../hooks/useDishPhotos'
import { LoginModal } from '../components/Auth/LoginModal'
import { EmptyState } from '../components/EmptyState'
import { DishSelector } from '../components/rate-meal/DishSelector'
import { BatchRatingCard } from '../components/rate-meal/BatchRatingCard'
import { BatchSummary } from '../components/rate-meal/BatchSummary'
import { RateMealSignIn, RateMealNoMenu, RateMealSuccess } from '../components/rate-meal/RateMealStates'

function getDishClientId(dishId) {
  return 'dish-' + dishId
}

function getSpecialClientId(specialDishName) {
  return 'special-' + specialDishName.trim().toLowerCase().replace(/\s+/g, '-')
}

// rating10 = null means "unrated" (0.0 is a real rating). Prefill from the
// user's existing vote so a batch submit never silently erases their review.
function createInitialRatingState(previousValue, prior) {
  return previousValue || {
    rating10: prior?.rating10 ?? null,
    reviewText: prior?.reviewText || '',
    photoFile: null,
  }
}

export function RateYourMeal() {
  var { restaurantId } = useParams()
  var navigate = useNavigate()
  var queryClient = useQueryClient()
  var { user, loading: authLoading } = useAuth()
  var { location, radius } = useLocationContext()
  var { uploadPhoto, uploading, analyzing } = useDishPhotos()

  var [step, setStep] = useState('select')
  var [currentIndex, setCurrentIndex] = useState(0)
  var [editingFromSummary, setEditingFromSummary] = useState(false)
  var [searchQuery, setSearchQuery] = useState('')
  var [loginModalOpen, setLoginModalOpen] = useState(false)
  var [selectedDishIds, setSelectedDishIds] = useState({})
  var [specialDishEnabled, setSpecialDishEnabled] = useState(false)
  var [specialDishName, setSpecialDishName] = useState('')
  var [specialDishError, setSpecialDishError] = useState(null)
  var [loadingPriorVotes, setLoadingPriorVotes] = useState(false)
  var [selectedDishes, setSelectedDishes] = useState([])
  var [ratingsById, setRatingsById] = useState({})
  var [submitError, setSubmitError] = useState(null)
  var [successCount, setSuccessCount] = useState(0)
  var [uploadStatus, setUploadStatus] = useState('')

  var { data: restaurant, isLoading: restaurantLoading, error: restaurantError } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: function () {
      return restaurantsApi.getById(restaurantId)
    },
    enabled: !!restaurantId,
  })

  var { dishes, loading: dishesLoading, error: dishesError } = useDishes(location, radius, null, restaurantId)

  // Wait for the session to restore before deciding the user is signed out.
  useEffect(function () {
    if (authLoading) return
    setLoginModalOpen(!user)
  }, [user, authLoading])

  // Each card / step starts at the top (name + slider in view).
  useEffect(function () {
    window.scrollTo(0, 0)
  }, [step, currentIndex])

  function markPhotoUploaded(clientId) {
    setRatingsById(function (previous) {
      return {
        ...previous,
        [clientId]: { ...previous[clientId], photoUploaded: true },
      }
    })
  }

  var submitMutation = useMutation({
    mutationFn: async function () {
      var resolvedDishes = selectedDishes.slice()
      var photoWarnings = []

      // Check every note before creating a special dish or uploading a photo.
      for (var j = 0; j < resolvedDishes.length; j += 1) {
        var noteRating = ratingsById[resolvedDishes[j].clientId]
        var noteError = validateUserContent(noteRating && noteRating.reviewText, 'Note')
        if (noteError) {
          var validationError = new Error(resolvedDishes[j].name + ': ' + noteError)
          validationError.userMessage = validationError.message
          throw validationError
        }
      }

      try {
        var votes = []

        for (var i = 0; i < resolvedDishes.length; i += 1) {
          var dish = resolvedDishes[i]
          var rating = ratingsById[dish.clientId]
          var resolvedDish = dish

          if (resolvedDish.isSpecial && !resolvedDish.dishId) {
            var createdDish = await dishesApi.create({
              restaurantId,
              name: resolvedDish.name,
              category: resolvedDish.category || 'Special',
              price: null,
            })

            resolvedDish = {
              ...resolvedDish,
              dishId: createdDish.id,
              category: createdDish.category || resolvedDish.category,
            }
            resolvedDishes[i] = resolvedDish
          }

          // Skip photos already uploaded by an earlier (failed) attempt.
          if (rating.photoFile && !rating.photoUploaded) {
            setUploadStatus('Uploading photo for ' + resolvedDish.name)
            var upload = await uploadPhoto(resolvedDish.dishId, rating.photoFile)
            if (upload && upload.rejected) {
              photoWarnings.push(resolvedDish.name + ': ' + upload.reason)
            } else {
              markPhotoUploaded(dish.clientId)
            }
          }

          votes.push({
            dishId: resolvedDish.dishId,
            rating10: rating.rating10,
            reviewText: rating.reviewText,
          })
        }

        setUploadStatus('')

        var result = await votesApi.submitBatchVotes({ votes: votes })
        return {
          result: result,
          resolvedDishes: resolvedDishes,
          photoWarnings: photoWarnings,
        }
      } catch (error) {
        logger.error('Error submitting rate-your-meal batch:', error)
        var classifiedError = error.type ? error : createClassifiedError(error)
        classifiedError.resolvedDishes = classifiedError.resolvedDishes || resolvedDishes
        throw classifiedError
      }
    },
    onSuccess: function (data) {
      setUploadStatus('')
      setSubmitError(null)
      setSelectedDishes(data.resolvedDishes)
      setSuccessCount(data.result.submittedCount || data.result.submittedDishIds.length)
      setStep('success')

      data.photoWarnings.forEach(function (warning) {
        toast.error('Photo not saved for ' + warning)
      })

      queryClient.invalidateQueries({ queryKey: ['dishes'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['userVotes'] })
      queryClient.invalidateQueries({ queryKey: ['userVote'] })
      queryClient.invalidateQueries({ queryKey: ['allDishes'] })
      queryClient.invalidateQueries({ queryKey: ['unratedDishes'] })
      queryClient.invalidateQueries({ queryKey: ['dish'] })
      queryClient.invalidateQueries({ queryKey: ['myVotesForDishes'] })
    },
    onError: function (error) {
      setUploadStatus('')
      if (error.resolvedDishes) {
        setSelectedDishes(error.resolvedDishes)
      }
      setSubmitError(error)
      setStep('summary')
    },
  })

  function handleToggleDish(dish) {
    setSelectedDishIds(function (previous) {
      var next = { ...previous }
      if (next[dish.dish_id]) {
        delete next[dish.dish_id]
      } else {
        next[dish.dish_id] = true
      }
      return next
    })
  }

  function buildSelectedDishes() {
    var sections = buildDishSections(dishes, restaurant?.menu_section_order || [], '')
    var nextSelectedDishes = []

    sections.forEach(function (section) {
      section.dishes.forEach(function (dish) {
        if (selectedDishIds[dish.dish_id]) {
          nextSelectedDishes.push({
            clientId: getDishClientId(dish.dish_id),
            dishId: dish.dish_id,
            name: dish.dish_name,
            category: dish.category || section.name,
            menuSection: dish.menu_section || section.name,
            isSpecial: false,
          })
        }
      })
    })

    if (specialDishEnabled && specialDishName.trim()) {
      var specialClientId = getSpecialClientId(specialDishName)
      // Reuse a special already created by an earlier (failed) submit.
      var priorSpecial = selectedDishes.find(function (d) { return d.clientId === specialClientId })
      nextSelectedDishes.push({
        clientId: specialClientId,
        dishId: priorSpecial ? priorSpecial.dishId : null,
        name: specialDishName.trim(),
        category: 'Special',
        menuSection: 'Special',
        isSpecial: true,
      })
    }

    return nextSelectedDishes
  }

  async function handleContinueFromSelector() {
    if (specialDishEnabled && specialDishName.trim()) {
      var nameError = validateUserContent(specialDishName, 'Dish name')
      if (nameError) {
        setSpecialDishError(nameError)
        return
      }
    }

    var nextSelectedDishes = buildSelectedDishes()
    if (nextSelectedDishes.length === 0) {
      return
    }

    // Load existing votes first: submitting without them would overwrite a
    // review the user already wrote with an empty note.
    var dishIds = nextSelectedDishes
      .filter(function (dish) { return !dish.isSpecial })
      .map(function (dish) { return dish.dishId })
    var priorVotes = {}
    if (dishIds.length > 0) {
      setLoadingPriorVotes(true)
      try {
        priorVotes = await queryClient.fetchQuery({
          queryKey: ['myVotesForDishes', user.id, dishIds],
          queryFn: function () { return votesApi.getMyVotesForDishes(dishIds) },
          staleTime: 0,
        })
      } catch (error) {
        logger.error('Error loading prior votes for rate-your-meal:', error)
        toast.error(getUserMessage(error, 'loading your past ratings'))
        return
      } finally {
        setLoadingPriorVotes(false)
      }
    }

    setSelectedDishes(nextSelectedDishes)
    setRatingsById(function (previous) {
      var next = {}
      nextSelectedDishes.forEach(function (dish) {
        next[dish.clientId] = createInitialRatingState(previous[dish.clientId], dish.dishId ? priorVotes[dish.dishId] : null)
      })
      return next
    })
    setSubmitError(null)
    setEditingFromSummary(false)
    setCurrentIndex(0)
    setStep('rate')
  }

  function handleSpecialDishNameChange(nextName) {
    if (specialDishError) setSpecialDishError(null)
    setSpecialDishName(nextName)
  }

  function handleSpecialToggle() {
    if (specialDishError) setSpecialDishError(null)
    setSpecialDishEnabled(!specialDishEnabled)
  }

  function handleRatingChange(clientId, nextValue) {
    setRatingsById(function (previous) {
      return {
        ...previous,
        [clientId]: nextValue,
      }
    })
  }

  // Return to wherever the user came from (restaurant or dish page) without
  // stacking a second restaurant entry on top of this flow.
  function goBackToRestaurant() {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/restaurants/' + restaurantId)
    }
  }

  function handleBack() {
    if (step === 'select') {
      goBackToRestaurant()
      return
    }

    if (step === 'rate') {
      if (editingFromSummary) {
        setEditingFromSummary(false)
        setStep('summary')
        return
      }

      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
        return
      }

      setStep('select')
      return
    }

    if (step === 'summary') {
      setCurrentIndex(selectedDishes.length > 0 ? selectedDishes.length - 1 : 0)
      setStep('rate')
      return
    }

    goBackToRestaurant()
  }

  function handleNextCard() {
    if (editingFromSummary) {
      setEditingFromSummary(false)
      setStep('summary')
      return
    }

    if (currentIndex >= selectedDishes.length - 1) {
      setSubmitError(null)
      setStep('summary')
      return
    }

    setCurrentIndex(currentIndex + 1)
  }

  function handleEditDish(index) {
    setEditingFromSummary(true)
    setCurrentIndex(index)
    setStep('rate')
  }

  function handleSubmitAll() {
    setSubmitError(null)
    submitMutation.mutate()
  }

  // System back (Android back, iOS edge swipe) steps through the flow instead
  // of unmounting the page and dropping every rating, note and staged photo.
  var handleBackRef = useRef(handleBack)
  useEffect(function () {
    handleBackRef.current = handleBack
  })

  var isSubmitting = submitMutation.isPending
  useEffect(function () {
    if (step !== 'rate' && step !== 'summary') {
      clearBackButtonInterceptor()
      return
    }
    var url = window.location.href
    var state = window.history.state
    setBackButtonInterceptor(function () {
      window.history.pushState(state, '', url)
      if (isSubmitting) return
      handleBackRef.current()
    })
    return function () { clearBackButtonInterceptor() }
  }, [step, isSubmitting])

  if (authLoading || restaurantLoading || dishesLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="px-4 py-6 space-y-4 animate-pulse" role="status" aria-label="Loading menu">
          <div className="h-7 w-40 rounded" style={{ background: 'var(--color-divider)' }} />
          <div className="h-11 rounded-xl" style={{ background: 'var(--color-divider)' }} />
          {[0, 1, 2, 3, 4].map(function (i) {
            return <div key={i} className="h-12 rounded-lg" style={{ background: 'var(--color-divider)' }} />
          })}
        </div>
      </div>
    )
  }

  if (restaurantError || dishesError) {
    var errorMessage = restaurantError
      ? getUserMessage(restaurantError, 'loading this restaurant')
      : dishesError.message
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p role="alert" className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={goBackToRestaurant}
            className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Back to Restaurant
          </button>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <h1 className="sr-only">Restaurant not found</h1>
        <EmptyState
          emoji="🍽️"
          title="Restaurant not found"
          subtitle="It may have closed or been removed."
          action={
            <button
              type="button"
              onClick={function () { navigate('/restaurants') }}
              className="py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            >
              Back to Restaurants
            </button>
          }
        />
      </div>
    )
  }

  var loginModal = (
    <LoginModal
      isOpen={loginModalOpen}
      onClose={function () { setLoginModalOpen(false) }}
    />
  )

  if (!user) {
    return (
      <>
        <RateMealSignIn
          onBack={goBackToRestaurant}
          onSignIn={function () { setLoginModalOpen(true) }}
        />
        {loginModal}
      </>
    )
  }

  if ((dishes || []).length === 0 && step === 'select') {
    return <RateMealNoMenu onBack={goBackToRestaurant} />
  }

  if (step === 'select') {
    return (
      <>
        <DishSelector
          dishes={dishes}
          menuSectionOrder={restaurant.menu_section_order || []}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedDishIds={selectedDishIds}
          specialDishEnabled={specialDishEnabled}
          specialDishName={specialDishName}
          specialDishError={specialDishError}
          onToggleDish={handleToggleDish}
          onSpecialToggle={handleSpecialToggle}
          onSpecialDishNameChange={handleSpecialDishNameChange}
          onBack={handleBack}
          onContinue={handleContinueFromSelector}
          continuing={loadingPriorVotes}
        />
        {loginModal}
      </>
    )
  }

  if (step === 'rate') {
    var currentDish = selectedDishes[currentIndex]
    var photosUsed = selectedDishes.filter(function (dish) {
      return dish.clientId !== currentDish.clientId && ratingsById[dish.clientId]?.photoFile
    }).length

    return (
      <>
        <BatchRatingCard
          key={currentDish.clientId}
          dish={currentDish}
          value={ratingsById[currentDish.clientId]}
          index={currentIndex}
          total={selectedDishes.length}
          isEditing={editingFromSummary}
          photosUsed={photosUsed}
          onBack={handleBack}
          onNext={handleNextCard}
          onChange={function (nextValue) { handleRatingChange(currentDish.clientId, nextValue) }}
        />
        {loginModal}
      </>
    )
  }

  if (step === 'summary') {
    return (
      <>
        <BatchSummary
          restaurantName={restaurant.name}
          dishes={selectedDishes}
          ratingsById={ratingsById}
          onBack={handleBack}
          onEdit={handleEditDish}
          onSubmit={handleSubmitAll}
          submitting={submitMutation.isPending}
          submitError={submitError}
          uploadStatus={uploading || analyzing ? uploadStatus || 'Uploading photo…' : ''}
        />
        {loginModal}
      </>
    )
  }

  return (
    <>
      <RateMealSuccess
        successCount={successCount}
        restaurantName={restaurant.name}
        onDone={function () { navigate('/restaurants/' + restaurantId, { replace: true }) }}
      />
      {loginModal}
    </>
  )
}
