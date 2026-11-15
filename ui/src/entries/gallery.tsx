/**
 * The avatar gallery window. GalleryPanel owns the whole surface, including its
 * own close button and Escape handling, because the window is frameless.
 */
import galleryCss from '../gallery.window.css?inline'
import { GalleryPanel } from '../GalleryPanel'
import { WindowRoot } from '../desktop/WindowRoot'

export default function GalleryWindow() {
  return (
    <WindowRoot css={galleryCss} cssId="gallery-window" revealOnPaint>
      <GalleryPanel />
    </WindowRoot>
  )
}
