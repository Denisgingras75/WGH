import { useNavigate } from 'react-router-dom'
import { WghSeal } from '../components/WghSeal'

export function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="px-4 py-4" style={{ background: 'var(--color-bg)', borderBottom: 'var(--border-default)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm pl-2 pr-3 py-1 flex-shrink-0"
            style={{
              color: 'var(--color-ink)',
              fontWeight: 700,
              background: 'var(--color-card)',
              border: 'var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 style={{ color: 'var(--color-text-primary)', fontSize: '24px', lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-6">
          <WghSeal size={96} />
        </div>
        <div className="space-y-8" style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <p className="eyebrow">Last updated: April 18, 2026</p>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Overview
            </h2>
            <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              What's Good Here is operated by Daniel Walsh (Martha's Vineyard, Massachusetts).
              Contact:{' '}
              <a
                href="mailto:hello@whatsgoodhere.app"
                style={{ color: 'var(--color-accent)', fontWeight: 700 }}
              >
                hello@whatsgoodhere.app
              </a>
              . A mailing address is available on request for formal data access requests.
            </p>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              What's Good Here ("we", "our", or "the app") is a community-driven food discovery
              platform for Martha's Vineyard. This Privacy Policy explains what we collect, what
              we do with it, and what choices you have.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Information We Collect
            </h2>
            <div className="space-y-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Account Information</h3>
                <p>
                  When you create an account, we collect your email address and display name.
                  If you sign in with Google or Apple, we receive your name (if you choose to
                  share it) and email from the provider. Apple users can select "Hide My Email,"
                  in which case we receive a private-relay address (ending in{' '}
                  <code>@privaterelay.appleid.com</code>) that forwards to your real inbox.
                  If you use the same verified email across providers, we automatically link
                  your accounts so you don't end up with duplicates.
                </p>
              </div>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Dish Ratings and Reviews</h3>
                <p>
                  We store the ratings and written reviews you submit, the dishes you save as
                  favorites, and playlists you create. Ratings are aggregated into public rankings;
                  your individual rating is not shown on the dish page alongside your name unless
                  you explicitly post a review.
                </p>
              </div>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Dish Photos</h3>
                <p>
                  When you upload a photo of a dish, we store the image, the dish it's attached
                  to, and a timestamp. We don't use your photos for anything other than displaying
                  them on the dish page and in your profile. You can delete a photo you uploaded
                  at any time.
                </p>
              </div>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Location Data</h3>
                <p>
                  With your permission, we access your device's location to show nearby
                  restaurants and dishes and to anchor the map on where you are. We do not
                  store your location history on our servers — the coordinates are only used
                  in the moment to answer a query.
                </p>
              </div>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Typing Cadence (Jitter)</h3>
                <p>
                  To protect reviews from bots and coordinated manipulation, we measure how you
                  type while writing a review. This includes per-key dwell time, timing between
                  keys, typo/edit rate, pause frequency, common key pairings (bigrams), cursor
                  and touch movement in the input area, and whether you pasted text or used
                  non-keyboard input. The aggregated profile is
                  stored associated with your account and we may send it to a trust-scoring
                  service so your reviews can be attested as human-written. We do not use it
                  to identify you outside the service, we do not sell it, and we do not share
                  it with advertisers. Learn more at{' '}
                  <a
                    href="/jitter"
                    style={{ color: 'var(--color-accent)', fontWeight: 700 }}
                  >
                    whatsgoodhere.app/jitter
                  </a>
                  .
                </p>
              </div>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Reports and Blocks</h3>
                <p>
                  The app lets you report content and block other users. If you do, we store
                  your report (the content you flagged, the reason, and a timestamp) and your
                  block list, so we can filter out content from users you've chosen not to see.
                  Reports are not shared back to the person who was reported.
                </p>
              </div>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Usage Analytics</h3>
                <p>
                  We use PostHog to understand how people use the app. This includes pages you
                  visit, features you interact with, and session recordings. Form inputs
                  (passwords, email fields, text fields) are masked in recordings by default;
                  rendered content on a page is captured to help us see what users actually
                  experienced. We use this to prioritize what to improve.
                </p>
              </div>
              <div>
                <h3 className="mb-1" style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Error Tracking</h3>
                <p>
                  We use Sentry to catch errors and crashes. Error reports include technical
                  context like the device model, operating system version, browser version,
                  and a stack trace. When an error happens, Sentry may also capture a replay
                  of the few seconds leading up to it (with form inputs masked) so we can see
                  what triggered the bug. We use this only to fix problems.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li>To provide and improve the app's features</li>
              <li>To display community ratings and rankings</li>
              <li>To show you relevant dishes and restaurants near you</li>
              <li>To track your voting history and saved dishes</li>
              <li>To protect reviews from bots and coordinated manipulation</li>
              <li>To respond to reports and enforce our community guidelines</li>
              <li>To fix bugs and improve app performance</li>
            </ul>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Third-Party Services
            </h2>
            <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              We do not sell your personal information. We share data only with services that
              help us run the app:
            </p>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li><strong>Supabase</strong> — our database, authentication, and file storage</li>
              <li><strong>Vercel</strong> — our hosting provider</li>
              <li><strong>Google</strong> — Sign in with Google, and the Google Places API for restaurant discovery (we send location queries to Google to find nearby places)</li>
              <li><strong>Apple</strong> — Sign in with Apple on iOS and web (subject to Apple's privacy policy)</li>
              <li><strong>PostHog</strong> — product analytics</li>
              <li><strong>Sentry</strong> — error tracking</li>
            </ul>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Your Votes Are Public
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              When you rate a dish, your rating contributes to the public ranking. Written reviews
              you post are public and attributed to your display name. Your overall statistics
              (total dishes rated, favorites count, trust badges) are visible on your profile.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Device Permissions
            </h2>
            <p className="leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              The app asks your permission before accessing:
            </p>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
              <li><strong>Location</strong> — to show nearby restaurants and dishes</li>
              <li><strong>Camera</strong> — to take a photo of a dish to upload</li>
              <li><strong>Photos library</strong> — to pick an existing photo to upload</li>
            </ul>
            <p className="leading-relaxed mt-3" style={{ color: 'var(--color-text-secondary)' }}>
              You can change these permissions anytime in your device settings. On iPhone,
              this is <strong>Settings → What's Good Here</strong>.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Deleting Your Account
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              You can delete your account from the in-app settings menu (tap the gear icon,
              then <strong>Delete Account</strong>). Deletion is permanent and removes your
              votes, reviews, photos, favorites, playlists, and profile. Dish rankings that
              included your votes will be recalculated without them. Deletion happens in-app —
              you do not need to email us to close your account.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Your Rights
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              You can access, update, or delete your profile information at any time through
              the app. If you are a California resident, you have additional rights under the
              CCPA, including the right to request a copy of the personal information we hold
              about you and the right to request deletion. We also comply with other applicable
              state privacy laws, including those of your state of residence — email us to make
              a formal request under any of them.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Children
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              What's Good Here is not intended for children under 13. We do not knowingly collect
              information from children under 13. If you believe a child has provided us with
              personal information, please contact us and we will delete it.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Data Retention
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              We keep your account information, votes, reviews, photos, and playlists for as
              long as your account is active. When you delete your account, we remove this
              data from our systems. Aggregated, de-identified statistics (like the number
              of votes a dish has received) may remain in rankings. Error reports, session
              replays, and analytics events are retained for a limited period (typically no
              longer than twelve months) in line with our providers' default retention
              settings, and are deleted or aggregated after that.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Where Your Data Lives
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Our database, file storage, and hosting are located in the United States. If you
              use the app from outside the U.S., your information is transferred to and
              processed in the U.S., which may have different data-protection rules than
              your home country.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Copyright (DMCA)
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              If you believe a dish photo or review on the app infringes your copyright, send
              a written notice to{' '}
              <a
                href="mailto:hello@whatsgoodhere.app"
                style={{ color: 'var(--color-accent)', fontWeight: 700 }}
              >
                hello@whatsgoodhere.app
              </a>
              {' '}that includes: (1) an identification of the copyrighted work you claim has
              been infringed; (2) the URL or description of the infringing content; (3) your
              contact information (name, address, phone, email); (4) a statement that you have
              a good-faith belief that the use is not authorized by the copyright owner, its
              agent, or the law; (5) a statement, under penalty of perjury, that the
              information in your notice is accurate and that you are the copyright owner or
              authorized to act on the owner's behalf; and (6) your physical or electronic
              signature. We review and act on valid takedown requests promptly.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Changes to This Policy
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              We may update this Privacy Policy from time to time. We'll update the "Last updated"
              date at the top and notify you in the app for material changes.
            </p>
          </section>

          <section className="pt-6" style={{ borderTop: 'var(--border-default)' }}>
            <h2 className="mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '22px', lineHeight: 1.15 }}>
              Contact Us
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              If you have questions about this Privacy Policy, please contact us at:{' '}
              <a
                href="mailto:hello@whatsgoodhere.app"
                style={{ color: 'var(--color-accent)', fontWeight: 700 }}
              >
                hello@whatsgoodhere.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
