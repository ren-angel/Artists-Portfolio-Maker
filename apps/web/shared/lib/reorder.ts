/** Moves one item in place; out-of-range moves are ignored. */
export function reorder<T>(list: T[], from: number, to: number) {
  if (
    to >= 0 &&
    to < list.length &&
    from >= 0 &&
    from < list.length &&
    from !== to
  )
    list.splice(to, 0, list.splice(from, 1)[0]);
}
