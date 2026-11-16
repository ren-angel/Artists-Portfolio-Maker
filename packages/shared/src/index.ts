import { z } from "zod";
import { plans, type Features, type PlanId } from "./plans.ts";
import { creativeSchema, creativeBlockTypes, youtubeVideoId } from "./creative.ts";
export * from "./creative.ts";
export * from "./plans.ts";
export * from "./legal.ts";

export const templateNames = [
  "gallery",
  "creative",
  "showcase",
  "story",
] as const;
export const blockTypes = [
  ...creativeBlockTypes,
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
  "spacer",
  "commissionStatus",
  "commissionPrices",
  "commissionTerms",
  "contactLinks",
] as const;
/** Sections that require the commissions feature to be published. */
export const commissionBlocks = new Set<string>([
  "commissionStatus",
  "commissionPrices",
  "commissionTerms",
]);
export const defaults = { ...plans.free.limits, pixels: 32_000_000 };
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
  "works",
  "go",
  "legal",
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
/* Schema revision 1.1: every field added after Phase 1 is optional with a
   default, so stored drafts and published snapshots parse unchanged. */
export const palettes = ["original", "warm", "cool", "noir", "blush", "sage", "midnight"] as const;
export const fontChoices = ["template", "serif", "sans", "mono", "editorial", "grotesk", "storybook"] as const;
export const themeSchema = z.object({
  template: z.enum(templateNames),
  accent: color,
  palette: z.enum(palettes).default("original"),
  font: z.enum(fontChoices),
  nav: z.enum(["split", "center", "stack"]),
  radius: z.enum(["template", "square", "soft", "round"]).default("template"),
  shadow: z.enum(["template", "none", "soft", "lifted"]).default("template"),
  hover: z.enum(["template", "none", "zoom", "lift"]).default("template"),
  aspect: z.enum(["template", "square", "portrait", "landscape", "original"]).default("template"),
  grid: z.enum(["template", "uniform", "masonry"]).default("template"),
  sectionScale: z.number().min(0.65).max(1.5).default(1),
  paperTexture: z.boolean().default(false),
  showBranding: z.boolean().default(false),
  footerText: z.string().max(200).default(""),
  footerSocial: z.boolean().default(true),
});
export type Theme = z.infer<typeof themeSchema>;
export const blockSchema = z
  .object({
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
    url: z.union([safeLink, z.literal(""), z.literal("portfolio:commissions")]),
    pageId: id.optional(),
    parentId: id.optional(),
    columns: z.union([z.literal(2), z.literal(3)]).optional(),
    tabletColumns: z.union([z.literal(1), z.literal(2)]).optional(),
    decoration: z.enum(["gradient", "dots", "frame", "soft", "reveal"]).optional(),
    typography: z.enum(["serif", "sans", "mono"]).optional(),
    /** Studio plan: an artwork shown behind the section. */
    bgArtId: id.nullable().default(null),
  })
  .superRefine((b, ctx) => {
    if (!b.url) return;
    if (
      (b.type === "videoEmbed" && !youtubeVideoId(b.url)) ||
      (["profileLink", "downloadLink"].includes(b.type) && !safeLink.safeParse(b.url).success)
    )
      ctx.addIssue({ code: "custom", message: "invalid_link" });
  });
