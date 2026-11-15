import type { Lang } from "../../lib/copy";
import { portuguese } from "./pt";

export type Common = {
  lang: Lang;
  name: string;
  domain: string;
};
export const cn = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");
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
      .replaceAll("muralia.com", () => domain ?? "localhost")
      .replaceAll("Muralia", () => name ?? "Muralia");
  };
}
