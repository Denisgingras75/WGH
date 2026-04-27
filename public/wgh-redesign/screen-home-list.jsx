/* global React, Rating, VoteStamp, WorthBadge, DishThumb, SectionHead, RankNum, TownPill, Icon, ScreenHeader */
const { useState: useStateHL } = React;

/* =============================================================
   HOME — List mode
   Editorial top story → category strip → ranked list w/ menu leaders
   ============================================================= */
function HomeList({ tweaks, onOpenDish, onOpenRestaurant, onSwitchMap, onSwitchProfile, onOpenBrowse }) {
  const { DISHES, CATEGORIES } = window.WGH_DATA;
  const [activeCat, setActiveCat] = useStateHL(null);
  const [query, setQuery] = useStateHL('');

  const ranked = DISHES
    .filter(d => !activeCat || d.category === activeCat)
    .filter(d => !query || d.dish_name.toLowerCase().includes(query.toLowerCase()) || d.restaurant_name.toLowerCase().includes(query.toLowerCase()))
    .slice()
    .sort((a, b) => b.avg_rating - a.avg_rating);

  const top = ranked[0];
  const rest = ranked.slice(1, 8);

  const dense = tweaks.density === 'compact';
  const photoForward = tweaks.photoProminence === 'photo-forward';

  return (
    <div className="screen">
      {/* Wordmark header — Amatic SC, hand-stamped */}
      <div style={{ padding: '14px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="font-script" style={{ fontSize: 32, fontWeight: 700, lineHeight: 0.9, color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}>
          What's Good Here<span style={{ color: 'var(--color-primary)' }}>.</span>
        </div>
        <button className="tap" onClick={onSwitchProfile} style={{
          width: 32, height: 32, borderRadius: 999,
          background: 'var(--color-primary)', color: 'white',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>DG</button>
      </div>

      {/* Search + radius */}
      <div style={{ padding: '6px 12px 10px' }}>
        <div className="card" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 14,
          border: '1.5px solid var(--color-divider)',
          boxShadow: 'none',
        }}>
          <Icon name="search" size={18} color="var(--color-text-tertiary)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you craving?"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, fontFamily: 'inherit', color: 'var(--color-text-primary)',
            }}
          />
          <button className="tap chip" style={{
            background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-divider)', fontSize: 12, padding: '4px 10px',
          }}>
            <Icon name="pin" size={12} stroke={2.5} color="var(--color-primary)" />
            5 mi
          </button>
        </div>
      </div>

      {/* Editorial top-story card */}
      {top && (
        <div style={{ padding: '4px 12px 0' }}>
          <div className="press tap" onClick={() => onOpenDish(top)} style={{
            position: 'relative',
            borderRadius: 18,
            overflow: 'hidden',
            background: 'var(--color-card)',
            boxShadow: 'var(--shadow-pop)',
            cursor: 'pointer',
          }}>
            <div style={{
              padding: '14px 16px 8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              borderBottom: '1.5px solid var(--color-rule)',
            }}>
              <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>
                Top of the island today
              </div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>
                MV · Apr 26
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, padding: 16, alignItems: 'stretch' }}>
              <DishThumb emoji={top.photo} size={photoForward ? 96 : 76} rounded={14} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="font-display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                    {top.dish_name}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    at <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{top.restaurant_name}</span>
                    <span style={{ color: 'var(--color-text-tertiary)' }}> · {top.restaurant_town}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
                  <div>
                    <Rating value={top.avg_rating} size="xl" />
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginTop: -4 }}>
                      / 10 · {top.total_votes} votes
                    </div>
                  </div>
                  <WorthBadge pct={top.percent_worth_it} />
                </div>
              </div>
            </div>
            {top.snippet && (
              <div style={{
                padding: '0 16px 14px', fontSize: 13, color: 'var(--color-text-secondary)',
                fontStyle: 'italic', lineHeight: 1.45,
              }}>
                "{top.snippet}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category strip */}
      <div style={{ marginTop: 18 }}>
        <div className="section-eyebrow" style={{ padding: '0 16px 8px' }}>Browse by</div>
        <div className="no-scrollbar" style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '0 12px 6px',
        }}>
          <CatChip label="All" active={!activeCat} onClick={() => setActiveCat(null)} />
          {CATEGORIES.map(c => (
            <CatChip key={c.id} icon={c.icon} label={c.label} active={activeCat === c.id} onClick={() => setActiveCat(activeCat === c.id ? null : c.id)} />
          ))}
        </div>
      </div>

      {/* Ranked list */}
      <SectionHead
        eyebrow="The Ranking"
        title={activeCat ? CATEGORIES.find(c => c.id === activeCat)?.label + ' · best nearby' : 'Best dishes nearby'}
        action={<button className="tap" onClick={onSwitchMap} style={{
          fontSize: 12, fontWeight: 600, color: 'var(--color-primary)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>On map <Icon name="chev" size={14} stroke={2.5} /></button>}
      />

      <div style={{ padding: '0 12px 100px' }}>
        {rest.map((d, i) => (
          <RankedRow
            key={d.dish_id}
            n={i + 2}
            dish={d}
            dense={dense}
            photoForward={photoForward}
            onClick={() => onOpenDish(d)}
            onRestClick={(e) => { e.stopPropagation(); onOpenRestaurant(d.restaurant_id); }}
          />
        ))}
        {rest.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
            No dishes match. Try another category or zoom out.
          </div>
        )}
      </div>

      {/* Map FAB */}
      <button onClick={onSwitchMap} className="tap" style={{
        position: 'absolute', bottom: 84, right: 16,
        background: 'var(--color-text-primary)', color: 'white',
        padding: '10px 16px', borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 600,
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        border: 'none', cursor: 'pointer', zIndex: 30,
      }}>
        <Icon name="map" size={16} stroke={2} />
        Map
      </button>
    </div>
  );
}

function CatChip({ icon, label, active, onClick }) {
  return (
    <button className="tap" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 14px', borderRadius: 999,
      background: active ? 'var(--color-text-primary)' : 'var(--color-card)',
      color: active ? 'white' : 'var(--color-text-primary)',
      border: active ? '1.5px solid var(--color-text-primary)' : '1.5px solid var(--color-divider)',
      fontSize: 13, fontWeight: 600,
      cursor: 'pointer', flexShrink: 0,
      whiteSpace: 'nowrap',
    }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      {label}
    </button>
  );
}

function RankedRow({ n, dish, dense, photoForward, onClick, onRestClick }) {
  const thumb = photoForward ? 64 : 48;
  const pad = dense ? '10px 12px' : '14px 12px';
  return (
    <div className="press tap" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: pad,
      borderBottom: '1px solid var(--color-divider)',
      cursor: 'pointer',
    }}>
      <div style={{ width: 28, textAlign: 'right', flexShrink: 0 }}>
        <RankNum n={n} size="sm" />
      </div>
      <DishThumb emoji={dish.photo} size={thumb} rounded={10} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Restaurant first (matches WGH dish-first hierarchy doc says restaurant-first list) */}
        <div onClick={onRestClick} style={{
          fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {dish.restaurant_name}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--color-text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginTop: 1,
        }}>
          {dish.dish_name}
        </div>
        {!dense && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <TownPill town={dish.restaurant_town} />
            <span style={{ color: 'var(--color-divider)', fontSize: 10 }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}>${dish.price}</span>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <Rating value={dish.avg_rating} size="lg" />
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: -2 }}>
          {dish.total_votes} votes
        </div>
      </div>
    </div>
  );
}

window.HomeList = HomeList;
