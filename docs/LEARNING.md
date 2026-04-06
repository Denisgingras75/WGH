# Learning Guide: Performance Optimizations

This file explains the technical terms and optimizations applied to What's Good Here in plain English.

---

## What We Fixed & Why

### 1. Deferred Analytics Loading

**What it was:** PostHog and Sentry were loading immediately when the page started, blocking everything else.

**What we did:** Made them load AFTER the page is visible to the user.

**Real-world analogy:** Imagine you're opening a restaurant. Before, you were making customers wait outside while you set up the security cameras. Now, you let customers in first, then set up the cameras in the background.

**Impact:** Page loads ~100ms faster because we're not downloading analytics code before showing content.

---

### 2. Removed Barrel File Imports

**What's a barrel file?** A file that re-exports everything from a folder. Like `src/api/index.js` that exports all APIs.

**The problem:** When you import ONE thing from a barrel file, JavaScript loads EVERYTHING in that file, even stuff you don't need.

```javascript
// BAD - loads ALL APIs even though we only need dishesApi
import { dishesApi } from '../api'

// GOOD - only loads what we need
import { dishesApi } from '../api/dishesApi'
```

**Real-world analogy:** It's like ordering a single burger but the kitchen prepares the entire menu "just in case." Direct imports mean the kitchen only makes what you ordered.

**Impact:** Smaller JavaScript bundles, faster page loads.

---

### 3. Memoized DishCard Component

**What's memoization?** Telling React "don't rebuild this component unless its data actually changed."

**The problem:** Every time the parent component updates, React was rebuilding every DishCard from scratch, even if nothing changed.

```javascript
// Before - rebuilds every time parent renders
export function DishCard({ dish }) { ... }

// After - only rebuilds if 'dish' actually changed
export const DishCard = memo(function DishCard({ dish }) { ... })
```

**Real-world analogy:** Imagine a chef who throws away a perfectly good dish and remakes it from scratch every time a new order comes in for a DIFFERENT table. `memo()` tells the chef "if this dish hasn't changed, don't remake it."

**Impact:** Smoother scrolling through dish lists, less CPU work.

---

### 4. Memoized AuthContext Value

**What's Context?** A way to share data (like user login info) across your whole app without passing it through every component.

**The problem:** Every time AuthContext updated, it created a new object `{ user, loading, signOut }`. React saw "new object!" and re-rendered EVERYTHING that uses auth, even if the actual values didn't change.

```javascript
// Before - new object every render, everything re-renders
return <AuthContext.Provider value={{ user, loading, signOut }}>

// After - same object unless values change
const value = useMemo(() => ({ user, loading, signOut }), [user, loading, signOut])
return <AuthContext.Provider value={value}>
```

**Real-world analogy:** Imagine a PA system that announces "ATTENTION EVERYONE" every 5 seconds, even when there's nothing new. Now it only announces when something actually changes.

**Impact:** Fewer unnecessary re-renders across the entire app.

---

### 5. Combined Array Iterations

**The problem:** We were looping through the dishes list TWICE - once to find "ranked" dishes, once to find "unranked" dishes.

```javascript
// Before - loops through dishes TWICE
const ranked = dishes.filter(d => d.votes >= 5)    // Loop 1
const unranked = dishes.filter(d => d.votes < 5)   // Loop 2

// After - ONE loop that sorts into two buckets
const ranked = []
const unranked = []
for (const dish of dishes) {
  if (dish.votes >= 5) ranked.push(dish)
  else unranked.push(dish)
}
```

**Real-world analogy:** You're sorting mail. Before, you went through the entire pile looking for bills, then went through it AGAIN looking for personal letters. Now you sort everything in one pass.

**Impact:** Faster list rendering, especially with many dishes.

---

### 6. Used `toSorted()` Instead of `[...arr].sort()`

**The problem:** To sort an array without modifying the original, we were creating a copy first.

```javascript
// Before - creates a copy, THEN sorts it (two operations)
const sorted = [...dishes].sort((a, b) => b.rating - a.rating)

// After - creates a sorted copy in one step
const sorted = dishes.toSorted((a, b) => b.rating - a.rating)
```

