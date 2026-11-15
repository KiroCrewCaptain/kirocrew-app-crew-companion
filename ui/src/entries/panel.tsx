/** The panel window, opened beside the avatar. */
import panelCss from '../panel.window.css?inline'
import { Panel } from '../panel'
import { WindowRoot } from '../desktop/WindowRoot'

export default function PanelWindow() {
  return (
    <WindowRoot css={panelCss} cssId="panel-window" revealOnPaint>
      <Panel />
    </WindowRoot>
  )
}
