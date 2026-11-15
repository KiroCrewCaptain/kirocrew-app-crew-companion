import { useRef, useEffect, type KeyboardEvent } from 'react'

/**
 * How long after `compositionend` an Enter keydown still belongs to the IME.
 * On WebKit the keydown that commits a candidate arrives AFTER
 * `compositionend` with `isComposing` already false, so the native flags alone
 * cannot identify it — the tracked latch below outlives them by this window.
 */
const POST_COMPOSITION_MS = 50

/**
 * Hangul syllables, Jamo and compatibility Jamo. Korean has no candidate step:
 * the Enter that follows a Hangul commit is the user's own Enter, so it must
 * not fall inside the post-composition window. Hanja conversion commits Han
 * characters, which do not match, so that candidate Enter stays guarded.
 */
const HANGUL = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]$/

export interface ImeLatch {
  onCompositionStart: () => void
  /** `data` is the committed text; a Hangul commit opens no window. */
  onCompositionEnd: (data?: string) => void
  /** True while a composition is live or inside the post-composition window. */
  isLatched: () => boolean
  /** Clear the latch and any pending timer (stale-latch recovery). */
  reset: () => void
  /**
   * Native-event twin of `useImeGuard().claimEnter`: take ownership of a key
   * the caller has decided is a choose/submit key, and report whether to act.
   * `true` = act on it (the caller consumes it as part of acting). `false` =
   * the IME owns this keypress; the claim has already consumed it — always
   * `stopPropagation()` (so it cannot fall through to the host composer), and
   * `preventDefault()` only when both native signals are clear (the
   * post-composition latch window, where the browser would otherwise act).
   * A mid-composition key keeps its default action: the browser is consuming
   * it for the candidate commit or candidate navigation itself, and
   * cancelling that would eat the user's composition. Owning both halves in
   * one place is the point — a call site re-spelling the split is the drift
   * the `ImeEnterClaimRatchet` exists to prevent.
   */
  claimKey: (e: globalThis.KeyboardEvent) => boolean
  /**
   * SYNTHETIC-event twin of `claimKey`, for a React `onKeyDown` that claims
   * through a latch of this flavour. The latch consumes the NATIVE event;
   * React walks its OWN propagation flag when dispatching to component
   * ancestors, and the native `stopPropagation()` does not set it — so a
   * declined key needs both halves or it still reaches an ancestor's
   * keyboard handling.
   *
   * It exists so no call site has to spell that pair itself. Reaching for
   * `claimKey(e.nativeEvent)` and remembering a caller-side
   * `e.stopPropagation()` is the same split-the-halves drift the
   * `ImeEnterClaimRatchet` pins everywhere else: four sites carried it, each
   * one a place one half could be dropped. An ACCEPTED key's default is left
   * to the caller, exactly as `claimKey` leaves it — a Tab site consumes only
   * the wrap it owns.
   */
  claimSyntheticKey: (e: KeyboardEvent) => boolean
}

/**
 * The tracked half of the IME guard, framework-free so both event worlds share
 * ONE latch spelling: `useImeGuard` layers it under React synthetic events, and
 * native-event listeners (document-level keydown handlers, which never see a
 * synthetic event and therefore cannot call `claimEnter`) consume it directly —
 * `useListKeyboardNav` is the reference consumer. A private flag-and-timer copy
 * in a native handler is exactly the drift the `ImeEnterClaimRatchet` pins.
 *
 * `latched` stays true from `compositionstart` until POST_COMPOSITION_MS after
 * `compositionend`. The timer handle is cleared on every new
 * `compositionstart`, so a stale timer cannot flip the latch back to false
 * while a follow-up (back-to-back) composition is mid-flight.
 */
export function createImeLatch(): ImeLatch {
  let latched = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const isLatched = () => latched
  const claimKey = (e: globalThis.KeyboardEvent) => {
    const composing = latched || e.isComposing || e.keyCode === 229
    if (!composing) return true
    if (!e.isComposing && e.keyCode !== 229) e.preventDefault()
    e.stopPropagation()
    return false
  }
  return {
    onCompositionStart() {
      clearTimeout(timer)
      latched = true
    },
    onCompositionEnd(data?: string) {
      if (data && HANGUL.test(data)) { clearTimeout(timer); latched = false; return }
      latched = true
      timer = setTimeout(() => { latched = false }, POST_COMPOSITION_MS)
    },
    isLatched,
    reset() {
      clearTimeout(timer)
      latched = false
    },
    claimKey,
    claimSyntheticKey(e: KeyboardEvent) {
      if (claimKey(e.nativeEvent)) return true
      e.stopPropagation()
      return false
    },
  }
}

