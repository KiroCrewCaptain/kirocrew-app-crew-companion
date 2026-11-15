/**
 * The two bridges the companion's desktop windows meet.
 *
 * `DesktopWindowBridge` is what the Kiro Crew desktop shell exposes in a window
 * it hosts for an app (`window.kirocrewDesktopWindow`; Kiro Crew's
 * `website/src/desktopWindow/desktopWindowTarget.ts`). The level 2 calls are
 * optional because a shell of an older version may load the page.
 *
 * `Preload` is the `window.crewCompanion` surface the companion's pages call,
 * the built-in's own preload, which `companionShell.ts` now builds over the
 * shell's bridge.
 */

export interface DesktopWindowBox { x: number; y: number; width: number; height: number }

export interface DesktopWindowBridge {
  level: number
  app: string
  window: string
  kind: string
  ready(): void
  close(windowId?: string): void
  open(windowId: string, options?: { anchor?: DesktopWindowBox }): void
  setHitRegions(regions: DesktopWindowBox[]): void
  setFocusable(focusable: boolean): void
  onShortcut(cb: (id: string) => void): () => void
  closeAll?(): void
  send?(windowId: string, message: unknown): void
  broadcast?(message: unknown): void
  onMessage?(cb: (fromWindowId: string, message: unknown) => void): () => void
  onWindowChange?(cb: (windowId: string, open: boolean) => void): () => void
  onPlaced?(cb: (placement: { side: 'left' | 'right' }) => void): () => void
  onActive?(cb: (state: { active: boolean; x?: number; y?: number; dragging?: boolean }) => void): () => void
  beginDrag?(drag: { offsetX: number; offsetY: number; width: number; height: number }): void
  endDrag?(): void
  onDrag?(cb: (phase: 'start' | 'move' | 'end', x?: number, y?: number) => void): () => void
  showSession?(slotKey: string): Promise<boolean>
  openExternal?(url: string): void
}

/** A box as the companion's pages report it. */
export interface HitRect { x: number; y: number; w: number; h: number }

export interface Preload {
  onSetOwner(cb: (isOwner: boolean) => void): () => void
  onSetActive(cb: (active: boolean, x?: number, y?: number, isDragging?: boolean) => void): () => void
  petReady(): void
  reportBubbleState(bubble: unknown, slot?: unknown, seq?: unknown): void
  onRenderBubble(cb: (bubble: unknown, playReaction?: boolean) => void): () => void
  bubbleAction(action: unknown): void
  onBubbleAction(cb: (action: unknown) => void): () => void
  reportWindowCommand(cmd: unknown): void
  onWindowCommand(cb: (cmd: unknown) => void): () => void
  onRehydrateSlot(cb: (slot: unknown) => void): () => void
  updateHitbox(pet: HitRect | null, bubble: HitRect | null): void
  setMenuHitbox(rect: HitRect | null): void
  setFocusable(focusable: boolean): void
  dragStart(offsetX: number, offsetY: number): void
  dragEnd(): void
  dragMouseUp(): void
  onDragUpdate(cb: (x: number, y: number) => void): () => void
  onDragEnded(cb: (x: number, y: number) => void): () => void
  onDragListenMouseUp(cb: () => void): () => void
  panelOpen(petRect: { x: number; y: number; width: number; height: number }): void
  panelClose(): void
  panelHold(hold: boolean): void
  panelBreathing(active: boolean): void
  onPanelClosed(cb: () => void): () => void
  onPanelOpened(cb: (side: 'left' | 'right') => void): () => void
  galleryOpen(): void
  galleryClose(): void
  onGalleryOpened(cb: () => void): () => void
  onGalleryClosed(cb: () => void): () => void
  appearanceChanged(): void
  onAppearanceChanged(cb: () => void): () => void
  openSession(slotKey: string): Promise<boolean>
  openExternal(url: string): void
  turnOff(): void
  contextMenuAction(action: string): void
}
