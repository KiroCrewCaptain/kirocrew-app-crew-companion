import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { keepWindowTransparent } from '../src/dashboardTheme'

/**
 * A desktop window of the companion is the dashboard's own document, with the
 * dashboard's stylesheets and theme already on it. The dashboard paints `body`
 * and a full-viewport `body::before` gradient, so the window must stay
 * transparent under them, and must not fetch the dashboard's document for
 * stylesheets the way the built-in's standalone pages did.
 */

function cleanup() {
  document.getElementById('cc-window-transparent')?.remove()
  document.documentElement.removeAttribute('style')
  document.body.removeAttribute('style')
}

beforeEach(cleanup)
afterEach(() => {
  vi.unstubAllGlobals()
  cleanup()
})

describe('keepWindowTransparent', () => {
  it('forces html/body transparent and neutralizes the body::before gradient', () => {
    keepWindowTransparent()

    for (const el of [document.documentElement, document.body]) {
      // happy-dom re-serializes the `background` shorthand from its longhands
      // (→ "none transparent"), so assert the transparency intent, not the exact string.
      expect(el.style.getPropertyValue('background')).toContain('transparent')
      expect(el.style.getPropertyValue('background-image')).toBe('none')
      expect(el.style.getPropertyPriority('background-image')).toBe('important')
    }

    const guard = document.getElementById('cc-window-transparent')
    expect(guard).not.toBeNull()
    // The guard must be the LAST child of <head> so it outranks the dashboard sheet.
    expect(document.head.lastElementChild).toBe(guard)
    const css = (guard!.textContent ?? '').split(/\s+/).join('')
    expect(css).toContain('body::before')
    expect(css).toContain('display:none!important')
    expect(css).toContain('background:transparent!important')
    expect(css).toContain('content:none!important')
  })

  it('is idempotent, and moves the guard back to the end of <head>', () => {
    keepWindowTransparent()
    const later = document.createElement('style')
    document.head.appendChild(later)
    keepWindowTransparent()
    expect(document.querySelectorAll('#cc-window-transparent')).toHaveLength(1)
    expect(document.head.lastElementChild?.id).toBe('cc-window-transparent')
    later.remove()
  })

  it('fetches nothing: the dashboard document already carries its stylesheets', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    keepWindowTransparent()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(document.querySelector('link[data-cc-dashboard-theme]')).toBeNull()
  })
})
