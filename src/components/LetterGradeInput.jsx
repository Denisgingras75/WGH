import { hapticLight } from '../utils/haptics'

// 5-letter grade input — replaces the 0–10 slider for rating dishes.
// Letter grades map to integer rating_10 values for backwards-compatible storage:
//   A = 10, B = 8, C = 6, D = 4, F = 2
// (Even spacing on the 0–10 scale; preserves crowd-average semantics.)
const GRADES = [
  { letter: 'A', rating: 10, label: 'Loved' },
  { letter: 'B', rating: 8, label: 'Good' },
  { letter: 'C', rating: 6, label: 'Fine' },
  { letter: 'D', rating: 4, label: 'Meh' },
  { letter: 'F', rating: 2, label: 'Avoid' },
]

export function ratingToLetter(rating) {
  if (rating == null) return null
  const r = Number(rating)
  if (r >= 9) return 'A'
  if (r >= 7) return 'B'
  if (r >= 5) return 'C'
  if (r >= 3) return 'D'
  return 'F'
}

export function letterToRating(letter) {
  const found = GRADES.find((g) => g.letter === letter)
  return found ? found.rating : null
}

export function LetterGradeInput({ value, onChange }) {
  // value can be a letter ('A'..'F') or a numeric rating_10. Normalize to letter.
  const selectedLetter =
    typeof value === 'string' && value.length === 1
      ? value
      : ratingToLetter(value)

  function handleSelect(grade) {
    hapticLight()
    onChange(grade.rating)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Grade this dish
        </span>
        {selectedLetter && (
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {GRADES.find((g) => g.letter === selectedLetter)?.label}
          </span>
        )}
      </div>
      <div
        role="radiogroup"
        aria-label="Grade this dish"
        className="grid grid-cols-5 gap-2"
      >
        {GRADES.map((grade) => {
          const isSelected = selectedLetter === grade.letter
          return (
            <button
              key={grade.letter}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Grade ${grade.letter}: ${grade.label}`}
              onClick={() => handleSelect(grade)}
              className="flex flex-col items-center justify-center rounded-xl transition-all duration-150 active:scale-95 focus-ring"
              style={{
                aspectRatio: '1',
                background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-elevated)',
                color: isSelected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                border: isSelected
                  ? '2px solid var(--color-primary)'
                  : '1.5px solid var(--color-divider)',
                boxShadow: isSelected ? '0 2px 8px rgba(228, 68, 10, 0.25)' : 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '32px',
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {grade.letter}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  marginTop: '2px',
                  opacity: isSelected ? 0.85 : 0.6,
                }}
              >
                {grade.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
