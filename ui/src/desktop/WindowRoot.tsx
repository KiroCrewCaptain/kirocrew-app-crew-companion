/**
 * The root every desktop window of the companion mounts under.
 *
 * The desktop shell opens each window this app declares on the dashboard's own
 * `/popout/desktop/crew-companion/<window>` document and mounts the declared
 * entry module there through the dashboard's app host. This root does what each
 * of the built-in's standalone page entries did before its first render:
 *
 * - installs the companion's bridge (`window.crewCompanion`, built over the
 *   shell's `window.kirocrewDesktopWindow` by `companionShell.ts`), once per
 *   document and before any child reads it;
 * - adds the window's document styles (the built-in page's `<style>` block) and
 *   keeps the window transparent under the dashboard's own theme;
 * - routes the companion's requests through the host's scoped client;
 * - re-renders on a language change, so every string follows the dashboard's.
 *
 * Without the shell's bridge (a browser tab on the same path) or with a bridge
 * older than this app needs, it renders nothing and asks the shell to close the
 * window: the companion's windows cannot work without the messages between them.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useAppApi, useLanguageGeneration } from '@kirocrew/app-sdk'
import { keepWindowTransparent } from '../dashboardTheme'
import { setTransport } from '../host/appFetch'
import { injectCss } from '../host/injectCss'
import { createCompanionShell, desktopBridge } from './companionShell'
import type { DesktopWindowBridge, Preload } from './types'

let installed: DesktopWindowBridge | null = null

/** Install the companion's bridge for this document once; `null` when it cannot run here. */
export function installCompanionShell(win: Window = window): DesktopWindowBridge | null {
  if (installed) return installed
  const bridge = desktopBridge(win)
  if (!bridge) {
    const raw = (win as unknown as { kirocrewDesktopWindow?: { close?: () => void } }).kirocrewDesktopWindow
    raw?.close?.()
    return null
  }
  ;(win as unknown as { crewCompanion?: Preload }).crewCompanion = createCompanionShell(bridge)
  installed = bridge
  return bridge
}

/** Tests only: forget the installed bridge. */
export function resetCompanionShellForTests(): void {
  installed = null
  delete (window as { crewCompanion?: Preload }).crewCompanion
}

export function WindowRoot({ css, cssId, revealOnPaint, children }: {
  /** The window's document styles. */
  css: string
  cssId: string
  /** Show the window after the first paint. The avatar and its owner say `ready` themselves. */
  revealOnPaint: boolean
  children: ReactNode
}) {
  // Before the first paint: a transparent overlay must never show an opaque frame.
  const [bridge] = useState(() => {
    const found = installCompanionShell()
    if (found) {
      injectCss(cssId, css)
      keepWindowTransparent()
    }
    return found
  })
  const api = useAppApi()
  useLanguageGeneration()
  // Set during render so the first request a child makes already goes through it.
  setTransport(api)

  useEffect(() => {
    if (!bridge || !revealOnPaint) return
    const frame = requestAnimationFrame(() => bridge.ready())
    return () => cancelAnimationFrame(frame)
  }, [bridge, revealOnPaint])

  if (!bridge) return null
  return <div className="cc-window-root">{children}</div>
}