**Real-world analogy:** Instead of photocopying a document and then highlighting the copy, you use a machine that makes a highlighted copy directly.

**Impact:** Slightly faster, cleaner code, more memory efficient.

---

### 7. Passive Event Listeners

**What's an event listener?** Code that waits for something to happen (like a click or scroll).

**What's "passive"?** A promise to the browser: "I won't try to cancel or modify this event, so don't wait for me."

```javascript
// Before - browser waits to see if we'll cancel the event
document.addEventListener('mousedown', handleClick)

// After - browser knows it can proceed immediately
document.addEventListener('mousedown', handleClick, { passive: true })
```

**Real-world analogy:** It's like telling airport security "I'm just watching planes, not boarding any." They don't need to check your ticket.

**Impact:** Smoother scrolling on mobile devices.

---

### 8. CSS content-visibility

**What it does:** Tells the browser "don't bother rendering things that aren't on screen yet."

```css
.dish-card-virtualized {
  content-visibility: auto;
  contain-intrinsic-size: 0 420px;
}
```

**Real-world analogy:** A theater doesn't build sets for Act 3 while Act 1 is playing. It waits until those scenes are needed.

**Impact:** Faster initial page paint when there are many cards. Browser only renders what's visible.

---

### 9. Cached localStorage Reads

**What's localStorage?** A way to save small bits of data in the browser (like "user prefers dark mode").

**The problem:** Every time we checked localStorage, JavaScript had to stop and ask the browser for the data. This is "synchronous" - everything waits.

```javascript
// Before - asks browser EVERY time
const sort = localStorage.getItem('browse_sort')

// After - remembers the answer
const cache = new Map()
function getStorageItem(key) {
  if (cache.has(key)) return cache.get(key)  // Instant!
  const value = localStorage.getItem(key)     // Only asks once
  cache.set(key, value)
  return value
}
```

**Real-world analogy:** Instead of calling your mom every time to ask what your childhood nickname was, you write it down the first time she tells you.

**Impact:** Faster repeated reads, less blocking.

---

## Glossary of Technical Terms

> **How to use this glossary:** Terms are organized by category so you can learn related concepts together. Start with the basics and work your way down!

---

### 🟢 JavaScript Basics
*The language that powers the web*

**JavaScript (JS)** — The programming language of the web. What makes pages interactive.

**Variable** — A named container for data. `const name = 'Pizza'`.

**String** — Text in JavaScript. `'Hello'` or `"World"` or `` `Template ${literal}` ``.

**Boolean** — A true/false value. `isLoggedIn = true` or `hasVoted = false`.

**Array** — A list of items. `[1, 2, 3]` or `['pizza', 'burger', 'taco']`. Access items by position: `array[0]` is the first item.

**Object** — A collection of key-value pairs: `{ name: 'Pizza', price: 12.99 }`.

**Function** — A reusable block of code. `function add(a, b) { return a + b }`.

**Parameter/Param** — Input to a function. In `function greet(name)`, `name` is a parameter.

**Callback** — A function passed to another function to be called later. "When the data arrives, call THIS function."

**Scope** — Where a variable exists. A variable inside a function isn't accessible outside it.

**Null** — Intentionally empty value. "This has no value." Different from `undefined`.

**Undefined** — A variable that exists but has no value yet. Different from `null`.

**Syntax** — The grammar rules of a language. `const x = 1` is valid syntax. `const = x 1` is not.

---

### 🟡 Modern JavaScript (ES6+)
*Newer features that make code cleaner*

**ES6/ES2015+** — Modern JavaScript with features like `const`, `let`, arrow functions, `class`, `import/export`. What we write.

**Destructuring** — Pulling values out of objects/arrays in one line:
```javascript
const { name, price } = dish  // instead of dish.name, dish.price
const [first, second] = array  // instead of array[0], array[1]
```

