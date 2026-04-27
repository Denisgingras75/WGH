/* Demo data for WGH Redesign — flavored for Martha's Vineyard food scene
   Values are placeholders; structure mirrors the existing Postgres schema
   (restaurants → menu_items → reviews) so the redesign maps 1:1. */

const RESTAURANTS = [
  { id: 'r1', name: 'Larsen\'s Fish Market', cuisine: 'Seafood shack', town: 'Menemsha', price_range: '$$', open_now: true,  avg_rating: 9.1, total_votes: 412, percent_worth_it: 94 },
  { id: 'r2', name: 'State Road',           cuisine: 'New American', town: 'West Tisbury', price_range: '$$$', open_now: true, avg_rating: 8.9, total_votes: 287, percent_worth_it: 89 },
  { id: 'r3', name: 'The Black Dog Tavern', cuisine: 'American',     town: 'Vineyard Haven', price_range: '$$', open_now: true, avg_rating: 7.6, total_votes: 1102, percent_worth_it: 64 },
  { id: 'r4', name: 'Atria',                cuisine: 'New American', town: 'Edgartown',     price_range: '$$$$', open_now: false, avg_rating: 8.7, total_votes: 198, percent_worth_it: 86 },
  { id: 'r5', name: 'Back Door Donuts',     cuisine: 'Bakery',       town: 'Oak Bluffs',    price_range: '$', open_now: true, avg_rating: 9.4, total_votes: 678, percent_worth_it: 96 },
  { id: 'r6', name: 'Giordano\'s',          cuisine: 'Italian-American', town: 'Oak Bluffs', price_range: '$$', open_now: true, avg_rating: 7.9, total_votes: 521, percent_worth_it: 71 },
  { id: 'r7', name: 'The Bite',             cuisine: 'Seafood shack', town: 'Menemsha',     price_range: '$$', open_now: true, avg_rating: 8.6, total_votes: 234, percent_worth_it: 82 },
  { id: 'r8', name: 'Among the Flowers',    cuisine: 'Café',         town: 'Edgartown',     price_range: '$$', open_now: true, avg_rating: 8.4, total_votes: 156, percent_worth_it: 80 },
];

const CATEGORIES = [
  { id: 'seafood',   icon: '🦞', label: 'Seafood' },
  { id: 'pizza',     icon: '🍕', label: 'Pizza' },
  { id: 'breakfast', icon: '🥞', label: 'Breakfast' },
  { id: 'sweets',    icon: '🍩', label: 'Sweets' },
  { id: 'pasta',     icon: '🍝', label: 'Pasta' },
  { id: 'burgers',   icon: '🍔', label: 'Burgers' },
  { id: 'sandwich',  icon: '🥪', label: 'Sandwiches' },
  { id: 'drinks',    icon: '🍸', label: 'Drinks' },
];

