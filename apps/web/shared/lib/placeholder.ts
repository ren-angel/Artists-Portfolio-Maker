import type { Lang } from "./copy";

/** Stand-in shown wherever demonstration artwork will be added later. */
export const placeholderArt = (lang: Lang) =>
  lang === "en" ? "/placeholders/art-en.svg" : "/placeholders/art-pt.svg";
