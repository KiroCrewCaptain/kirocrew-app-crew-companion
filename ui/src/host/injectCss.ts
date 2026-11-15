/**
 * Put a stylesheet into the document once.
 *
 * The built-in's CSS files were bundled by the dashboard's build, which loads
 * each with the page that imports it. An app bundle is one ES module the
 * dashboard imports, with no stylesheet beside it, so each file is read as text
 * (`?inline`) and added here, once per id, on first import.
 */
export function injectCss(id: string, css: string): void {
  if (typeof document === 'undefined') return
  const elementId = `cc-style-${id}`
  if (document.getElementById(elementId)) return
  const style = document.createElement('style')
  style.id = elementId
  style.textContent = css
  document.head.appendChild(style)
}
