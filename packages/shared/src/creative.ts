import { z } from "zod";

const ids = (max: number) =>
  z
    .array(z.uuid())
    .max(max)
    .refine((a) => new Set(a).size === a.length);
export const creativeKinds = [
  "comic",
  "character",
  "project",
  "product",
] as const;
export const checkoutUrl = z
  .string()
  .max(500)
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  });
export const chapterSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(120),
  visible: z.boolean(),
  date: z.iso.date().nullable(),
  cover: z.uuid().nullable(),
  artIds: ids(250),
});
export const creativeSchema = z
  .object({
    kind: z.enum(creativeKinds),
    visible: z.boolean().default(false),
    featured: z.boolean().default(false),
    description: z.string().max(4000).default(""),
    status: z.string().max(80).default(""),
    tags: z.array(z.string().trim().min(1).max(60)).max(16).default([]),
    fields: z
      .array(
        z.object({ label: z.string().max(100), text: z.string().max(4000) }),
      )
      .max(24)
      .default([]),
    cover: z.uuid().nullable().default(null),
    artIds: ids(250).default([]),
    related: ids(100).default([]),
    chapters: z.array(chapterSchema).max(150).default([]),
    link: z.union([checkoutUrl, z.literal("")]).default(""),
    sale: z
      .object({
        price: z.number().nonnegative().max(1000000),
        currency: z.string().regex(/^[A-Z]{3}$/),
        checkout: z.union([checkoutUrl, z.literal("")]),
        available: z.boolean(),
      })
      .optional(),
  })
  .superRefine((c, ctx) => {
    if (c.kind !== "comic" && c.chapters.length)
      ctx.addIssue({ code: "custom", message: "invalid_chapters" });
    if ((c.kind === "product") !== Boolean(c.sale))
      ctx.addIssue({ code: "custom", message: "invalid_product" });
    if (c.sale?.available && !c.sale.checkout)
      ctx.addIssue({ code: "custom", message: "missing_checkout" });
    if (new Set(c.chapters.map((h) => h.id)).size !== c.chapters.length)
      ctx.addIssue({ code: "custom", message: "duplicate_chapter" });
  });
export type Creative = z.infer<typeof creativeSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export function newCreative(kind: Creative["kind"]): Creative {
  return creativeSchema.parse({
    kind,
    ...(kind === "product" && {
      sale: { price: 0, currency: "BRL", checkout: "", available: false },
    }),
  });
}

export const creativeLabels = {
  comicSeries: ["Comic series", "Séries de quadrinhos"],
  latestChapters: ["Latest chapters", "Capítulos recentes"],
  characterCards: ["Character cards", "Cartões de personagens"],
  characterProfile: ["Character profile", "Perfil de personagem"],
  characterGallery: ["Character gallery", "Galeria de personagem"],
  relationships: ["Related pages", "Páginas relacionadas"],
  projectAssociation: ["Associated projects", "Projetos associados"],
  projectShowcase: ["Project showcase", "Vitrine de projetos"],
  projectTimeline: ["Project timeline", "Cronologia do projeto"],
  comparison: ["Before and after", "Antes e depois"],
  carousel: ["Image carousel", "Carrossel de imagens"],
  processSteps: ["Artwork process", "Processo de criação"],
  productCards: ["Digital products", "Produtos digitais"],
  downloadLink: ["Free download link", "Link de download gratuito"],
  collections: ["Featured collections", "Coleções em destaque"],
  columns: ["Columns", "Colunas"],
  videoEmbed: ["YouTube video", "Vídeo do YouTube"],
  profileLink: ["Artist profile link", "Link de perfil do artista"],
} as const;
export type CreativeBlockType = keyof typeof creativeLabels;
export const creativeBlockTypes = Object.keys(
  creativeLabels,
) as CreativeBlockType[];

export const artCategories = {
  illustration: ["Illustration", "Ilustração"],
  photography: ["Photography", "Fotografia"],
  comics: ["Comics", "Quadrinhos"],
  character: ["Character design", "Design de personagens"],
  traditional: ["Traditional art", "Arte tradicional"],
  design: ["Graphic design", "Design gráfico"],
  "3d": ["3D art", "Arte 3D"],
  other: ["Other", "Outras"],
} as const;
export const directorySchema = z.object({
  listed: z.boolean(),
  category: z.enum([
    "",
    ...(Object.keys(artCategories) as (keyof typeof artCategories)[]),
  ]),
  tags: z.string().trim().max(240),
});
export type DirectoryProfile = z.infer<typeof directorySchema>;
export type DirectoryArtist = {
  handle: string;
  name: string;
  category: DirectoryProfile["category"];
  tags: string;
  thumbnail: string | null;
};

export function youtubeVideoId(value: string) {
  if (!checkoutUrl.safeParse(value).success) return null;
  const u = new URL(value);
  let id: string | null = null;
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  if (["www.youtube.com", "youtube.com", "m.youtube.com"].includes(u.hostname))
    id =
      u.pathname === "/watch"
        ? u.searchParams.get("v")
        : (u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)$/)?.[1] ?? null);
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}
