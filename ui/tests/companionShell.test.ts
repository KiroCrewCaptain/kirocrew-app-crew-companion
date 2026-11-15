/**
 * The companion's bridge over the desktop shell's window bridge.
 *
 * What the built-in's main process did between its windows is done here between
 * the windows the shell hosts, over the shell's messages. A fake shell routes
 * `send` and `broadcast` between fake windows of one app the way the host does
 * (a message for `pet` reaches the copy hosting the avatar), so each test drives
 * two real shells against each other.
 */
import { describe, expect, it, vi } from 'vitest'
import { createCompanionShell, desktopBridge, GALLERY, NOTIFIER, PANEL, PET } from '../src/desktop/companionShell'
import type { DesktopWindowBridge, Preload } from '../src/desktop/types'

type Listener<T extends unknown[]> = (...args: T) => void

interface FakeWindow {
  bridge: DesktopWindowBridge
  message: Set<Listener<[string, unknown]>>
  windowChange: Set<Listener<[string, boolean]>>
  active: Set<Listener<[{ active: boolean; x?: number; y?: number; dragging?: boolean }]>>
  drag: Set<Listener<['start' | 'move' | 'end', number?, number?]>>
  placed: Set<Listener<[{ side: 'left' | 'right' }]>>
}

function fakeShell() {
  const windows = new Map<string, FakeWindow>()
  function sub<T extends unknown[]>(set: Set<Listener<T>>) {
    return (cb: Listener<T>) => { set.add(cb); return () => { set.delete(cb) } }
  }
  function open(id: string, kind: string, level = 2) {
    const w: FakeWindow = {
      message: new Set(), windowChange: new Set(), active: new Set(), drag: new Set(), placed: new Set(),
      bridge: undefined as unknown as DesktopWindowBridge,
    }
    w.bridge = {
      level, app: 'crew-companion', window: id, kind,
      ready: vi.fn(), close: vi.fn(), open: vi.fn(), setHitRegions: vi.fn(), setFocusable: vi.fn(),
      onShortcut: () => () => {},
      closeAll: vi.fn(),
      send: vi.fn((to: string, message: unknown) => {
        // A message is JSON on the wire.
        const copy = JSON.parse(JSON.stringify(message))
        for (const cb of windows.get(to)?.message ?? []) cb(id, copy)
      }),
      broadcast: vi.fn((message: unknown) => {
        for (const [other, ow] of windows) if (other !== id) for (const cb of ow.message) cb(id, message)
      }),
      onMessage: sub(w.message),
      onWindowChange: sub(w.windowChange),
      onActive: sub(w.active),
      onDrag: sub(w.drag),
      onPlaced: sub(w.placed),
      beginDrag: vi.fn(),
      endDrag: vi.fn(),
      showSession: vi.fn(async () => true),
      openExternal: vi.fn(),
    }
    windows.set(id, w)
    return w
  }
  return { windows, open }
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

function pair() {
  const shell = fakeShell()
  const pet = shell.open(PET, 'overlay')
  const owner = shell.open(NOTIFIER, 'background')
  const petShell = createCompanionShell(pet.bridge)
  const ownerShell = createCompanionShell(owner.bridge)
  return { shell, pet, owner, petShell, ownerShell }
}

describe('roles', () => {
  it('the background window owns notifications and never draws the avatar', async () => {
    const { petShell, ownerShell } = pair()
    const ownerRole = vi.fn(); const ownerActive = vi.fn(); const petRole = vi.fn()
    ownerShell.onSetOwner(ownerRole)
    ownerShell.onSetActive(ownerActive)
    petShell.onSetOwner(petRole)
    await settle()
    expect(ownerRole).toHaveBeenCalledWith(true)
    expect(ownerActive).toHaveBeenCalledWith(false)
    expect(petRole).toHaveBeenCalledWith(false)
  })

  it('a copy learns whether it hosts the avatar from the shell', () => {
    const { pet, petShell } = pair()
    const cb = vi.fn()
    petShell.onSetActive(cb)
    for (const l of pet.active) l({ active: true, x: 40, y: 50, dragging: true })
    expect(cb).toHaveBeenCalledWith(true, 40, 50, true)
  })

  it('refuses a bridge older than level 2', () => {
    const shell = fakeShell()
    expect(desktopBridge({ kirocrewDesktopWindow: shell.open(PET, 'overlay', 1).bridge } as unknown as Window)).toBeNull()
    expect(desktopBridge({ kirocrewDesktopWindow: shell.open(PET, 'overlay', 2).bridge } as unknown as Window)).not.toBeNull()
    expect(desktopBridge({} as Window)).toBeNull()
  })
})

describe('the bubble, from the owner to the avatar', () => {
  it('a fresh bubble reaches the avatar and asks it to react', () => {
    const { petShell, ownerShell } = pair()
    const render = vi.fn()
    petShell.onRenderBubble(render)
    ownerShell.reportBubbleState({ kind: 'reminder', text: 'stand up' }, { kind: 'reminder' }, -3)
    expect(render).toHaveBeenCalledWith({ kind: 'reminder', text: 'stand up' }, true)
  })

  it('a copy that becomes the avatar gets the current bubble without a replayed reaction', () => {
    const { pet, petShell, ownerShell } = pair()
    ownerShell.reportBubbleState({ kind: 'approval' }, null, -1)
    const render = vi.fn()
    petShell.onRenderBubble(render)
    for (const l of pet.active) l({ active: true })
    expect(render).toHaveBeenCalledWith({ kind: 'approval' }, false)
  })

  it('a copy that loads asks for the bubble the owner holds', () => {
    const { pet, petShell, ownerShell } = pair()
    ownerShell.reportBubbleState({ kind: 'break' }, null, -2)
    const render = vi.fn()
    petShell.onRenderBubble(render)
    petShell.petReady()
    expect(pet.bridge.ready).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledWith({ kind: 'break' }, false)
  })

  it('only the owner produces: a view never reports a bubble', () => {
    const { owner, petShell } = pair()
    const heard = vi.fn()
    owner.message.add(heard)
    petShell.reportBubbleState({ kind: 'x' }, null, 1)
    expect(heard).not.toHaveBeenCalled()
  })

  it('a bubble action on the avatar reaches the owner', () => {
    const { petShell, ownerShell } = pair()
    const action = vi.fn()
    ownerShell.onBubbleAction(action)
    petShell.bubbleAction('dismiss')
    expect(action).toHaveBeenCalledWith('dismiss')
  })

  it('a reopened owner picks up the slot the avatar last showed', () => {
    const shell = fakeShell()
    const pet = shell.open(PET, 'overlay')
    const petShell = createCompanionShell(pet.bridge)
    const firstOwner = createCompanionShell(shell.open(NOTIFIER, 'background').bridge)
    petShell.onRenderBubble(() => {})
    firstOwner.reportBubbleState({ kind: 'approval' }, { kind: 'approval', count: 2 }, -7)
    // The owner's page died; the shell reopens it.
    const second = shell.open(NOTIFIER, 'background')
    const reopened = createCompanionShell(second.bridge)
    const rehydrate = vi.fn()
    reopened.onRehydrateSlot(rehydrate)
    expect(rehydrate).toHaveBeenCalledWith({ slot: { kind: 'approval', count: 2 }, seq: -7 })
  })
})

describe('window commands', () => {
  it('a command that arrives before the avatar listens is held, in order', () => {
    const { petShell, ownerShell } = pair()
    ownerShell.reportWindowCommand('panel')
    ownerShell.reportWindowCommand('gallery')
    const cb = vi.fn()
    petShell.onWindowCommand(cb)
    expect(cb.mock.calls).toEqual([['panel'], ['gallery']])
    ownerShell.reportWindowCommand('panel')
    expect(cb).toHaveBeenCalledTimes(3)
  })
})

describe('the avatar window', () => {
  it('reports the avatar, bubble and menu boxes as hit regions', () => {
    const { pet, petShell } = pair()
    petShell.updateHitbox({ x: 1, y: 2, w: 128, h: 128 }, { x: 10, y: 20, w: 200, h: 60 })
    petShell.setMenuHitbox({ x: 0, y: 0, w: 1440, h: 900 })
    expect(pet.bridge.setHitRegions).toHaveBeenLastCalledWith([
      { x: 1, y: 2, width: 128, height: 128 },
      { x: 10, y: 20, width: 200, height: 60 },
      { x: 0, y: 0, width: 1440, height: 900 },
    ])
    petShell.setMenuHitbox(null)
    petShell.updateHitbox(null, null)
    expect(pet.bridge.setHitRegions).toHaveBeenLastCalledWith([])
  })

  it('drives the drag hand-off through the shell', () => {
    const { pet, petShell } = pair()
    const listen = vi.fn(); const move = vi.fn(); const end = vi.fn()
    petShell.onDragListenMouseUp(listen)
    petShell.onDragUpdate(move)
    petShell.onDragEnded(end)
    petShell.dragStart(30, 40)
    expect(pet.bridge.beginDrag).toHaveBeenCalledWith({ offsetX: 30, offsetY: 40, width: 128, height: 128 })
    for (const l of pet.drag) l('start')
    for (const l of pet.drag) l('move', 300, 200)
    for (const l of pet.drag) l('end', 310, 210)
    expect(listen).toHaveBeenCalledTimes(1)
    expect(move).toHaveBeenCalledWith(300, 200)
    expect(end).toHaveBeenCalledWith(310, 210)
    petShell.dragMouseUp()
    expect(pet.bridge.endDrag).toHaveBeenCalledTimes(1)
  })

  it('opens the panel beside the avatar, in its own page pixels', () => {
    const { pet, petShell } = pair()
    vi.stubGlobal('screenX', 1920)
    vi.stubGlobal('screenY', 0)
    try {
      petShell.panelOpen({ x: 1920 + 500, y: 300, width: 128, height: 128 })
    } finally {
      vi.unstubAllGlobals()
    }
    expect(pet.bridge.open).toHaveBeenCalledWith(PANEL, { anchor: { x: 500, y: 300, width: 128, height: 128 } })
    petShell.panelClose()
    expect(pet.bridge.close).toHaveBeenCalledWith(PANEL)
  })

  it('hears the panel and the gallery open and close', () => {
    const { pet, petShell } = pair()
    const closed = vi.fn(); const gOpen = vi.fn(); const gClose = vi.fn()
    petShell.onPanelClosed(closed)
    petShell.onGalleryOpened(gOpen)
    petShell.onGalleryClosed(gClose)
    for (const l of pet.windowChange) { l(PANEL, true); l(PANEL, false); l(GALLERY, true); l(GALLERY, false) }
    expect(closed).toHaveBeenCalledTimes(1)
    expect(gOpen).toHaveBeenCalledTimes(1)
    expect(gClose).toHaveBeenCalledTimes(1)
  })

  it('opens a session through the shell and answers what it answered', async () => {
    const { pet, petShell } = pair()
    await expect(petShell.openSession('dashboard:abc')).resolves.toBe(true)
    expect(pet.bridge.showSession).toHaveBeenCalledWith('dashboard:abc')
    ;(pet.bridge.showSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false)
    await expect(petShell.openSession('dashboard:abc')).resolves.toBe(false)
  })

  it('turning the companion off closes every one of its windows at once', () => {
    const { pet, petShell } = pair()
    petShell.turnOff()
    expect(pet.bridge.closeAll).toHaveBeenCalledTimes(1)
  })
})

describe('the panel and the gallery', () => {
  it('the panel hears which side of the avatar it opened on', () => {
    const shell = fakeShell()
    const panel = shell.open(PANEL, 'panel')
    const panelShell: Preload = createCompanionShell(panel.bridge)
    const side = vi.fn()
    panelShell.onPanelOpened(side)
    for (const l of panel.placed) l({ side: 'left' })
    expect(side).toHaveBeenCalledWith('left')
  })

  it('a changed avatar in the gallery reaches the avatar and the owner', () => {
    const shell = fakeShell()
    const pet = createCompanionShell(shell.open(PET, 'overlay').bridge)
    const owner = createCompanionShell(shell.open(NOTIFIER, 'background').bridge)
    const gallery = createCompanionShell(shell.open(GALLERY, 'panel').bridge)
    const a = vi.fn(); const b = vi.fn()
    pet.onAppearanceChanged(a)
    owner.onAppearanceChanged(b)
    gallery.appearanceChanged()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('the gallery closes itself and opens https links through the shell', () => {
    const shell = fakeShell()
    const g = shell.open(GALLERY, 'panel')
    const gallery = createCompanionShell(g.bridge)
    gallery.galleryClose()
    expect(g.bridge.close).toHaveBeenCalledWith(GALLERY)
    gallery.openExternal('https://petdex.dev')
    expect(g.bridge.openExternal).toHaveBeenCalledWith('https://petdex.dev')
  })
})