export const pageSchema = z.object({
  id,
  title: short,
  slug,
  inNav: z.boolean(),
  creative: creativeSchema.optional(),
  blocks: z.array(blockSchema).max(60),
});
export const gallerySchema = z.object({
  id,
  title: short,
  slug,
  description: z.string().max(2000),
  visible: z.boolean(),
  cover: id.nullable(),
  artIds: z.array(id).max(plans.studio.limits.artworks),
});
export const artworkDetailKeys = ["year", "medium", "dimensions", "edition", "availability"] as const;
export const artSchema = z.object({
  id,
  assetId: id,
  width:z.int().positive().optional(),height:z.int().positive().optional(),
  title: short,
  description: z.string().max(2000),
  alt: z.string().max(500),
  featured: z.boolean(),
  details: z.partialRecord(z.enum(artworkDetailKeys), z.string().trim().max(160)).optional(),
});
const contactSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("email"), label: z.string().max(40), value: z.email().max(254) }),
  z.object({ kind: z.literal("whatsapp"), label: z.string().max(40), value: z.string().regex(/^\+?\d{8,15}$/) }),
  z.object({ kind: z.literal("link"), label: z.string().max(40), value: safeLink }),
]);
export type Contact = z.infer<typeof contactSchema>;
export const commissionSchema = z.object({
  status: z.enum(["open", "closed", "waitlist"]).default("closed"),
  currency: z.string().regex(/^[A-Z]{3}$/).default("BRL"),
  note: z.string().max(300).default(""),
  turnaround: z.string().max(120).default(""),
  types: z
    .array(
      z.object({
        id,
        name: z.string().trim().min(1).max(60),
        description: z.string().max(500),
        priceFrom: z.number().nonnegative().max(1_000_000).nullable(),
        priceTo: z.number().nonnegative().max(1_000_000).nullable(),
        turnaround: z.string().max(80),
        artId: id.nullable(),
        galleryId: id.nullable().optional(),
        visible: z.boolean(),
      }),
    )
    .max(20)
    .default([]),
  terms: z.string().max(5000).default(""),
  allowed: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  disallowed: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  contacts: z.array(contactSchema).max(10).default([]),
});
export type Commissions = z.infer<typeof commissionSchema>;
/** Safe outbound URL for a contact entry; never a script or data URL. */
export function contactHref(c: Contact) {
  if (c.kind === "email") return "mailto:" + c.value;
  if (c.kind === "whatsapp") return "https://wa.me/" + c.value.replace(/\D/g, "");
  return c.value;
}
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
    artworks: z.array(artSchema).max(plans.studio.limits.artworks),
    commissions: commissionSchema.default(commissionSchema.parse({})),
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
    const pageIds = new Set(d.pages.map(p => p.id));
    for (const p of d.pages) {
      const c = p.creative;
      if (c) {
        if (!c.visible && p.id === d.home) issue("hidden_home");
        for (const collection of [c, ...c.chapters])
          if (
            collection.artIds.some((id) => !art.has(id)) ||
            (collection.cover && !art.has(collection.cover))
          )
            issue("invalid_creative_art");
        if (c.related.some((id) => !pageIds.has(id) || id === p.id)) issue("invalid_related_page");
      }
      const byId = new Map(p.blocks.map((b) => [b.id, b]));
      for (const b of p.blocks) {
        if (b.pageId && !pageIds.has(b.pageId)) issue("invalid_page_reference");
        let node = b;
        for (let level = 0; node.parentId; level++) {
          const parent = byId.get(node.parentId);
          if (level >= 2 || parent?.type !== "columns") {
            issue("invalid_container");
            break;
          }
          node = parent;
        }
      }
      if (!unique(p.blocks.map((b) => b.id))) issue("duplicate_block");
      for (const b of p.blocks)
        if (
          (b.artId && !art.has(b.artId)) ||
          (b.bgArtId && !art.has(b.bgArtId)) ||
          (b.galleryId && !galleries.has(b.galleryId))
        )
          issue("invalid_block_reference");
    }
    for (const c of d.commissions.types)
      if ((c.artId && !art.has(c.artId)) || (c.galleryId && !galleries.has(c.galleryId))) issue("invalid_commission_reference");
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
    bgArtId: null,
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
      radius: "template",
      shadow: "template",
      hover: "template",
      aspect: "template",
      grid: "template",
      sectionScale: 1,
      paperTexture: false,
      showBranding: false,
      footerText: "",
      footerSocial: true,
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
    commissions: commissionSchema.parse({}),
  };
}
/** Plan-gated choices fall back to template defaults when the plan lacks
    them, so a downgrade never deletes the draft, only what is published. */