**Spread Operator** — `...` copies items from arrays/objects:
```javascript
const copy = [...array]  // copy array
const merged = { ...obj1, ...obj2 }  // merge objects
```

**Template Literal** — String with embedded expressions: `` `Hello, ${name}!` ``

**Ternary Operator** — Shorthand if/else: `condition ? valueIfTrue : valueIfFalse`

**Map (Array method)** — Transforms each item in an array:
```javascript
const names = dishes.map(dish => dish.name)  // ['Pizza', 'Burger', 'Taco']
```

**Import** — Bringing code from another file. `import { DishCard } from './DishCard'`.

**Export** — Making code available for other files to import. `export function myFunction() {}`.

**Module** — A JavaScript file that exports code for other files to use. Modern JS is modular.

---

### 🔵 Async Programming
*Handling things that take time (like fetching data)*

**Synchronous** — Code that runs line-by-line, blocking everything until it's done. Opposite of async.

**Async/Await** — A way to write code that waits for something (like data from a server) without freezing the whole page. `await` pauses that function until the data arrives, but the rest of the app keeps working.

**Promise** — An object representing a future value. "I promise to give you data... eventually."
```javascript
fetch('/api/dishes')  // returns a Promise
  .then(data => console.log(data))  // runs when data arrives
```

**Fetch** — A way to request data from a server. `fetch('/api/dishes')` gets dishes.

**Parallel** — Doing multiple things at the same time instead of one after another. `Promise.all()` runs promises in parallel.

**Waterfall** — When things load one after another instead of in parallel. Like: fetch user → THEN fetch dishes → THEN fetch votes. Slow! Use `Promise.all()` to parallelize.

---

### ⚛️ React Core Concepts
*The library we use to build the UI*

**React** — A JavaScript library for building UIs with components. What this app is built with.

**Component** — A reusable piece of UI. Like a `DishCard` that shows one dish's info. Components can contain other components.

**Functional Component** — A React component written as a function (what we use):
```javascript
function DishCard({ dish }) { return <div>{dish.name}</div> }
```

**JSX** — JavaScript + HTML-like syntax. What React components are written in:
```jsx
return <div className="card">{dish.name}</div>
```

**Props** — Data passed to a React component. Like arguments to a function:
```jsx
<DishCard dish={dish} onVote={handleVote} />
```

**State** — Data that can change and causes re-renders when it does. `useState` creates state:
```javascript
const [count, setCount] = useState(0)
```

**Re-render** — When React rebuilds a component because something changed. Too many = slow app. Memoization reduces re-renders.

**Conditional Rendering** — Showing different things based on conditions. `{isLoggedIn ? <Profile /> : <Login />}`

**Key (React)** — A unique identifier for list items so React can track them:
```jsx
{dishes.map(dish => <DishCard key={dish.id} dish={dish} />)}
```

**Virtual DOM** — React's copy of the real DOM. React compares changes in the virtual DOM to minimize real DOM updates.

---

### 🪝 React Hooks
*Special functions that add features to components*

**Hook** — A function that lets you use React features in function components. Start with "use": `useState`, `useEffect`, `useMemo`. You can make custom hooks too.

**useState** — A Hook that creates state:
```javascript
const [count, setCount] = useState(0)
// count is the value, setCount updates it
```

**useEffect** — A Hook that runs code after render. For side effects: fetching data, subscriptions, timers.
```javascript
useEffect(() => {
  fetchDishes()
}, [])  // [] means run once on mount
```

**useMemo** — A Hook that caches a calculated value so it's not recalculated every render:
```javascript
const sorted = useMemo(() => dishes.toSorted(...), [dishes])
```

**useCallback** — A Hook that caches a function so it's not recreated every render. Use when passing callbacks to memoized children.

**Ref (useRef)** — A way to hold a value that persists across renders without causing re-renders. Also used to access DOM elements directly.

**Context (React)** — A way to share data across many components without passing it manually through each one. Like a radio broadcast instead of passing notes.

**Suspense** — React feature that shows a fallback (like a spinner) while waiting for something to load.

