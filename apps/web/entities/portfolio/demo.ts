import { commissionSchema, initialDraft, newBlock, type Block, type Draft, type Template } from "@doodallery/shared";
import { templateAccent } from "./templates/kit";
import type { Lang } from "../../shared/lib/copy";
import { placeholderArt } from "../../shared/lib/placeholder";

/* Fictional demonstration portfolios mirroring the Design/ template routes.
   They use the original illustrations bundled under public/home and stable
   identifiers so gallery and artwork links resolve between requests. */

type Text = [en: string, pt: string];
type Work = { title: Text; description?: Text; featured?: boolean };
type Spec = {
  title: string;
  description: Text;
  home: Text;
  works: Work[];
  galleries: { title: Text; description: Text; works: number[]; cover?: number }[];
  blocks: (art: (i: number) => string, gallery: (i: number) => string) => Partial<Block>[];
  about: Partial<Block>[];
  social: string[];
};

const id = (n: number) => "00000000-0000-4000-8000-" + n.toString(16).padStart(12, "0");
const L = (en: string, pt = en): Text => [en, pt];

const specs: Record<Template, Spec> = {
  gallery: {
    title: "Nina Flores",
    description: L("Photographer & visual artist · São Paulo", "Fotógrafa e artista visual · São Paulo"),
    home: L("Work", "Obras"),
    works: [
      { title: L("Dried Grass, 4pm", "Capim seco, 16h"), featured: true, description: L("Photographed in the studio at the end of the day, on the one day the light stayed long enough to arrange itself. Printed by the artist on cotton rag, in an edition of twelve.", "Fotografada no estúdio no fim do dia, no único dia em que a luz ficou tempo suficiente para se organizar. Impressa pela artista em papel algodão, em edição de doze.") },
      { title: L("Concrete Curve"), featured: true },
      { title: L("Linen & Stone", "Linho e pedra"), featured: true },
      { title: L("Little Kiln", "Pequeno forno"), featured: true },
    ],
    galleries: [
      { title: L("Still life", "Natureza-morta"), description: L("Objects arranged until they feel inevitable.", "Objetos arranjados até parecerem inevitáveis."), works: [0, 2, 3] },
      { title: L("Architecture", "Arquitetura"), description: L("Buildings at the hour they stop looking like buildings.", "Prédios na hora em que deixam de parecer prédios."), works: [1] },
    ],
    blocks: (art) => [
      { type: "hero", heading: "Nina Flores", text: "“I photograph the space between objects, the light that stays after everyone has left the room.”", artId: art(0) },
      { type: "image", artId: art(1), text: "Archival pigment print · 80 × 100 cm" },
      { type: "featured", heading: "Selected work" },
      { type: "richText", layout: "center", heading: "Studio note, spring 2026", text: "“A photograph is not a record of what was there. It is a record of what I noticed.”" },
      { type: "about", heading: "Nina Flores works slowly, in natural light, mostly at home in São Paulo.", text: "Her practice moves between still life and architecture: objects arranged until they feel inevitable, buildings photographed at the hour when they stop looking like buildings. She prints everything herself, in small editions.", artId: art(2) },
    ],
    about: [
      { type: "about", heading: "Nina Flores works slowly, in natural light.", text: "Her practice moves between still life and architecture. She prints everything herself, in small editions." },
      { type: "galleryPreview", heading: "Series" },
    ],
    social: ["https://instagram.com", "https://substack.com"],
  },
  creative: {
    title: "Luna Mori",
    description: L("commissions open", "encomendas abertas"),
    home: L("work", "obras"),
    works: [
      { title: L("Starlight Girl", "Garota estelar") },
      { title: L("Paper Sun", "Sol de papel"), featured: true },
      { title: L("Moss Spirit Sheet", "Ficha do espírito Musgo"), featured: true },
      { title: L("Self portrait, 2am", "Autorretrato, 2h"), featured: true },
      { title: L("Lantern Study", "Estudo de lanterna"), featured: true },
    ],
    galleries: [
      { title: L("Fanart"), description: L("Characters from stories I love.", "Personagens de histórias que eu amo."), works: [0, 3] },
      { title: L("Original Art", "Arte original"), description: L("Posters and experiments in colour.", "Pôsteres e experimentos com cor."), works: [1, 4] },
      { title: L("Character Designs", "Design de personagens"), description: L("Reference sheets for my OCs.", "Fichas dos meus personagens."), works: [2] },
    ],
    blocks: (art) => [
      { type: "hero", heading: "hi, i'm\nluna ✦", text: "I draw cheerful characters, elaborate fanart and the occasional small universe. Everything here is made with too much colour and one very tired graphics tablet.", artId: art(0) },
      { type: "featured", heading: "some favourites" },
      { type: "galleryPreview" },
      { type: "cta", heading: "want me to draw *your character?*", text: "From R$180 · 3 slots open this round · 1–3 week turnaround", url: "portfolio:commissions" },
      { type: "about", heading: "about luna", text: "Illustrator and full-time fan of characters with too many accessories. I've been drawing since I was seven, posting since I was fourteen, and painting tiny universes ever since. Currently based in São Paulo with one very judgemental cat.", artId: art(3) },
    ],
    about: [
      { type: "about", heading: "about luna", text: "Illustrator and full-time fan of characters with too many accessories." },
      { type: "social", heading: "find me" },
    ],
    social: ["https://instagram.com", "https://ko-fi.com"],
  },
  showcase: {
    title: "Theo Vale",
    description: L("Selected work 2019, 2026", "Trabalhos selecionados 2019, 2026"),
    home: L("Work", "Trabalhos"),
    works: [
      { title: L("The Gate at Dawn", "O portão ao amanhecer"), featured: true, description: L("A pilgrimage site at the edge of a valley that floods with fog every morning.", "Um santuário na borda de um vale que se enche de neblina toda manhã.") },
      { title: L("Islands Above the Cloud Sea", "Ilhas sobre o mar de nuvens"), featured: true, description: L("Six floating settlements, one failing engine, and the rope bridges between them.", "Seis vilarejos flutuantes, um motor falhando e as pontes de corda entre eles.") },
      { title: L("Snowfall Tower", "Torre da nevasca"), featured: true, description: L("The opening shot for a game that never shipped, and the piece that started everything.", "A cena de abertura de um jogo que nunca saiu, e a peça que começou tudo.") },
      { title: L("The Wanderer", "O andarilho") },
    ],
    galleries: [
      { title: L("Environment design · Personal", "Ambientes · Pessoal"), description: L("A place that looks like it has stood for centuries.", "Um lugar que parece estar de pé há séculos."), works: [0, 3] },
      { title: L("Worldbuilding · Studio project", "Construção de mundo · Estúdio"), description: L("Floating settlements and the bridges between them.", "Vilarejos flutuantes e as pontes entre eles."), works: [1] },
      { title: L("Client work · Key art", "Cliente · Key art"), description: L("Key art for a game that never shipped.", "Key art de um jogo que nunca saiu."), works: [2] },
    ],
    blocks: (art) => [
      { type: "hero", heading: "Worlds that feel\n*older than the story*", text: "Concept artist and worldbuilder for games and film. Environments, key art and the uncomfortable amount of lore behind them.", artId: art(0) },
      { type: "featured", heading: "Selected projects" },
      { type: "about", heading: "Ten years of painting places\nnobody has been to.", text: "I work with production teams from first thumbnail to final key art, building the visual logic of a world so the rest of the team can move inside it. Trained as an architect, which explains the stairs.", artId: art(3), url: "https://artstation.com" },
    ],
    about: [
      { type: "about", heading: "Ten years of painting places nobody has been to.", text: "Concept artist and worldbuilder for games and film." },
      { type: "cta", heading: "Have a world *in mind?*", url: "https://artstation.com" },
    ],
    social: ["https://artstation.com", "https://instagram.com"],
  },
  story: {
    title: "Mika Sora",
    description: L("An ongoing comic · 4 chapters", "Uma HQ em andamento · 4 capítulos"),
    home: L("The comic", "A HQ"),
    works: [
      { title: L("Night Ferry, chapter one", "Balsa noturna, capítulo um"), featured: true },
      { title: L("The visitor", "O visitante"), featured: true },
      { title: L("Ren, the lantern keeper", "Ren, o guardião da lanterna"), featured: true },
      { title: L("Moss, something in the woods", "Musgo, algo na floresta") },
    ],
    galleries: [
      { title: L("The town that keeps the lights on", "A cidade que mantém as luzes acesas"), description: L("Mar 2026"), works: [0, 1, 2] },
      { title: L("A visitor with no shadow", "Um visitante sem sombra"), description: L("May 2026", "Mai 2026"), works: [1, 2, 0] },
      { title: L("Lanterns for the lost", "Lanternas para os perdidos"), description: L("Aug 2026", "Ago 2026"), works: [2, 0] },
      { title: L("Where the river remembers", "Onde o rio se lembra"), description: L("Oct 2026", "Out 2026"), works: [0, 3] },
    ],
    blocks: (art) => [
      { type: "hero", heading: "Night Ferry", text: "A quiet story about a town that keeps its lights on for the people who never arrive.\n\nDrawn in pencil and warm grey wash, updated slowly. Best read with tea, in one sitting, slightly too late at night.", artId: art(0) },
      { type: "galleryPreview", heading: "Chapters" },
      { type: "featured", text: "the town keeps the lights on, whether or not anyone comes back" },
      { type: "about", heading: "Mika draws comics about quiet places and the people who leave them.", text: "Based between São Paulo and somewhere much smaller. Night Ferry is a long-form comic drawn entirely on paper with a mechanical pencil and an unreasonable amount of patience.", artId: art(2) },
    ],
    about: [
      { type: "about", heading: "Mika draws comics about quiet places.", text: "Night Ferry is drawn entirely on paper." },
      { type: "social", heading: "Elsewhere" },
    ],
    social: ["https://instagram.com", "https://ko-fi.com"],
  },
};

