/**
 * Source-level pins on the companion's window page.
 *
 * The built-in's window was its own page entry and had to initialise i18n itself:
 * reminders carry their own text and rendered fine, while break nudges, which
 * arrive as a key for this side to translate, resolved to nothing and the
 * companion stayed quiet. The app's strings are bundled (`src/host/i18n.ts`), so
 * there is no bootstrap to forget; the first test pins that a nudge key resolves
 * with nothing initialised.
 */
import { describe, it, expect } from 'vitest'
import { nudgeTextFor } from '../src/nudgeKeys'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SOURCE = readFileSync(
  resolve(__dirname, '../src/pet.tsx'),
  'utf-8',
)

describe('the companion window page', () => {
  it('translates a break nudge with no i18n bootstrap', () => {
    const text = nudgeTextFor('break.water.1')
    expect(text).toBeTruthy()
    expect(text).not.toContain('apps.crewCompanion')
  })

  it('resolves break nudges through the explicit lookup, never string assembly', () => {
    // A key built by interpolation is invisible to the key checker and renders raw
    // to the user when it misses. This is the regression that shipped once already.
    expect(SOURCE).toContain('nudgeTextFor(')
    expect(SOURCE).not.toMatch(/i18nT\(`/)
    expect(SOURCE).not.toContain('apps.crewCompanion.${')
  })

  it('keeps the overlay click-through by reporting hitboxes, not toggling on hover', () => {
    // The window covers the whole display. The companion reports its rects and the
    // main process polls the cursor and toggles ignore-mouse itself — the old
    // pointer-enter/leave setInteractive round-trip let a fast click fall through.
    expect(SOURCE).toContain('useMouseForward(')
    expect(SOURCE).not.toContain('setInteractive')
  })

  it('pings presence more often than the backend TTL', () => {
    // store.py drops presence after 90s; a slower ping makes the companion think
    // nobody is there and suppresses break nudges.
    const match = SOURCE.match(/PRESENCE_MS\s*=\s*([\d_]+)/)
    expect(match, 'PRESENCE_MS must be declared').toBeTruthy()
    const ms = Number(match![1].replace(/_/g, ''))
    expect(ms).toBeLessThan(90_000)
  })
})
