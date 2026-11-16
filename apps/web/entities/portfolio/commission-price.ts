import type { Lang } from "../../shared/lib/copy";

export function commissionPrice(language: Lang, currency: string, from: number | null, to: number | null) {
  const format = (value: number) => new Intl.NumberFormat(language, {
    style: "currency", currency, maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
  if (from === null && to === null) return language === "en" ? "Price on request" : "Sob consulta";
  if (from === null) return (language === "en" ? "up to " : "até ") + format(to!);
  if (to !== null && to > from) return format(from) + " – " + format(to);
  return (language === "en" ? "from " : "a partir de ") + format(from);
}
