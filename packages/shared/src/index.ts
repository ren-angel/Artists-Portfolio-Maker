import { z } from "zod";

export const templateNames = [
  "gallery",
  "creative",
  "showcase",
  "story",
] as const;
export const blockTypes = [
  "hero",
  "heading",
  "richText",
  "image",
  "featured",
  "galleryPreview",
  "galleryGrid",
  "about",
  "social",
  "contact",
  "cta",
  "divider",
] as const;
export const defaults = {
  sites: 1,
  pages: 5,
  artworks: 50,
  storage: 200 * 1024 ** 2,
  upload: 12 * 1024 ** 2,
  pixels: 32_000_000,
};
export const reserved = new Set(
  "www app api admin support help billing assets media cdn mail status static studio dashboard auth preview gallery galleries sitemap robots localhost site demo report prints ftp smtp mailer cdn-assets security postmaster abuse".split(
    " ",
  ),
);
export const slug = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const reservedPages = new Set([
  "api",
  "site",
  "studio",
  "auth",
  "preview",
  "report",
  "demo",
  "prints",
  "galleries",
]);
export const handle = slug.min(3).refine((s) => !reserved.has(s));
const id = z.uuid();
const short = z.string().trim().min(1).max(120);
export const safeLink = z
  .string()
  .max(500)
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  });
const color = z.string().regex(/^#[a-fA-F0-9]{6}$/);
export const themeSchema = z.object({
  template: z.enum(templateNames),
  accent: color,
  palette: z.enum(["original", "warm", "cool", "noir"]).default("original"),
  font: z.enum(["template", "serif", "sans", "mono"]),
  nav: z.enum(["split", "center", "stack"]),
});
export const blockSchema = z.object({
  version: z.literal(1),
  id,
  type: z.enum(blockTypes),
  heading: z.string().max(160),
  text: z.string().max(10000),
  visible: z.boolean(),
  layout: z.enum(["left", "center", "right"]),
  background: z.enum(["none", "tint", "paper"]),
  spacing: z.enum(["compact", "normal", "roomy"]),
  artId: id.nullable(),
  galleryId: id.nullable(),
  url: z.union([safeLink, z.literal("")]),
});
export const pageSchema = z.object({
  id,
  title: short,
  slug,
  inNav: z.boolean(),
  blocks: z.array(blockSchema).max(60),
});
export const gallerySchema = z.object({
  id,
  title: short,
  slug,
  description: z.string().max(2000),
  visible: z.boolean(),
  cover: id.nullable(),
  artIds: z.array(id).max(1000),
});
export const artSchema = z.object({
  id,
  assetId: id,
  title: short,
  description: z.string().max(2000),
  alt: z.string().max(500),
  featured: z.boolean(),
});
export const draftSchema = z
  .object({
    version: z.literal(1),
    title: short,
    description: z.string().max(320),
    language: z.enum(["pt-BR", "en"]),
    home: id,
    step: z.number().int().min(2).max(7),
    theme: themeSchema,
    social: z.array(safeLink).max(10),
    pages: z.array(pageSchema).min(1).max(100),
    galleries: z.array(gallerySchema).max(100),
    artworks: z.array(artSchema).max(1000),
  })
  .superRefine((d, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    const unique = (values: string[]) => new Set(values).size === values.length;
    for (const items of [d.pages, d.galleries, d.artworks])
      if (!unique(items.map((i) => i.id))) issue("duplicate_id");
    if (
      !unique(d.pages.map((p) => p.slug)) ||
      !unique(d.galleries.map((g) => g.slug))
    )
      issue("duplicate_slug");
    if (d.pages.some((p) => reservedPages.has(p.slug))) issue("reserved_slug");
    if (!d.pages.some((p) => p.id === d.home)) issue("missing_home");
    const art = new Set(d.artworks.map((a) => a.id));
    const galleries = new Set(d.galleries.map((g) => g.id));
    for (const g of d.galleries)
      if (
        !unique(g.artIds) ||
        g.artIds.some((a) => !art.has(a)) ||
        (g.cover && !art.has(g.cover))
      )
        issue("invalid_gallery_reference");
    for (const p of d.pages) {
      if (!unique(p.blocks.map((b) => b.id))) issue("duplicate_block");
      for (const b of p.blocks)
        if (
          (b.artId && !art.has(b.artId)) ||
          (b.galleryId && !galleries.has(b.galleryId))
        )
          issue("invalid_block_reference");
    }
  });
export type Draft = z.infer<typeof draftSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Art = z.infer<typeof artSchema>;
export type Template = (typeof templateNames)[number];
export function newBlock(type: Block["type"]): Block {
  return {
    id: crypto.randomUUID(),
    version: 1,
    type,
    heading: "",
    text: "",
    visible: true,
    layout: "left",
    background: "none",
    spacing: "normal",
    artId: null,
    galleryId: null,
    url: "",
  };
}
export function initialDraft(
  title: string,
  language: Draft["language"] = "pt-BR",
): Draft {
  const home = crypto.randomUUID();
  return {
    version: 1,
    title,
    description: "",
    language,
    step: 2,
    home,
    theme: {
      template: "gallery",
      accent: "#b87358",
      palette: "original",
      font: "template",
      nav: "split",
    },
    social: [],
    pages: [
      {
        id: home,
        title: language === "en" ? "Home" : "Início",
        slug: "home",
        inNav: true,
        blocks: [
          newBlock("hero"),
          newBlock("featured"),
          newBlock("galleryPreview"),
        ],
      },
    ],
    galleries: [],
    artworks: [],
  };
}
export function publishable(draft: Draft): Draft {
  const galleries = draft.galleries.filter((g) => g.visible);
  const allowed = new Set(galleries.map((g) => g.id));
  const used = new Set(
    galleries.flatMap((g) => (g.cover ? [...g.artIds, g.cover] : g.artIds)),
  );
  const pages = draft.pages.map((p) => ({
    ...p,
    blocks: p.blocks
      .filter((b) => b.visible && (!b.galleryId || allowed.has(b.galleryId)))
      .map((b) => {
        if (b.artId) used.add(b.artId);
        if (b.type === "featured")
          for (const art of draft.artworks) if (art.featured) used.add(art.id);
        return b;
      }),
  }));
  return draftSchema.parse({
    ...draft,
    pages,
    galleries,
    artworks: draft.artworks.filter((a) => used.has(a.id)),
  });
}
export function tenantFromHost(host: string, domain: string): string | null {
  const value = host.toLowerCase().replace(/:\d+$/, "");
  if (!value.endsWith("." + domain)) return null;
  const name = value.slice(0, -domain.length - 1);
  return handle.safeParse(name).success ? name : null;
}
