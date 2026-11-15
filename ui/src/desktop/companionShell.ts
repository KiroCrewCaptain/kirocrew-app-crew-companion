/**
 * The companion's desktop bridge, served by the Kiro Crew desktop window host.
 *
 * In the built-in, the companion's windows talked to main-process code that
 * shipped inside the desktop app (`window.crewCompanion`, a preload of its own).
 * That code is gone from this app: the desktop shell hosts the windows this
 * app's manifest declares (`desktop.windows`) and hands each page one generic
 * bridge, `window.kirocrewDesktopWindow` (bridge level 2). This module rebuilds
 * the `window.crewCompanion` surface the companion's pages already call on top of
 * that bridge, so the ported pages read as they did, and it does here what the
 * built-in's main process did between its windows:
 *
 * - `pet` is the avatar, one copy per display (`displays: "all"`); the shell
 *   says which copy hosts it (`onActive`) and runs the drag hand-off between
 *   displays (`beginDrag` / `onDrag` / `endDrag`).
 * - `notifier` is the hidden owner of notifications (the session socket, the
 *   reminder poll and the bubble), the built-in's "brain" window: a `background`
 *   window that is never shown and is reopened at once if it dies.
 * - The owner's bubble reaches the avatar as a message. The shell delivers a
 *   message for `pet` to the copy hosting the avatar, so the owner keeps the last
 *   bubble and sends it again whenever a copy becomes the avatar's or loads,
 *   which is what the built-in's main process cached it for. A fresh bubble asks
 *   the avatar to react; a re-sent one does not, so a hand-off never replays it.
 * - A window command (open the panel, change the avatar) and a bubble action go
 *   the same way, and the avatar holds commands that arrive before its listener.
 * - The panel and gallery opening and closing are the shell's `onWindowChange`.
 */
import type { DesktopWindowBridge, HitRect, Preload } from './types'

/** Window ids, as `app.json` declares them. */
export const PET = 'pet'
export const NOTIFIER = 'notifier'
export const PANEL = 'panel'
export const GALLERY = 'gallery'

/** The avatar's box, the renderer's sprite size (constants.ts PET_W/PET_H). */
const PET_BOX = 128

/** The bridge level this shell needs: messages, the spanning overlay, showSession. */
export const REQUIRED_BRIDGE_LEVEL = 2

type Message =
  | { cc: 'bubble'; bubble: unknown; slot: unknown; seq: unknown; react: boolean }
  | { cc: 'need-bubble' }
  | { cc: 'owner-hello' }
  | { cc: 'rehydrate'; slot: unknown; seq: unknown }
  | { cc: 'bubble-action'; action: unknown }
  | { cc: 'window-command'; cmd: unknown }
  | { cc: 'appearance-changed' }

function asMessage(raw: unknown): Message | null {
  if (!raw || typeof raw !== 'object') return null
  const kind = (raw as { cc?: unknown }).cc
  return typeof kind === 'string' ? (raw as Message) : null
}

/** The host bridge on this window, when it is the one this shell can drive. */
export function desktopBridge(win: Window = window): DesktopWindowBridge | null {
  const raw = (win as unknown as { kirocrewDesktopWindow?: unknown }).kirocrewDesktopWindow
  if (!raw || typeof raw !== 'object') return null
  const bridge = raw as DesktopWindowBridge
  if (typeof bridge.level !== 'number' || bridge.level < REQUIRED_BRIDGE_LEVEL) return null
  return bridge
}

function toRegion(r: HitRect | null | undefined) {
  if (!r) return null
  return { x: r.x, y: r.y, width: r.w, height: r.h }
}

/** Listeners a page registers, each one removable. */
function listeners<T extends unknown[]>() {
  const set = new Set<(...args: T) => void>()
  return {
    add(cb: (...args: T) => void): () => void {
      set.add(cb)
      return () => { set.delete(cb) }
    },
    emit(...args: T): void {
      for (const cb of [...set]) cb(...args)
    },
    get size() { return set.size },
  }
}

/**
 * Build the `window.crewCompanion` surface for this window over *bridge*.
 *
 * Every subscription the shell itself needs is made here, before the page
 * mounts, so a message that arrives while React is still rendering is kept for
 * the listener that is about to register instead of being lost.
 */