const DISHES = [
  { dish_id: 'd1', dish_name: 'Lobster roll, hot butter', restaurant_id: 'r1', restaurant_name: 'Larsen\'s Fish Market', restaurant_town: 'Menemsha', category: 'seafood', category_label: 'Seafood', avg_rating: 9.6, total_votes: 287, percent_worth_it: 97, price: 32, photo: '🦞', distance_mi: 8.2, map_x: 0.18, map_y: 0.40, open_now: true,  user_visited: true,  trend_delta: 12, snippet: 'No mayo, no nonsense. Pure butter. Eat it on the dock as the sun sets.' },
  { dish_id: 'd2', dish_name: 'Stuffed quahog',           restaurant_id: 'r1', restaurant_name: 'Larsen\'s Fish Market', restaurant_town: 'Menemsha', category: 'seafood', category_label: 'Seafood', avg_rating: 8.4, total_votes: 89,  percent_worth_it: 81, price: 9,  photo: '🐚', distance_mi: 8.2, map_x: 0.20, map_y: 0.42, open_now: true,  user_visited: false, trend_delta: 4 },
  { dish_id: 'd3', dish_name: 'Wood-fired pizza, prosciutto', restaurant_id: 'r2', restaurant_name: 'State Road', restaurant_town: 'West Tisbury', category: 'pizza', category_label: 'Pizza', avg_rating: 9.2, total_votes: 156, percent_worth_it: 92, price: 24, photo: '🍕', distance_mi: 4.1, map_x: 0.32, map_y: 0.55, open_now: true, user_visited: true, trend_delta: 6, snippet: 'Crust gets the credit, but the prosciutto is from Smoke & Pickles up the road.' },
  { dish_id: 'd4', dish_name: 'Pan-roasted halibut',      restaurant_id: 'r2', restaurant_name: 'State Road', restaurant_town: 'West Tisbury', category: 'seafood', category_label: 'Seafood', avg_rating: 8.7, total_votes: 78, percent_worth_it: 85, price: 42, photo: '🐟', distance_mi: 4.1, map_x: 0.34, map_y: 0.57, open_now: true, user_visited: false, trend_delta: 2 },
  { dish_id: 'd5', dish_name: 'Apple fritter (after 7pm)',restaurant_id: 'r5', restaurant_name: 'Back Door Donuts', restaurant_town: 'Oak Bluffs', category: 'sweets', category_label: 'Sweets', avg_rating: 9.5, total_votes: 412, percent_worth_it: 96, price: 4, photo: '🍩', distance_mi: 2.3, map_x: 0.55, map_y: 0.50, open_now: true, user_visited: true, trend_delta: 18, snippet: 'The line forms at 6:45. Worth every minute. Order 2 — one for the walk back.' },
  { dish_id: 'd6', dish_name: 'Quahog chowder',           restaurant_id: 'r3', restaurant_name: 'The Black Dog Tavern', restaurant_town: 'Vineyard Haven', category: 'seafood', category_label: 'Seafood', avg_rating: 7.4, total_votes: 489, percent_worth_it: 58, price: 12, photo: '🥣', distance_mi: 1.2, map_x: 0.48, map_y: 0.58, open_now: true, user_visited: true, trend_delta: -3 },
  { dish_id: 'd7', dish_name: 'Crab cake sandwich',       restaurant_id: 'r7', restaurant_name: 'The Bite', restaurant_town: 'Menemsha', category: 'sandwich', category_label: 'Sandwiches', avg_rating: 8.9, total_votes: 134, percent_worth_it: 88, price: 22, photo: '🦀', distance_mi: 8.4, map_x: 0.16, map_y: 0.43, open_now: true, user_visited: false, trend_delta: 7 },
  { dish_id: 'd8', dish_name: 'Tagliatelle bolognese',    restaurant_id: 'r4', restaurant_name: 'Atria', restaurant_town: 'Edgartown', category: 'pasta', category_label: 'Pasta', avg_rating: 8.6, total_votes: 92, percent_worth_it: 84, price: 36, photo: '🍝', distance_mi: 5.8, map_x: 0.65, map_y: 0.62, open_now: false, user_visited: true, trend_delta: 1 },
  { dish_id: 'd9', dish_name: 'Buttermilk pancakes',      restaurant_id: 'r8', restaurant_name: 'Among the Flowers', restaurant_town: 'Edgartown', category: 'breakfast', category_label: 'Breakfast', avg_rating: 8.5, total_votes: 211, percent_worth_it: 82, price: 14, photo: '🥞', distance_mi: 5.6, map_x: 0.66, map_y: 0.60, open_now: true, user_visited: false, trend_delta: 3 },
  { dish_id: 'd10', dish_name: 'Eggplant parm',           restaurant_id: 'r6', restaurant_name: 'Giordano\'s', restaurant_town: 'Oak Bluffs', category: 'pasta', category_label: 'Pasta', avg_rating: 6.8, total_votes: 198, percent_worth_it: 51, price: 22, photo: '🍆', distance_mi: 2.1, map_x: 0.54, map_y: 0.51, open_now: true, user_visited: true, trend_delta: -5 },
  { dish_id: 'd11', dish_name: 'Margherita',              restaurant_id: 'r6', restaurant_name: 'Giordano\'s', restaurant_town: 'Oak Bluffs', category: 'pizza', category_label: 'Pizza', avg_rating: 8.2, total_votes: 312, percent_worth_it: 78, price: 18, photo: '🍕', distance_mi: 2.1, map_x: 0.56, map_y: 0.49, open_now: true, user_visited: false, trend_delta: 2 },
  { dish_id: 'd12', dish_name: 'Burger, smash style',     restaurant_id: 'r3', restaurant_name: 'The Black Dog Tavern', restaurant_town: 'Vineyard Haven', category: 'burgers', category_label: 'Burgers', avg_rating: 7.1, total_votes: 256, percent_worth_it: 62, price: 19, photo: '🍔', distance_mi: 1.2, map_x: 0.47, map_y: 0.60, open_now: true, user_visited: false, trend_delta: 0 },
];

const TOWN_PINS = [
  { id: 't1', label: 'Menemsha',       x: 0.14, y: 0.36 },
  { id: 't2', label: 'Vineyard Haven', x: 0.46, y: 0.55 },
  { id: 't3', label: 'Oak Bluffs',     x: 0.58, y: 0.46 },
  { id: 't4', label: 'Edgartown',      x: 0.70, y: 0.62 },
  { id: 't5', label: 'West Tisbury',   x: 0.32, y: 0.50 },
];

