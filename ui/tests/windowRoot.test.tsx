/**
 * The root every desktop window mounts under, through the real window entries.
 *
 * The shell reveals a window only once its page says `ready`, so the panel and
 * gallery roots say it after their first paint, while the avatar and its owner
 * say it themselves once their listeners are up. Without the shell's bridge (a
 * browser tab on the same path) a root renders nothing and closes the window.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { resetCompanionShellForTests } from '../src/desktop/WindowRoot'

vi.mock('../src/panel', () => ({ Panel: () => <div data-testid="panel-card" /> }))
vi.mock('../src/GalleryPanel', () => ({ GalleryPanel: () => <div data-testid="gallery" /> }))
vi.mock('../src/pet', () => ({ Companion: () => <div data-testid="companion" /> }))

function installBridge(window: string, kind: string, level = 2) {
  const bridge = {
    level, app: 'crew-companion', window, kind,
    ready: vi.fn(), close: vi.fn(), open: vi.fn(), setHitRegions: vi.fn(), setFocusable: vi.fn(),
    onShortcut: () => () => {},
    send: vi.fn(), broadcast: vi.fn(), closeAll: vi.fn(),
    onMessage: () => () => {}, onWindowChange: () => () => {}, onPlaced: () => () => {},
    onActive: () => () => {}, onDrag: () => () => {},
  }
  ;(globalThis as unknown as { kirocrewDesktopWindow?: unknown }).kirocrewDesktopWindow = bridge
  return bridge
}

afterEach(() => {
  resetCompanionShellForTests()
  delete (globalThis as unknown as { kirocrewDesktopWindow?: unknown }).kirocrewDesktopWindow
  document.querySelectorAll('style[id^="cc-"]').forEach((n) => n.remove())
})

async function nextFrame() {
  await new Promise((r) => requestAnimationFrame(() => r(null)))
}

describe('the panel and gallery windows', () => {
  it.each([
    ['panel', '../src/entries/panel', 'panel-card', 'cc-style-panel-window'],
    ['gallery', '../src/entries/gallery', 'gallery', 'cc-style-gallery-window'],
  ])('%s: mounts under the companion bridge and is revealed after its first paint', async (id, entry, testId, styleId) => {
    const bridge = installBridge(id, 'panel')
    const { default: Root } = await import(/* @vite-ignore */ entry)
    const view = render(<Root />)
    expect(view.getByTestId(testId)).toBeInTheDocument()
    expect(document.getElementById(styleId)).not.toBeNull()
    expect(document.getElementById('cc-window-transparent')).not.toBeNull()
    expect((window as unknown as { crewCompanion?: unknown }).crewCompanion).toBeTruthy()
    await nextFrame()
    expect(bridge.ready).toHaveBeenCalledTimes(1)
  })
})

describe('the avatar window', () => {
  it('leaves `ready` to the companion, which says it once its listeners are up', async () => {
    const bridge = installBridge('pet', 'overlay')
    const { default: Root } = await import('../src/entries/pet')
    const view = render(<Root />)
    expect(view.getByTestId('companion')).toBeInTheDocument()
    expect(view.container.querySelector('.cc-window-root')).not.toBeNull()
    expect(document.getElementById('cc-style-pet-window')).not.toBeNull()
    await nextFrame()
    expect(bridge.ready).not.toHaveBeenCalled()
  })

  it('the owner window is the same component', async () => {
    const pet = await import('../src/entries/pet')
    const notifier = await import('../src/entries/notifier')
    expect(notifier.default).toBe(pet.default)
  })
})

describe('without a bridge it can drive', () => {
  it('renders nothing in a browser tab', async () => {
    const { default: Root } = await import('../src/entries/panel')
    const view = render(<Root />)
    expect(view.container.innerHTML).toBe('')
    expect((window as unknown as { crewCompanion?: unknown }).crewCompanion).toBeUndefined()
  })

  it('closes a window whose shell is older than the messages it needs', async () => {
    const bridge = installBridge('pet', 'overlay', 1)
    const { default: Root } = await import('../src/entries/pet')
    const view = render(<Root />)
    expect(view.container.innerHTML).toBe('')
    expect(bridge.close).toHaveBeenCalledTimes(1)
  })
})
