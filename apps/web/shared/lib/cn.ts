/** Joins conditional class names. */
export const cn = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");
