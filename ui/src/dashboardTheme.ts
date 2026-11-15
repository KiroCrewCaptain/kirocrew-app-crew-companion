/**
 * Keep a desktop window of the companion transparent under the dashboard's theme.
 *
 * In the built-in each window was its own page entry with no dashboard
 * stylesheet, so this module fetched the dashboard's document and adopted its
 * stylesheets. A window the desktop shell hosts now loads the dashboard's own
 * document (`/popout/desktop/crew-companion/<window>`), whose stylesheets and
 * theme (`ThemeProvider`) are already there and follow every theme change, so
 * nothing is fetched. What stays is the transparency guard: the dashboard paints
 * `body` and a full-viewport `body::before` gradient, which would turn a
 * transparent overlay into an opaque rectangle over the whole display.
 */
import transparentCss from './windowTransparent.css?raw'

const TRANSPARENT_STYLE_ID = 'cc-window-transparent'

/**
 * Clear the document's backgrounds and append the guard LAST into <head>, so it is
 * re-asserted after the dashboard's own stylesheets. Idempotent.
 */
export function keepWindowTransparent(): void {
  for (const el of [document.documentElement, document.body]) {
    if (!el) continue
    el.style.setProperty('background', 'transparent', 'important')
    el.style.setProperty('background-image', 'none', 'important')
  }
  let guard = document.getElementById(TRANSPARENT_STYLE_ID) as HTMLStyleElement | null
  if (!guard) {
    guard = document.createElement('style')
    guard.id = TRANSPARENT_STYLE_ID
  }
  guard.textContent = transparentCss
  document.head.appendChild(guard)
}