/** Placeholder image for each demonstration asset identifier. */
export function demoImages(template: Template, lang: Lang) {
  return Object.fromEntries(
    specs[template].works.map((_, i) => [id(1000 + i), placeholderArt(lang)]),
  );
}

export function demo(template: Template, lang: Lang): Draft {
  const s = specs[template];
  const pick = ([en, pt]: Text) => (lang === "en" ? en : pt);
  const art = (i: number) => id(100 + i);
  const gallery = (i: number) => id(200 + i);
  const block = (b: Partial<Block>, n: number): Block => ({ ...newBlock(b.type ?? "richText"), ...b, id: id(n) });
  const slug = (t: string) =>
    t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return {
    version: 1,
    title: s.title,
    description: pick(s.description),
    language: lang,
    home: id(1),
    step: 7,
    theme: { ...initialDraft("").theme, template, accent: templateAccent[template] },
    commissions: commissionSchema.parse(template === "creative" ? {
      status: "open", currency: "BRL", turnaround: pick(L("1–3 weeks", "1–3 semanas")),
      note: pick(L("Three slots for character illustration this round.", "Três vagas para ilustração de personagens nesta rodada.")),
      types: [
        [pick(L("Headshot", "Retrato")), 180, 3], [pick(L("Bust", "Busto")), 260, 0],
        [pick(L("Half-body", "Meio corpo")), 380, 4], [pick(L("Full-body", "Corpo inteiro")), 520, 2],
      ].map(([name,priceFrom,image], i) => ({ id:id(700+i),name,priceFrom,priceTo:null,description:"",turnaround:"",artId:art(Number(image)),galleryId:gallery(0),visible:true })),
      contacts: [{ kind: "email", label: pick(L("Example inquiry", "Exemplo de consulta")), value: "luna@example.invalid" }],
      terms: pick(L("For personal illustration. Agree on the brief and delivery date before work begins.", "Para ilustração pessoal. Combine o briefing e o prazo antes do início do trabalho.")),
      allowed: [pick(L("Original characters", "Personagens originais")), "Fanart"], disallowed: [pick(L("Commercial use", "Uso comercial"))],
    } : {}),
    social: s.social,
    pages: [
      { id: id(1), title: pick(s.home), slug: "home", inNav: true, blocks: s.blocks(art, gallery).map((b, i) => block(b, 300 + i)) },
      { id: id(2), title: lang === "en" ? "About" : "Sobre", slug: "about", inNav: true, blocks: s.about.map((b, i) => block(b, 400 + i)) },
      ...(template === "creative" ? [{
        id: id(3), title: pick(L("Commissions", "Encomendas")), slug: "commissions", inNav: true,
        blocks: [
          block({type:"commissionStatus", heading:pick(L("Let’s draw something *together*", "Vamos desenhar *juntos*"))}, 501),
          block({type:"commissionPrices"},502),
          block({type:"richText",heading:pick(L("How it works", "Como funciona")),text:pick(L("1. Share references and your brief.\n\n2. Review a sketch.\n\n3. Receive the finished illustration.", "1. Envie referências e o briefing.\n\n2. Revise o esboço.\n\n3. Receba a ilustração final."))},503),
          block({type:"commissionTerms"},504),
          block({type:"contactLinks",heading:pick(L("Have a character in mind?", "Tem um personagem em mente?"))},505),
        ],
      }] : []),
    ],
    galleries: s.galleries.map((g, i) => ({
      id: gallery(i),
      title: pick(g.title),
      slug: slug(pick(g.title)),
      description: pick(g.description),
      visible: true,
      cover: art(g.cover ?? g.works[0]),
      artIds: g.works.map(art),
    })),
    artworks: s.works.map((w, i) => ({
      id: art(i),
      assetId: id(1000 + i),
      title: pick(w.title),
      description: w.description ? pick(w.description) : "",
      ...(template === "gallery" ? { details: {
        year: ["2026", "2025", "2025", "2024"][i],
        medium: i === 2 ? pick(L("Gelatin silver print", "Impressão em gelatina e prata")) : pick(L("Archival pigment print", "Impressão pigmentada de arquivo")),
        dimensions: ["60 × 80 cm", "80 × 100 cm", "40 × 50 cm", "50 × 70 cm"][i],
        edition: "12 + 2 AP", availability: pick(L("Enquire for prints", "Consulte sobre impressões")),
      } } : {}),
      alt: pick(w.title),
      featured: Boolean(w.featured),
    })),
  };
}