export function entitle(draft: Draft, features: Features): Draft {
  const d = structuredClone(draft);
  const t = d.theme;
  if (features.appearance === "basic") {
    Object.assign(t, { radius: "template", shadow: "template", hover: "template", aspect: "template", sectionScale: 1, paperTexture: false, footerText: "" });
    if (!["original", "warm", "cool", "noir"].includes(t.palette)) t.palette = "original";
    if (!["template", "serif", "sans", "mono"].includes(t.font)) t.font = "template";
  }
  if (features.appearance !== "advanced") {
    t.grid = "template";
    for (const p of d.pages) for (const b of p.blocks) b.bgArtId = null;
  }
  if (!features.commissions)
    for (const p of d.pages) p.blocks = p.blocks.filter((b) => !commissionBlocks.has(b.type));
  return d;
}
export function publishable(draft: Draft, plan: PlanId = "free"): Draft {
  draft = entitle(draft, plans[plan].features);
  const galleries = draft.galleries.filter((g) => g.visible);
  const allowed = new Set(galleries.map((g) => g.id));
  const used = new Set(
    galleries.flatMap((g) => (g.cover ? [...g.artIds, g.cover] : g.artIds)),
  );
  const included = draft.pages.filter((p) => !p.creative || p.creative.visible);
  const pageIds = new Set(included.map((p) => p.id));
  for (const p of included) {
    const c = p.creative;
    if (!c) continue;
    if (c.sale && !c.sale.available) c.sale.checkout = "";
    c.chapters = c.chapters.filter((h) => h.visible);
    c.related = c.related.filter((id) => pageIds.has(id));
    for (const item of [c, ...c.chapters]) {
      if (item.cover) used.add(item.cover);
      item.artIds.forEach((id) => used.add(id));
    }
  }
  const pages = included.map((p) => ({
    ...p,
    blocks: p.blocks
      .filter((b) =>
        blockVisible(
          b,
          p.blocks,
          (b) => (!b.pageId || pageIds.has(b.pageId)) && (!b.galleryId || allowed.has(b.galleryId)),
        ),
      )
      .map((b) => {
        if (b.artId) used.add(b.artId);
        if (b.bgArtId) used.add(b.bgArtId);
        if (b.type === "featured") for (const art of draft.artworks) if (art.featured) used.add(art.id);
        if (b.type === "commissionPrices")
          for (const c of draft.commissions.types) if (c.artId && c.visible) used.add(c.artId);
        return b;
      }),
  }));
  return draftSchema.parse({
    ...draft,
    pages,
    galleries,
    artworks: draft.artworks.filter((a) => used.has(a.id)),
    commissions: {
      ...draft.commissions,
      types: draft.commissions.types.filter(c => c.visible).map((c) => ({ ...c, galleryId: c.galleryId && allowed.has(c.galleryId) ? c.galleryId : null, artId: c.artId && used.has(c.artId) ? c.artId : null })),
    },
  });
}
export function blockVisible(block: Block, blocks: Block[], allowed: (block: Block) => boolean): boolean {
  if (!block.visible || !allowed(block)) return false;
  if (!block.parentId) return true;
  const parent = blocks.find((b) => b.id === block.parentId);
  return !!parent && blockVisible(parent, blocks, allowed);
}
export function cleanPageReferences(d: Draft) {
  const arts = new Set(d.artworks.map((a) => a.id));
  const galleries = new Set(d.galleries.map((g) => g.id));
  const pages = new Set(d.pages.map((p) => p.id));
  for (const p of d.pages) {
    if (p.creative) {
      p.creative.related = p.creative.related.filter((id) => pages.has(id));
      for (const item of [p.creative, ...p.creative.chapters]) {
        item.artIds = item.artIds.filter((id) => arts.has(id));
        if (item.cover && !arts.has(item.cover)) item.cover = null;
      }
    }
    const containers = new Set(p.blocks.filter((b) => b.type === "columns").map((b) => b.id));
    for (const b of p.blocks) {
      if (b.parentId && !containers.has(b.parentId)) delete b.parentId;
      if (b.artId && !arts.has(b.artId)) b.artId = null;
      if (b.bgArtId && !arts.has(b.bgArtId)) b.bgArtId = null;
      if (b.galleryId && !galleries.has(b.galleryId)) b.galleryId = null;
      if (b.pageId && !pages.has(b.pageId)) delete b.pageId;
    }
  }
}
export function removeGallery(draft: Draft, id: string) {
  draft.galleries = draft.galleries.filter(g => g.id !== id);
  for (const page of draft.pages)
    for (const block of page.blocks) if (block.galleryId === id) block.galleryId = null;
  for (const type of draft.commissions.types) if (type.galleryId === id) type.galleryId = null;
}

export function tenantFromHost(host: string, domain: string): string | null {
  const value = host.toLowerCase().replace(/:\d+$/, "");
  if (!value.endsWith("." + domain)) return null;
  const name = value.slice(0, -domain.length - 1);
  return handle.safeParse(name).success ? name : null;
}

/** Account-level visibility controls take effect immediately, independently of draft publication. */
export const visibilitySchema = z.object({ discoverable: z.boolean(), indexable: z.boolean() });
export type Visibility = z.infer<typeof visibilitySchema>;
export type DiscoveryWork = { handle: string; artist: string; title: string; artId: string; alt: string; thumbnail: string };

export function sectionTree(blocks: Block[], root: string) {
  const ids = new Set([root]);
  for (let depth = 0; depth < 2; depth++)
    for (const b of blocks) if (b.parentId && ids.has(b.parentId)) ids.add(b.id);
  return blocks.filter((b) => ids.has(b.id)).map((b) => (b.id === root ? { ...b, parentId: undefined } : b));
}

export function cloneSection(blocks: Block[]) {
  const ids = new Map(blocks.map((b) => [b.id, crypto.randomUUID()]));
  return blocks.map((b) => ({
    ...b,
    id: ids.get(b.id)!,
    parentId: b.parentId ? ids.get(b.parentId) : undefined,
  }));
}

/** A placement is valid when the resulting tree fits the same two-level limit as the draft schema. */
export function containerChoices(blocks: Block[], block: Block) {
  const subtree = sectionTree(blocks, block.id);
  const descendants = new Set(subtree.map((b) => b.id));
  const depth = (node: Block, inBlocks: Block[]) => {
    let level = 0;
    while (node.parentId && level <= 2) {
      const parent = inBlocks.find((b) => b.id === node.parentId);
      if (!parent) break;
      node = parent;
      level++;
    }
    return level;
  };
  const height = Math.max(0, ...subtree.map((b) => depth(b, subtree)));
  return blocks.filter(
    (b) => b.type === "columns" && !descendants.has(b.id) && depth(b, blocks) + 1 + height <= 2,
  );
}

export const pageStarters = {
  comic: ["comicSeries", "latestChapters"],
  character: ["characterCards", "characterGallery"],
  illustration: ["featured", "processSteps"],
  photography: ["carousel", "galleryPreview"],
  sculpture: ["projectShowcase", "comparison"],
  general: ["hero", "featured", "about"],
} as const satisfies Record<string, readonly Block["type"][]>;
