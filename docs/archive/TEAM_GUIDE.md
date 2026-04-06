# Quick Reference: Using the New API Layer

## For Your Team: How to Use the Changes

### 🎯 When Adding a New Feature

#### Old Way (❌ Don't do this anymore)
```javascript
import { supabase } from '../lib/supabase'

export function MyComponent() {
  const handleClick = async () => {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('category', 'pizza')
    
    if (error) console.log(error)
    setDishes(data)
  }
}
```

#### New Way (✅ Do this)
```javascript
import { dishesApi } from '../api'
import { withRetry, getUserMessage } from '../utils/errorHandler'

export function MyComponent() {
  const handleClick = async () => {
    try {
      const data = await withRetry(() =>
        dishesApi.getRankedDishes({
          lat: 41.43,
          lng: -70.56,
          radiusMiles: 5,
          category: 'pizza'
        })
      )
      setDishes(data)
    } catch (error) {
      const message = getUserMessage(error, 'loading pizzas')
      setError(message)
    }
  }
}
```

### 🧪 Running Tests

```bash
# Run all tests
npm run test

# Watch mode (auto-rerun on file changes)
npm run test -- --watch

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### 🆕 Adding a New API Function

**Step 1:** Add function to API file
```javascript
// src/api/dishesApi.js
export const dishesApi = {
  async getRankedDishes(...) { /* ... */ },
  
  async getTrendingDishes() {  // ← NEW function
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('total_votes', { ascending: false })
        .limit(10)
      
      if (error) {
        const classifiedError = new Error(error.message)
        classifiedError.type = classifyError(error)
        throw classifiedError
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching trending dishes:', error)
      throw error
    }
  }
}
```

**Step 2:** Use in component/hook
```javascript
import { dishesApi } from '../api'
import { withRetry, getUserMessage } from '../utils/errorHandler'

export function TrendingDishes() {
  const [trending, setTrending] = useState([])
  const [error, setError] = useState(null)
  
  useEffect(() => {
    withRetry(() => dishesApi.getTrendingDishes())
      .then(setTrending)
      .catch(err => setError(getUserMessage(err, 'loading trending')))
  }, [])
  
  return (
    <div>
      {error && <div className="error">{error}</div>}
      {trending.map(dish => (
        <div key={dish.id}>{dish.name}</div>
      ))}
    </div>
  )
}
```

**Step 3:** Write test (optional but recommended)
```javascript
// src/api/dishesApi.test.js
describe('getTrendingDishes', () => {
  it('should fetch trending dishes', async () => {
    // ... test code
  })
})
```

### 🐛 Debugging Errors

Check the error type:
```javascript
import { classifyError, ErrorTypes } from '../utils/errorHandler'

try {
  await someApiCall()
} catch (error) {
  const type = classifyError(error)
  
  if (type === ErrorTypes.AUTH_ERROR) {
    // User not logged in
  } else if (type === ErrorTypes.NETWORK_ERROR) {
    // No internet
  } else if (type === ErrorTypes.NOT_FOUND) {
    // Item doesn't exist
  }
}
```

### 📝 Writing Tests

**Test a hook:**
```javascript
import { renderHook, act } from '@testing-library/react'
import { useYourHook } from './useYourHook'

describe('useYourHook', () => {
  it('should do something', async () => {
    const { result } = renderHook(() => useYourHook())
    
    await act(async () => {
      await result.current.doSomething()
    })
    
    expect(result.current.data).toBeDefined()
  })
})
```

**Test an API function:**
```javascript
import { vi } from 'vitest'
import { yourApi } from '../api'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(function() { return this }),
      })),
    })),
  },
}))

describe('yourApi', () => {
  it('should fetch data', async () => {
    // Mock supabase response
    const mockData = [{ id: 1, name: 'Test' }]
    
    // Call API
    const result = await yourApi.getData()
    
    // Assert
    expect(result).toEqual(mockData)
  })
})
```

### 🚀 Deployment

Everything works the same:
```bash
npm run build   # Builds for production
npm run preview # Test production build locally
# Deploy same as before
```

### 📊 Monitoring Errors

Future enhancement - to catch real user errors, add to error handler:
```javascript
// In errorHandler.js
function logError(error, context) {
  // Send to Sentry, LogRocket, etc.
  console.error(context, error)
}

// Use in hooks
catch (error) {
  logError(error, 'loading-dishes')
}
```

---

## File Imports Cheat Sheet

```javascript
// ✅ DO import from API layer
import { dishesApi, restaurantsApi, votesApi, favoritesApi, adminApi, authApi } from '../api'

// ✅ DO import error utilities
import { withRetry, getUserMessage, classifyError, isRetryable } from '../utils/errorHandler'

// ✅ DO import from hooks
import { useDishes, useVote, useSavedDishes } from '../hooks'

// ❌ DON'T import supabase directly (except AuthContext)
// import { supabase } from '../lib/supabase'  ← WRONG!

// ❌ DON'T import components that use supabase directly
// Have them use hooks instead
```

---

## Common Patterns

### Pattern 1: Fetch and Display
```javascript
export function MyList() {
  const { dishes, loading, error, refetch } = useDishes(location, radius)
  
  if (loading) return <Skeleton />
  if (error) return <div className="error">{error.message}</div>
  
  return (
    <div>
      {dishes.map(d => <Card key={d.dish_id} dish={d} />)}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

### Pattern 2: Mutation with Error Handling
```javascript
export function VoteButton({ dishId }) {
  const { submitVote, submitting, error } = useVote()
  
  const handleVote = async (value) => {
    const result = await submitVote(dishId, value)
    if (result.success) {
      showNotification('Vote recorded!')
    } else {
      showNotification(result.error, 'error')
    }
  }
  
  return (
    <button onClick={() => handleVote(true)} disabled={submitting}>
      {submitting ? 'Voting...' : 'Worth It'}
    </button>
  )
}
```

### Pattern 3: Retry on Failure
```javascript
const handleSubmit = async () => {
  try {
    await withRetry(
      () => votesApi.submitVote({ dishId, wouldOrderAgain: true }),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        onRetry: (attempt, delay) => {
          console.log(`Retry attempt ${attempt}, waiting ${delay}ms`)
        }
      }
    )
    showSuccess()
  } catch (error) {
    showError(getUserMessage(error, 'voting'))
  }
}
```

---

## Tips & Best Practices

1. **Always use `withRetry()` for critical operations**
   - Voting, authentication, saving favorites

2. **Use `getUserMessage()` for all errors**
   - Gives consistent, friendly messages to users

3. **Test critical paths**
   - Anything related to voting or auth

4. **Check error types**
   - Don't retry auth errors (401)
   - Do retry network errors

5. **Keep API functions focused**
   - One responsibility per function
   - Reuse as much as possible

6. **Add JSDoc comments**
   - Helps team understand what functions do
   - TypeScript can build on this later

---

**You've got this! Happy coding! 🚀**
