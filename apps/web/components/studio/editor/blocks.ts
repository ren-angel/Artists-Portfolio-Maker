import type { Block } from "@studio/shared";
import { t, type Key, type Lang } from "../../../lib/copy";

const key = (type: Block["type"]): Key => (type === "hero" ? "heroBlock" : type);
export const blockName = (l: Lang, type: Block["type"]) => t(l, key(type));

/** Library order and hints follow Design/src/data/muralia.js BLOCK_LIBRARY,
    limited to the section types the shared renderer supports. */
export const library: { type: Block["type"]; hint: [string, string] }[] = [
  { type: "hero", hint: ["Big opening statement", "Abertura de impacto"] },
  { type: "richText", hint: ["Paragraph with emphasis", "Parágrafo com ênfase"] },
  { type: "heading", hint: ["A section title", "Um título de seção"] },
  { type: "image", hint: ["One large artwork", "Uma obra em destaque"] },
  { type: "galleryGrid", hint: ["Grid of works", "Grade de obras"] },
  { type: "featured", hint: ["Hand-picked pieces", "Peças escolhidas"] },
  { type: "galleryPreview", hint: ["Links to galleries", "Links para galerias"] },
  { type: "about", hint: ["Photo and short bio", "Foto e bio curta"] },
  { type: "social", hint: ["Where to find you", "Onde te encontrar"] },
  { type: "contact", hint: ["How to reach you", "Como falar com você"] },
  { type: "cta", hint: ["One clear button", "Um botão claro"] },
  { type: "divider", hint: ["A drawn line", "Uma linha desenhada"] },
  { type: "spacer", hint: ["Room to breathe", "Espaço entre seções"] },
  { type: "contactLinks", hint: ["Email, WhatsApp, links", "E-mail, WhatsApp, links"] },
  { type: "commissionStatus", hint: ["Open, closed or waitlist", "Abertas, fechadas ou espera"] },
  { type: "commissionPrices", hint: ["Types and prices", "Tipos e valores"] },
  { type: "commissionTerms", hint: ["Rules and terms", "Regras e termos"] },
];

export const takesArt = (type: Block["type"]) => ["hero", "image", "about"].includes(type);
export const takesGallery = (type: Block["type"]) => ["galleryGrid", "galleryPreview"].includes(type);
export const takesText = (type: Block["type"]) =>
  ["hero", "richText", "about", "contact", "image", "cta", "featured", "heading", "galleryGrid"].includes(type);
export const takesLink = (type: Block["type"]) => ["cta", "contact", "hero", "about"].includes(type);
export const isCommission = (type: Block["type"]) => type.startsWith("commission") || type === "contactLinks";