/**
 * Document-tracked IME latch for keydown handlers that trap Tab at a dialog's
 * focus boundary (`useDialogFocusTrap` and the hand-rolled traps that share
 * its shape), rather than each re-implementing the flag-and-timer semantics
 * (the drift the `ImeEnterClaimRatchet` pins).
 *
 * Both event worlds consume it, and each has its own claim: a NATIVE
 * document/window listener (which never sees a synthetic event, so
 * `useImeGuard().claimEnter` cannot consume for it) claims with `claimKey(e)`;
 * a React `onKeyDown` on the dialog panel claims with `claimSyntheticKey(e)`,
 * which adds the synthetic propagation half React needs. What makes the latch
 * document-tracked is the composing input's position, not the handler's
 * flavour — see the tracking note below.
 *
 * Composition tracking listens at DOCUMENT capture: the composing input is
 * anywhere inside the dialog, so element-scoped listeners have nothing
 * reliable to attach to.
 *
 * `enabled` keys the tracking lifecycle and nothing else, so the latch
 * survives the host's own re-renders: the commit's input event re-renders the
 * host right before the committing keydown arrives, and a latch reset riding
 * along on that churn would clear the post-composition window at exactly the
 * moment it matters. A re-enabled latch does NOT inherit state from its
 * disabled span — a composition that ended (or was abandoned) while the latch
 * was off would otherwise strand it.
 *
 * Stranded-latch recovery ships with the tracking: a composition abandoned
 * WITHOUT `compositionend` (focus moves off the input mid-composition, an
 * OS-level IME cancel) would otherwise leave the latch set — and a latched
 * guard consumes the keys it declines, so the trap would silently stop
 * cycling for the dialog's lifetime. `focusout` at document capture is the
 * recovery signal.
 *
 * The returned latch is identity-stable for the host's lifetime (it lives in
 * a ref), so listing it in an effect dependency array never re-runs the
 * effect.
 */
export function useDocumentImeLatch(enabled = true): ImeLatch {
  const latchRef = useRef<ImeLatch>()
  if (!latchRef.current) latchRef.current = createImeLatch()
  const latch = latchRef.current
  useEffect(() => {
    if (!enabled) return
    latch.reset()
    const onCompositionStart = () => latch.onCompositionStart()
    const onCompositionEnd = () => latch.onCompositionEnd()
    const onRecover = () => latch.reset()
    document.addEventListener('compositionstart', onCompositionStart, true)
    document.addEventListener('compositionend', onCompositionEnd, true)
    document.addEventListener('focusout', onRecover, true)
    return () => {
      document.removeEventListener('compositionstart', onCompositionStart, true)
      document.removeEventListener('compositionend', onCompositionEnd, true)
      document.removeEventListener('focusout', onRecover, true)
      // Drop any pending post-composition timer with the listeners so a timer
      // from a disabled span cannot fire into the next enablement.
      latch.reset()
    }
  }, [enabled, latch])
  return latch
}

/**
 * Guard against IME composition Enter falsely triggering submit handlers.
 *
 * IME (Chinese/Japanese/Korean) sends a final Enter to commit the composition.
 * React's synthetic `isComposing` is sometimes false on that final Enter, so
 * this hook layers multiple guards:
 *
 *   1. the tracked latch (`createImeLatch`) - true from compositionStart until
 *                                    50ms after compositionEnd (timer-based)
 *   2. `e.nativeEvent.isComposing` - native browser flag
 *   3. `e.keyCode === 229`         - "IME processing" keyCode some browsers
 *                                    emit while composition is in flight even
 *                                    after isComposing flips to false
 *
 * **Sharing a single hook instance across multiple inputs:** If the hosting
 * component unmounts an input mid-composition (e.g. Escape cancels a rename
 * and removes the input from the tree), `compositionEnd` will never fire and
 * the latch would stay set forever, blocking Enter on every input that
 * shares this hook. Recovery therefore ships WITH the tracking: the only
 * composition binding this hook exposes carries the blur reset, so a surface
 * cannot opt out of it by omission. That matters more now than it used to,
 * because `claimEnter` also consumes the keypresses a latched guard declines —
 * the failure mode is a surface that silently stops sending rather than one
 * that visibly inserts newlines.
 *
 * **A swallowed Enter still has to be consumed.** Deciding not to submit is not
 * the same as declining the keypress: on a multiline input the browser's default
 * for an Enter nobody claimed is to insert a literal newline, so a guard that
 * returns early without `preventDefault` turns "this Enter belongs to the IME"
 * into "corrupt the user's draft". `claimEnter` exists so no call site has to
 * remember that. It suppresses the default only where the browser would
 * otherwise act — both native signals clear — and leaves a keypress the IME is
 * itself consuming alone. The window this matters in is not hypothetical: the
 * latch timer above outlives the native signals by 50ms, and a fast
 * typist's send lands inside it.
 *
 * Usage (simple Enter/Escape inputs):
 *   const ime = useImeGuard()
 *   <input {...ime.bindEnter({ onEnter: submit, onEscape: cancel, onBlur: commit })} />
 *
 * Usage (custom onKeyDown logic):
 *   <textarea
 *     {...ime.bindComposition()}
 *     onKeyDown={e => {
 *       if (e.key === 'Enter' && !e.shiftKey) { if (ime.claimEnter(e)) submit(); return }
 *       if (e.key === 'Escape') { ime.reset(); ... }
 *     }}
 *   />
 */
