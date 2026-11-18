import type { Lang } from "../../../shared/lib/copy";
import { portuguese } from "./pt";

export type Common = {
  lang: Lang;
  name: string;
  domain: string;
};
export { cn } from "../../../shared/lib/cn";
export function translator({
  lang,
  name,
  domain,
}: Pick<Common, "lang"> & Partial<Pick<Common, "name" | "domain">>) {
  return (source: string) => {
    const key = source.trim();
    const value =
      lang === "pt-BR" && portuguese[key]
        ? source.replace(key, () => portuguese[key])
        : source;
    return value
      .replaceAll("doodallery.com", () => domain ?? "localhost")
      .replaceAll("Doodallery", () => name ?? "Doodallery");
  };
}
