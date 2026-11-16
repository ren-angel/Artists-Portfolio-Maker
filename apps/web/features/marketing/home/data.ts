export const TEMPLATES = [
  {
    id: "gallery",
    name: "Gallery",
    artist: "Nina Flores",
    artistHandle: "ninaflores",
    tagline: "Quiet, editorial, exhibition-like.",
    description:
      "A restrained frame that lets one image at a time breathe. Wide margins, a slow typeface and a grid that behaves like a gallery wall.",
    bestFor: ["Photography", "Fine art", "Editorial"],
    palette: ["#FFFDF8", "#272438", "#D9D2C5"],
    mood: "Minimal · editorial",
    href: "/demo/gallery",
    accent: "bg-ink",
  },
  {
    id: "creative",
    name: "Creative",
    artist: "Luna Mori",
    artistHandle: "lunamori",
    tagline: "Playful, colourful, full of personality.",
    description:
      "Sticker labels, rounded frames and pastel blocks that arrange themselves like a sketchbook page — built for illustrators who want their site to feel like them.",
    bestFor: ["Illustration", "Fanart", "Character design"],
    palette: ["#FFF4EF", "#FF7868", "#B6A0F6"],
    mood: "Playful · expressive",
    href: "/demo/creative",
    accent: "bg-coral",
  },
  {
    id: "showcase",
    name: "Showcase",
    artist: "Theo Vale",
    artistHandle: "theovale",
    tagline: "Cinematic, dark, built for big work.",
    description:
      "Full-bleed frames, heavy type and project pages that read like a case study. Made for concept art, worldbuilding and production portfolios.",
    bestFor: ["Concept art", "3D", "Game art"],
    palette: ["#141320", "#F2EDE4", "#E0A45C"],
    mood: "Dramatic · premium",
    href: "/demo/showcase",
    accent: "bg-[#141320]",
  },
  {
    id: "story",
    name: "Story",
    artist: "Mika Sora",
    artistHandle: "mikasora",
    tagline: "Warm, narrative, artbook-like.",
    description:
      "Parchment surfaces, chapter navigation and a serif that reads like a printed book. Home for comics, characters and long-form storytelling.",
    bestFor: ["Comics", "Original characters", "Storytelling"],
    palette: ["#F8F0E3", "#6B5442", "#C9A87C"],
    mood: "Dreamy · intimate",
    href: "/demo/story",
    accent: "bg-[#6B5442]",
  },
];

export const ARTISTS = [
  {
    id: "luna",
    name: "Luna Mori",
    handle: "lunamori",
    initials: "LM",
    role: "Illustrator",
    specialties: "Character art · fanart · original characters",
    bio: "Draws cheerful characters with too many accessories. Fanart by night, original worlds by day.",
    template: "creative",
    accent: "bg-coral",
    works: 84,
  },
  {
    id: "theo",
    name: "Theo Vale",
    handle: "theovale",
    initials: "TV",
    role: "Concept artist",
    specialties: "Worldbuilding · environments · game art",
    bio: "Painting impossible places for games and film. Currently building a world of floating cities.",
    template: "showcase",
    accent: "bg-[#141320]",
    works: 42,
  },
  {
    id: "mika",
    name: "Mika Sora",
    handle: "mikasora",
    initials: "MS",
    role: "Comic creator",
    specialties: "Comics · characters · soft storytelling",
    bio: "Making quiet comics about small towns, lanterns and the people who wander through them.",
    template: "story",
    accent: "bg-[#6B5442]",
    works: 61,
  },
  {
    id: "nina",
    name: "Nina Flores",
    handle: "ninaflores",
    initials: "NF",
    role: "Photographer",
    specialties: "Editorial · still life · slow living",
    bio: "Photographs the space between objects. Natural light, analogue film, quiet compositions.",
    template: "gallery",
    accent: "bg-ink",
    works: 96,
  },
];

export const CATEGORIES = [
  "All",
  "Illustration",
  "Comics",
  "Photography",
  "3D",
  "Character Design",
  "Traditional Art",
  "Concept Art",
];

export const WORKS = [
  { id: "w1", title: "Lantern Hour", artist: "Luna Mori", artistId: "luna", category: "Illustration", tall: true },
  { id: "w2", title: "The Gate at Dawn", artist: "Theo Vale", artistId: "theo", category: "Concept Art", tall: false },
  { id: "w3", title: "Dried Grass, 4pm", artist: "Nina Flores", artistId: "nina", category: "Photography", tall: true },
  { id: "w4", title: "Night Ferry", artist: "Mika Sora", artistId: "mika", category: "Comics", tall: false },
  { id: "w5", title: "Moss Spirit Sheet", artist: "Luna Mori", artistId: "luna", category: "Character Design", tall: false },
  { id: "w6", title: "Islands Above the Cloud Sea", artist: "Theo Vale", artistId: "theo", category: "Concept Art", tall: true },
  { id: "w7", title: "Concrete Curve", artist: "Nina Flores", artistId: "nina", category: "Photography", tall: false },
  { id: "w8", title: "Little Kiln", artist: "June Park", artistId: "june", category: "Traditional Art", tall: true },
  { id: "w9", title: "Paper Sun", artist: "Luna Mori", artistId: "luna", category: "Illustration", tall: false },
  { id: "w10", title: "The Wanderer", artist: "Theo Vale", artistId: "theo", category: "Character Design", tall: true },
  { id: "w11", title: "Soft Clay Friend", artist: "Ito Ren", artistId: "ito", category: "3D", tall: false },
  { id: "w12", title: "Linen & Stone", artist: "Nina Flores", artistId: "nina", category: "Photography", tall: false },
  { id: "w13", title: "Star Clip", artist: "Mika Sora", artistId: "mika", category: "Illustration", tall: true },
  { id: "w14", title: "Snowfall Tower", artist: "Theo Vale", artistId: "theo", category: "Concept Art", tall: false },
];

export const COMMISSION_TYPES = [
  { id: "headshot", name: "Headshot", price: "R$ 180" },
  { id: "bust", name: "Bust", price: "R$ 260" },
  { id: "half", name: "Half-body", price: "R$ 380" },
  { id: "full", name: "Full-body", price: "R$ 520" },
];

export const CHAPTERS = [
  {
    id: "c1",
    number: "01",
    title: "The town that keeps the lights on",
    pages: 18,
  },
  { id: "c2", number: "02", title: "A visitor with no shadow", pages: 22 },
  { id: "c3", number: "03", title: "Lanterns for the lost", pages: 20 },
];

export const CHARACTERS = [{ name: "Moss" }];
