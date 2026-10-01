import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'

import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { BottomNav } from './components/BottomNav'
import { ProtectedRoute } from './components/ProtectedRoute'
import { WelcomeModal } from './components/Auth/WelcomeModal'
import { RouteProgress } from './components/RouteProgress'
import { ScrollToTop } from './components/ScrollToTop'
import { OfflineIndicator } from './components/OfflineIndicator'
import { PageSkeleton } from './components/Skeleton'
import { getSessionItem, removeSessionItem, setSessionItem } from './lib/storage'
import { preloadSounds } from './lib/sounds'
import { preloadCategoryImages } from './constants/categories'
import { CHUNK_RELOAD_KEY, isChunkLoadError } from './utils/chunkErrors'

// Lazy-load a page; if its chunk fails to load (e.g., after a deploy), reload the page once
function lazyWithRetry(importFn, namedExport) {
  return lazy(() =>
    importFn()
      .then(m => {
        // Successful load — clear any reload flag
        removeSessionItem(CHUNK_RELOAD_KEY)
        return { default: namedExport ? m[namedExport] : m.default }
      })
      .catch((error) => {
        if (isChunkLoadError(error) && !getSessionItem(CHUNK_RELOAD_KEY)) {
          setSessionItem(CHUNK_RELOAD_KEY, '1')
          window.location.reload()
          return { default: () => null }
        }
        throw error
      })
  )
}

// Lazy load pages for code splitting
const Browse = lazyWithRetry(() => import('./pages/Browse'), 'Browse')
const Dish = lazyWithRetry(() => import('./pages/Dish'), 'Dish')
const Restaurants = lazyWithRetry(() => import('./pages/Restaurants'), 'Restaurants')
const RestaurantDetail = lazyWithRetry(() => import('./pages/RestaurantDetail'), 'RestaurantDetail')
const RateYourMeal = lazyWithRetry(() => import('./pages/RateYourMeal'), 'RateYourMeal')
const Profile = lazyWithRetry(() => import('./pages/Profile'), 'Profile')
const Admin = lazyWithRetry(() => import('./pages/Admin'), 'Admin')
const Login = lazyWithRetry(() => import('./pages/Login'), 'Login')
const Privacy = lazyWithRetry(() => import('./pages/Privacy'), 'Privacy')
const Terms = lazyWithRetry(() => import('./pages/Terms'), 'Terms')
const Support = lazyWithRetry(() => import('./pages/Support'), 'Support')
const UserProfile = lazyWithRetry(() => import('./pages/UserProfile'), 'UserProfile')
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'), 'ResetPassword')
const AcceptInvite = lazyWithRetry(() => import('./pages/AcceptInvite'), 'AcceptInvite')
const AcceptCuratorInvite = lazyWithRetry(() => import('./pages/AcceptCuratorInvite'), 'AcceptCuratorInvite')
const MyList = lazyWithRetry(() => import('./pages/MyList'), 'MyList')
const ManageRestaurant = lazyWithRetry(() => import('./pages/ManageRestaurant'), 'ManageRestaurant')
const MapPage = lazyWithRetry(() => import('./pages/Map'), 'Map')
const HowReviewsWork = lazyWithRetry(() => import('./pages/HowReviewsWork'), 'HowReviewsWork')
const ForRestaurants = lazyWithRetry(() => import('./pages/ForRestaurants'), 'ForRestaurants')
const JitterLanding = lazyWithRetry(() => import('./pages/JitterLanding'))
const RestaurantReviews = lazyWithRetry(() => import('./pages/RestaurantReviews'), 'RestaurantReviews')
const PlaylistPage = lazyWithRetry(() => import('./pages/Playlist'), 'Playlist')
const NotFound = lazyWithRetry(() => import('./pages/NotFound'), 'NotFound')

function App() {
  // Preload sounds and category images on app start
  useEffect(() => {
    preloadSounds()
    preloadCategoryImages()
  }, [])

  return (
    <ErrorBoundary>
      <Toaster
        position="top-center"
        richColors
        expand={false}
        duration={4000}
        closeButton
        style={{ fontFamily: 'inherit' }}
        toastOptions={{
          style: {
            padding: '16px',
            borderRadius: '12px',
          },
        }}
      />
      <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <ScrollToTop />
          <RouteProgress />
          <OfflineIndicator />
          <WelcomeModal />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<><MapPage /><BottomNav /></>} />
              <Route path="/map" element={<Navigate to="/" replace />} />
              <Route path="/browse" element={<Layout><Browse /></Layout>} />
              <Route path="/dish/:dishId" element={<Layout><Dish /></Layout>} />
              <Route path="/restaurants" element={<Layout><Restaurants /></Layout>} />
              <Route path="/restaurants/:restaurantId" element={<Layout><RestaurantDetail /></Layout>} />
              <Route path="/restaurants/:restaurantId/rate" element={<Layout><RateYourMeal /></Layout>} />
              <Route path="/restaurants/:restaurantId/reviews" element={<Layout><RestaurantReviews /></Layout>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
              <Route path="/user/:userId" element={<Layout><UserProfile /></Layout>} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/curator-invite/:token" element={<AcceptCuratorInvite />} />
              <Route path="/my-list" element={<ProtectedRoute><Layout><MyList /></Layout></ProtectedRoute>} />
              <Route path="/manage" element={<ProtectedRoute><ManageRestaurant /></ProtectedRoute>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/support" element={<Support />} />
              <Route path="/how-reviews-work" element={<Layout><HowReviewsWork /></Layout>} />
              <Route path="/for-restaurants" element={<ForRestaurants />} />
              <Route path="/playlist/:id" element={<Layout><PlaylistPage /></Layout>} />
              <Route path="/jitter" element={<Layout><JitterLanding /></Layout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LocationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
