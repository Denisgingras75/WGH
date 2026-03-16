import { getStorageItem, setStorageItem } from './storage'

var LISTS_KEY = 'wgh_user_lists'

function readLists() {
  var raw = getStorageItem(LISTS_KEY)
  if (!raw) return []
  try {
    var parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

function writeLists(lists) {
  setStorageItem(LISTS_KEY, JSON.stringify(lists))
}

// Get all lists
export function getLists() {
  return readLists()
}

// Create a new list
export function createList(name, emoji) {
  var lists = readLists()
  var newList = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name,
    emoji: emoji || '\uD83D\uDCCB',
    dishes: [],
    createdAt: new Date().toISOString(),
  }
  lists.push(newList)
  writeLists(lists)
  return newList
}

// Delete a list
export function deleteList(listId) {
  var lists = readLists().filter(function(l) { return l.id !== listId })
  writeLists(lists)
  return lists
}

// Add a dish to a list
export function addDishToList(listId, dish) {
  var lists = readLists()
  var list = lists.find(function(l) { return l.id === listId })
  if (!list) return null
  // Don't add duplicates
  if (list.dishes.some(function(d) { return d.dish_id === dish.dish_id })) return list
  list.dishes.push({
    dish_id: dish.dish_id,
    dish_name: dish.dish_name,
    restaurant_name: dish.restaurant_name,
    category: dish.category,
    avg_rating: dish.avg_rating,
    addedAt: new Date().toISOString(),
  })
  writeLists(lists)
  return list
}

// Remove a dish from a list
export function removeDishFromList(listId, dishId) {
  var lists = readLists()
  var list = lists.find(function(l) { return l.id === listId })
  if (!list) return null
  list.dishes = list.dishes.filter(function(d) { return d.dish_id !== dishId })
  writeLists(lists)
  return list
}

// Get lists that contain a specific dish
export function getListsForDish(dishId) {
  return readLists().filter(function(l) {
    return l.dishes.some(function(d) { return d.dish_id === dishId })
  })
}
