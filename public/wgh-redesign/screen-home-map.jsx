/* global React, Rating, VoteStamp, WorthBadge, DishThumb, SectionHead, Icon, ScreenHeader, TownPill */
const { useState: useStateHM, useMemo: useMemoHM } = React;

/* =============================================================
   HOME — Map mode
   Editorial: Martha's Vineyard outline, dish "stamps" on map,
   bottom sheet with horizontal cards, drag-up for full list
   ============================================================= */
function HomeMap({ tweaks, onOpenDish, onOpenRestaurant, onSwitchList, onSwitchProfile }) {
  const { DISHES, MAP_BOUNDS, TOWN_PINS } = window.WGH_DATA;
  const [activeId, setActiveId] = useStateHM(DISHES[0]?.dish_id);
  const [filter, setFilter] = useStateHM('all'); // all | open-now | top-rated | unvisited

  const filtered = useMemoHM(() => {
    let list = DISHES.slice();
    if (filter === 'open-now') list = list.filter(d => d.open_now);
    if (filter === 'top-rated') list = list.filter(d => d.avg_rating >= 8.8);
    if (filter === 'unvisited') list = list.filter(d => !d.user_visited);
    return list;
  }, [filter]);

  const active = filtered.find(d => d.dish_id === activeId) || filtered[0];

  const pinStyle = tweaks.pinStyle || 'rating-num';

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top floating header bar */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12, zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div className="card" style={{
          flex: 1,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 14,
          boxShadow: 'var(--shadow-pop)',
        }}>
          <Icon name="search" size={18} color="var(--color-text-tertiary)" />
          <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Martha's Vineyard
          </span>
          <Icon name="chevDown" size={16} color="var(--color-text-tertiary)" />
        </div>
        <button onClick={onSwitchList} className="tap" style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-pop)',
        }}>
          <Icon name="list" size={18} stroke={2.5} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="no-scrollbar" style={{
        position: 'absolute', top: 70, left: 0, right: 0, zIndex: 25,
        display: 'flex', gap: 6, padding: '0 12px',
        overflowX: 'auto',
      }}>
        {[
          { id: 'all', label: 'All ' + DISHES.length },
          { id: 'open-now', label: '🟢 Open now' },
          { id: 'top-rated', label: '⭐ 8.8+' },
          { id: 'unvisited', label: 'Unvisited' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="tap" style={{
            padding: '6px 12px', borderRadius: 999,
            background: filter === f.id ? 'var(--color-text-primary)' : 'white',
            color: filter === f.id ? 'white' : 'var(--color-text-primary)',
            border: 'none', cursor: 'pointer', flexShrink: 0,
            fontSize: 12, fontWeight: 600,
            boxShadow: 'var(--shadow-card)',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Map canvas */}
      <div className="map-fallback" style={{
        position: 'absolute', inset: 0, zIndex: 1,
        overflow: 'hidden',
      }}>
        <MVMap
          dishes={filtered}
          activeId={active?.dish_id}
          onPinClick={(id) => setActiveId(id)}
          pinStyle={pinStyle}
          townPins={TOWN_PINS}
        />
      </div>

      {/* Bottom sheet — horizontally-scrolling dish cards */}
      <div style={{
        position: 'absolute', bottom: 76, left: 0, right: 0, zIndex: 20,
      }}>
        <div className="no-scrollbar" style={{
          display: 'flex', gap: 10, padding: '0 12px',
          overflowX: 'auto', scrollSnapType: 'x mandatory',
        }}>
          {filtered.map(d => (
            <MapCard
              key={d.dish_id}
              dish={d}
              active={d.dish_id === active?.dish_id}
              onSelect={() => setActiveId(d.dish_id)}
              onOpen={() => onOpenDish(d)}
              onOpenRest={() => onOpenRestaurant(d.restaurant_id)}
              photoForward={tweaks.photoProminence === 'photo-forward'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Stylized MV outline + dish pins */
function MVMap({ dishes, activeId, onPinClick, pinStyle, townPins }) {
  // Map coords in normalized 0–1 space; stylized outline of MV.
  const W = 393, H = 700;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block' }}>
      {/* Water background already from .map-fallback */}
      {/* Subtle ocean grid */}
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(26,26,26,0.04)" strokeWidth="1" />
        </pattern>
        <filter id="papershadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />

      {/* Stylized MV island outline — rough triangle/heart shape */}
      <g filter="url(#papershadow)">
        <path
          d="M 60 200
             C 60 180, 100 160, 150 160
             C 200 145, 260 150, 310 175
             C 345 195, 350 230, 340 270
             C 335 310, 320 345, 290 380
             C 260 415, 220 445, 175 460
             C 130 470, 90 455, 70 420
             C 50 385, 45 340, 50 295
             C 52 260, 55 225, 60 200 Z"
          fill="#F0E6D4"
          stroke="#1A1A1A"
          strokeWidth="1.5"
          opacity="0.95"
        />
        {/* Inland green */}
        <path
          d="M 110 230 C 150 220, 200 218, 250 232 C 280 245, 295 270, 290 310 C 275 350, 240 390, 200 410 C 160 420, 120 405, 100 370 C 85 340, 90 290, 110 230 Z"
          fill="#DBE3D2"
          opacity="0.6"
        />
        {/* Pond accents */}
        <circle cx="180" cy="380" r="14" fill="#C9DEE0" opacity="0.7" />
        <circle cx="220" cy="350" r="10" fill="#C9DEE0" opacity="0.7" />
        <ellipse cx="150" cy="320" rx="20" ry="10" fill="#C9DEE0" opacity="0.6" />
      </g>

      {/* Town labels */}
      {townPins.map(t => (
        <g key={t.id}>
          <circle cx={t.x * W} cy={t.y * H} r="3" fill="#1A1A1A" opacity="0.7" />
          <text
            x={t.x * W + 6} y={t.y * H + 3}
            fontSize="9"
            fontFamily="Outfit, sans-serif"
            fontWeight="600"
            fill="var(--color-text-secondary)"
            letterSpacing="0.05em"
            style={{ textTransform: 'uppercase' }}
          >{t.label}</text>
        </g>
      ))}

      {/* Dish pins */}
      {dishes.map(d => {
        const cx = d.map_x * W;
        const cy = d.map_y * H;
        const isActive = d.dish_id === activeId;
        return (
          <Pin
            key={d.dish_id}
            cx={cx} cy={cy}
            dish={d}
            active={isActive}
            style={pinStyle}
            onClick={() => onPinClick(d.dish_id)}
          />
        );
      })}
    </svg>
  );
}

function Pin({ cx, cy, dish, active, style, onClick }) {
  const tone = dish.avg_rating >= 9 ? 'var(--color-primary)' : dish.avg_rating >= 8 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)';
  const r = active ? 22 : 16;

  if (style === 'emoji-tile') {
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }} transform={`translate(${cx},${cy})`}>
        <rect x={-r} y={-r} width={r * 2} height={r * 2} rx="6" fill="white" stroke={active ? tone : '#1A1A1A'} strokeWidth={active ? 2 : 1} filter="url(#papershadow)" />
        <text x="0" y={r * 0.35} textAnchor="middle" fontSize={r * 1.1}>{dish.photo}</text>
        {active && <circle cx="0" cy={r + 3} r="2" fill={tone} />}
      </g>
    );
  }

  if (style === 'minimal-dot') {
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }} transform={`translate(${cx},${cy})`}>
        <circle r={active ? 8 : 5} fill={tone} stroke="white" strokeWidth={active ? 3 : 2} />
        {active && (
          <text x="0" y="-12" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="var(--color-text-primary)">
            {dish.avg_rating.toFixed(1)}
          </text>
        )}
      </g>
    );
  }

  // default: rating-num bubble
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} transform={`translate(${cx},${cy})`}>
      <circle r={r} fill={active ? tone : 'white'} stroke={tone} strokeWidth={active ? 2 : 1.5} filter={active ? 'url(#papershadow)' : ''} />
      <text x="0" y="3" textAnchor="middle"
        fontSize={active ? 12 : 10}
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="700"
        fill={active ? 'white' : tone}
        style={{ letterSpacing: '-0.02em' }}>
        {dish.avg_rating.toFixed(1)}
      </text>
      {active && <polygon points={`0,${r + 6} -4,${r} 4,${r}`} fill={tone} />}
    </g>
  );
}

function MapCard({ dish, active, onSelect, onOpen, onOpenRest, photoForward }) {
  return (
    <div className="press tap" onClick={active ? onOpen : onSelect} style={{
      flex: '0 0 86%',
      scrollSnapAlign: 'start',
      background: 'white',
      borderRadius: 16,
      padding: 12,
      display: 'flex',
      gap: 12,
      boxShadow: active ? 'var(--shadow-pop)' : 'var(--shadow-card)',
      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
      cursor: 'pointer',
      minHeight: 96,
    }}>
      <DishThumb emoji={dish.photo} size={photoForward ? 80 : 64} rounded={12} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div onClick={(e) => { e.stopPropagation(); onOpenRest(); }}
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dish.restaurant_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dish.dish_name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <Rating value={dish.avg_rating} size="lg" />
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>· {dish.total_votes}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {dish.open_now ? (
              <span style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>● Open</span>
            ) : (
              <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Closed</span>
            )}
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{dish.distance_mi}mi</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.HomeMap = HomeMap;
