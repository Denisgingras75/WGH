import { useState, useRef } from 'react'
import { ALL_CATEGORIES } from '../../constants/categories'
import { RATE_LIMITS } from '../../lib/rateLimiter'
import { restaurantManagerApi } from '../../api/restaurantManagerApi'
import { logger } from '../../utils/logger'
import { getUserFacingMessage } from '../../utils/errorHandler'
import { CARD_STYLE, DISABLED_STYLE, INPUT_CLASS, INPUT_FOCUS_CLASS, INPUT_STYLE, PRIMARY_BUTTON_CLASS, ROW_ACTION_CLASS, SECONDARY_BUTTON_CLASS, SECONDARY_BUTTON_STYLE } from '../../constants/styles'

// Each imported dish counts against the dish-create limit, so one import can't exceed it.
const MAX_IMPORT = RATE_LIMITS.dishCreate.maxAttempts

const ROW_INPUT_CLASS = 'px-3 py-2 rounded-lg text-sm ' + INPUT_FOCUS_CLASS

function primaryStyle({ disabled, busy }) {
  if (disabled && !busy) return DISABLED_STYLE
  return { background: 'var(--color-primary)', color: 'var(--color-text-on-primary)', opacity: busy ? 0.7 : 1 }
}

export function MenuImportWizard({ restaurantName, onBulkAdd, onClose }) {
  const [step, setStep] = useState(1)
  const [menuText, setMenuText] = useState('')
  const [parsedDishes, setParsedDishes] = useState([])
  const [selected, setSelected] = useState({})
  const [error, setError] = useState(null)
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [importing, setImporting] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const fileInputRef = useRef(null)
  // Bumped on every parse and on cancel, so a stale parse result is ignored
  const parseIdRef = useRef(0)

  async function handlePdfUpload(e) {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    // Some Android/Drive pickers report an empty or octet-stream MIME type for PDFs
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setError('Please upload a PDF file')
      input.value = ''
      return
    }
    setExtractingPdf(true)
    setError(null)
    try {
      // Worker is bundled by Vite and served from 'self' (CSP: worker-src 'self' blob:)
      const [pdfjsLib, { default: workerUrl }] = await Promise.all([
        import('pdfjs-dist/legacy/build/pdf.mjs'),
        import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
      ])
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
      const arrayBuffer = await file.arrayBuffer()
      // Text extraction never needs eval; CSP has no 'unsafe-eval'
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, isEvalSupported: false }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(' ')
        fullText += pageText + '\n'
      }
      setMenuText(fullText.trim())
    } catch (err) {
      logger.error('PDF extraction error:', err)
      setError('Could not extract text from PDF. Try pasting the menu text instead.')
    } finally {
      setExtractingPdf(false)
      // Reset so picking the same file again still fires onChange
      input.value = ''
    }
  }

  async function handleParse() {
    if (!menuText.trim()) return
    const parseId = ++parseIdRef.current
    setStep(2)
    setError(null)
    try {
      const dishes = await restaurantManagerApi.parseMenuText(menuText, restaurantName)
      if (parseId !== parseIdRef.current) return
      if (!dishes.length) { setError('No dishes found. Try pasting more of the menu.'); setStep(1); return }
      setParsedDishes(dishes)
      const sel = {}
      dishes.forEach((_, i) => { sel[i] = true })
      setSelected(sel)
      setConfirmDiscard(false)
      setStep(3)
    } catch (err) {
      if (parseId !== parseIdRef.current) return
      logger.error('Menu parse error:', err)
      setError(getUserFacingMessage(err, 'reading your menu'))
      setStep(1)
    }
  }

  function cancelParse() {
    parseIdRef.current++
    setStep(1)
  }

  function toggleDish(index) { setSelected(prev => ({ ...prev, [index]: !prev[index] })) }
  function selectAll() { const sel = {}; parsedDishes.forEach((_, i) => { sel[i] = true }); setSelected(sel) }
  function deselectAll() { setSelected({}) }
  function updateDish(index, field, value) {
    setParsedDishes(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  const selectedCount = parsedDishes.filter((d, i) => selected[i] && d.name?.trim()).length
  const hasUnnamedSelected = parsedDishes.some((d, i) => selected[i] && !d.name?.trim())
  const overLimit = selectedCount > MAX_IMPORT

  async function handleConfirm() {
    if (importing) return
    const toAdd = parsedDishes.filter((d, i) => selected[i] && d.name?.trim())
    if (!toAdd.length || toAdd.length > MAX_IMPORT || hasUnnamedSelected) return
    setImporting(true)
    let ok = false
    try {
      ok = await onBulkAdd(toAdd)
    } finally {
      setImporting(false)
    }
    // On failure, keep the reviewed list so the manager can fix it and retry
    if (ok) onClose()
  }

  if (step === 1) {
    const parseDisabled = !menuText.trim()
    return (
      <div className="rounded-xl p-4 mb-4" style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Import menu</h3>
          <button onClick={onClose} className={`${ROW_ACTION_CLASS} -mr-3`} style={{ color: 'var(--color-text-secondary)' }}>
            Cancel
          </button>
        </div>
        <label htmlFor="menu-text" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          Menu text
        </label>
        <textarea
          id="menu-text"
          value={menuText}
          onChange={(e) => setMenuText(e.target.value)}
          placeholder="Paste your menu here — dish names, prices, sections, whatever you have…"
          rows={8}
          className={`${INPUT_CLASS} resize-none`}
          style={INPUT_STYLE}
        />
        {error && (
          <p role="alert" className="text-sm mt-2" style={{ color: 'var(--color-danger)' }}>{error}</p>
        )}
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={extractingPdf}
            className={`flex-1 ${SECONDARY_BUTTON_CLASS}`}
            style={{ ...SECONDARY_BUTTON_STYLE, opacity: extractingPdf ? 0.7 : 1 }}
          >
            {extractingPdf ? 'Reading PDF…' : 'Upload PDF'}
          </button>
          <button
            onClick={handleParse}
            disabled={parseDisabled}
            className={`flex-1 ${PRIMARY_BUTTON_CLASS}`}
            style={primaryStyle({ disabled: parseDisabled })}
          >
            Parse menu
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} className="hidden" />
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="rounded-xl p-4 mb-4 text-center" style={CARD_STYLE}>
        <div role="status" className="flex flex-col items-center">
          <div
            className="spinner mb-3"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Parsing your menu…</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>This takes a few seconds</p>
        </div>
        <button onClick={cancelParse} className={`w-full mt-4 ${SECONDARY_BUTTON_CLASS}`} style={SECONDARY_BUTTON_STYLE}>
          Cancel
        </button>
      </div>
    )
  }

  const confirmDisabled = selectedCount === 0 || overLimit || hasUnnamedSelected
  const footerNote = hasUnnamedSelected
    ? 'Give every selected dish a name, or deselect it.'
    : overLimit
      ? `You can import up to ${MAX_IMPORT} dishes at a time. Deselect some and import the rest later.`
      : null

  return (
    <div className="rounded-xl p-4 mb-4" style={CARD_STYLE}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Review dishes</h3>
        {!confirmDiscard && (
          <button
            onClick={() => setConfirmDiscard(true)}
            disabled={importing}
            className={`${ROW_ACTION_CLASS} -mr-3`}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
        )}
      </div>
      <p className="mb-2" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>
        {parsedDishes.length} found · {selectedCount} selected
      </p>

      {confirmDiscard && (
        <div
          className="flex flex-wrap items-center justify-between gap-x-2 rounded-xl pl-3 mb-2"
          style={{ background: 'var(--color-surface)' }}
        >
          <p className="text-sm font-semibold py-2" style={{ color: 'var(--color-text-primary)' }}>
            Discard {parsedDishes.length} {parsedDishes.length === 1 ? 'dish' : 'dishes'}?
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setConfirmDiscard(false)} className={ROW_ACTION_CLASS} style={{ color: 'var(--color-text-secondary)' }}>
              Keep editing
            </button>
            <button onClick={onClose} className={ROW_ACTION_CLASS} style={{ color: 'var(--color-danger)' }}>
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-2 -ml-3">
        <button onClick={selectAll} className={ROW_ACTION_CLASS} style={{ color: 'var(--color-primary)' }}>Select all</button>
        <button onClick={deselectAll} className={ROW_ACTION_CLASS} style={{ color: 'var(--color-text-secondary)' }}>Deselect all</button>
      </div>

      <div className="max-h-80 overflow-y-auto overscroll-contain rounded-xl" style={{ border: '1px solid var(--color-divider)' }}>
        {parsedDishes.map((dish, i) => {
          const isSelected = !!selected[i]
          const unnamed = isSelected && !dish.name?.trim()
          const categoryIsUnlisted = dish.category && !ALL_CATEGORIES.some(c => c.id === dish.category)
          return (
            <div
              key={i}
              className="py-2 pr-3"
              style={{
                background: isSelected ? 'var(--color-primary-muted)' : 'transparent',
                borderBottom: i < parsedDishes.length - 1 ? '1px solid var(--color-divider)' : 'none',
              }}
            >
              <div className="flex items-center">
                <label className="flex items-center justify-center w-11 h-11 shrink-0">
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    style={{ accentColor: 'var(--color-primary)' }}
                    aria-label={`Include ${dish.name || 'dish'}`}
                    checked={isSelected}
                    onChange={() => toggleDish(i)}
                  />
                </label>
                <input
                  type="text"
                  aria-label="Dish name"
                  aria-invalid={unnamed ? true : undefined}
                  autoComplete="off"
                  value={dish.name || ''}
                  onChange={(e) => updateDish(i, 'name', e.target.value)}
                  className={`flex-1 min-w-0 ${ROW_INPUT_CLASS}`}
                  style={unnamed ? { ...INPUT_STYLE, borderColor: 'var(--color-danger)' } : INPUT_STYLE}
                />
              </div>
              <div className="flex gap-2 pl-11 mt-1">
                <select
                  aria-label="Category"
                  value={dish.category || ''}
                  onChange={(e) => updateDish(i, 'category', e.target.value)}
                  className={`flex-1 min-w-0 ${ROW_INPUT_CLASS}`}
                  style={INPUT_STYLE}
                >
                  {categoryIsUnlisted && <option value={dish.category}>{dish.category}</option>}
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  aria-label="Price"
                  inputMode="decimal"
                  value={dish.price ?? ''}
                  onChange={(e) => updateDish(i, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="$"
                  step="0.01"
                  min="0"
                  className={`w-24 shrink-0 text-right ${ROW_INPUT_CLASS}`}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 mt-3">
        <button
          onClick={() => { setStep(1); setError(null); setConfirmDiscard(false) }}
          disabled={importing}
          className={`flex-1 ${SECONDARY_BUTTON_CLASS}`}
          style={SECONDARY_BUTTON_STYLE}
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirmDisabled || importing}
          className={`flex-1 ${PRIMARY_BUTTON_CLASS}`}
          style={primaryStyle({ disabled: confirmDisabled, busy: importing })}
        >
          {importing ? 'Adding…' : `Add ${selectedCount} to menu`}
        </button>
      </div>
      {footerNote && (
        <p className="mt-2" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>{footerNote}</p>
      )}
    </div>
  )
}
