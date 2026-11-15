import { cycles, templateNames } from "@studio/shared";

/** Forward only choices supported by the studio. URLs cannot supply a redirect destination. */
export function studioIntent(search: string) {
  const input = new URLSearchParams(search);
  const params = new URLSearchParams();
  const template = templateNames.find(t => t === input.get("template"));
  const plan = input.get("plan");
  const cycle = cycles.find(c => c === input.get("cycle")) ?? "monthly";
  if (template) params.set("template", template);
  if (plan === "artist" || plan === "studio") {
    params.set("plan", plan);
    params.set("cycle", cycle);
  }
  if (input.get("setup") === "1") params.set("setup", "1");
  if (input.get("tab") === "editor") params.set("tab", "editor");
  return { template, plan: plan === "artist" || plan === "studio" ? plan : undefined, cycle, query: params.size ? "?" + params : "" } as const;
}
