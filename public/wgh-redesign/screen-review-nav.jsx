/* global React, Rating, VoteStamp, DishThumb, Icon */
const { useState: useStateRF } = React;

/* =============================================================
   REVIEW FLOW — modal sheet, "I tried this"
   ============================================================= */
function ReviewFlow({ dish, onClose, onSubmit }) {
  const [rating, setRating] = useStateRF(8.5);
  const [wouldAgain, setWouldAgain] = useStateRF(true);
  const [note, setNote] = useStateRF('');

  if (!dish) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(15,14,13,0.5)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeUp 0.25s ease-out',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        background: 'var(--color-paper)',
        borderRadius: '20px 20px 0 0',
        padding: '14px 16px 24px',
        maxHeight: '88%', overflowY: 'auto',
        animation: 'fadeUp 0.3s ease-out',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: 'var(--color-divider)',
          margin: '0 auto 14px',
        }} />

        <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>Log a dish</div>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 14px' }}>
          How was it, honestly?
        </h2>

        {/* Dish summary */}
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          padding: 12, borderRadius: 12,
          background: 'var(--color-card)', boxShadow: 'var(--shadow-card)',
          marginBottom: 18,
        }}>
          <DishThumb emoji={dish.photo} size={48} rounded={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{dish.dish_name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{dish.restaurant_name}</div>
          </div>
        </div>

        {/* The MAIN question — Worth it? */}
        <div className="section-eyebrow" style={{ marginBottom: 8 }}>Would you order it again?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
          <button onClick={() => setWouldAgain(true)} className="tap press" style={{
            padding: '16px 12px', borderRadius: 12,
            background: wouldAgain ? 'var(--color-success)' : 'var(--color-card)',
            color: wouldAgain ? 'white' : 'var(--color-text-primary)',
            border: wouldAgain ? '2px solid var(--color-success)' : '1.5px solid var(--color-divider)',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <Icon name="check" size={22} stroke={2.5} />
            <span className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>Worth it</span>
          </button>
          <button onClick={() => setWouldAgain(false)} className="tap press" style={{
            padding: '16px 12px', borderRadius: 12,
            background: !wouldAgain ? 'var(--color-text-primary)' : 'var(--color-card)',
            color: !wouldAgain ? 'white' : 'var(--color-text-primary)',
            border: !wouldAgain ? '2px solid var(--color-text-primary)' : '1.5px solid var(--color-divider)',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <Icon name="x" size={22} stroke={2.5} />
            <span className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>Skip</span>
          </button>
        </div>

        {/* Rating slider */}
        <div className="section-eyebrow" style={{ marginBottom: 8 }}>Score it · {rating.toFixed(1)} / 10</div>
        <div style={{ marginBottom: 22 }}>
          <input
            type="range"
            min="1" max="10" step="0.1"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
            <span>1 nope</span>
            <span>5 fine</span>
            <span>8 great</span>
            <span>10 best ever</span>
          </div>
        </div>

        {/* Note */}
        <div className="section-eyebrow" style={{ marginBottom: 8 }}>One sentence — what stood out?</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Crust was perfect, sauce was thin..."
          style={{
            width: '100%', minHeight: 70,
            padding: 12, borderRadius: 10,
            background: 'white',
            border: '1.5px solid var(--color-divider)',
            fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text-primary)',
            outline: 'none', resize: 'none',
            marginBottom: 18, boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <button onClick={onClose} className="tap press" style={{
            padding: '14px', borderRadius: 12,
            background: 'transparent', color: 'var(--color-text-secondary)',
            border: '1.5px solid var(--color-divider)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={() => onSubmit({ rating, wouldAgain, note })} className="tap press" style={{
            padding: '14px', borderRadius: 12,
            background: 'var(--color-primary)', color: 'white',
            border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>Save to my diary</button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   BOTTOM NAV
   ============================================================= */
function BottomNav({ active, onChange, onOpenReview }) {
  const items = [
    { id: 'list', icon: 'home', label: 'Home' },
    { id: 'browse', icon: 'list', label: 'Browse' },
    { id: 'add', icon: 'plus', label: '', isPrimary: true },
    { id: 'map', icon: 'map', label: 'Map' },
    { id: 'profile', icon: 'user', label: 'You' },
  ];
  return (
    <nav style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(247, 244, 241, 0.96)',
      backdropFilter: 'blur(16px) saturate(160%)',
      borderTop: '1px solid var(--color-divider)',
      padding: '8px 8px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {items.map(it => {
        if (it.isPrimary) {
          return (
            <button key={it.id} onClick={onOpenReview} className="tap press" style={{
              width: 48, height: 48, borderRadius: 999,
              background: 'var(--color-primary)', color: 'white',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(228,68,10,0.4)',
              marginTop: -10,
            }}>
              <Icon name="plus" size={24} stroke={3} />
            </button>
          );
        }
        const isActive = active === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} className="tap" style={{
            position: 'relative',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '4px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
            minWidth: 56,
          }}>
            <Icon name={it.icon} size={22} stroke={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>{it.label}</span>
            {isActive && <span className="nav-active-dot" />}
          </button>
        );
      })}
    </nav>
  );
}

window.ReviewFlow = ReviewFlow;
window.BottomNav = BottomNav;
