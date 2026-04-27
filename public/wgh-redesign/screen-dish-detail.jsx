/* global React, Rating, VoteStamp, WorthBadge, DishThumb, SectionHead, Icon, ScreenHeader, TownPill, DeltaTag */
const { useState: useStateDD } = React;

/* =============================================================
   DISH DETAIL — the "menu item" page, the heart of WGH
   ============================================================= */
function DishDetail({ dish, onBack, onOpenRestaurant, onReview }) {
  const { REVIEWS } = window.WGH_DATA;
  const reviews = REVIEWS.filter(r => r.dish_id === dish.dish_id);
  const [tab, setTab] = useStateDD('reviews'); // reviews | similar

  const myReview = reviews.find(r => r.user_id === 'me');

  return (
    <div className="screen">
      <ScreenHeader
        eyebrow="Dish"
        title={dish.dish_name}
        onBack={onBack}
        rightSlot={
          <button className="tap" style={{ width: 36, height: 36, borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bookmark" size={20} stroke={2} />
          </button>
        }
      />

      {/* Hero */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <DishThumb emoji={dish.photo} size={110} rounded={18} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>{dish.category_label}</div>
            <h1 className="font-display" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '4px 0 6px' }}>
              {dish.dish_name}
            </h1>
            <button onClick={() => onOpenRestaurant(dish.restaurant_id)} className="tap" style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)',
              textDecoration: 'underline', textDecorationColor: 'var(--color-primary)',
              textDecorationThickness: '2px', textUnderlineOffset: '3px',
              padding: 0,
            }}>
              {dish.restaurant_name}
            </button>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              {dish.restaurant_town} · {dish.distance_mi} mi away
            </div>
          </div>
        </div>

        {/* Big stat block */}
        <div style={{
          marginTop: 16,
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center',
          padding: '14px 16px',
          background: 'var(--color-card)', borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Rating value={dish.avg_rating} size="xl" />
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>/10</span>
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginTop: -2 }}>
              {dish.total_votes} votes
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--color-divider)', paddingLeft: 16 }}>
            <div className="stat-num" style={{ fontSize: 22, color: 'var(--color-success)' }}>
              {dish.percent_worth_it}<span style={{ fontSize: 14 }}>%</span>
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', letterSpacing: '0.05em' }}>
              would order again
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-num" style={{ fontSize: 18 }}>${dish.price}</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>menu price</div>
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          <button onClick={onReview} className="tap press" style={{
            padding: '12px 16px', borderRadius: 12,
            background: 'var(--color-primary)', color: 'white', border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name="star" size={16} stroke={2.5} />
            {myReview ? 'Edit your review' : 'I tried this'}
          </button>
          <button className="tap press" style={{
            padding: '12px 16px', borderRadius: 12,
            background: 'var(--color-card)', color: 'var(--color-text-primary)',
            border: '1.5px solid var(--color-divider)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name="direction" size={16} stroke={2} />
            Directions
          </button>
        </div>

        {/* My review (if exists) */}
        {myReview && (
          <div style={{
            marginTop: 12, padding: 14, borderRadius: 12,
            background: 'var(--color-primary-muted)',
            border: '1px solid var(--color-primary-glow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>Your take</div>
              <DeltaTag mine={myReview.rating} consensus={dish.avg_rating} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <Rating value={myReview.rating} size="lg" />
              <VoteStamp wouldAgain={myReview.would_again} size="lg" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              "{myReview.note}"
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--color-rule)', margin: '20px 16px 0' }}>
        {[
          { id: 'reviews', label: `What people say · ${reviews.length}` },
          { id: 'similar', label: 'Try also' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="tap" style={{
            flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: tab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -1.5,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'reviews' && (
        <div style={{ padding: '12px 16px 100px' }}>
          {/* Histogram */}
          <RatingHistogram reviews={reviews} />
          {/* Review list */}
          <div style={{ marginTop: 16 }}>
            {reviews.filter(r => r.user_id !== 'me').map(r => <ReviewRow key={r.id} review={r} />)}
          </div>
        </div>
      )}

      {tab === 'similar' && (
        <div style={{ padding: '12px 16px 100px' }}>
          <SimilarDishes dish={dish} />
        </div>
      )}
    </div>
  );
}

function RatingHistogram({ reviews }) {
  const buckets = [0, 0, 0, 0, 0]; // 6, 7, 8, 9, 10
  reviews.forEach(r => {
    const idx = Math.min(4, Math.max(0, Math.floor(r.rating) - 6));
    buckets[idx]++;
  });
  const max = Math.max(1, ...buckets);
  const labels = ['6', '7', '8', '9', '10'];
  return (
    <div style={{
      padding: 14, borderRadius: 12,
      background: 'var(--color-card)', boxShadow: 'var(--shadow-card)',
    }}>
      <div className="section-eyebrow" style={{ marginBottom: 8 }}>Rating distribution</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
            <div style={{
              width: '100%',
              flex: 1,
              display: 'flex', alignItems: 'flex-end',
            }}>
              <div style={{
                width: '100%',
                height: `${(b / max) * 100}%`,
                background: i >= 3 ? 'var(--color-primary)' : 'var(--color-divider)',
                borderRadius: '3px 3px 0 0',
                minHeight: b > 0 ? 4 : 0,
              }} />
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ review }) {
  return (
    <div style={{
      padding: '14px 0', borderBottom: '1px dotted var(--color-divider)',
      display: 'flex', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 999, flexShrink: 0,
        background: review.avatar_color || 'var(--color-primary)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>{review.author_initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.author_name}</span>
            {review.local && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>· local</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Rating value={review.rating} size="md" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <VoteStamp wouldAgain={review.would_again} />
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{review.date}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {review.note}
        </div>
      </div>
    </div>
  );
}

function SimilarDishes({ dish }) {
  const { DISHES } = window.WGH_DATA;
  const similar = DISHES.filter(d => d.category === dish.category && d.dish_id !== dish.dish_id).slice(0, 5);
  return (
    <div>
      {similar.map(d => (
        <div key={d.dish_id} className="press tap" style={{
          display: 'flex', gap: 12, alignItems: 'center',
          padding: '12px 0', borderBottom: '1px dotted var(--color-divider)',
          cursor: 'pointer',
        }}>
          <DishThumb emoji={d.photo} size={48} rounded={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.restaurant_name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.dish_name}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{d.restaurant_town}</div>
          </div>
          <Rating value={d.avg_rating} size="md" />
        </div>
      ))}
    </div>
  );
}

window.DishDetail = DishDetail;