const COLLECTIONS = [
  { id: 'c1', vol: 'XII', title: 'Open after 9pm', subtitle: 'Late-night cravings, locally vetted', dish_count: 14, dish_emojis: ['🍩', '🍕', '🍔', '🌮'], bg: '#1A1A1A' },
  { id: 'c2', vol: 'IX', title: 'Worth driving up-island for', subtitle: 'Past the dirt roads, before the cliffs', dish_count: 9,  dish_emojis: ['🦞', '🍕', '🐟', '🍝'], bg: '#3B5547' },
  { id: 'c3', vol: 'V',  title: 'Under $15', subtitle: 'When the wallet is summer-tired', dish_count: 22, dish_emojis: ['🥪', '🌮', '🍩', '🥣'], bg: '#B14A1F' },
  { id: 'c4', vol: 'III', title: 'First-trip essentials', subtitle: 'You came on the ferry. Eat these.', dish_count: 11, dish_emojis: ['🦞', '🍩', '🐚', '🍕'], bg: '#7A4E20' },
];

const ME = {
  initials: 'DG',
  name: 'Daniel G.',
  bio: 'Eats here three weeks a year. Calls it research.',
  followers: 47,
  following: 84,
};

const REVIEWS = [
  // mine
  { id: 'rv1', user_id: 'me', dish_id: 'd1', rating: 9.8, would_again: true, note: 'Insane. The bun. The butter. Don\'t talk to me until I finish.', date: 'Apr 22', month_short: 'Apr', day: 22 },
  { id: 'rv2', user_id: 'me', dish_id: 'd5', rating: 9.0, would_again: true, note: 'Got 4. Walked back to the inn eating my second.', date: 'Apr 18', month_short: 'Apr', day: 18 },
  { id: 'rv3', user_id: 'me', dish_id: 'd6', rating: 6.2, would_again: false, note: 'Salty, gloopy, tourist-trap chowder. Pass.', date: 'Apr 16', month_short: 'Apr', day: 16 },
  { id: 'rv4', user_id: 'me', dish_id: 'd3', rating: 9.4, would_again: true, note: 'Best pizza on the island. Fight me.', date: 'Apr 14', month_short: 'Apr', day: 14 },
  { id: 'rv5', user_id: 'me', dish_id: 'd10', rating: 5.5, would_again: false, note: 'Soggy. Soggy soggy. Skip.', date: 'Apr 12', month_short: 'Apr', day: 12 },
  { id: 'rv6', user_id: 'me', dish_id: 'd8',  rating: 8.8, would_again: true, note: 'Pasta cut perfectly. Sauce a touch sweet.', date: 'Apr 10', month_short: 'Apr', day: 10 },

  // others — for d1 (lobster roll)
  { id: 'rv7',  user_id: 'u1', dish_id: 'd1', rating: 10, would_again: true,  note: 'There is no better lobster roll in the world. I am not exaggerating.', date: '2d ago', author_name: 'Sarah M.',   author_initials: 'SM', avatar_color: '#3B5547', local: true },
  { id: 'rv8',  user_id: 'u2', dish_id: 'd1', rating: 9.5, would_again: true, note: 'Eat it on the picnic table out back. Worth the wait.',                  date: '5d ago', author_name: 'Theo K.',     author_initials: 'TK', avatar_color: '#B14A1F' },
  { id: 'rv9',  user_id: 'u3', dish_id: 'd1', rating: 8.0, would_again: true, note: 'Good but a bit overhyped. Still — that butter.',                       date: '1w ago', author_name: 'Priya N.',    author_initials: 'PN', avatar_color: '#7A4E20' },
  { id: 'rv10', user_id: 'u4', dish_id: 'd1', rating: 9.7, would_again: true, note: 'I drove an hour for this. Drove an hour back. Will do it again.',     date: '2w ago', author_name: 'Marcus W.',   author_initials: 'MW', avatar_color: '#1A1A1A', local: true },

  // others — for d5 (apple fritter)
  { id: 'rv11', user_id: 'u5', dish_id: 'd5', rating: 9.6, would_again: true, note: 'After 7pm only. Get one. Then get another. The line moves.',         date: '3d ago', author_name: 'Jamie R.', author_initials: 'JR', avatar_color: '#E07856' },
  { id: 'rv12', user_id: 'u6', dish_id: 'd5', rating: 9.0, would_again: true, note: 'Fritter > donut. Apple chunks the size of marbles.',                date: '6d ago', author_name: 'Kai T.',  author_initials: 'KT', avatar_color: '#3B5547' },

  // others — for d3 (pizza)
  { id: 'rv13', user_id: 'u7', dish_id: 'd3', rating: 9.3, would_again: true, note: 'Char-blistered crust, salty cured pork, perfect bite.',             date: '4d ago', author_name: 'Naomi B.', author_initials: 'NB', avatar_color: '#C48A12' },
];

const MAP_BOUNDS = { width: 393, height: 700 };

window.WGH_DATA = {
  RESTAURANTS, CATEGORIES, DISHES, COLLECTIONS, ME, REVIEWS, TOWN_PINS, MAP_BOUNDS,
};
