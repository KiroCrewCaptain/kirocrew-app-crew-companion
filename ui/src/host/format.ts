/**
 * The four dashboard formatters the companion uses that the App Kit SDK does not
 * export (`fmtUnit`, `fmtDateFields`, `fmtWeekday`, `fmtList`), with the
 * dashboard's own behaviour (`website/src/i18n/format.ts` in Kiro Crew): the
 * host's active language, `localeMatcher: 'lookup'`, and a dash for a value that
 * cannot be shown. The SDK's `fmtNumber` and `activeLocale` are the host's own.
 */
import { activeLocale, fmtNumber } from '@kirocrew/app-sdk'

/** The SDK's own clock-time formatter, the dashboard's. */
export { fmtTime } from '@kirocrew/app-sdk'

export type NumberOptions = Omit<Intl.NumberFormatOptions, 'localeMatcher'>
export type DateOptions = Omit<Intl.DateTimeFormatOptions, 'localeMatcher'>
export type DateFieldOptions = Omit<DateOptions, 'dateStyle' | 'timeStyle'>

export type FormatUnit =
  | 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
  | 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte' | 'terabyte'
  | 'kilobyte-per-second' | 'megabyte-per-second'

/** What the dashboard shows for a value it cannot format (U+2014). */
const NO_VALUE = '\u2014'

/** A millisecond timestamp below this is read as seconds, as the dashboard does. */
const SECONDS_CEILING = 1e11

function locale(): string {
  try {
    const value = activeLocale()
    return typeof value === 'string' && value ? value : 'en'
  } catch {
    return 'en'
  }
}

const formatters = new Map<string, unknown>()

function memo<T>(kind: string, lng: string, options: unknown, build: () => T): T {
  const key = `${kind}|${lng}|${JSON.stringify(options ?? null)}`
  const hit = formatters.get(key)
  if (hit !== undefined) return hit as T
  const made = build()
  formatters.set(key, made)
  return made
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    const d = new Date(value < SECONDS_CEILING ? value * 1000 : value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function dateTime(value: Date | string | number | null | undefined, options: DateOptions): string {
  const d = toDate(value)
  if (!d) return NO_VALUE
  const lng = locale()
  return memo('datetime', lng, options, () =>
    new Intl.DateTimeFormat(lng, { localeMatcher: 'lookup', ...options }),
  ).format(d)
}

/**
 * A value with a unit, `90m` or `512MB`. Every plain space becomes a no-break
 * space, so the number and its unit never wrap apart in any language.
 */
export function fmtUnit(value: number, unit: FormatUnit, options?: NumberOptions): string {
  if (!Number.isFinite(value)) return NO_VALUE
  return fmtNumber(value, { style: 'unit', unit, unitDisplay: 'narrow', ...options }).split(' ').join('\u00A0')
}

/** A date from explicit components (`weekday`, `hour`, ...), never a style preset. */
export function fmtDateFields(
  value: Date | string | number | null | undefined,
  options: DateFieldOptions,
): string {
  return dateTime(value, options)
}

const ISO_WEEK = [1, 2, 3, 4, 5, 6, 7]

/** A weekday name by ISO index, 1 = Monday to 7 = Sunday, whatever the host timezone. */
export function fmtWeekday(isoIndex: number, style: 'long' | 'short' | 'narrow' = 'short'): string {
  const idx = Math.trunc(isoIndex)
  if (!ISO_WEEK.includes(idx)) return NO_VALUE
  // 2024-01-01 was a Monday, so the day of the month is the ISO weekday index.
  return dateTime(new Date(Date.UTC(2024, 0, idx)), { weekday: style, timeZone: 'UTC' })
}

/** Join items the way the language joins them (`A, B and C`, `A、B和C`). */
export function fmtList(
  items: readonly string[],
  options?: { type?: 'conjunction' | 'disjunction' | 'unit'; style?: 'long' | 'short' | 'narrow' },
): string {
  const type = options?.type ?? 'conjunction'
  const style = options?.style ?? 'long'
  const lng = locale()
  return memo('list', lng, { type, style }, () =>
    new Intl.ListFormat(lng, { localeMatcher: 'lookup', type, style }),
  ).format(items.filter((item) => item !== ''))
}
