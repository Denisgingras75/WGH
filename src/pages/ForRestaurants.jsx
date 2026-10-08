import { useNavigate } from 'react-router-dom'

// Sticker-sheet inks for the step numerals and value-prop blocks
var STEP_INKS = {
  '1': { bg: 'var(--color-primary)', fg: 'var(--color-text-on-primary)' },
  '2': { bg: 'var(--color-accent)', fg: 'var(--color-text-on-primary)' },
  '3': { bg: 'var(--color-butter)', fg: 'var(--color-ink)' },
}
var PROP_BLOCKS = [
  { bg: 'var(--color-butter)', fg: 'var(--color-ink)', muted: 'var(--color-text-secondary)', tilt: '-1.5deg' },
  { bg: 'var(--color-primary)', fg: 'var(--color-text-on-primary)', muted: 'var(--color-text-on-primary-muted)', tilt: '1deg' },
  { bg: 'var(--color-accent)', fg: 'var(--color-text-on-primary)', muted: 'var(--color-text-on-primary-muted)', tilt: '1.5deg' },
  { bg: 'var(--color-card)', fg: 'var(--color-ink)', muted: 'var(--color-text-secondary)', tilt: '-1deg' },
]

/**
 * ForRestaurants — pitch page for door-knocking.
 * Shows on Denis's phone when talking to restaurant owners.
 * No auth, no data fetching, pure persuasion.
 */
export function ForRestaurants() {
  var navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero */}
      <div className="px-6 pt-12 pb-8 text-center">
        <div
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-6"
          style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            background: 'var(--color-butter)',
            color: 'var(--color-ink)',
            border: 'var(--border-ink)',
            boxShadow: 'var(--shadow-hard-sm)',
            transform: 'rotate(-2deg)',
          }}
        >
          FREE FOR RESTAURANTS
        </div>
        <h1
          style={{
            fontSize: '44px',
            lineHeight: 0.98,
            letterSpacing: '-0.035em',
            color: 'var(--color-text-primary)',
          }}
        >
          Your best dishes,{' '}
          <span style={{ color: 'var(--color-primary)' }}>ranked by locals</span>
        </h1>
        <p
          className="mt-5 mx-auto"
          style={{
            fontSize: '17px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            maxWidth: '330px',
            lineHeight: 1.5,
          }}
        >
          What's Good Here helps tourists find your restaurant through your
          highest-rated dishes — not ads, not reviews, real votes.
        </p>
      </div>

      {/* How it works */}
      <div className="px-6 pb-8">
        <h2
          className="text-center mb-5"
          style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}
        >
          How It Works
        </h2>
        <ol className="space-y-4 list-none p-0 m-0">
          {[
            {
              num: '1',
              title: 'Locals vote on your dishes',
              desc: 'Simple 1-10 rating: "Would you order this again?" No long reviews, no fake stars.',
            },
            {
              num: '2',
              title: 'Your best dishes climb the rankings',
              desc: 'Top-rated dishes appear on the leaderboard. Tourists see what\'s actually good.',
            },
            {
              num: '3',
              title: 'Tourists find you through your food',
              desc: 'They search "best lobster roll" and your dish shows up — ranked, rated, trusted.',
            },
          ].map(function (step) {
            return (
              <li
                key={step.num}
                className="flex items-start gap-4 p-4"
                style={{
                  background: 'var(--color-card)',
                  border: 'var(--border-ink)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-hard)',
                }}
              >
                <span
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: STEP_INKS[step.num].bg,
                    color: STEP_INKS[step.num].fg,
                    border: 'var(--border-ink)',
                    boxShadow: 'var(--shadow-hard-sm)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '20px',
                    lineHeight: 1,
                  }}
                  aria-hidden="true"
                >
                  {step.num}
                </span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em', fontSize: '19px', lineHeight: 1.15, color: 'var(--color-text-primary)' }}>
                    {step.title}
                  </p>
                  <p className="mt-1.5" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                    {step.desc}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Value props */}
      <div className="px-6 pb-8">
        <h2
          className="text-center mb-5"
          style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}
        >
          Why Restaurants Love It
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '0', label: 'Cost to you', desc: 'Free. Forever.' },
            { icon: '10s', label: 'Time to set up', desc: 'We add your menu' },
            { icon: '80%', label: 'Users are tourists', desc: 'New customers, not regulars' },
            { icon: '0', label: 'Fake reviews', desc: 'Vote-based, not review-based' },
          ].map(function (prop, i) {
            var block = PROP_BLOCKS[i % PROP_BLOCKS.length]
            return (
              <div
                key={prop.label}
                className="p-4 text-center"
                style={{
                  background: block.bg,
                  color: block.fg,
                  border: 'var(--border-ink)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-hard)',
                  transform: 'rotate(' + block.tilt + ')',
                }}
              >
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '44px', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {prop.icon}
                </p>
                <p className="mt-2" style={{ fontSize: '14px', fontWeight: 800 }}>
                  {prop.label}
                </p>
                <p style={{ fontSize: '12px', fontWeight: 500, color: block.muted, marginTop: '2px', lineHeight: 1.35 }}>
                  {prop.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* What you get */}
      <div className="px-6 pb-8">
        <div
          className="p-5"
          style={{
            background: 'var(--color-card)',
            border: 'var(--border-ink)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-hard-lg)',
          }}
        >
          <h3 className="mb-4" style={{ fontSize: '24px', lineHeight: 1.1, color: 'var(--color-text-primary)' }}>
            Your restaurant gets:
          </h3>
          <ul className="space-y-3">
            {[
              'A dedicated page with all your dishes ranked',
              'Real-time ratings from actual customers',
              'Free promotion when your dishes trend',
              'A manager dashboard to track performance',
              'Ability to post specials and events',
            ].map(function (item) {
              return (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      marginTop: '1px',
                      background: 'var(--color-butter)',
                      border: 'var(--border-ink-thin)',
                      color: 'var(--color-ink)',
                      fontSize: '13px',
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                    {item}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-12 text-center">
        <button
          onClick={function () { navigate('/restaurants') }}
          className="btn-ink w-full py-4"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            fontSize: '17px',
            fontWeight: 800,
            boxShadow: 'var(--shadow-hard-lg)',
          }}
        >
          See Restaurants on WGH
        </button>
        <p className="mt-5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Questions? Reach out — <a href="mailto:denisgingras75@gmail.com" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>denisgingras75@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
