import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { draftSchema } from "@studio/shared";
import { Portfolio, matchPage } from "../../../components/Portfolio";
import { t } from "../../../lib/copy";
export const metadata = { robots: { index: false, follow: false } };
export default async function Preview({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const cookie = await cookies();
  const base = process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:4000";
  const options = {
    cache: "no-store" as const,
    headers: { cookie: cookie.toString() },
  };
  const list = await fetch(base + "/sites", options);
  if (list.status === 401) redirect("/auth/login");
  if (!list.ok) throw Error("Could not load preview");
  const site = (await list.json()).sites[0];
  if (!site) redirect("/studio");
  const r = await fetch(base + "/sites/" + site.id, options);
  if (!r.ok) notFound();
  const draft = draftSchema.parse((await r.json()).draft);
  const { path = [] } = await params;
  if (!matchPage(draft, path)) notFound();
  return (
    <>
      <header className="preview-head">
        <span>
          {t(draft.language, "preview")} · {t(draft.language, "draft")}
        </span>
        <a href="/studio">← {t(draft.language, "open")}</a>
      </header>
      <main>
        <Portfolio draft={draft} site={site.id} path={path} base="/preview" />
      </main>
    </>
  );
}
