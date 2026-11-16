import type { artworkDetailKeys } from "@studio/shared";
import type { Lang } from "../../shared/lib/copy";

const labels = {
  year: ["Year", "Ano"], medium: ["Medium", "Técnica"], dimensions: ["Dimensions", "Dimensões"],
  edition: ["Edition", "Edição"], availability: ["Availability", "Disponibilidade"],
} as const;

export const detailLabel = (key: typeof artworkDetailKeys[number], language: Lang) => labels[key][language === "en" ? 0 : 1];