**Error Boundary** — A React component that catches errors in its children and shows a fallback instead of crashing the whole app.

---

### 🌐 Web & Browser Basics
*How the web works*

**Browser** — The app you use to view websites (Chrome, Safari, Firefox). It downloads your code and runs it.

**HTML (HyperText Markup Language)** — The language for structuring web pages. `<div>`, `<p>`, `<button>`, etc. React generates HTML.

**CSS (Cascading Style Sheets)** — The language for styling web pages. Colors, fonts, layouts, animations.

**DOM (Document Object Model)** — The browser's representation of your page as a tree of elements. React updates the DOM for you.

**URL (Uniform Resource Locator)** — A web address. `https://whats-good-here.vercel.app/browse`

**HTTP** — The protocol browsers use to request web pages and data. GET requests data, POST sends data.

**HTTPS** — Secure HTTP. Data is encrypted. The padlock in your browser's address bar.

**Client** — The user's browser. "Client-side" means code that runs in the browser, not on a server.

**Server** — A computer that serves data/files to other computers. Supabase runs on servers. Vercel hosts our files on servers.

**localStorage** — Browser storage that persists even after closing the tab. Limited to ~5MB of text data. Good for preferences, not sensitive data.

**Console** — The browser's developer tool for seeing messages and errors. `console.log('hello')` prints to it.

---

### 🔌 APIs & Data
*How your app talks to servers*

**API (Application Programming Interface)** — A way for different software to talk to each other. When your app fetches dishes from Supabase, it's using Supabase's API. Like a waiter taking your order to the kitchen and bringing food back.

**API Endpoint** — A specific URL that does one thing. `/api/dishes` might return all dishes. `/api/dishes/123` returns dish #123. Like different windows at a service counter.

**REST API** — A common API style using HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove).

**JSON (JavaScript Object Notation)** — A text format for data. `{"name": "Pizza", "price": 12.99}`. APIs usually return JSON.

**Query** — A request for specific data. "Get all dishes where category = 'pizza'."

**Query String** — Data in a URL after `?`. In `/browse?category=pizza`, `category=pizza` is the query string.

**CRUD** — Create, Read, Update, Delete. The four basic operations for data. Most apps are CRUD apps.

**Database** — Where data is permanently stored. Supabase uses PostgreSQL. Like a giant organized spreadsheet.

**SQL (Structured Query Language)** — Language for querying databases. `SELECT * FROM dishes WHERE category = 'pizza'`.

**PostgreSQL (Postgres)** — A database. What Supabase uses under the hood.

**Schema** — The structure of your data. "Dishes have name (string), price (number), category (string)."

---

### 🔐 Authentication & Security
*Keeping users and data safe*

**Authentication (Auth)** — Verifying WHO someone is. "Prove you're Daniel by entering your password." Different from authorization.

**Authorization** — Verifying what someone is ALLOWED to do. "Daniel is logged in, but can he access the admin page?" Different from authentication.

**Session** — A period of user activity. Login creates a session, logout ends it.

**Token** — A string that proves identity. JWTs (JSON Web Tokens) are common auth tokens.

**OAuth** — A way to log in using another service. "Sign in with Google" uses OAuth.

**CORS (Cross-Origin Resource Sharing)** — Security rules about which websites can request data from which servers. Why you sometimes see "CORS error."

**XSS (Cross-Site Scripting)** — A security attack where malicious scripts are injected into pages. React helps prevent this by escaping content.

---

### ⚡ Performance Optimization
*Making your app fast*

**Bundle** — All your JavaScript code combined into one (or a few) files for the browser to download. Smaller bundles = faster loads.

**Chunk** — A piece of your bundle that can be loaded separately. Lets you load only what's needed for the current page.

**Code Splitting** — Breaking your app into chunks so users don't download everything at once. Visit /home, download home code. Visit /admin, then download admin code.

**Lazy Loading** — Loading something only when it's needed. Like not downloading the Admin page until someone visits /admin.

**Dynamic Import** — Loading code only when it's needed: `import('./HeavyComponent')`. The code downloads at that moment, not upfront.

