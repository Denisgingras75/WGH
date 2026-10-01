function sortDishes(arr) {
  return arr.slice().sort(function (a, b) {
    var aRating = a.avg_rating || 0
    var bRating = b.avg_rating || 0
    if (bRating !== aRating) return bRating - aRating

    var aVotes = a.total_votes || 0
    var bVotes = b.total_votes || 0
    if (bVotes !== aVotes) return bVotes - aVotes

    return (a.dish_name || '').localeCompare(b.dish_name || '')
  })
}

export function buildDishSections(dishes, menuSectionOrder, searchQuery) {
  var normalizedQuery = (searchQuery || '').toLowerCase().trim()
  var filteredDishes = (dishes || []).filter(function (dish) {
    if (!normalizedQuery) return true

    return (
      (dish.dish_name || '').toLowerCase().includes(normalizedQuery) ||
      (dish.category || '').toLowerCase().includes(normalizedQuery) ||
      (dish.menu_section || '').toLowerCase().includes(normalizedQuery)
    )
  })

  var groups = {}
  var uncategorized = []

  filteredDishes.forEach(function (dish) {
    var sectionName = dish.menu_section

    if (!sectionName) {
      uncategorized.push(dish)
      return
    }

    if (!groups[sectionName]) {
      groups[sectionName] = []
    }

    groups[sectionName].push(dish)
  })

  var orderedSectionNames = Object.keys(groups).slice().sort(function (a, b) {
    var aIndex = menuSectionOrder.indexOf(a)
    var bIndex = menuSectionOrder.indexOf(b)

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    return a.localeCompare(b)
  })

  var sections = orderedSectionNames.map(function (sectionName) {
    return {
      name: sectionName,
      dishes: sortDishes(groups[sectionName]),
    }
  })

  if (uncategorized.length > 0) {
    sections.push({
      name: 'Other',
      dishes: sortDishes(uncategorized),
    })
  }

  return sections
}
