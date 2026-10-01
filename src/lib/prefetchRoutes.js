// Prefetch functions for smoother navigation - call on hover/focus
export const prefetchRoutes = {
  browse: () => import('../pages/Browse'),
  dish: () => import('../pages/Dish'),
  map: () => import('../pages/Map'),
  restaurants: () => import('../pages/Restaurants'),
  restaurantDetail: () => import('../pages/RestaurantDetail'),
  profile: () => import('../pages/Profile'),
}