**Tree Shaking** — Removing unused code from your bundle. If you import `{ dishesApi }` but never use `restaurantsApi`, tree shaking removes `restaurantsApi`. Like a shipping company not loading boxes that aren't going anywhere.

**Minification** — Removing unnecessary characters from code (spaces, long variable names) to make files smaller.

**Gzip** — A compression format. Servers send gzipped files (smaller), browsers decompress them. That's why you see "gzip" sizes in build output.

**Cache** — Storing something so you don't have to fetch/calculate it again. Like remembering a phone number instead of looking it up every time.

**Memo/Memoization** — Caching the result of a function or component so you don't recalculate if inputs haven't changed.

**Debounce** — Waiting until someone stops doing something before responding. Like waiting until someone stops typing before searching, instead of searching every keystroke.

**Critical Path** — The stuff that MUST load before users see anything. Shorter critical path = faster perceived load time.

**TTI (Time to Interactive)** — How long until a user can actually click/type/interact with your page. Key performance metric.

**Latency** — The delay before data arrives. Server is far away = high latency. Why CDNs help.

**CDN (Content Delivery Network)** — Servers around the world that store copies of your files. Users download from the nearest one. Vercel uses a CDN.

**Vendor Chunk** — A bundle containing third-party libraries (React, Supabase, etc.) separate from your code. These change less often so browsers can cache them longer.

**Virtualization** — Only rendering items that are visible on screen, not the entire list. For very long lists.

**Optimistic Update** — Updating the UI immediately before the server confirms. Makes apps feel faster. If server fails, revert.

**Barrel File** — A file that re-exports multiple things from one place. `index.js` files that do `export { thing } from './thing'`. Convenient but can hurt performance.

---

### 🧱 Architecture Concepts
*How apps are structured*

**Frontend** — The part of your app users see and interact with. HTML, CSS, JavaScript in the browser.

**Backend** — The server-side part of your app. Where data is stored, processed, and secured. Users never see this code directly. Supabase is our backend.

**SPA (Single Page Application)** — An app that loads once and then updates without full page reloads. What we have. Fast navigation but slower initial load.

**Client-Side Rendering (CSR)** — When the browser downloads JavaScript and builds the page itself. What we do. Opposite of SSR.