export function createCompanionShell(bridge: DesktopWindowBridge): Preload {
  const isOwner = bridge.kind === 'background'
  const isAvatar = bridge.window === PET

  const hit: { pet: HitRect | null; bubble: HitRect | null; menu: HitRect | null } = {
    pet: null, bubble: null, menu: null,
  }
  const pushRegions = () => {
    const regions = [hit.pet, hit.bubble, hit.menu].map(toRegion).filter((r) => r !== null)
    bridge.setHitRegions(regions)
  }

  const renderBubble = listeners<[unknown, boolean]>()
  const bubbleAction = listeners<[unknown]>()
  const windowCommand = listeners<[unknown]>()
  const rehydrate = listeners<[unknown]>()
  const appearanceChanged = listeners<[]>()
  const setActive = listeners<[boolean, number?, number?, boolean?]>()
  const panelClosed = listeners<[]>()
  const panelOpenedSide = listeners<['left' | 'right']>()
  const galleryOpened = listeners<[]>()
  const galleryClosed = listeners<[]>()
  const dragUpdate = listeners<[number, number]>()
  const dragEnded = listeners<[number, number]>()
  const dragListen = listeners<[]>()

  // What arrived before its listener did.
  const heldCommands: unknown[] = []
  let heldRehydrate: unknown = undefined

  // The owner's last report, re-sent to whichever copy hosts the avatar.
  let ownerState: { bubble: unknown; slot: unknown; seq: unknown } = { bubble: null, slot: null, seq: null }
  // The avatar's copy of the same, so a reopened owner can pick up where it was.
  let lastShown: { slot: unknown; seq: unknown } | null = null

  const sendBubble = (react: boolean) => {
    bridge.send?.(PET, { cc: 'bubble', ...ownerState, react })
  }

  bridge.onMessage?.((from, raw) => {
    const msg = asMessage(raw)
    if (!msg) return
    switch (msg.cc) {
      case 'bubble':
        if (isOwner || from !== NOTIFIER) return
        lastShown = { slot: msg.slot, seq: msg.seq }
        renderBubble.emit(msg.bubble, msg.react === true)
        return
      case 'need-bubble':
        if (isOwner) sendBubble(false)
        return
      case 'owner-hello':
        if (!isOwner && from === NOTIFIER && lastShown) {
          bridge.send?.(NOTIFIER, { cc: 'rehydrate', ...lastShown })
        }
        return
      case 'rehydrate':
        if (!isOwner) return
        if (rehydrate.size > 0) rehydrate.emit({ slot: msg.slot, seq: msg.seq })
        else heldRehydrate = { slot: msg.slot, seq: msg.seq }
        return
      case 'bubble-action':
        if (isOwner && from === PET) bubbleAction.emit(msg.action)
        return
      case 'window-command':
        if (isOwner || from !== NOTIFIER) return
        if (windowCommand.size > 0) windowCommand.emit(msg.cmd)
        else heldCommands.push(msg.cmd)
        return
      case 'appearance-changed':
        appearanceChanged.emit()
        return
    }
  })

  bridge.onWindowChange?.((id, open) => {
    if (id === PANEL && !open) panelClosed.emit()
    if (id === GALLERY) (open ? galleryOpened : galleryClosed).emit()
  })
  bridge.onPlaced?.((placement) => panelOpenedSide.emit(placement.side))

  if (isAvatar) {
    bridge.onActive?.((state) => {
      setActive.emit(state.active, state.x, state.y, state.dragging)
      // The copy that now hosts the avatar draws whatever the owner shows.
      if (state.active) bridge.send?.(NOTIFIER, { cc: 'need-bubble' })
    })
    bridge.onDrag?.((phase, x, y) => {
      if (phase === 'start') dragListen.emit()
      else if (phase === 'move' && typeof x === 'number' && typeof y === 'number') dragUpdate.emit(x, y)
      else if (phase === 'end' && typeof x === 'number' && typeof y === 'number') dragEnded.emit(x, y)
    })
  }

  if (isOwner) {
    // A reopened owner asks the avatar what it last showed, as the built-in's main
    // process replayed it to a replacement brain.
    bridge.send?.(PET, { cc: 'owner-hello' })
  }

  return {
    // ── roles ────────────────────────────────────────────────────────────────
    onSetOwner(cb) {
      queueMicrotask(() => cb(isOwner))
      return () => {}
    },
    onSetActive(cb) {
      // The hidden owner never draws the avatar; a copy hears from the shell.
      if (!isAvatar) queueMicrotask(() => cb(false))
      return setActive.add(cb)
    },
    petReady() {
      bridge.ready()
      if (!isOwner) bridge.send?.(NOTIFIER, { cc: 'need-bubble' })
    },

    // ── the bubble, between the owner and the avatar ───────────────────────────
    reportBubbleState(bubble, slot, seq) {
      if (!isOwner) return
      ownerState = { bubble: bubble ?? null, slot: slot ?? null, seq: typeof seq === 'number' ? seq : null }
      sendBubble(true)
    },
    onRenderBubble(cb) {
      return renderBubble.add(cb)
    },
    bubbleAction(action) {
      if (!isOwner) bridge.send?.(NOTIFIER, { cc: 'bubble-action', action })
    },
    onBubbleAction(cb) {
      return bubbleAction.add(cb)
    },
    reportWindowCommand(cmd) {
      if (isOwner) bridge.send?.(PET, { cc: 'window-command', cmd })
    },
    onWindowCommand(cb) {
      const off = windowCommand.add(cb)
      for (const cmd of heldCommands.splice(0)) cb(cmd)
      return off
    },
    onRehydrateSlot(cb) {
      const off = rehydrate.add(cb)
      if (heldRehydrate !== undefined) {
        const held = heldRehydrate
        heldRehydrate = undefined
        cb(held)
      }
      return off
    },

    // ── pointer and focus ──────────────────────────────────────────────────────
    updateHitbox(pet, bubble) {
      hit.pet = pet ?? null
      hit.bubble = bubble ?? null
      pushRegions()
    },
    setMenuHitbox(rect) {
      hit.menu = rect ?? null
      pushRegions()
    },
    setFocusable(focusable) {
      bridge.setFocusable(Boolean(focusable))
    },

    // ── drag across displays ───────────────────────────────────────────────────
    dragStart(offsetX, offsetY) {
      bridge.beginDrag?.({ offsetX, offsetY, width: PET_BOX, height: PET_BOX })
    },
    dragEnd() {
      bridge.endDrag?.()
    },
    dragMouseUp() {
      bridge.endDrag?.()
    },
    onDragUpdate(cb) {
      return dragUpdate.add(cb)
    },
    onDragEnded(cb) {
      return dragEnded.add(cb)
    },
    onDragListenMouseUp(cb) {
      return dragListen.add(cb)
    },

    // ── the panel ───────────────────────────────────────────────────────────────
    panelOpen(petRect) {
      // The page passes screen pixels (its display's origin plus the avatar's
      // position); the shell anchors a panel to a box in this page's pixels.
      bridge.open(PANEL, {
        anchor: {
          x: petRect.x - window.screenX,
          y: petRect.y - window.screenY,
          width: petRect.width,
          height: petRect.height,
        },
      })
    },
    panelClose() {
      bridge.close(PANEL)
    },
    // The built-in recorded these and read them nowhere; the panel closes itself.
    panelHold() {},
    panelBreathing() {},
    onPanelClosed(cb) {
      return panelClosed.add(cb)
    },
    onPanelOpened(cb) {
      return panelOpenedSide.add(cb)
    },

    // ── the gallery ─────────────────────────────────────────────────────────────
    galleryOpen() {
      bridge.open(GALLERY)
    },
    galleryClose() {
      bridge.close(GALLERY)
    },
    onGalleryOpened(cb) {
      return galleryOpened.add(cb)
    },
    onGalleryClosed(cb) {
      return galleryClosed.add(cb)
    },
    appearanceChanged() {
      bridge.broadcast?.({ cc: 'appearance-changed' })
    },
    onAppearanceChanged(cb) {
      return appearanceChanged.add(cb)
    },

    // ── asks of the shell ───────────────────────────────────────────────────────
    async openSession(slotKey) {
      if (!bridge.showSession) return false
      return (await bridge.showSession(String(slotKey ?? ''))) === true
    },
    openExternal(url) {
      bridge.openExternal?.(url)
    },
    turnOff() {
      // The app is already disabled (the menu posts that first); close every window
      // now rather than at the shell's next reconcile tick.
      bridge.closeAll?.()
    },
    contextMenuAction() {},
  }
}
