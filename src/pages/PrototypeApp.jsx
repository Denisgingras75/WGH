/* eslint-disable */
/* prettier-ignore */
// =========================================================================
//  PrototypeApp — Claude Design handoff, ported verbatim.
//  Source: /Users/denisgingras/Downloads/design_handoff_wgh_redesign/designs/Whats Good Here.html
//
//  Design is authoritative. This file stays as close to the reference as
//  possible. The only changes vs. the HTML are:
//    1. React UMD globals → ES imports
//    2. Mock DATA (static JSON blob) → `useProtoData()` adapter over live
//       WGH hooks. Mutates module-scoped DATA before children render.
//    3. setTweak('theme', …) also calls ThemeContext setTheme() so the theme
//       persists to user profile + propagates socially across the app.
//    4. onVote wired to useVote().submitVote; bookmarks from useFavorites.
//    5. Guest sign-in nudge (floating CTA above nav) when no user.
//    6. Removed embedded edit-mode postMessage plumbing — that was for the
//       prototype's iframe editor, not relevant here.
//
//  Everything else — every component body, every style value, every string —
//  is a verbatim copy of the reference.
// =========================================================================

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocationContext } from '../context/LocationContext'
import { useTheme } from '../context/ThemeContext'
import { useDishes } from '../hooks/useDishes'
import { useAllDishes } from '../hooks/useAllDishes'
import { useUserVotes } from '../hooks/useUserVotes'
import { useUserPlaylists } from '../hooks/useUserPlaylists'
import { useFavorites } from '../hooks/useFavorites'
import { useVote } from '../hooks/useVote'
import { profileApi } from '../api/profileApi'
import { getCategoryEmoji, BROWSE_CATEGORIES } from '../constants/categories'

// Leaflet map lazy-loaded so the whole redesign bundle doesn't pay for it
// when the user never visits the Map view.
const LazyRestaurantMap = lazy(() =>
  import('../components/restaurants/RestaurantMap').then((m) => ({ default: m.RestaurantMap })),
)

// ---- Tweakable defaults (persisted via edit mode) ----
const DEFAULTS = {
  theme: 'paper',
  density: 'cozy',
  rankingView: 'list',
  votingStyle: 'ballot',
  showMap: true,
}

// ---- Module-scoped DATA (shape matches the prototype's mock JSON) ----
// App() populates this from live WGH hooks on every render before the
// children (which read DATA at render time) are evaluated. Keeping DATA
// module-scoped matches the prototype's shape so the ported JSX below
// can reference it identically (e.g. inside DishSheet, MapMini).
let DATA = {
  town: 'All Island',
  user: { name: 'You', handle: 'you', initials: 'YOU', score: 0, rank: 'Visitor' },
  dishes: [],
  lists: [],
  activity: [],
}

// ---- DATA adapter: WGH hooks → prototype shape ----
function mapDishToProto(d) {
  const totalVotes = Number(d.total_votes) || 0
  const avg = Number(d.avg_rating) || 0
  const yes = Math.round((avg / 10) * Math.max(totalVotes, 1))
  const no = Math.max(0, totalVotes - yes)
  const price =
    d.price != null ? '$' + Number(d.price).toFixed(2).replace(/\.00$/, '') : ''
  const imageUrl = d.featured_photo_url || d.photo_url || null
  // Restaurant meta: powers the Order Now / Directions buttons on DishSheet
  const restaurantId = d.restaurant_id || null
  const lat = d.restaurant_lat != null ? Number(d.restaurant_lat) : null
  const lng = d.restaurant_lng != null ? Number(d.restaurant_lng) : null
  const address = d.restaurant_address || null
  const website = d.restaurant_website_url || null
  const directOrderUrl = d.order_url || null
  const toastSlug = d.toast_slug || null
  const orderUrl = directOrderUrl
    || (toastSlug ? `https://www.toasttab.com/${toastSlug}/v3` : null)
    || website
    || null
  return {
    id: d.dish_id || d.id,
    name: d.dish_name || d.name,
    restaurant: d.restaurant_name || (d.restaurants && d.restaurants.name) || '',
    restaurantId,
    neighborhood: d.restaurant_town || (d.restaurants && d.restaurants.town) || '',
    category: d.category || '',
    emoji: getCategoryEmoji(d.category) || '🍽️',
    imageUrl,
    price,
    yes,
    no,
    score: Math.round(avg * 10),
    avgRating: avg,
    snippet: d.smart_snippet || '',
    trend: totalVotes >= 10 && avg >= 8 ? 'up' : 'steady',
    locals: totalVotes,
    firsts: 0,
    // Restaurant action targets — all optional, hidden when absent
    lat, lng, address, website, orderUrl,
    _raw: d,
  }
}

