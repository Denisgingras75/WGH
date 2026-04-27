/* global React, ReactDOM, IOSDevice, HomeList, HomeMap, Browse, DishDetail, RestaurantDetail, Profile, ReviewFlow, BottomNav, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle */
const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "photoProminence": "balanced",
  "pinStyle": "rating-num",
  "profileHonesty": "balanced"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Routing — simple stack within the iOS frame
  const [tab, setTab] = useStateA('list'); // list | map | browse | profile
  const [stack, setStack] = useStateA([]); // {kind: 'dish'|'restaurant', id}
  const [reviewing, setReviewing] = useStateA(null); // dish or null

  const { DISHES, RESTAURANTS } = window.WGH_DATA;

  const top = stack[stack.length - 1];
  const push = (entry) => setStack([...stack, entry]);
  const pop = () => setStack(stack.slice(0, -1));

  const openDish = (d) => push({ kind: 'dish', id: d.dish_id });
  const openRestaurant = (id) => push({ kind: 'restaurant', id });

  // When user changes tab, clear stack
  const switchTab = (id) => { setTab(id); setStack([]); };

  let screen;
  if (top?.kind === 'dish') {
    const dish = DISHES.find(d => d.dish_id === top.id);
    screen = <DishDetail dish={dish} onBack={pop}
      onOpenRestaurant={openRestaurant}
      onReview={() => setReviewing(dish)} />;
  } else if (top?.kind === 'restaurant') {
    const r = RESTAURANTS.find(x => x.id === top.id);
    screen = <RestaurantDetail restaurant={r} onBack={pop} onOpenDish={openDish} />;
  } else if (tab === 'list') {
    screen = <HomeList tweaks={tweaks} onOpenDish={openDish} onOpenRestaurant={openRestaurant}
      onSwitchMap={() => setTab('map')} onSwitchProfile={() => setTab('profile')} />;
  } else if (tab === 'map') {
    screen = <HomeMap tweaks={tweaks} onOpenDish={openDish} onOpenRestaurant={openRestaurant}
      onSwitchList={() => setTab('list')} onSwitchProfile={() => setTab('profile')} />;
  } else if (tab === 'browse') {
    screen = <Browse onOpenDish={openDish} onOpenRestaurant={openRestaurant}
      onOpenCategory={() => setTab('list')} />;
  } else if (tab === 'profile') {
    screen = <Profile tweaks={tweaks} onOpenDish={openDish} onOpenRestaurant={openRestaurant} onBack={() => setTab('list')} />;
  }

  return (
    <div className="wgh-root" style={{
      width: '100vw', height: '100vh',
      background: '#E8E1D6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, boxSizing: 'border-box',
      backgroundImage: `radial-gradient(circle at 20% 20%, rgba(228,68,10,0.08), transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(196,138,18,0.08), transparent 50%)`,
    }}>
      <IOSDevice width={393} height={812} dark={false}>
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
          {/* Padded for status bar */}
          <div style={{ paddingTop: 50, height: '100%', boxSizing: 'border-box', position: 'relative' }}>
            {screen}
            <BottomNav active={top ? null : tab} onChange={switchTab}
              onOpenReview={() => {
                // if we're on a dish, review that one; else pick top-rated unvisited
                const dish = top?.kind === 'dish' ? DISHES.find(d => d.dish_id === top.id)
                  : DISHES.find(d => !d.user_visited) || DISHES[0];
                setReviewing(dish);
              }} />
          </div>
          {reviewing && (
            <ReviewFlow dish={reviewing} onClose={() => setReviewing(null)}
              onSubmit={() => setReviewing(null)} />
          )}
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Density">
          <TweakRadio
            value={tweaks.density}
            onChange={(v) => setTweak('density', v)}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
        </TweakSection>

        <TweakSection title="Photo prominence">
          <TweakRadio
            value={tweaks.photoProminence}
            onChange={(v) => setTweak('photoProminence', v)}
            options={[
              { value: 'balanced', label: 'Balanced' },
              { value: 'photo-forward', label: 'Photo-forward' },
            ]}
          />
        </TweakSection>

        <TweakSection title="Map pin style" description="On the map screen">
          <TweakRadio
            value={tweaks.pinStyle}
            onChange={(v) => setTweak('pinStyle', v)}
            options={[
              { value: 'rating-num', label: 'Rating bubble' },
              { value: 'emoji-tile', label: 'Emoji tile' },
              { value: 'minimal-dot', label: 'Minimal dot' },
            ]}
          />
        </TweakSection>

        <TweakSection title="Profile tone" description="How honest your diary feels">
          <TweakRadio
            value={tweaks.profileHonesty}
            onChange={(v) => setTweak('profileHonesty', v)}
            options={[
              { value: 'celebratory', label: 'Celebratory' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'brutally-honest', label: 'Brutally honest' },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
