/**
 * The avatar window (`pet`): one copy on every display, the avatar on one of them.
 * The hidden owner (`notifier`) runs the same component in its owner role.
 */
import petCss from '../pet.window.css?inline'
import { Companion } from '../pet'
import { WindowRoot } from '../desktop/WindowRoot'

export default function PetWindow() {
  return (
    <WindowRoot css={petCss} cssId="pet-window" revealOnPaint={false}>
      <Companion />
    </WindowRoot>
  )
}
