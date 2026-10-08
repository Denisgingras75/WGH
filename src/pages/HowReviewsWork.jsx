import { useNavigate } from 'react-router-dom'
import { TrustBadge } from '../components/TrustBadge'

export function HowReviewsWork() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--color-bg)' }}>
      <header className="px-5 pt-6 pb-5 mb-6" style={{ borderBottom: 'var(--border-default)' }}>
        <button
          onClick={() => navigate(-1)}
          className="text-sm mb-5 px-3 py-1"
          style={{
            color: 'var(--color-ink)',
            fontWeight: 700,
            background: 'var(--color-card)',
            border: 'var(--border-subtle)',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          &#8592; Back
        </button>
        <h1
          style={{ color: 'var(--color-text-primary)', fontSize: '32px', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          How Our Reviews Work
        </h1>
      </header>

      <div className="px-5 space-y-8">
        {/* Section 1: AI-Estimated Ratings */}
        <section>
          <h2
            className="mb-3"
            style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}
          >
            Getting Started with Real Data
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500, lineHeight: 1.65 }}>
            We analyzed real reviews from Google to give every restaurant initial ratings.
            AI reads what people said about specific dishes and translates their feedback into
            our 1-10 rating scale. These ratings are labeled clearly:
          </p>
          <div className="mb-3">
            <TrustBadge type="ai_estimated" size="md" />
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500, lineHeight: 1.65 }}>
            As more locals and visitors rate dishes themselves, AI estimates are gradually
            replaced by real community ratings.
          </p>
        </section>

        {/* Section 2: Human Verification */}
        <section>
          <h2
            className="mb-3"
            style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}
          >
            Verified Human Reviews
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500, lineHeight: 1.65 }}>
            Every review typed on What&apos;s Good Here is verified through behavioral analysis.
            We measure <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>how</strong> you type, not <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>what</strong> you type &mdash; your unique
            typing rhythm builds a profile over time, like a batting average that stabilizes
            with more at-bats.
          </p>
          <div
            className="p-4 space-y-3 mb-3"
            style={{
              background: 'var(--color-card)',
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex items-center gap-3">
              <TrustBadge type="building" size="md" />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                New reviewers (1-4 reviews)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <TrustBadge type="human_verified" size="md" />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                Consistent typing pattern (5+ reviews)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <TrustBadge type="trusted_reviewer" size="md" />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                Highly consistent (15+ reviews)
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Why This Matters */}
        <section>
          <h2
            className="mb-3"
            style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}
          >
            Why This Matters
          </h2>
          <p className="mb-3" style={{ color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500, lineHeight: 1.65 }}>
            Fake reviews are everywhere. Bots can post a single fake review easily, but maintaining
            a consistent human typing profile across dozens of reviews is statistically impossible.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', fontWeight: 500, lineHeight: 1.65 }}>
            Restaurants can trust that their ratings come from real people.
            Consumers can trust they&apos;re getting honest recommendations.
          </p>
        </section>

        {/* Section 4: Privacy */}
        <section
          className="p-5"
          style={{
            background: 'var(--color-highlight)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h2
            className="mb-2"
            style={{ color: 'var(--color-ink)', fontSize: '22px', lineHeight: 1.15 }}
          >
            Your Privacy
          </h2>
          <p style={{ color: 'var(--color-ink)', fontSize: '15px', fontWeight: 600, lineHeight: 1.6 }}>
            We never store what you type &mdash; only the timing between keystrokes.
            No raw keystrokes, no review content in our verification system.
            Just rhythm metadata. Your review content is only used for the review itself.
          </p>
        </section>
      </div>
    </div>
  )
}
