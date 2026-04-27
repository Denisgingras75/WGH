import { Link } from 'react-router-dom'
import {
  Rating,
  RankNum,
  WorthBadge,
  DeltaTag,
  DishThumb,
  SectionHead,
  VoteStamp,
} from '../components/editorial-atoms'

/**
 * Hidden preview at /redesign-atoms — gallery of every editorial atom
 * ported from the claude.ai/design handoff. Not in nav, not user-facing.
 * Open the URL directly to demo the atoms in the live build.
 */
export function RedesignAtoms() {
  const sampleDish = { name: "Connie's Lobster Roll", restaurant: 'The Net Result', town: 'Vineyard Haven' }

  return (
    <div style={{
      background: 'var(--color-paper)',
      minHeight: '100vh',
      paddingBottom: 80,
      fontFamily: 'Geist, system-ui, sans-serif',
    }}>
      <header style={{ padding: '20px 16px 8px', borderBottom: '1px solid var(--color-divider)' }}>
        <div className="section-eyebrow">Editorial Atoms · Preview</div>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 0 0' }}>
          Redesign atoms gallery
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
          Live React port of the claude.ai/design handoff atoms. Tokens, classes, and
          components shown in the actual app build environment. Not hooked into any user
          surface — this page is hidden from navigation.
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
          See also: <Link to="/wgh-redesign" style={{ color: 'var(--color-primary)' }}>/wgh-redesign</Link> (full prototype) ·
          <Link to="/" style={{ marginLeft: 8, color: 'var(--color-primary)' }}>← back to live app</Link>
        </p>
      </header>

      <SectionHead eyebrow="Type" title="Display, mono, script" />
      <div style={{ padding: '0 16px', display: 'grid', gap: 10 }}>
        <div className="font-display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Fraunces 32 · Display
        </div>
        <div className="font-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Fraunces 22 · Section title
        </div>
        <div style={{ fontSize: 15 }}>Geist 15 · Body sans</div>
        <div className="font-mono-ed" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
          JETBRAINS MONO 11 · 0.05EM TRACKING
        </div>
        <div className="font-script" style={{ fontSize: 28, fontWeight: 700 }}>
          What&apos;s Good Here<span style={{ color: 'var(--color-primary)' }}>.</span>
        </div>
      </div>

      <SectionHead eyebrow="Rating" title="Stat numerals" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 24, alignItems: 'baseline' }}>
        <div style={{ textAlign: 'center' }}>
          <Rating value={9.4} size="xl" />
          <div className="section-eyebrow" style={{ marginTop: 4 }}>xl</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Rating value={8.7} size="lg" />
          <div className="section-eyebrow" style={{ marginTop: 4 }}>lg</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Rating value={7.3} size="md" />
          <div className="section-eyebrow" style={{ marginTop: 4 }}>md</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Rating value={6.1} size="sm" />
          <div className="section-eyebrow" style={{ marginTop: 4 }}>sm</div>
        </div>
      </div>

      <SectionHead eyebrow="Rank" title="Newspaper-style rank numbers" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 24, alignItems: 'flex-end' }}>
        <RankNum n={1} size="lg" />
        <RankNum n={2} size="lg" />
        <RankNum n={3} size="lg" />
        <RankNum n={4} size="md" />
        <RankNum n={12} size="md" />
        <RankNum n={87} size="sm" />
      </div>

      <SectionHead eyebrow="Stamps" title="Worth it / Skip" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <VoteStamp wouldAgain={true} />
        <VoteStamp wouldAgain={false} />
        <VoteStamp wouldAgain={true} size="lg" />
        <VoteStamp wouldAgain={false} size="lg" />
      </div>

      <SectionHead eyebrow="Worth %" title="Crowd-worth badge" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 16 }}>
        <WorthBadge pct={94} />
        <WorthBadge pct={82} />
        <WorthBadge pct={61} />
      </div>

      <SectionHead eyebrow="Delta" title="Your rating vs crowd" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <DeltaTag mine={9.0} consensus={7.8} />
        <DeltaTag mine={6.5} consensus={8.4} />
        <DeltaTag mine={8.0} consensus={8.1} />
        <DeltaTag mine={4.0} consensus={7.5} />
      </div>

      <SectionHead eyebrow="Thumb" title="Dish placeholder tile" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <DishThumb emoji="🦞" size={44} />
        <DishThumb emoji="🍔" size={56} />
        <DishThumb emoji="🍕" size={72} />
        <DishThumb emoji="🍝" size={96} rounded={14} />
      </div>

      <SectionHead eyebrow="Composition" title="Editorial dish row" />
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--color-divider)' }}>
          <div style={{ width: 28 }}><RankNum n={1} size="md" /></div>
          <DishThumb emoji="🦞" size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {sampleDish.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {sampleDish.restaurant}
              <span style={{ color: 'var(--color-text-tertiary)' }}> · {sampleDish.town}</span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <VoteStamp wouldAgain={true} />
              <span className="font-mono-ed" style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                312 votes · 47 locals
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Rating value={9.4} size="lg" />
            <DeltaTag mine={9.4} consensus={8.6} />
          </div>
        </div>
      </div>

      <SectionHead eyebrow="Menu list" title="Dotted-leader rows" />
      <div style={{ padding: '0 16px' }}>
        {[
          ['Lobster Roll', '$34', 9.4],
          ['Fish & Chips', '$22', 8.1],
          ['Clam Chowder', '$14', 8.7],
          ['Steamers', '$24', 7.6],
        ].map(([name, price, rating]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'baseline', padding: '6px 0' }}>
            <span className="font-display" style={{ fontSize: 15, fontWeight: 500 }}>{name}</span>
            <span className="leader" />
            <Rating value={rating} size="md" />
            <span className="font-mono-ed" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
              {price}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RedesignAtoms
