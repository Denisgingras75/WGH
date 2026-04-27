/* global React, Rating, VoteStamp, DishThumb, SectionHead, Icon, ScreenHeader, DeltaTag, RankNum, TownPill */
const { useState: useStateP } = React;

/* =============================================================
   PROFILE — your honest food diary
   Goodreads-style "shelf" + Untappd-style stats + Beli ranking energy
   ============================================================= */
function Profile({ tweaks, onOpenDish, onOpenRestaurant, onBack }) {
  const { ME, REVIEWS, DISHES } = window.WGH_DATA;
  const [tab, setTab] = useStateP('diary'); // diary | shelf | stats
  const honesty = tweaks.profileHonesty || 'balanced'; // celebratory | balanced | brutally-honest

  const myReviews = REVIEWS.filter(r => r.user_id === 'me')
    .map(r => ({ ...r, dish: DISHES.find(d => d.dish_id === r.dish_id) }))
    .filter(r => r.dish);

  const wouldAgain = myReviews.filter(r => r.would_again);
  const skipped = myReviews.filter(r => !r.would_again);
  const ratio = myReviews.length ? Math.round((wouldAgain.length / myReviews.length) * 100) : 0;

  const avgRating = myReviews.length ? (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length) : 0;
  const harshness = myReviews.length ?
    (myReviews.reduce((s, r) => s + (r.rating - r.dish.avg_rating), 0) / myReviews.length) : 0;

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Your food diary" title="Profile" onBack={onBack}
        rightSlot={
          <button className="tap" style={{ width: 36, height: 36, borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="settings" size={20} stroke={2} />
          </button>
        }
      />

      {/* Identity card — newspaper masthead style */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: 'var(--color-primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, flexShrink: 0,
            boxShadow: 'var(--shadow-card)',
          }}>{ME.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              {ME.name}
            </h1>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {ME.bio}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{ME.followers}</strong> followers
              </span>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{ME.following}</strong> following
              </span>
            </div>
          </div>
        </div>

        {/* Honesty banner — the soul of the redesign */}
        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 12,
          border: '1.5px solid var(--color-rule)',
          background: honesty === 'celebratory' ? 'rgba(228,68,10,0.04)' :
                      honesty === 'brutally-honest' ? 'rgba(118,118,118,0.06)' : 'transparent',
        }}>
          <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>Honesty index</div>
          {honesty === 'celebratory' && (
            <div className="font-display" style={{ fontSize: 16, fontWeight: 600, marginTop: 4, letterSpacing: '-0.01em' }}>
              You'd order <span style={{ color: 'var(--color-success)' }}>{wouldAgain.length} dishes</span> again. That's a {ratio}% hit rate. 🍴
            </div>
          )}
          {honesty === 'balanced' && (
            <div className="font-display" style={{ fontSize: 16, fontWeight: 600, marginTop: 4, letterSpacing: '-0.01em' }}>
              {ratio}% worth it · avg <span style={{ color: 'var(--color-primary)' }}>{avgRating.toFixed(1)}</span> · you rate {harshness > 0 ? '+' : ''}{harshness.toFixed(1)} vs. crowd
            </div>
          )}
          {honesty === 'brutally-honest' && (
            <div className="font-display" style={{ fontSize: 15, fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>
              You said "skip" to <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{skipped.length} of {myReviews.length}</span>.
              Average score: <span style={{ color: 'var(--color-primary)' }}>{avgRating.toFixed(1)}</span>. You rate harsher than {Math.abs(harshness).toFixed(1)}/10 below the crowd.
            </div>
          )}
        </div>
      </div>

      {/* Stats strip — Untappd flavor */}
      <div style={{
        margin: '0 12px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: 'var(--color-card)', borderRadius: 12,
        padding: '12px 4px', boxShadow: 'var(--shadow-card)',
      }}>
        <BigStat n={myReviews.length} label="reviews" />
        <BigStat n={wouldAgain.length} label="worth it" tone="success" />
        <BigStat n={skipped.length} label="skipped" tone="muted" />
        <BigStat n={new Set(myReviews.map(r => r.dish.restaurant_id)).size} label="spots" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--color-rule)', margin: '20px 16px 0' }}>
        {[
          { id: 'diary', label: 'Diary' },
          { id: 'shelf', label: 'Top dishes' },
          { id: 'stats', label: 'Stats' },
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

      {tab === 'diary' && (
        <div style={{ padding: '12px 16px 100px' }}>
          {/* Group by month */}
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>April 2025</div>
          {myReviews.map(r => (
            <DiaryEntry key={r.id} review={r} onOpenDish={() => onOpenDish(r.dish)} onOpenRest={() => onOpenRestaurant(r.dish.restaurant_id)} brutallyHonest={honesty === 'brutally-honest'} />
          ))}
        </div>
      )}

      {tab === 'shelf' && (
        <div style={{ padding: '12px 16px 100px' }}>
          <div className="section-eyebrow" style={{ marginBottom: 8 }}>Your top of all time</div>
          {wouldAgain.slice().sort((a, b) => b.rating - a.rating).slice(0, 6).map((r, i) => (
            <div key={r.id} onClick={() => onOpenDish(r.dish)} className="press tap" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0', borderBottom: '1px dotted var(--color-divider)', cursor: 'pointer',
            }}>
              <div style={{ width: 28 }}><RankNum n={i + 1} size="sm" /></div>
              <DishThumb emoji={r.dish.photo} size={56} rounded={12} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.dish.dish_name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>{r.dish.restaurant_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Rating value={r.rating} size="lg" />
                <DeltaTag mine={r.rating} consensus={r.dish.avg_rating} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div style={{ padding: '12px 16px 100px' }}>
          <StatsBlock myReviews={myReviews} />
        </div>
      )}
    </div>
  );
}

function BigStat({ n, label, tone = 'primary' }) {
  const colors = {
    primary: 'var(--color-text-primary)',
    success: 'var(--color-success)',
    muted: 'var(--color-text-tertiary)',
  };
  return (
    <div style={{ textAlign: 'center', padding: '0 4px', borderRight: '1px solid var(--color-divider)' }}>
      <div className="stat-num" style={{ fontSize: 24, color: colors[tone], lineHeight: 1.1 }}>{n}</div>
      <div className="font-mono" style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DiaryEntry({ review, onOpenDish, onOpenRest, brutallyHonest }) {
  const r = review;
  return (
    <div className="press tap" onClick={onOpenDish} style={{
      display: 'flex', gap: 12, padding: '12px 0',
      borderBottom: '1px dotted var(--color-divider)', cursor: 'pointer',
    }}>
      <div style={{ flexShrink: 0, textAlign: 'center', width: 36 }}>
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.month_short}</div>
        <div className="font-display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>{r.day}</div>
      </div>
      <DishThumb emoji={r.dish.photo} size={56} rounded={12} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div onClick={(e) => { e.stopPropagation(); onOpenRest(); }} style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.dish.restaurant_name}
          </div>
          <Rating value={r.rating} size="md" />
        </div>
        <div style={{
          fontSize: 12, color: 'var(--color-text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500,
          textDecoration: brutallyHonest && !r.would_again ? 'line-through' : 'none',
          textDecorationColor: 'var(--color-text-tertiary)',
          textDecorationThickness: '1.5px',
        }}>
          {r.dish.dish_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <VoteStamp wouldAgain={r.would_again} />
          <DeltaTag mine={r.rating} consensus={r.dish.avg_rating} />
        </div>
        {r.note && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, fontStyle: 'italic', lineHeight: 1.45 }}>
            "{r.note}"
          </div>
        )}
      </div>
    </div>
  );
}

function StatsBlock({ myReviews }) {
  const byCategory = {};
  myReviews.forEach(r => {
    const c = r.dish.category_label || 'Other';
    byCategory[c] = (byCategory[c] || 0) + 1;
  });
  const cats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...cats.map(c => c[1]));

  const byTown = {};
  myReviews.forEach(r => {
    byTown[r.dish.restaurant_town] = (byTown[r.dish.restaurant_town] || 0) + 1;
  });
  const towns = Object.entries(byTown).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="section-eyebrow" style={{ marginBottom: 8 }}>What you eat</div>
      <div style={{ marginBottom: 24 }}>
        {cats.map(([cat, n]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{cat}</span>
                <span className="font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{n}</span>
              </div>
              <div style={{ height: 6, background: 'var(--color-divider)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(n / max) * 100}%`, background: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-eyebrow" style={{ marginBottom: 8 }}>Where you eat</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {towns.map(([town, n]) => (
          <div key={town} style={{
            padding: 12, borderRadius: 10,
            background: 'var(--color-card)', boxShadow: 'var(--shadow-card)',
            textAlign: 'center',
          }}>
            <div className="stat-num" style={{ fontSize: 22, color: 'var(--color-primary)' }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{town}</div>
          </div>
        ))}
      </div>
    </>
  );
}

window.Profile = Profile;
