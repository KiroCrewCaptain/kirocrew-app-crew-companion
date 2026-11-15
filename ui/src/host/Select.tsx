/**
 * The dashboard's select as the reminder editor and the sprite importer used it
 * (`SimpleSelect`): the host's own themed dropdown (`Select` from
 * `@kirocrew/app-sdk/ui`), or a native `<select>` on a host without one.
 *
 * Two things `SimpleSelect` did that the host's narrowed `Select` does not take as
 * props are kept here: `style` lands on a wrapper (where `SimpleSelect` put it),
 * and a ref focuses the control, which the schedule editor uses to put the
 * keyboard on its first field when it opens.
 */
import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from 'react'
import * as ui from '@kirocrew/app-sdk/ui'
import type { SelectProps as HostSelectProps } from '@kirocrew/app-sdk/ui'
import NativeSelect from './NativeSelect'

export type SelectProps = HostSelectProps & { style?: CSSProperties }

const HostSelect = ('Select' in ui ? ui.Select : undefined) ?? NativeSelect

const Select = forwardRef<{ focus(): void }, SelectProps>(function Select({ style, ...props }, ref) {
  const wrapper = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => ({
    focus() {
      wrapper.current?.querySelector<HTMLElement>('button, select, [tabindex]')?.focus()
    },
  }), [])
  return (
    <div ref={wrapper} style={style}>
      <HostSelect {...props} />
    </div>
  )
})

export default Select