**SSR (Server-Side Rendering)** — Rendering your app on the server first, then sending HTML. Faster first paint but more complex. (We don't do this.)

**RSC (React Server Components)** — Components that run on the server and send HTML to the client. (We don't use these - we're a Vite SPA.)

**Hydration** — When React takes over a server-rendered page and makes it interactive. Like inflating a balloon.

**Route/Routing** — Matching URLs to pages. `/browse` shows the Browse page. React Router handles this.

**Middleware** — Code that runs between receiving a request and sending a response. Can check auth, log requests, etc.

**Proxy** — A server that forwards requests. We proxy PostHog through `/ingest` to avoid ad blockers.

**Webhook** — A URL that receives data when something happens. "When a new user signs up, POST to this URL."

**WebSocket** — A persistent connection for real-time data. Chat apps use WebSockets.

**Immutable** — Data that doesn't change. Instead of modifying, you create a new copy with changes. React prefers immutable updates.

**Mutation** — Changing data directly. `dish.name = 'New Name'` mutates. React prefers avoiding mutations.

**Side Effect** — Code that affects something outside its function: fetching data, updating DOM, logging. `useEffect` handles side effects.

**Global State** — Data accessible from anywhere in your app. Context provides global state.

**DRY (Don't Repeat Yourself)** — A principle: if you're copying code, make it a reusable function/component instead.

---

### 🛠️ Developer Tools
*What you use to build*

**IDE (Integrated Development Environment)** — A code editor with extra features. VS Code, Cursor, WebStorm.

**CLI (Command Line Interface)** — A text-based way to interact with programs. The terminal where you type `npm run dev`.

**Git** — Version control software. Tracks changes to your code. Like "undo" but for your entire project history.

**GitHub** — A website that hosts Git repositories. Where your code lives online.

**Repository (Repo)** — A project tracked by Git. Your code on GitHub is a repository.

**npm (Node Package Manager)** — Tool for installing JavaScript packages. `npm install react`.

**Yarn** — Alternative to npm for installing packages. We use npm.

**Node.js** — JavaScript that runs outside the browser (on servers, on your computer). What runs `npm`.

**Package** — A bundle of code you can install. `npm install some-package`. Listed in `package.json`.

**package.json** — File listing your project's dependencies and scripts. `npm install` reads this.

**Dependency** — Something your code needs to work. React is a dependency. Listed in `package.json`.

**Dev Server** — A local server for development. `npm run dev` starts one at localhost:5173.

**Localhost** — Your own computer as a server. `localhost:5173` means "this computer, port 5173."

**Build** — The process of converting your development code into optimized production code. `npm run build` does this.

**Deploy** — Putting your app on a server so others can use it. `vercel --prod` deploys to Vercel.

**Production (Prod)** — The live version users see. Opposite of development.

**Environment Variable** — Settings that change between environments. `VITE_SUPABASE_URL` is different in development vs production. Stored in `.env` files.

**Hot Reload / HMR (Hot Module Replacement)** — When you save a file and the browser updates instantly without a full refresh. Makes development faster.

**ESLint** — A tool that checks your code for problems and style issues. `npm run lint`.

**Lint/Linter** — A tool that checks code for errors and style issues. ESLint is our linter.

**Polyfill** — Code that adds modern features to old browsers. "If browser doesn't have X, here's X."

**Zero-Config** — Tools that work without configuration. Vite is mostly zero-config.

---

### 🏗️ Our Tech Stack
*The specific tools we use*

**Vite** — Our build tool. Fast dev server, optimized production builds.

**Tailwind CSS** — A CSS framework using utility classes. `className="flex items-center p-4"` instead of writing CSS.

**Supabase** — Our backend-as-a-service. Provides database, authentication, and storage.

**SDK (Software Development Kit)** — A package that makes it easier to use a service. `@supabase/supabase-js` is Supabase's SDK.

**Vercel** — Our hosting platform. Deploys and serves the app globally.

**TypeScript (TS)** — JavaScript with types. `function greet(name: string): string`. Catches errors before runtime. (We use plain JS.)

---

### 🎯 Events & Interactivity
*Responding to user actions*

**Event** — Something that happens: a click, a keypress, a scroll, data arriving. Your code can listen for events and respond.

**Event Handler** — A function that runs when an event happens. `onClick={handleClick}`.

**Event Listener** — Code that waits for an event to happen, then runs. `document.addEventListener('click', handleClick)`.

**Passive (Event Listener)** — Telling the browser you won't cancel the event, so it can proceed without waiting for your code.

---

### 📊 Data Structures
*Ways to organize data*

**Map (Data structure)** — A collection of key-value pairs. Faster than objects for frequent additions/deletions.

**Index** — Position in an array (starting at 0). Also, `index.js` is the default file in a folder.

**UUID (Universally Unique Identifier)** — A random ID like `550e8400-e29b-41d4-a716-446655440000`. Guaranteed unique.

**Static** — Doesn't change. Static files are the same for everyone. Static site = pre-built HTML.

**Runtime** — When code actually runs (vs when it's written or built).

---

### 🎨 User Experience
*How it feels to use the app*

**UI (User Interface)** — What users see and interact with. Buttons, forms, cards, etc.

**UX (User Experience)** — How it feels to use an app. Is it fast? Intuitive? Frustrating?

**Framework** — A structured way to build apps. React is a framework (technically a library). Next.js is a framework built on React.

**Library** — Pre-written code you can use. React is a library. Smaller/more focused than a framework.

---

## Further Reading

- [React Docs](https://react.dev/) - Official React documentation
- [web.dev](https://web.dev/) - Google's web performance guides
- [Vite Docs](https://vitejs.dev/) - Our build tool's documentation