// Build a maps URL for directions. Prefers lat/lng (exact pin), falls back to
// the address string. Uses the universal Google Maps dir URL which works on
// iOS (opens Apple/Google Maps via chooser), Android, and web.
function buildDirectionsUrl(dish) {
  if (dish && dish.lat != null && dish.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${dish.lat},${dish.lng}`
  }
  if (dish && dish.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dish.address)}`
  }
  if (dish && dish.restaurant) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dish.restaurant)}`
  }
  return null
}

// Render either a real dish photo or the emoji-on-stripes placeholder.
// Used wherever the prototype had a .stripe-ph + emoji combo. Keeps every
// overlay the prototype had (rank badge, price chip, close button, etc.) by
// forwarding children. Children render ABOVE the image/emoji layer.
function DishImage({ dish, style, emojiSize = 32, children }) {
  const hasImage = !!(dish && dish.imageUrl)
  const baseStyle = { position: 'relative', overflow: 'hidden', ...style }
  return (
    <div className={hasImage ? '' : 'stripe-ph'} style={baseStyle}>
      {hasImage ? (
        <img
          src={dish.imageUrl}
          alt=""
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: emojiSize }}>
          {dish && dish.emoji}
        </div>
      )}
      {children}
    </div>
  )
}

function mapListToProto(p, i) {
  return {
    id: p.id || 'p-' + i,
    title: p.title || p.name || 'Untitled list',
    owner: p.owner_display_name || p.owner || 'you',
    followers: p.follower_count || p.followers || 0,
    count: p.dish_count || p.count || 0,
    description: p.description || '',
  }
}

function useProtoData() {
  const { user } = useAuth()
  const { location: geo, radius, town } = useLocationContext()
  const { dishes: rankedDishes } = useDishes(geo, radius)
  const { dishes: allDishes } = useAllDishes()
  const { stats } = useUserVotes(user?.id)
  const { playlists: myPlaylists } = useUserPlaylists(user?.id)

  return useMemo(
    function () {
      const src =
        rankedDishes && rankedDishes.length > 0 ? rankedDishes : allDishes || []
      const dishes = src.slice(0, 80).map(function (d) {
        return mapDishToProto(d)
      })
      const lists = (myPlaylists || []).map(function (p, i) {
        return mapListToProto(p, i)
      })
      const u = user
        ? {
            name:
              (user.user_metadata && user.user_metadata.display_name) ||
              (user.email ? user.email.split('@')[0] : 'You'),
            handle: user.email ? user.email.split('@')[0] : 'you',
            initials: (function () {
              const name =
                (user.user_metadata && user.user_metadata.display_name) ||
                user.email ||
                'You'
              const parts = String(name).split(/[\s@._-]+/).filter(Boolean)
              if (parts.length >= 2)
                return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
              return (parts[0] || 'U').charAt(0).toUpperCase()
            })(),
            score: (stats && stats.totalVotes) || 0,
            rank:
              (stats && stats.ratingStyle && stats.ratingStyle.label) || 'Local',
          }
        : { name: 'You', handle: 'guest', initials: 'YO', score: 0, rank: 'Guest' }

      return {
        town: town || 'All Island',
        user: u,
        dishes,
        lists,
        activity: [], // TODO: wire friend activity feed
        recentMeals: (stats && stats.recentMeals) || [],
      }
    },
    [user, town, rankedDishes, allDishes, stats, myPlaylists],
  )
}

// ----- Icons -----
const Icon = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" />
    </svg>
  ),
  Browse: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </svg>
  ),
  Vote: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 7h16v13H4z" />
      <path d="M4 11h16" />
      <path d="m8 15 2 2 4-4" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 4h13a1 1 0 0 1 1 1v15l-4-3-4 3-4-3-3 3V5a1 1 0 0 1 1-1z" />
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  Up: () => (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <path d="M5 2l4 5H1z" fill="currentColor" />
    </svg>
  ),
  Steady: () => (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <path d="M2 5h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Yes: () => (
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path d="m2 6 3 3 5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  ),
  No: () => (
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  ),
  Pin: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  Bookmark: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
}

// ---- Masthead ----
function Masthead({ town, onTown }) {
  return (
    <header className="hairline-b" style={{padding: '18px 20px 14px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 12}}>
        <div style={{flex:1, minWidth:0}}>
          <div className="mono" style={{fontSize: 10, letterSpacing: '.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>Vol. III · No. 142 · Fri 19 April</div>
          <h1 className="serif" style={{margin: '4px 0 10px', fontWeight: 900, fontSize: 34, lineHeight: 1, letterSpacing: '-.02em', fontStyle:'italic', whiteSpace:'nowrap'}}>
            What's Good <span style={{color:'var(--tomato)'}}>Here</span>
          </h1>
          <div style={{font:'500 12px/1.3 Inter', color:'var(--ink-2)'}}>
            A local's guide to what to actually order.
          </div>
        </div>
        <div className="avatar" title={DATA.user.name} style={{flexShrink:0}}>{DATA.user.initials}</div>
      </div>
      <div style={{marginTop: 14, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button onClick={onTown} style={{border:0, background:'transparent', padding:0, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, font:'600 12px/1 Inter', color:'var(--ink)'}}>
          <Icon.Pin /> <span>{town}</span>
          <span className="mono" style={{color:'var(--ink-3)', fontSize:10}}>· Martha's Vineyard</span>
        </button>
        <div className="mono" style={{fontSize: 10, color:'var(--ink-3)'}}>12,481 votes · 384 dishes</div>
      </div>
    </header>
  );
}

// ---- Search + Filters ----
function SearchRow({ value, onChange }) {
  return (
    <div style={{padding:'12px 20px', display:'flex', gap:10, alignItems:'center'}}>
      <div style={{flex:1, position:'relative', border:'1px solid var(--rule)', borderRadius: 10, background:'var(--card)', padding:'10px 12px 10px 36px'}}>
        <span style={{position:'absolute', left:12, top: 11, color:'var(--ink-3)'}}><Icon.Browse/></span>
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Search a dish, restaurant, or 'lobster roll'…"
          style={{border:0, background:'transparent', outline:'none', width:'100%', font:'500 14px/1.2 Inter', color:'var(--ink)'}} />
      </div>
      <button className="press" style={{border:'1px solid var(--rule)', background:'var(--card)', borderRadius:10, padding:'10px 12px', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer'}}>
        <Icon.Filter/><span style={{font:'600 12px/1 Inter'}}>Filter</span>
      </button>
    </div>
  );
}

// Category strip — uses WGH's real BROWSE_CATEGORIES so filtering works
// against live dish data. "All" prepended to match the prototype's shape.
const CATS = [{ id: 'all', label: 'All', emoji: '•' }, ...BROWSE_CATEGORIES];
function CatStrip({ active, setActive }) {
  return (
    <div className="no-scrollbar" style={{display:'flex', gap:8, overflowX:'auto', padding:'4px 20px 14px'}}>
      {CATS.map(c => (
        <button key={c.id} onClick={()=>setActive(c.id)}
          className={"chip " + (active===c.id ? 'active' : '')}
          style={{whiteSpace:'nowrap', cursor:'pointer', padding: '8px 14px', fontSize: 13}}>
          <span style={{fontSize:14}}>{c.emoji}</span>{c.label}
        </button>
      ))}
    </div>
  );
}

// ---- Dish row (list view) ----
function DishRow({ dish, rank, onOpen, bookmarked, onBookmark }) {
  if (!dish) return null;
  const total = (dish.yes || 0) + (dish.no || 0);
  const yesPct = total > 0 ? Math.round((dish.yes / total) * 100) : 0;
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e)=>{if(e.key==='Enter')onOpen();}} className="press row-dish" style={{
      display:'grid', gridTemplateColumns: '38px 68px 1fr auto', gap: 14, alignItems:'center',
      width:'100%', textAlign:'left', background:'transparent', border:0, padding:'14px 0', cursor:'pointer',
      borderBottom: '1px solid var(--rule)'
    }}>
      <div className="rank-num" style={{fontSize: 44, textAlign:'center', color: rank <= 3 ? 'var(--tomato)' : 'var(--ink-2)'}}>
        {String(rank).padStart(2,'0')}
      </div>
      <DishImage dish={dish} style={{ width: 68, height: 68, borderRadius: 10 }} emojiSize={32} />
      <div>
        <div className="serif" style={{fontWeight:700, fontSize: 17, lineHeight:1.15, letterSpacing:'-.01em'}}>
          {dish.name}
        </div>
        <div style={{font:'500 12px/1.3 Inter', color:'var(--ink-2)', marginTop:3}}>
          {dish.restaurant} <span style={{color:'var(--ink-3)'}}>· {dish.neighborhood}</span>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center', marginTop:7}}>
          <span className="vote-pill yes"><Icon.Yes/>{yesPct}%</span>
          <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{total} votes · {dish.locals} locals</span>
          {dish.trend === 'up' && <span style={{color:'var(--moss)', display:'inline-flex', gap:3, alignItems:'center', fontSize:11, fontWeight:600}}><Icon.Up/>rising</span>}
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6}}>
        <div className="mono" style={{fontSize:11, color:'var(--ink-2)'}}>{dish.price}</div>
        <span onClick={(e)=>{e.stopPropagation(); onBookmark();}} role="button" tabIndex={0} style={{border:0, background:'transparent', color: bookmarked ? 'var(--tomato)' : 'var(--ink-3)', cursor:'pointer', padding:4, display:'inline-flex'}}>
          <Icon.Bookmark/>
        </span>
      </div>
    </div>
  );
}

// ---- Dish card (grid view) ----
function DishCard({ dish, rank, onOpen }) {
  if (!dish) return null;
  const total = (dish.yes || 0) + (dish.no || 0);
  const yesPct = total > 0 ? Math.round((dish.yes / total) * 100) : 0;
  return (
    <button onClick={onOpen} className="press" style={{
      textAlign:'left', background:'var(--card)', border:'1px solid var(--rule)', borderRadius: 14,
      padding: 0, cursor:'pointer', overflow:'hidden', display:'flex', flexDirection:'column'
    }}>
      <DishImage dish={dish} style={{ aspectRatio: '5/4' }} emojiSize={54}>
        <div className="rank-num" style={{position:'absolute', top:8, left:10, fontSize:28, color:'var(--tomato)', textShadow: dish.imageUrl ? '0 1px 3px rgba(0,0,0,.5)' : 'none', zIndex: 1}}>
          {String(rank).padStart(2,'0')}
        </div>
        <div className="mono" style={{position:'absolute', top:10, right:10, fontSize:10, background:'var(--paper)', padding:'3px 6px', borderRadius: 4, color:'var(--ink-2)', zIndex: 1}}>{dish.price}</div>
      </DishImage>
      <div style={{padding:'10px 12px 14px'}}>
        <div className="serif" style={{fontWeight:700, fontSize: 15, lineHeight:1.15}}>{dish.name}</div>
        <div style={{font:'500 11px/1 Inter', color:'var(--ink-2)', marginTop:4}}>{dish.restaurant}</div>
        <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span className="vote-pill yes" style={{padding:'4px 8px', fontSize:11}}><Icon.Yes/>{yesPct}%</span>
          <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{dish.yes} yes</span>
        </div>
      </div>
    </button>
  );
}

// ---- Section heading ----
function Section({ kicker, title, more }) {
  return (
    <div style={{padding:'20px 20px 10px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap: 12}}>
      <div style={{flex:1, minWidth: 0}}>
        <div className="mono" style={{fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--ink-3)'}}>{kicker}</div>
        <h2 className="serif" style={{margin:'4px 0 0', fontWeight:800, fontSize: 22, letterSpacing:'-.01em', lineHeight:1.15}}>{title}</h2>
      </div>
      {more && <button style={{border:0, background:'transparent', color:'var(--tomato)', font:'600 12px/1 Inter', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0}}>{more} →</button>}
    </div>
  );
}

// ---- Hero pick of the day ----
function TonightPick({ dish, onOpen }) {
  if (!dish) return null;
  const total = (dish.yes || 0) + (dish.no || 0);
  const yesPct = total > 0 ? Math.round((dish.yes / total) * 100) : 0;
  return (
    <div style={{padding: '6px 20px 20px'}}>
      <button onClick={onOpen} className="press" style={{
        width:'100%', textAlign:'left', cursor:'pointer',
        background:'var(--card)', border:'1px solid var(--rule-2)', borderRadius: 16,
        padding: 16, display:'grid', gridTemplateColumns:'1fr 108px', gap: 14,
        boxShadow:'var(--shadow-ink)'
      }}>
        <div>
          <div className="mono" style={{fontSize: 10, letterSpacing: '.2em', color:'var(--tomato)', textTransform:'uppercase'}}>★ The pick tonight</div>
          <div className="serif" style={{fontWeight:800, fontStyle:'italic', fontSize: 24, lineHeight:1.05, letterSpacing:'-.01em', marginTop: 6}}>
            "{dish.snippet || dish.name}"
          </div>
          <div style={{marginTop:10, font:'600 13px/1.2 Inter'}}>{dish.name}</div>
          <div style={{font:'500 12px/1 Inter', color:'var(--ink-2)', marginTop:3}}>{dish.restaurant} · {dish.neighborhood}</div>
          <div style={{marginTop: 12, display:'flex', gap:8, alignItems:'center'}}>
            <span className="vote-pill yes"><Icon.Yes/>{yesPct}% say yes</span>
            <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{dish.locals} locals · {total} votes</span>
          </div>
        </div>
        <DishImage dish={dish} style={{ aspectRatio: '1', borderRadius: 12 }} emojiSize={52} />
      </button>
    </div>
  );
}

// ---- Activity ticker ----
function Activity({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{padding:'4px 20px 20px'}}>
      <div className="mono" style={{fontSize: 10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase', marginBottom:8}}>Locals, right now</div>
      <div style={{display:'flex', flexDirection:'column', gap: 6, border:'1px solid var(--rule)', background:'var(--card)', borderRadius: 12, padding:'6px 12px'}}>
        {items.map((a,i) => (
          <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i<items.length-1 ? '1px dashed var(--rule)' : 'none'}}>
            <span className="avatar" style={{width:22, height:22, fontSize:9}}>{a.who.split(' ').map(s=>s[0]).join('').slice(0,2)}</span>
            <span style={{font:'500 12px/1.3 Inter', color:'var(--ink-2)', flex:1}}>
              <b style={{color:'var(--ink)'}}>{a.who}</b> {a.what} <span className="mark" style={{color:'var(--ink)'}}>{a.dish}</span>
            </span>
            <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{a.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Map mini (live Leaflet preview) ----
// Small preview of the top dishes on a real map. Swappable mock fallback
// rendered while the Leaflet bundle + tiles load.
function MapMini({ dishes, userLocation, onDishClick }) {
  const mapDishes = (dishes || []).slice(0, 8).filter(d => d._raw && d._raw.restaurant_lat != null)
  return (
    <div style={{padding:'0 20px 20px'}}>
      <div style={{aspectRatio:'16/8', borderRadius: 14, border:'1px solid var(--rule)', position:'relative', overflow:'hidden'}}>
        <Suspense fallback={<MapFallback label={`top · ${DATA.town}`} />}>
          <LazyRestaurantMap
            mode="dish"
            dishes={mapDishes.map(d => d._raw)}
            userLocation={userLocation}
            town={DATA.town}
            isAuthenticated={false}
            permissionGranted={false}
            radiusMi={25}
            compact
            onSelectDish={(dish) => {
              const proto = mapDishes.find(m => (m._raw.dish_id || m._raw.id) === (dish.dish_id || dish.id))
              if (proto && onDishClick) onDishClick(proto)
            }}
          />
        </Suspense>
        <div className="mono" style={{position:'absolute', bottom:8, left:10, fontSize:10, color:'var(--ink-3)', background:'var(--paper)', padding:'3px 6px', borderRadius:4, zIndex: 400, pointerEvents: 'none'}}>top · {DATA.town}</div>
      </div>
    </div>
  );
}

// Simple striped fallback shown while the Leaflet chunk loads.
function MapFallback({ label }) {
  return (
    <div className="map-bg" style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <span className="mono" style={{fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--ink-3)'}}>{label || 'Loading map…'}</span>
    </div>
  )
}

// ---- Browse page ----
function BrowsePage({ dishes, view, onOpen, bookmarks, toggleBookmark, cat, setCat, q, setQ, userLocation }) {
  const filtered = dishes
    .filter(d => cat==='all' || d.category === cat)
    .filter(d => !q || (d.name+d.restaurant).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <SearchRow value={q} onChange={setQ}/>
      <CatStrip active={cat} setActive={setCat}/>
      <Section kicker={`${filtered.length} ranked`} title={cat==='all' ? 'Top dishes on the island' : `Top ${CATS.find(c=>c.id===cat)?.label?.toLowerCase()}`}/>
      {view === 'list' && (
        <div style={{padding:'0 20px'}}>
          {filtered.map((d, i) => (
            <DishRow key={d.id} dish={d} rank={i+1} onOpen={()=>onOpen(d)} bookmarked={bookmarks.has(d.id)} onBookmark={()=>toggleBookmark(d.id)} />
          ))}
        </div>
      )}
      {view === 'grid' && (
        <div style={{padding:'0 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12}}>
          {filtered.map((d, i) => <DishCard key={d.id} dish={d} rank={i+1} onOpen={()=>onOpen(d)}/>)}
        </div>
      )}
      {view === 'map' && <div style={{padding:'0 20px 20px'}}><MapFull dishes={filtered} onOpen={onOpen} userLocation={userLocation}/></div>}
    </>
  );
}

function MapFull({ dishes, onOpen, userLocation }) {
  const mapDishes = (dishes || []).filter(d => d._raw && d._raw.restaurant_lat != null)
  return (
    <div style={{aspectRatio:'4/5', borderRadius:14, border:'1px solid var(--rule)', position:'relative', overflow:'hidden'}}>
      <Suspense fallback={<MapFallback />}>
        <LazyRestaurantMap
          mode="dish"
          dishes={mapDishes.map(d => d._raw)}
          userLocation={userLocation}
          town={DATA.town}
          isAuthenticated={false}
          permissionGranted={false}
          radiusMi={25}
          onSelectDish={(dish) => {
            const proto = mapDishes.find(m => (m._raw.dish_id || m._raw.id) === (dish.dish_id || dish.id))
            if (proto && onOpen) onOpen(proto)
          }}
        />
      </Suspense>
    </div>
  );
}

// ---- Vote page (Ballot) ----
function VoteBallot({ dish, onVote, onSkip }) {
  const [note, setNote] = useState('');
  const [score, setScore] = useState(7);
  useEffect(() => { setScore(7); setNote('') }, [dish?.id]);
  if (!dish) return <div style={{padding: 40, textAlign:'center'}} className="serif">Nothing left to vote on. Nice work.</div>;
  const total = (dish.yes || 0) + (dish.no || 0);
  const yesPct = total > 0 ? Math.round((dish.yes / total) * 100) : 0;
  const scoreLabel = score >= 9 ? 'World-class' : score >= 8 ? 'Worth it' : score >= 7 ? 'Solid' : score >= 5 ? 'Meh' : score >= 3 ? 'Skip' : 'Avoid';
  const scoreColor = score >= 7 ? 'var(--moss)' : score >= 5 ? 'var(--ochre)' : 'var(--tomato)';
  return (
    <div style={{padding:'10px 20px 24px'}}>
      <div className="mono" style={{fontSize:10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase', margin:'0 0 12px'}}>Ballot · cast your vote</div>
      <div className="ballot">
        <span className="hole"/>
        <div className="mono" style={{fontSize: 10, letterSpacing:'.16em', color:'var(--ink-3)', textTransform:'uppercase'}}>No. {String(dish.id).slice(-4).toUpperCase()}</div>
        <div className="serif" style={{fontWeight:800, fontSize: 26, lineHeight:1.1, letterSpacing:'-.01em', marginTop:6}}>{dish.name}</div>
        <div style={{font:'500 13px/1.3 Inter', color:'var(--ink-2)', marginTop:2}}>{dish.restaurant} · {dish.neighborhood}</div>

        <DishImage dish={dish} style={{ aspectRatio: '16/10', borderRadius: 10, margin: '14px 0' }} emojiSize={72} />

        <div className="serif" style={{fontWeight:700, fontStyle:'italic', fontSize: 20, lineHeight:1.2}}>Would you order this again?</div>

        {/* Sliding score — 0 to 10. Tint + label shift as you drag. */}
        <div style={{marginTop: 14, padding: '12px 0'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 10}}>
            <span className="rank-num" style={{fontSize: 40, fontStyle:'italic', color: scoreColor, fontWeight: 900, lineHeight: .85}}>{score}</span>
            <span style={{font:'700 14px/1 Inter', color: scoreColor, letterSpacing: '.04em', textTransform: 'uppercase'}}>{scoreLabel}</span>
          </div>
          <input
            type="range" min={0} max={10} step={1}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="wgh-score-slider"
            style={{
              width: '100%', appearance: 'none', height: 6, borderRadius: 3,
              background: `linear-gradient(to right, ${scoreColor} 0%, ${scoreColor} ${score * 10}%, var(--rule) ${score * 10}%, var(--rule) 100%)`,
              outline: 'none', cursor: 'pointer',
            }}
          />
          <div style={{display:'flex', justifyContent:'space-between', marginTop: 6}}>
            <span className="mono" style={{fontSize: 9, color:'var(--ink-3)', letterSpacing: '.12em'}}>AVOID</span>
            <span className="mono" style={{fontSize: 9, color:'var(--ink-3)', letterSpacing: '.12em'}}>MEH</span>
            <span className="mono" style={{fontSize: 9, color:'var(--ink-3)', letterSpacing: '.12em'}}>WORTH IT</span>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginTop: 8}}>
          <button onClick={onSkip} className="press" style={{padding:'14px 10px', borderRadius:12, border:'1.5px solid var(--rule-2)', background:'var(--paper)', cursor:'pointer', font:'700 14px/1 Inter', whiteSpace:'nowrap'}}>
            Not tried
          </button>
          <button
            onClick={() => onVote(dish.id, score >= 7 ? 'yes' : 'no', score, note)}
            className="press"
            style={{padding:'14px 10px', borderRadius:12, border:'1.5px solid var(--ink)', background:'var(--ink)', color:'var(--paper)', cursor:'pointer', font:'700 14px/1 Inter', whiteSpace:'nowrap', letterSpacing: '.02em'}}
          >
            Cast vote · {score}/10
          </button>
        </div>

        <div style={{marginTop: 16}}>
          <div className="mono" style={{fontSize: 10, letterSpacing:'.16em', color:'var(--ink-3)', textTransform:'uppercase', marginBottom:8}}>Optional · note for locals</div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="What made it worth it? Any tips for next time?"
            style={{width:'100%', minHeight: 70, resize:'vertical', padding:10, borderRadius:10, border:'1px solid var(--rule)', background:'var(--paper)', color:'var(--ink)', font:'500 13px/1.4 Inter', outline:'none'}}/>
        </div>

        <div className="hairline" style={{marginTop: 14, paddingTop: 12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div className="mono" style={{fontSize: 10, color:'var(--ink-3)'}}>Locals currently say <b style={{color:'var(--tomato)'}}>{yesPct}%</b> yes · {dish.locals} votes</div>
        </div>
      </div>
    </div>
  );
}

// ---- Lists page ----
function ListsPage({ lists, shelf, setShelf, shelfCounts: shelfCountsProp, triedRows, wanttoRows, userHandle }) {
  const shelfCounts = shelfCountsProp || { tried: 0, wantto: 0, heard: 0, mine: 0 };
  const shelfLabels = { tried: 'Tried', wantto: 'Want to try', heard: 'Heard it\'s good', mine: 'My lists' };

  // Per-shelf dish rows. Falls back to top dishes for shelves we can't source live.
  const shelfRows = useMemo(function () {
    if (shelf === 'tried') {
      return (triedRows || []).slice(0, 5).map(function (r, i) {
        return {
          row: {
            id: r.id || (r.dish_name + (r.voted_at || i)),
            name: r.dish_name || r.name,
            restaurant: r.restaurant_name || r.restaurant || '',
            emoji: getCategoryEmoji(r.category) || '🍽️',
            imageUrl: r.photo_url || null,
            yes: Number(r.rating) >= 7 ? 1 : 0,
            no: 0,
          },
          meta: {
            verb: Number(r.rating) >= 7 ? 'Worth it' : Number(r.rating) >= 5 ? 'Meh' : 'Skip',
            subtitle: r.voted_at ? new Date(r.voted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
            color: Number(r.rating) >= 7 ? 'var(--tomato)' : Number(r.rating) >= 5 ? 'var(--ochre)' : 'var(--ink-3)',
            rating: Math.max(0, Math.min(5, Math.round(Number(r.rating || 0) / 2))),
          },
        }
      })
    }
    if (shelf === 'wantto') {
      return (wanttoRows || []).slice(0, 5).map(function (r) {
        return {
          row: {
            id: r.dish_id || r.id,
            name: r.dish_name || r.name,
            restaurant: r.restaurant_name || '',
            emoji: getCategoryEmoji(r.category) || '🍽️',
            imageUrl: r.photo_url || null,
            yes: 0, no: 0,
          },
          meta: { verb: 'Saved', subtitle: 'in Want to try', color: 'var(--ochre)', rating: 0 },
        }
      })
    }
    // 'heard' + 'mine' — we don't have live data sources yet; show top dishes as placeholders
    return DATA.dishes.slice(0, 5).map(function (d) {
      return {
        row: d,
        meta: shelf === 'heard'
          ? { verb: 'Heard it', subtitle: 'from locals', color: 'var(--moss)', rating: 0 }
          : { verb: 'In pizza tour', subtitle: '6 dishes · 12 follow', color: 'var(--ink)', rating: 0 },
      }
    })
  }, [shelf, triedRows, wanttoRows])

  return (
    <>
      <div style={{padding:'18px 20px 6px'}}>
        <div className="mono" style={{fontSize: 10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>Your shelves</div>
        <h2 className="serif" style={{margin:'6px 0 4px', fontWeight:800, fontSize: 28, letterSpacing:'-.015em', lineHeight: 1.05}}>
          The <span style={{fontStyle:'italic', color:'var(--tomato)'}}>bookshelf</span><br/>of things eaten.
        </h2>
        <div style={{font:'500 12px/1.4 Inter', color:'var(--ink-2)', marginTop: 6, maxWidth: 320}}>
          Every dish you've tried, saved, or heard about — shelved, countable, shareable.
        </div>
      </div>

      {/* Shelf cards (Goodreads-esque, stacked "spines") */}
      <div style={{padding:'16px 20px 4px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10}}>
        {[
          { id:'tried', label:"Tried", n: shelfCounts.tried, sub:'eaten', tint:'var(--tomato)', bg:'var(--tomato-soft)' },
          { id:'wantto', label:'Want to try', n: shelfCounts.wantto, sub:'queued', tint:'var(--ochre)', bg:'var(--ochre-soft)' },
          { id:'heard', label:"Heard it's good", n: shelfCounts.heard, sub:'tips', tint:'var(--moss)', bg:'var(--paper-2)' },
          { id:'mine', label:'My lists', n: shelfCounts.mine, sub:'lists', tint:'var(--ink)', bg:'var(--paper-2)' },
        ].map(s => (
          <button key={s.id} onClick={()=>setShelf(s.id)} className="press" style={{
            textAlign:'left', border: shelf===s.id ? '1.5px solid var(--ink)' : '1px solid var(--rule)',
            background: shelf===s.id ? s.bg : 'var(--card)',
            borderRadius: 12, padding: '14px 14px 12px', cursor:'pointer', position:'relative', overflow:'hidden'
          }}>
            <div style={{position:'absolute', left:0, top:10, bottom:10, width:3, background: s.tint, borderRadius: '0 2px 2px 0'}}/>
            <div style={{display:'flex', alignItems:'baseline', gap: 6}}>
              <div className="rank-num" style={{fontSize: 38, fontStyle:'normal', color: s.tint, fontWeight: 900, letterSpacing:'-.03em', lineHeight: .9}}>{s.n}</div>
              <div className="mono" style={{fontSize:9, color:'var(--ink-3)', letterSpacing:'.12em', textTransform:'uppercase', whiteSpace:'nowrap'}}>{s.sub}</div>
            </div>
            <div className="serif" style={{fontWeight:700, fontSize: 14, marginTop: 10, letterSpacing:'-.01em', lineHeight: 1.15}}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Section */}
      <div style={{padding:'18px 20px 6px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap: 12}}>
        <div style={{flex:1, minWidth:0}}>
          <div className="mono" style={{fontSize: 10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>
            {shelfLabels[shelf]} · {shelfCounts[shelf]} {shelf==='mine' ? 'lists' : 'dishes'}
          </div>
          <h3 className="serif" style={{margin:'3px 0 0', fontWeight:700, fontSize: 18, letterSpacing:'-.01em', fontStyle:'italic'}}>
            {shelf==='tried' ? 'What you\'ve put a fork through.' :
             shelf==='wantto' ? 'Next time you\'re on-island.' :
             shelf==='heard' ? 'Whispers from locals you trust.' :
             'Your published lists.'}
          </h3>
        </div>
        <button style={{border:'1px solid var(--rule)', background:'var(--card)', padding:'7px 11px', borderRadius:999, cursor:'pointer', display:'inline-flex', gap:4, alignItems:'center', font:'600 11px/1 Inter', whiteSpace:'nowrap', flexShrink:0}}>
          <Icon.Plus/>New list
        </button>
      </div>

      <div style={{padding:'10px 20px 4px', display:'flex', flexDirection:'column', gap: 8}}>
        {shelfRows.length === 0 ? (
          <div className="serif" style={{fontStyle:'italic', fontSize: 14, color:'var(--ink-2)', padding:'16px 2px'}}>
            {shelf === 'tried' ? "You haven't rated anything yet. Cast a vote to start this shelf."
              : shelf === 'wantto' ? 'Bookmark a dish to queue it up here.'
              : shelf === 'heard' ? 'Whispers from locals will show up here.'
              : 'Create a list to see it here.'}
          </div>
        ) : shelfRows.map(function (r, i) {
          return <ListShelfRow key={r.row.id} dish={r.row} idx={i+1} meta={r.meta} />
        })}
      </div>

      {/* Share bar */}
      <div style={{margin: '14px 20px 4px', padding: '14px 14px', border:'1px dashed var(--rule-2)', borderRadius: 12, display:'flex', justifyContent:'space-between', alignItems:'center', gap: 10}}>
        <div style={{minWidth:0, flex:1}}>
          <div className="serif" style={{fontWeight:700, fontStyle:'italic', fontSize: 15, lineHeight:1.3}}>Share this shelf</div>
          <div className="mono" style={{fontSize:10, color:'var(--ink-3)', marginTop: 6, letterSpacing:'.08em', textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>wgh.co/{userHandle || DATA.user.handle}/{shelf}</div>
        </div>
        <button style={{border:'1px solid var(--ink)', background:'var(--ink)', color:'var(--paper)', padding:'8px 14px', borderRadius:999, cursor:'pointer', font:'700 12px/1 Inter', whiteSpace:'nowrap', flexShrink:0}}>Copy link</button>
      </div>

      <div style={{padding:'24px 20px 10px'}}>
        <div className="mono" style={{fontSize: 10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>Follow lists from locals</div>
        <h3 className="serif" style={{margin:'4px 0 12px', fontWeight:800, fontSize: 22, letterSpacing:'-.01em', fontStyle:'italic'}}>Worth following</h3>
        <div style={{display:'flex', flexDirection:'column', gap: 10}}>
          {lists.map((l, i) => <PublicListCard key={l.id} list={l} idx={i+1}/>)}
        </div>
      </div>
    </>
  );
}

function ListShelfRow({ dish, meta, idx }) {
  const total = (dish.yes || 0) + (dish.no || 0);
  return (
    <div style={{display:'grid', gridTemplateColumns:'22px 44px 1fr auto', gap:12, alignItems:'center', padding:'12px 14px 12px 10px', background:'var(--card)', border:'1px solid var(--rule)', borderRadius: 12, position:'relative'}}>
      <div className="mono" style={{fontSize:10, color:'var(--ink-3)', textAlign:'right', fontWeight:600}}>{String(idx).padStart(2,'0')}</div>
      <DishImage dish={dish} style={{ width: 44, height: 44, borderRadius: 8 }} emojiSize={22} />
      <div style={{minWidth:0}}>
        <div className="serif" style={{fontWeight:700, fontSize: 15, lineHeight:1.15, letterSpacing:'-.005em'}}>{dish.name}</div>
        <div style={{font:'500 12px/1.2 Inter', color:'var(--ink-2)', marginTop:2}}>{dish.restaurant}</div>
        <div style={{display:'flex', gap:10, alignItems:'center', marginTop:6, flexWrap:'wrap'}}>
          <span style={{color: meta.color, fontSize: 10.5, fontWeight:700, whiteSpace:'nowrap', letterSpacing:'.02em', textTransform:'uppercase'}}>· {meta.verb}</span>
          <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{meta.subtitle}</span>
          {meta.rating > 0 && (
            <span style={{color:'var(--ochre)', fontSize: 11, letterSpacing: '.08em'}}>
              {'★'.repeat(meta.rating)}<span style={{color:'var(--rule-2)'}}>{'★'.repeat(5-meta.rating)}</span>
            </span>
          )}
        </div>
      </div>
      <button style={{border:0, background:'transparent', color:'var(--ink-3)', cursor:'pointer', fontSize: 16, padding: '0 4px'}}>⋯</button>
    </div>
  );
}

function PublicListCard({ list, idx }) {
  const colors = ['var(--tomato)','var(--ochre)','var(--moss)','var(--ink)'];
  const c = colors[(idx-1) % colors.length];
  return (
    <div style={{border:'1px solid var(--rule)', background:'var(--card)', borderRadius: 14, padding:'14px 16px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 14, alignItems:'flex-start'}}>
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4, paddingTop: 2}}>
        <div className="rank-num" style={{fontSize: 32, fontStyle:'normal', color: c, fontWeight:900, letterSpacing:'-.03em'}}>{String(idx).padStart(2,'0')}</div>
        <div style={{width: 2, height: 18, background: c, borderRadius: 1}}/>
      </div>
      <div style={{minWidth:0}}>
        <div className="serif" style={{fontWeight:800, fontSize: 17, letterSpacing:'-.01em', lineHeight:1.15, textWrap:'pretty'}}>{list.title}</div>
        <div style={{font:'500 12px/1.35 Inter', color:'var(--ink-2)', marginTop: 4}}>{list.description}</div>
        <div className="mono" style={{fontSize:10, color:'var(--ink-3)', marginTop:8, display:'flex', gap: 8, flexWrap:'wrap'}}>
          <span>by {list.owner}</span>
          <span>·</span>
          <span><b style={{color:'var(--ink)'}}>{list.count}</b> dishes</span>
          <span>·</span>
          <span><b style={{color:'var(--ink)'}}>{list.followers}</b> follow</span>
        </div>
      </div>
      <button className="press" style={{border:'1px solid var(--ink)', background:'transparent', padding:'7px 12px', borderRadius: 999, cursor:'pointer', font:'700 11px/1 Inter', whiteSpace:'nowrap', letterSpacing:'.04em', textTransform:'uppercase'}}>+ Follow</button>
    </div>
  );
}

// ---- Theme registry ----
const THEMES = [
  { id:'paper', name:'Paper', tag:'Editorial · warm', swatch:['#F4EFE8','#1A1714','#C5412A','#B8893A'], font:'Fraunces' },
  { id:'dusk',  name:'Dusk',  tag:'Supper club · dim', swatch:['#1C1B19','#F3EADA','#E56A4C','#D9A655'], font:'Fraunces' },
  { id:'zine',  name:'Zine',  tag:'Punk · riso print', swatch:['#F2EDE0','#0A0A0A','#FF2D87','#FFE94A'], font:'Bowlby One SC' },
  { id:'diner', name:'Diner', tag:'Matchbook · retro', swatch:['#F6EBD0','#2B1810','#C8201E','#E5A22C'], font:'Alfa Slab One' },
  { id:'chalk', name:'Chalkboard', tag:'Blackboard · handwritten', swatch:['#1E2A26','#F5F0DF','#F48F5A','#FFD65C'], font:'Caveat Brush' },
  { id:'neon',  name:'Neon Night', tag:'Vaporwave · glowing', swatch:['#0B0421','#F8E9FF','#FF3C9A','#3BF4E8'], font:'Archivo' },
];
const THEME_LABEL = Object.fromEntries(THEMES.map(t => [t.id, t.name]));

// ---- Profile page ----
function ProfilePage({ user, currentTheme, stats, recentMeals, tasteStats }) {
  const s = stats || {};
  const votesCast = String(s.votesCast ?? user.score ?? 0);
  const tried = String(s.tried ?? 0);
  const toTry = String(s.toTry ?? 0);
  const listsN = String(s.lists ?? 0);

  // Taste chart: map real tasteStats (from get_badge_evaluation_stats) into
  // the bar rows the prototype designs. Falls back to reference rows when the
  // user hasn't voted enough for stats to exist.
  const tasteRows = useMemo(function () {
    if (tasteStats && tasteStats.length > 0) {
      return tasteStats
        .filter(r => Number(r.total_ratings || 0) >= 1)
        .slice(0, 5)
        .map(r => {
          const avg = Number(r.my_avg_rating != null ? r.my_avg_rating : r.avg_rating) * 10
          const consensus = Number(r.consensus_avg != null ? r.consensus_avg : r.avg_rating) * 10
          const bias = Math.round(avg - consensus)
          return {
            cat: (r.category || '').replace(/\b\w/g, c => c.toUpperCase()),
            count: Number(r.total_ratings) || 0,
            avg: Math.round(avg),
            bias,
            emoji: getCategoryEmoji(r.category) || '🍽️',
          }
        })
    }
    return [
      { cat: 'Burgers', count: 18, avg: 68, bias: -8, emoji: '🍔' },
      { cat: 'Lobster rolls', count: 12, avg: 82, bias: 2, emoji: '🦞' },
      { cat: 'Chowder', count: 9, avg: 91, bias: 9, emoji: '🥣' },
      { cat: 'Pizza', count: 14, avg: 74, bias: -1, emoji: '🍕' },
      { cat: 'Coffee', count: 22, avg: 88, bias: 3, emoji: '☕' },
    ]
  }, [tasteStats])

  // Food journal: real last-3 votes when available, fallback to top dishes
  const journalRows = useMemo(function () {
    if (recentMeals && recentMeals.length > 0) {
      return recentMeals.map(m => ({
        id: (m.dish_name || '') + (m.voted_at || ''),
        name: m.dish_name,
        restaurant: m.restaurant_name || '',
        rating: Number(m.rating) || 0,
        date: m.voted_at ? new Date(m.voted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      }))
    }
    return DATA.dishes.slice(0, 3).map((d, i) => ({
      id: d.id, name: d.name, restaurant: d.restaurant, rating: null, date: ['Apr 17','Apr 12','Apr 5'][i],
    }))
  }, [recentMeals])
  return (
    <>
      <div style={{padding: '20px 20px 10px', display:'flex', gap: 14, alignItems:'center'}}>
        <div className="avatar" style={{width:64, height:64, fontSize: 22}}>{user.initials}</div>
        <div style={{flex:1}}>
          <div className="serif" style={{fontWeight:800, fontSize: 22, letterSpacing:'-.01em', lineHeight:1.1}}>{user.name}</div>
          <div style={{font:'500 12px/1 Inter', color:'var(--ink-2)', marginTop:4}}>@{user.handle} · Member since '25</div>
          <div style={{display:'flex', gap: 8, marginTop: 8, alignItems:'center', flexWrap:'wrap'}}>
            <span className="chip">🏝 {user.rank}</span>
            <span className="chip">Burger bias</span>
            <button onClick={()=>window.__openStudio && window.__openStudio()} className="chip" style={{cursor:'pointer', borderStyle:'solid', fontWeight:700}}>
              🎨 <span style={{marginLeft:4}}>{THEME_LABEL[currentTheme] || 'Design'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Design your feed CTA */}
      <div style={{padding:'0 20px 14px'}}>
        <button onClick={()=>window.__openStudio && window.__openStudio()} className="press" style={{
          width:'100%', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'center',
          padding:'14px 16px', border:'1px solid var(--rule)', borderRadius: 14,
          background:'var(--card)', cursor:'pointer', textAlign:'left', color:'inherit'
        }}>
          <div style={{width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
            background:'linear-gradient(135deg, var(--tomato), var(--ochre))', color:'#fff', fontSize:22}}>🎨</div>
          <div style={{minWidth:0}}>
            <div className="serif" style={{fontWeight:800, fontSize:16, letterSpacing:'-.005em', lineHeight:1.15}}>Design your feed</div>
            <div style={{font:'500 12px/1.3 Inter', color:'var(--ink-2)', marginTop:2}}>6 themes · shown on your profile & lists</div>
          </div>
          <span className="mono" style={{fontSize:10, letterSpacing:'.1em', color:'var(--ink-3)', textTransform:'uppercase'}}>{currentTheme}</span>
        </button>
      </div>

      {/* Stat ledger — large editorial numerals */}
      <div style={{padding:'4px 20px 18px'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 0, border:'1px solid var(--rule)', borderRadius: 12, background:'var(--card)', overflow:'hidden'}}>
          <Stat n={votesCast} l="Votes cast" tint="var(--tomato)"/>
          <Stat n={tried} l="Tried" tint="var(--ink)" divider/>
          <Stat n={toTry} l="To try" tint="var(--ochre)" divider/>
          <Stat n={listsN} l="Lists" tint="var(--moss)" divider/>
        </div>
      </div>

      <div className="hairline-b" style={{margin:'0 20px'}}/>

      {/* Taste profile */}
      <div style={{padding:'20px 20px 10px'}}>
        <div className="mono" style={{fontSize: 10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>Your taste, charted</div>
        <h3 className="serif" style={{margin:'4px 0 14px', fontWeight:800, fontStyle:'italic', fontSize: 22, letterSpacing:'-.01em', lineHeight: 1.2}}>
          Harsh on burgers.<br/><span style={{color:'var(--tomato)'}}>Soft on chowder.</span>
        </h3>
        <div style={{display:'flex', flexDirection:'column', gap: 14}}>
          {tasteRows.map(r => (
            <div key={r.cat} style={{display:'grid', gridTemplateColumns:'1fr auto', gap: 4, alignItems:'baseline'}}>
              <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                <span style={{fontSize:14}}>{r.emoji}</span>
                <span style={{font:'600 13px/1 Inter'}}>{r.cat}</span>
                <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{r.count} tried</span>
              </div>
              <div style={{display:'flex', alignItems:'baseline', gap: 8}}>
                <span className="rank-num" style={{fontSize: 22, fontStyle:'normal', color: r.bias>=0 ? 'var(--moss)' : 'var(--tomato)', fontWeight: 900}}>{r.avg}</span>
                <span className="mono" style={{fontSize:10, color: r.bias>=0 ? 'var(--moss)' : 'var(--tomato)', fontWeight:700, whiteSpace:'nowrap'}}>{r.bias>=0?'+':''}{r.bias} vs avg</span>
              </div>
              <div style={{gridColumn:'1 / -1', height: 6, background:'var(--rule)', borderRadius: 3, overflow:'hidden', position:'relative'}}>
                <span style={{position:'absolute', left:0, top:0, bottom:0, width: `${r.avg}%`, background: r.bias>=0 ? 'var(--moss)' : 'var(--tomato)'}}/>
                {/* avg tick */}
                <span style={{position:'absolute', left: `${r.avg - r.bias}%`, top:-2, bottom:-2, width: 1.5, background:'var(--ink)', opacity:.6}}/>
              </div>
            </div>
          ))}
        </div>
        <div className="mono" style={{fontSize:9, color:'var(--ink-3)', marginTop: 12, display:'flex', gap: 12, letterSpacing:'.1em', textTransform:'uppercase'}}>
          <span>— your % yes</span>
          <span>| island avg</span>
        </div>
      </div>

      <div className="hairline-b" style={{margin:'16px 20px 0'}}/>

      {/* Journal */}
      <div style={{padding:'18px 20px 10px'}}>
        <div className="mono" style={{fontSize: 10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>Food journal</div>
        <h3 className="serif" style={{margin:'4px 0 12px', fontWeight:800, fontSize: 20, letterSpacing:'-.01em'}}>Last few bites</h3>
        <div style={{display:'flex', flexDirection:'column', gap: 12}}>
          {journalRows.length === 0 ? (
            <div className="serif" style={{fontStyle:'italic', fontSize:14, color:'var(--ink-2)', padding:'8px 0'}}>
              Cast your first vote and it'll show up here.
            </div>
          ) : journalRows.map((row) => {
            const isYes = row.rating == null || row.rating >= 7;
            const ratingLabel = row.rating == null ? null : (row.rating >= 7 ? 'Worth it' : row.rating >= 5 ? 'Meh' : 'Skip');
            return (
              <div key={row.id} className="quote-card" style={{background:'var(--card)', borderRadius: 10, padding:'12px 14px', border:'1px solid var(--rule)', borderLeft:`3px solid ${isYes ? 'var(--tomato)' : 'var(--ink-3)'}`}}>
                <div style={{display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start'}}>
                  <div className="serif" style={{fontWeight:700, fontSize:15, lineHeight:1.2, flex:1, minWidth:0}}>{row.name}</div>
                  <div className="mono" style={{fontSize:10, color:'var(--ink-3)', whiteSpace:'nowrap', paddingTop:3}}>{row.date}</div>
                </div>
                <div style={{font:'500 12px/1.2 Inter', color:'var(--ink-2)', margin:'4px 0 6px'}}>{row.restaurant}</div>
                {row.rating != null && (
                  <div style={{marginTop: 4, display:'flex', gap: 8, alignItems:'center'}}>
                    <span className={'vote-pill ' + (isYes ? 'yes' : 'no')}>
                      {isYes ? <><Icon.Yes/>{ratingLabel}</> : <><Icon.No/>{ratingLabel}</>}
                    </span>
                    <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{row.rating}/10</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stat({ n, l, delta, tint, divider }) {
  return (
    <div style={{padding:'14px 10px', textAlign:'center', borderLeft: divider ? '1px solid var(--rule)' : 'none', position:'relative'}}>
      <div className="rank-num" style={{fontSize:34, fontStyle: 'normal', color: tint, fontWeight: 900, letterSpacing:'-.03em', lineHeight: .9}}>{n}</div>
      <div className="mono" style={{fontSize:9, color:'var(--ink-2)', letterSpacing:'.14em', textTransform:'uppercase', marginTop:6, fontWeight: 600}}>{l}</div>
      {delta && <div className="mono" style={{fontSize:9, color:'var(--ink-3)', marginTop:3}}>{delta}</div>}
    </div>
  );
}

// ---- Dish sheet ----
function DishSheet({ dish, onClose, bookmarks, toggleBookmark, onRate }) {
  const [score, setScore] = useState(dish ? Math.round(dish.avgRating || 7) : 7);
  useEffect(() => { if (dish) setScore(Math.round(dish.avgRating || 7)) }, [dish?.id]);
  if (!dish) return null;
  const total = (dish.yes || 0) + (dish.no || 0);
  const yesPct = total > 0 ? Math.round((dish.yes / total) * 100) : 0;
  const bk = bookmarks.has(dish.id);
  const directionsUrl = buildDirectionsUrl(dish);
  const hasOrder = !!dish.orderUrl;
  const scoreLabel = score >= 9 ? 'World-class' : score >= 8 ? 'Worth it' : score >= 7 ? 'Solid' : score >= 5 ? 'Meh' : score >= 3 ? 'Skip' : 'Avoid';
  const scoreColor = score >= 7 ? 'var(--moss)' : score >= 5 ? 'var(--ochre)' : 'var(--tomato)';
  return (
    <div className="sheet show" style={{transform: 'translate(-50%, 0)'}}>
      <div className="sheet-grab"/>
      <div style={{padding:'4px 20px 100px'}}>
        <DishImage dish={dish} style={{ aspectRatio: '16/10', borderRadius: 14 }} emojiSize={100}>
          <button onClick={onClose} style={{position:'absolute', top:10, right:10, width:32, height:32, borderRadius:999, border:0, background:'var(--paper)', cursor:'pointer', fontSize:16, zIndex: 1}}>×</button>
        </DishImage>
        <div className="mono" style={{fontSize:10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase', marginTop: 14}}>
          Dish · {dish.category}
        </div>
        <h2 className="serif" style={{margin:'4px 0', fontWeight:800, fontSize: 28, lineHeight:1.05, letterSpacing:'-.015em', fontStyle:'italic'}}>{dish.name}</h2>
        <div style={{font:'500 13px/1 Inter', color:'var(--ink-2)'}}>{dish.restaurant} · {dish.neighborhood} · {dish.price}</div>

        {/* Action row — Order Now (primary) · Directions · Save */}
        <div style={{marginTop: 14, display:'grid', gridTemplateColumns: hasOrder ? '1.2fr 1fr 1fr' : '1fr 1fr', gap: 8}}>
          {hasOrder && (
            <a href={dish.orderUrl} target="_blank" rel="noopener noreferrer" className="press" style={{padding:'12px 8px', borderRadius:12, border:'1.5px solid var(--tomato)', background:'var(--tomato)', color:'var(--paper)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap: 6, font:'700 13px/1 Inter', textDecoration: 'none', whiteSpace: 'nowrap'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Order now
            </a>
          )}
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="press" style={{padding:'12px 8px', borderRadius:12, border:'1.5px solid var(--ink)', background:'var(--paper)', color:'var(--ink)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap: 6, font:'700 13px/1 Inter', textDecoration: 'none', whiteSpace: 'nowrap'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
              Directions
            </a>
          )}
          <button onClick={()=>toggleBookmark(dish.id)} className="press" style={{padding:'12px 8px', borderRadius:12, border:`1.5px solid ${bk ? 'var(--tomato)' : 'var(--ink)'}`, background:'var(--paper)', color: bk ? 'var(--tomato)' : 'var(--ink)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap: 6, font:'700 13px/1 Inter', whiteSpace: 'nowrap'}}>
            <Icon.Bookmark/> {bk ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Rate this dish — sliding score 0–10 */}
        <div style={{marginTop: 16, padding: '14px 14px 16px', background:'var(--card)', border:'1px solid var(--rule)', borderRadius: 12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap: 8}}>
            <div className="mono" style={{fontSize:10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>Your rating</div>
            <div style={{display:'flex', alignItems:'baseline', gap: 6}}>
              <span className="rank-num" style={{fontSize: 24, fontStyle:'italic', color: scoreColor, fontWeight: 900}}>{score}</span>
              <span style={{font:'600 11px/1 Inter', color: scoreColor, letterSpacing: '.04em', textTransform: 'uppercase'}}>{scoreLabel}</span>
            </div>
          </div>
          <input
            type="range" min={0} max={10} step={1}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="wgh-score-slider"
            style={{
              width: '100%', marginTop: 12, appearance: 'none', height: 6, borderRadius: 3,
              background: `linear-gradient(to right, ${scoreColor} 0%, ${scoreColor} ${score * 10}%, var(--rule) ${score * 10}%, var(--rule) 100%)`,
              outline: 'none', cursor: 'pointer',
            }}
          />
          <div style={{display:'flex', justifyContent:'space-between', marginTop: 6}}>
            <span className="mono" style={{fontSize: 9, color:'var(--ink-3)'}}>AVOID</span>
            <span className="mono" style={{fontSize: 9, color:'var(--ink-3)'}}>MEH</span>
            <span className="mono" style={{fontSize: 9, color:'var(--ink-3)'}}>WORTH IT</span>
          </div>
          <button
            onClick={() => { onRate && onRate(dish.id, score); }}
            className="press"
            style={{width: '100%', marginTop: 12, padding: '10px 14px', border: 0, borderRadius: 999, background: 'var(--ink)', color: 'var(--paper)', font: '700 13px/1 Inter', letterSpacing: '.02em', cursor: 'pointer'}}
          >
            Cast vote · {score}/10
          </button>
        </div>

        <div style={{marginTop: 18, padding: '12px 14px', background:'var(--card)', border:'1px solid var(--rule)', borderRadius: 12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="serif" style={{fontWeight:700, fontSize:16}}>{yesPct}% worth it</div>
            <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{total} votes · {dish.locals} locals</span>
          </div>
          <div className="conf-bar" style={{marginTop: 8}}><span style={{width:`${yesPct}%`}}/></div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
            <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{dish.yes} yes</span>
            <span className="mono" style={{fontSize:10, color:'var(--ink-3)'}}>{dish.no} skip</span>
          </div>
        </div>

        <div style={{marginTop: 18}}>
          <div className="mono" style={{fontSize:10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>What locals say</div>
          <div style={{marginTop: 10, display:'flex', flexDirection:'column', gap: 12}}>
            {[
              { who:'Mara R.', quote:dish.snippet || 'Solid order.', vote:'yes', days: '2d', locals: true},
              { who:'Sam P.', quote:'Skip the fries side — upgrade to chowder.', vote:'yes', days: '1w', locals: true},
              { who:'Jules T.', quote:'Great on Tues/Weds. Sunday feels like leftovers.', vote:'no', days: '3w', locals: false},
            ].map((r,i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'32px 1fr', gap: 10}}>
                <div className="avatar" style={{width:32, height:32, fontSize:11, background: r.locals ? 'var(--tomato)' : 'var(--ochre)'}}>{r.who.split(' ').map(s=>s[0]).join('')}</div>
                <div>
                  <div style={{display:'flex', gap:8, alignItems:'baseline'}}>
                    <b style={{font:'700 13px/1 Inter'}}>{r.who}</b>
                    {r.locals && <span className="chip" style={{padding:'2px 6px', fontSize:9}}>local</span>}
                    <span className={"vote-pill " + (r.vote==='yes' ? 'yes' : 'no')} style={{padding:'2px 6px', fontSize:10}}>
                      {r.vote==='yes' ? <><Icon.Yes/>Worth</> : <><Icon.No/>Skip</>}
                    </span>
                    <span className="mono" style={{fontSize:9, color:'var(--ink-3)', marginLeft:'auto'}}>{r.days}</span>
                  </div>
                  <div className="serif" style={{fontStyle:'italic', fontSize:14, lineHeight:1.35, marginTop: 4}}>"{r.quote}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginTop: 20}}>
          <div className="mono" style={{fontSize:10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>Also on the menu</div>
          <div style={{display:'flex', gap: 10, overflowX:'auto', marginTop:10, padding:'2px 0'}} className="no-scrollbar">
            {DATA.dishes.filter(d=>d.id !== dish.id).slice(0,4).map(d => {
              const dTotal = (d.yes || 0) + (d.no || 0);
              const dPct = dTotal > 0 ? Math.round((d.yes / dTotal) * 100) : 0;
              return (
                <div key={d.id} style={{minWidth: 140, background:'var(--card)', border:'1px solid var(--rule)', borderRadius: 10, padding: 10}}>
                  <DishImage dish={d} style={{ aspectRatio: '1', borderRadius: 6 }} emojiSize={30} />
                  <div className="serif" style={{fontWeight:700, fontSize: 13, marginTop: 6, lineHeight: 1.15}}>{d.name}</div>
                  <div className="mono" style={{fontSize:10, color:'var(--ink-3)', marginTop: 3}}>{dPct}% yes</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Design Studio (theme picker) ----
function DesignStudio({ currentTheme, onPick, onClose, mode }) {
  // mode: 'onboard' | 'edit'
  const [selected, setSelected] = useState(currentTheme || 'paper');
  const t = THEMES.find(x => x.id === selected) || THEMES[0];
  return (
    <div className="studio-overlay" onClick={mode === 'edit' ? onClose : undefined}>
      <div className="studio-sheet" onClick={e=>e.stopPropagation()} data-theme={selected}>
        {/* Live preview pane */}
        <div className="studio-preview">
          <div className="studio-preview-inner">
            <div className="mono" style={{fontSize: 9, letterSpacing:'.22em', color:'var(--ink-3)', textTransform:'uppercase'}}>Vol. III · Preview</div>
            <div className="serif" style={{fontWeight: 900, fontSize: 26, lineHeight: 1, letterSpacing:'-.02em', marginTop: 6, fontStyle: 'italic'}}>
              What's Good <span style={{color:'var(--tomato)'}}>Here</span>
            </div>
            <div style={{marginTop: 14, display:'grid', gridTemplateColumns: '48px 1fr auto', gap: 12, alignItems:'center', padding:'10px 12px', background:'var(--card)', border:'1px solid var(--rule)', borderRadius: 10}}>
              <div className="rank-num" style={{fontSize: 32, fontStyle:'italic', color:'var(--tomato)', textAlign:'center'}}>01</div>
              <div>
                <div className="serif" style={{fontWeight: 700, fontSize: 14, lineHeight: 1.15}}>Lobster roll</div>
                <div className="mono" style={{fontSize: 9, color:'var(--ink-3)', marginTop: 2, letterSpacing:'.06em'}}>NET'S · 94% yes</div>
              </div>
              <span className="vote-pill yes" style={{fontSize: 10, padding:'4px 8px'}}>Worth</span>
            </div>
            <div style={{marginTop: 10, display:'flex', gap: 6, flexWrap:'wrap'}}>
              <span className="chip active">Lobster</span>
              <span className="chip">Burgers</span>
              <span className="chip">Pizza</span>
            </div>
          </div>
        </div>

        {/* Chrome */}
        <div className="studio-chrome">
          <div className="studio-header">
            <div>
              <div className="mono" style={{fontSize: 10, letterSpacing:'.2em', color:'var(--ink-3)', textTransform:'uppercase'}}>
                {mode === 'onboard' ? 'Welcome — step 1 of 1' : 'Design studio'}
              </div>
              <h2 className="serif" style={{margin:'4px 0 0', fontWeight: 900, fontSize: 24, letterSpacing:'-.02em', fontStyle:'italic', lineHeight:1.1}}>
                {mode === 'onboard' ? 'Make it yours.' : 'Your look'}
              </h2>
              <div style={{font:'500 12px/1.35 Inter', color:'var(--ink-2)', marginTop: 6, maxWidth: 320}}>
                {mode === 'onboard'
                  ? 'Pick a vibe. You can change it any time from your profile — and friends see it when they visit your lists.'
                  : 'Changes apply everywhere. Friends see your theme on your profile and lists.'}
              </div>
            </div>
            {mode === 'edit' && (
              <button onClick={onClose} style={{border:0, background:'transparent', cursor:'pointer', color:'var(--ink-3)', fontSize: 22, padding: 6}}>×</button>
            )}
          </div>

          <div className="studio-grid">
            {THEMES.map(th => {
              const isActive = th.id === selected;
              return (
                <button
                  key={th.id}
                  onClick={()=>setSelected(th.id)}
                  className="studio-card press"
                  data-active={isActive}
                  aria-pressed={isActive}
                >
                  <div className="studio-swatch" style={{background: th.swatch[0]}}>
                    <div style={{fontFamily: th.font, color: th.swatch[1], fontSize: 22, fontWeight: 800, fontStyle: th.id === 'neon' ? 'italic' : 'normal', textShadow: th.id === 'neon' ? `0 0 10px ${th.swatch[2]}` : 'none', letterSpacing: th.id==='paper'||th.id==='dusk' ? '-.02em' : 0}}>Aa</div>
                    <div style={{position:'absolute', bottom: 8, left: 8, right: 8, display:'flex', gap: 4}}>
                      <span style={{flex: 1, height: 6, borderRadius: 3, background: th.swatch[2]}}/>
                      <span style={{flex: 1, height: 6, borderRadius: 3, background: th.swatch[3]}}/>
                      <span style={{flex: 1, height: 6, borderRadius: 3, background: th.swatch[1], opacity:.3}}/>
                    </div>
                    {isActive && (
                      <div style={{position:'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius:999, background: th.swatch[2], color: '#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <Icon.Yes/>
                      </div>
                    )}
                  </div>
                  <div className="studio-meta">
                    <div style={{font:'800 13px/1.1 Inter', letterSpacing:'-.005em'}}>{th.name}</div>
                    <div className="mono" style={{fontSize: 9, letterSpacing:'.12em', color:'var(--ink-3)', textTransform:'uppercase', marginTop: 3}}>{th.tag}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="studio-footer">
            <div style={{font:'500 11px/1.3 Inter', color:'var(--ink-3)', flex: 1, minWidth: 0}}>
              <span style={{color:'var(--ink-2)'}}>Now showing:</span> <b style={{color:'var(--ink)'}}>{t.name}</b>
              <span className="mono" style={{marginLeft: 8, fontSize: 10, color:'var(--ink-3)'}}>· {t.tag}</span>
            </div>
            <button
              onClick={()=>{ onPick(selected); }}
              style={{border:0, background:'var(--ink)', color:'var(--paper)', padding:'12px 20px', borderRadius: 999, font:'700 13px/1 Inter', cursor:'pointer', whiteSpace:'nowrap', letterSpacing:'.02em'}}
            >
              {mode === 'onboard' ? `Use ${t.name} →` : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- App ----
export function PrototypeApp() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { submitVote } = useVote()
  const { favorites, toggleFavorite } = useFavorites(user?.id)
  const { location: geo } = useLocationContext()

  // Live data → populate module-scoped DATA so children read the same shape
  const live = useProtoData()
  DATA = live

  // Taste stats (per-category bias) — powers the "Your taste, charted" chart
  const [tasteStats, setTasteStats] = useState([])
  useEffect(function () {
    if (!user?.id) { setTasteStats([]); return }
    let cancelled = false
    profileApi.getTasteStats(user.id)
      .then(function (rows) { if (!cancelled) setTasteStats(rows || []) })
      .catch(function () { if (!cancelled) setTasteStats([]) })
    return function () { cancelled = true }
  }, [user?.id])

  const [tab, setTab] = useState('home')
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [shelf, setShelf] = useState('tried')
  const [voteIdx, setVoteIdx] = useState(0)
  const [openDish, setOpenDish] = useState(null)
  const [toast, setToast] = useState('')
  const [tweaks, setTweaks] = useState({ ...DEFAULTS, theme })
  const [studioOpen, setStudioOpen] = useState(null) // null | 'onboard' | 'edit'

  // Bookmarks from real favorites (replaces prototype's local Set)
  const bookmarks = useMemo(function () {
    const s = new Set()
    ;(favorites || []).forEach(function (f) { s.add(f.dish_id || f.id) })
    return s
  }, [favorites])

  // Keep tweaks.theme in sync with ThemeContext (hydrated on auth, changed elsewhere, etc.)
  useEffect(function () { setTweaks(function (t) { return { ...t, theme: theme } }) }, [theme])

  // First-run onboarding
  useEffect(function () {
    try {
      const seen = localStorage.getItem('wgh.onboarded')
      if (!seen) setTimeout(function () { setStudioOpen('onboard') }, 400)
    } catch (_e) { /* ignore */ }
  }, [])

  // Expose opener globally so nested components (Profile chip / CTA) can call it
  useEffect(function () {
    window.__openStudio = function () { setStudioOpen('edit') }
    return function () { try { delete window.__openStudio } catch (_e) { /* ignore */ } }
  }, [])

  function setTweak(key, val) {
    setTweaks(function (prev) { return { ...prev, [key]: val } })
    if (key === 'theme') setTheme(val) // persist + propagate across app
  }

  function toggleBookmark(id) {
    if (!user) { showToast('Sign in to save dishes'); return }
    const wasBookmarked = bookmarks.has(id)
    toggleFavorite(id)
    showToast(wasBookmarked ? 'Removed from Want to try' : 'Saved to Want to try')
  }

  function showToast(t) {
    setToast(t)
    setTimeout(function () { setToast('') }, 1600)
  }

  function onVote(_id, v, score, note) {
    if (!user) { showToast('Sign in to vote'); navigate('/login'); return }
    const proto = DATA.dishes[voteIdx]
    if (proto && proto._raw) {
      const dishId = proto._raw.dish_id || proto._raw.id
      const rating = typeof score === 'number' ? score : (v === 'yes' ? 9 : 4)
      submitVote(dishId, rating, note || null).catch(function () { showToast('Vote failed — try again') })
    }
    showToast(typeof score === 'number' ? `Vote cast · ${score}/10` : (v === 'yes' ? 'Vote cast · Worth it 🔥' : 'Vote cast · Skipped'))
    setVoteIdx(function (i) { return (i + 1) % Math.max(DATA.dishes.length, 1) })
  }

  return (
    <div className="app-shell grain" data-theme={tweaks.theme} data-density={tweaks.density}>
      {/* page */}
      <div className="page-scroll">
        {tab === 'home' && (
          <>
            <Masthead town={DATA.town} onTown={()=>showToast('Town picker (Edgartown, Oak Bluffs, …)')}/>
            <TonightPick dish={DATA.dishes[0]} onOpen={()=>setOpenDish(DATA.dishes[0])}/>
            <Activity items={DATA.activity}/>
            <Section kicker="Top · Martha's Vineyard" title="This week's rank" more="Browse all"/>
            <div style={{padding:'0 20px 6px', display:'flex', justifyContent:'flex-end'}}>
              <div className="seg">
                {[['list','List'],['grid','Cards'],['map','Map']].map(([id,l]) => (
                  <button key={id} className={tweaks.rankingView===id?'on':''} onClick={()=>setTweak('rankingView', id)}>{l}</button>
                ))}
              </div>
            </div>
            {tweaks.rankingView==='list' && (
              <div style={{padding:'0 20px'}}>
                {DATA.dishes.slice(0,5).map((d,i) => (
                  <DishRow key={d.id} dish={d} rank={i+1} onOpen={()=>setOpenDish(d)} bookmarked={bookmarks.has(d.id)} onBookmark={()=>toggleBookmark(d.id)} />
                ))}
              </div>
            )}
            {tweaks.rankingView==='grid' && (
              <div style={{padding:'0 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                {DATA.dishes.slice(0,6).map((d,i) => <DishCard key={d.id} dish={d} rank={i+1} onOpen={()=>setOpenDish(d)}/>)}
              </div>
            )}
            {tweaks.rankingView==='map' && <MapMini dishes={DATA.dishes} userLocation={geo} onDishClick={setOpenDish}/>}

            <Section kicker="Fresh from locals" title="Lists you might follow" more="See all"/>
            <div style={{padding:'0 20px 20px', display:'flex', flexDirection:'column', gap: 10}}>
              {DATA.lists.slice(0,2).map((l, i) => <PublicListCard key={l.id} list={l} idx={i+1}/>)}
            </div>
          </>
        )}
        {tab === 'browse' && (
          <BrowsePage dishes={DATA.dishes} view={tweaks.rankingView} onOpen={setOpenDish} bookmarks={bookmarks} toggleBookmark={toggleBookmark} cat={cat} setCat={setCat} q={q} setQ={setQ} userLocation={geo}/>
        )}
        {tab === 'vote' && (
          <VoteBallot dish={DATA.dishes[voteIdx]} onVote={onVote} onSkip={()=>{ setVoteIdx(i=>(i+1)%Math.max(DATA.dishes.length, 1)); showToast('Marked not tried'); }}/>
        )}
        {tab === 'lists' && (
          <ListsPage
            lists={DATA.lists}
            shelf={shelf}
            setShelf={setShelf}
            shelfCounts={{
              tried: DATA.user.score || 0,
              wantto: favorites?.length || 0,
              heard: 0,
              mine: DATA.lists.length,
            }}
            triedRows={DATA.recentMeals}
            wanttoRows={favorites || []}
            userHandle={DATA.user.handle}
          />
        )}
        {tab === 'profile' && (
          <ProfilePage
            user={DATA.user}
            currentTheme={tweaks.theme}
            stats={{
              votesCast: DATA.user.score || 0,
              tried: DATA.user.score || 0,
              toTry: bookmarks.size,
              lists: DATA.lists.length,
            }}
            recentMeals={DATA.recentMeals}
            tasteStats={tasteStats}
          />
        )}
      </div>

      {/* Dish sheet */}
      {openDish && (
        <>
          <div className={"sheet-back show"} onClick={()=>setOpenDish(null)}/>
          <DishSheet
            dish={openDish}
            onClose={()=>setOpenDish(null)}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            onRate={(dishId, score) => {
              if (!user) { showToast('Sign in to vote'); navigate('/login'); return }
              submitVote(dishId, score, null)
                .then(() => showToast(`Vote cast · ${score}/10`))
                .catch(() => showToast('Vote failed — try again'))
              setOpenDish(null)
            }}
          />
        </>
      )}

      {/* Toast */}
      <div className={"toast " + (toast ? 'show' : '')}>{toast}</div>

      {/* Design Studio */}
      {studioOpen && (
        <DesignStudio
          mode={studioOpen}
          currentTheme={tweaks.theme}
          onClose={()=>setStudioOpen(null)}
          onPick={(id)=>{
            setTweak('theme', id)
            try { localStorage.setItem('wgh.onboarded', '1') } catch (_e) { /* ignore */ }
            setStudioOpen(null)
            showToast('Theme saved · ' + (THEME_LABEL[id] || id))
          }}
        />
      )}

      {/* Guest sign-in CTA (not in the prototype — added because the prototype
          assumed a signed-in user but our live app starts as guest) */}
      {!user && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
        }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="press"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid var(--ink)',
              background: 'var(--ink)',
              color: 'var(--paper)',
              font: "600 13px/1 Inter, system-ui, sans-serif",
              letterSpacing: '0.02em',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-ink)',
            }}
          >
            Sign in to save &amp; vote
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="navbar">
        {[
          ['home','Home',Icon.Home],
          ['browse','Rank',Icon.Browse],
          ['vote','Vote',Icon.Vote],
          ['lists','Lists',Icon.List],
          ['profile','You',Icon.Profile],
        ].map(([id,l,Ic]) => (
          <button key={id} className={"nav-btn " + (tab===id?'active':'')} onClick={()=>{ setTab(id); window.scrollTo({top:0, behavior:'auto'}); }}>
            <Ic/><span>{l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
