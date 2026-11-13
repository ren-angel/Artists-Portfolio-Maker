import { initialDraft, type Draft, type Template } from "@studio/shared";
import type { Lang } from "./copy";
const names = {
  gallery: "Nina Flores",
  creative: "Luna Mori",
  showcase: "Theo Vale",
  story: "Mika Sora",
};
const titles = {
  gallery: ["Studies in stillness", "Estudos de quietude"],
  creative: ["A little paper garden", "Um jardim de papel"],
  showcase: ["The last observatory", "O último observatório"],
  story: ["Letters from the ferry", "Cartas da travessia"],
};
export const print = (template: Template) => "/prints/" + template + ".webp";
export function demo(template: Template, lang: Lang): Draft {
  const draft = initialDraft(names[template], lang);
  draft.theme.template = template;
  const art = {
    id: crypto.randomUUID(),
    assetId: crypto.randomUUID(),
    title: titles[template][lang === "en" ? 0 : 1],
    description: "",
    alt: titles[template][lang === "en" ? 0 : 1],
    featured: true,
  };
  draft.artworks = [art];
  const hero = draft.pages[0].blocks[0];
  hero.heading = draft.title;
  hero.text = art.title;
  hero.artId = art.id;
  return draft;
}
