/* global React, Rating, DishThumb, SectionHead, Icon, ScreenHeader, TownPill, WorthBadge, RankNum */
const { useState: useStateBR } = React;

/* =============================================================
   BROWSE — category-led discovery, edited collections
   ============================================================= */
function Browse({ onOpenDish, onOpenCategory, onOpenRestaurant }) {
  const { DISHES, CATEGORIES, COLLECTIONS } = window.WGH_DATA;

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 6px' }}>
        <div className="section-eyebrow">Browse</div>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
          What are you in the mood for?
        </h1>
      </div>

      {/* Category grid */}
      <div style={{ padding: '14px 12px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {CATEGORIES.map(c => {
            const top = DISHES.filter(d => d.category === c.id).sort((a, b) => b.avg_rating - a.avg_rating)[0];
            return (
              <button key={c.id} onClick={() => onOpenCategory(c)} className="tap press" style={{
                background: 'var(--color-card)', border: 'none',
                borderRadius: 14, padding: 14,
                textAlign: 'left', cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                display: 'flex', flexDirection: 'column', gap: 8,
                minHeight: 100,
              }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>{c.icon}</div>
                <div>
                  <div className="font-display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {DISHES.filter(d => d.category === c.id).length} dishes
                    {top && <> · best <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{top.avg_rating.toFixed(1)}</span></>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edited collections — magazine feel */}
      <SectionHead eyebrow="Editor's picks" title="Curated lists" />
      <div className="no-scrollbar" style={{
        display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 12px 6px',
      }}>
        {COLLECTIONS.map(col => (
          <div key={col.id} className="press tap" style={{
            flex: '0 0 78%',
            borderRadius: 16, overflow: 'hidden',
            background: col.bg || '#1A1A1A', color: 'white',
            position: 'relative', minHeight: 180,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: 16, cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 }}>
                Vol. {col.vol}
              </div>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '6px 0 0' }}>
                {col.title}
              </h3>
              <p style={{ fontSize: 12, opacity: 0.85, marginTop: 6, lineHeight: 1.4 }}>{col.subtitle}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: -8 }}>
                {col.dish_emojis.slice(0, 4).map((e, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: 999,
                    background: 'rgba(255,255,255,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, marginLeft: i === 0 ? 0 : -10,
                    border: '2px solid ' + (col.bg || '#1A1A1A'),
                  }}>{e}</div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>{col.dish_count} dishes →</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trending */}
      <SectionHead eyebrow="On the rise" title="Trending this week" rule={true} />
      <div style={{ padding: '0 16px 100px' }}>
        {DISHES.slice().sort((a, b) => (b.trend_delta || 0) - (a.trend_delta || 0)).slice(0, 4).map((d, i) => (
          <div key={d.dish_id} onClick={() => onOpenDish(d)} className="press tap" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: '1px dotted var(--color-divider)',
            cursor: 'pointer',
          }}>
            <div style={{ width: 22, textAlign: 'center', color: 'var(--color-success)' }}>
              <Icon name="trend" size={18} stroke={2.5} />
            </div>
            <DishThumb emoji={d.photo} size={48} rounded={10} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.restaurant_name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.dish_name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Rating value={d.avg_rating} size="md" />
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>+{d.trend_delta || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================================================
   RESTAURANT DETAIL
   ============================================================= */
function RestaurantDetail({ restaurant, onBack, onOpenDish }) {
  const { DISHES } = window.WGH_DATA;
  const dishes = DISHES.filter(d => d.restaurant_id === restaurant.id).sort((a, b) => b.avg_rating - a.avg_rating);
  const topRated = dishes.slice(0, 3);
  const skipList = dishes.filter(d => d.percent_worth_it < 70).slice(0, 3);

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Restaurant" title={restaurant.name} onBack={onBack} />

      {/* Hero */}
      <div style={{ padding: '8px 16px 12px' }}>
        <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>{restaurant.cuisine}</div>
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '4px 0 8px' }}>
          {restaurant.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <span>{restaurant.town}</span>
          <span style={{ color: 'var(--color-divider)' }}>·</span>
          <span>{restaurant.price_range}</span>
          <span style={{ color: 'var(--color-divider)' }}>·</span>
          <span style={{ color: restaurant.open_now ? 'var(--color-success)' : 'var(--color-text-tertiary)', fontWeight: 600 }}>
            {restaurant.open_now ? '● Open now' : '○ Closed'}
          </span>
        </div>

        <div style={{
          marginTop: 14, padding: 14, borderRadius: 12,
          background: 'var(--color-card)', boxShadow: 'var(--shadow-card)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14,
        }}>
          <Stat label="Best dish" value={topRated[0]?.avg_rating.toFixed(1)} sub={topRated[0]?.dish_name} />
          <Stat label="Avg rating" value={restaurant.avg_rating.toFixed(1)} sub={`${restaurant.total_votes} votes`} />
          <Stat label="Worth it" value={`${restaurant.percent_worth_it}%`} sub="overall" />
        </div>
      </div>

      {/* Order This / Skip This — hero of restaurant view */}
      <SectionHead eyebrow="The honest menu" title="Order this" rule />
      <div style={{ padding: '0 12px 4px' }}>
        {topRated.map((d, i) => (
          <div key={d.dish_id} onClick={() => onOpenDish(d)} className="press tap" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
            borderRadius: 12,
            background: i === 0 ? 'rgba(228,68,10,0.04)' : 'transparent',
            marginBottom: 4, cursor: 'pointer',
          }}>
            <div style={{ width: 22 }}><RankNum n={i + 1} size="sm" /></div>
            <DishThumb emoji={d.photo} size={48} rounded={10} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.dish_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Rating value={d.avg_rating} size="md" />
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>· {d.total_votes} votes</span>
                <WorthBadge pct={d.percent_worth_it} />
              </div>
            </div>
            <Icon name="chev" size={16} color="var(--color-text-tertiary)" />
          </div>
        ))}
      </div>

      {skipList.length > 0 && (
        <>
          <div style={{ padding: '20px 16px 8px' }}>
            <div className="section-eyebrow" style={{ color: 'var(--color-text-tertiary)' }}>Locals warn</div>
            <h3 className="font-display" style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Maybe skip these</h3>
          </div>
          <div style={{ padding: '0 12px' }}>
            {skipList.map(d => (
              <div key={d.dish_id} onClick={() => onOpenDish(d)} className="press tap" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 12, marginBottom: 4, cursor: 'pointer', opacity: 0.85,
              }}>
                <DishThumb emoji={d.photo} size={40} rounded={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="line-through-soft" style={{ fontSize: 14, fontWeight: 500 }}>{d.dish_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>only {d.percent_worth_it}% would order again</div>
                </div>
                <Rating value={d.avg_rating} size="sm" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Full menu */}
      <SectionHead eyebrow="Everything ranked" title={`Full menu · ${dishes.length}`} rule />
      <div style={{ padding: '0 16px 100px' }}>
        {dishes.map(d => (
          <div key={d.dish_id} onClick={() => onOpenDish(d)} className="press tap" style={{
            display: 'flex', alignItems: 'baseline', padding: '10px 0',
            borderBottom: '1px dotted var(--color-divider)', cursor: 'pointer',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.dish_name}</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>${d.price} · {d.total_votes} votes</div>
            </div>
            <div className="leader" />
            <Rating value={d.avg_rating} size="md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div className="section-eyebrow" style={{ fontSize: 9, marginBottom: 2 }}>{label}</div>
      <div className="stat-num" style={{ fontSize: 18, color: 'var(--color-text-primary)' }}>{value || '—'}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  );
}

window.Browse = Browse;
window.RestaurantDetail = RestaurantDetail;
