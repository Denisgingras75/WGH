import { PageHeader } from '../components/PageHeader'
import { TrustBadge } from '../components/TrustBadge'
import { TRUST_BADGE_LEGEND } from '../constants/jitter'
import { AMATIC_TITLE } from '../constants/styles'

const sectionTitleStyle = { ...AMATIC_TITLE, fontSize: '24px' }

export function HowReviewsWork() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PageHeader title="How Our Reviews Work" />

      <div className="px-4 py-5 space-y-8">
        {/* Section 1: AI-Estimated Ratings */}
        <section>
          <h2 className="mb-3" style={sectionTitleStyle}>
            Getting Started with Real Data
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            We analyzed real reviews from Google to give every restaurant initial ratings.
            AI reads what people said about specific dishes and translates their feedback into
            our 1-10 rating scale. These ratings are labeled clearly:
          </p>
          <div className="flex items-center gap-3 mb-3">
            <TrustBadge type="ai_estimated" size="md" />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              AI Estimated
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            As more locals and visitors rate dishes themselves, AI estimates are gradually
            replaced by real community ratings.
          </p>
        </section>

        {/* Section 2: Human Verification */}
        <section>
          <h2 className="mb-3" style={sectionTitleStyle}>
            Verified Human Reviews
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Every review typed on What&apos;s Good Here is verified through behavioral analysis.
            We measure <strong style={{ color: 'var(--color-text-primary)' }}>how</strong> you type, not <strong style={{ color: 'var(--color-text-primary)' }}>what</strong> you type &mdash; your unique
            typing rhythm builds a profile over time, like a batting average that stabilizes
            with more at-bats.
          </p>
          <div className="space-y-2 mb-3">
            {TRUST_BADGE_LEGEND.filter(function (badge) { return badge.type !== 'ai_estimated' }).map(function (badge) {
              return (
                <div key={badge.type} className="flex items-center gap-3">
                  <TrustBadge type={badge.type} size="md" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {badge.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {badge.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 3: Why This Matters */}
        <section>
          <h2 className="mb-3" style={sectionTitleStyle}>
            Why This Matters
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Fake reviews are everywhere. Bots can post a single fake review easily, but maintaining
            a consistent human typing profile across dozens of reviews is statistically impossible.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Restaurants can trust that their ratings come from real people.
            Consumers can trust they&apos;re getting honest recommendations.
          </p>
        </section>

        {/* Section 4: Privacy */}
        <section
          className="rounded-xl p-4"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-divider)' }}
        >
          <h2 className="mb-3" style={sectionTitleStyle}>
            Your Privacy
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            We never store what you type &mdash; only the timing between keystrokes.
            No raw keystrokes, no review content in our verification system.
            Just rhythm metadata. Your review content is only used for the review itself.
          </p>
        </section>
      </div>
    </div>
  )
}
