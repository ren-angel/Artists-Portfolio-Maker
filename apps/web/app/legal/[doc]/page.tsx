import { notFound } from "next/navigation";
import { legalDocuments } from "@studio/shared";
import { brand, language } from "../../../shared/lib/server";
import { legal } from "../../../features/legal/legal";
import { TakedownForm } from "../../../features/legal/TakedownForm";
import Logo from "../../../shared/ui/Logo";
import "../../../shared/ui/ui.css";

type Props = { params: Promise<{ doc: string }> };
export async function generateMetadata({ params }: Props) {
  const d = legal((await params).doc, await language(), brand());
  return { title: d ? d.title + " · " + brand() : brand() };
}
export default async function LegalPage({ params }: Props) {
  const l = await language();
  const { doc } = await params;
  const d = legal(doc, l, brand());
  if (!d) notFound();
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  return (
    <div className="ui ui-page">
      <header className="mx-auto flex max-w-[860px] items-center justify-between px-6 py-6">
        <Logo name={brand()} />
        <a href="/" className="text-[12.5px] text-ink/50 hover:text-ink">← {tr("Back to site", "Voltar ao site")}</a>
      </header>
      <main className="mx-auto max-w-[860px] px-6 pb-20">
        <p role="note" className="rounded-xl border border-dashed border-[#c4483a]/50 bg-coral/10 px-4 py-3 text-[12.5px] text-[#8a2f25]">
          {tr(
            "DRAFT pending review by a qualified lawyer. This text describes how the service works but is not yet a legally reviewed document.",
            "RASCUNHO pendente de revisão jurídica qualificada. Este texto descreve o funcionamento do serviço, mas ainda não foi revisado juridicamente.",
          )}
        </p>
        <h1 className="mt-8 font-display text-[36px] font-semibold leading-tight tracking-[-0.03em] sm:text-[44px]">{d.title}</h1>
        <p className="mt-2 text-[12px] text-ink/45">{tr("Version", "Versão")} {d.version}</p>
        <div className="mt-8 space-y-7">
          {d.sections.map(([h, body]) => (
            <section key={h}>
              <h2 className="font-display text-[19px] font-semibold tracking-tight">{h}</h2>
              <p className="mt-2 text-[14.5px] leading-[1.75] text-ink/70">{body}</p>
            </section>
          ))}
        </div>
        {doc === "copyright" && <TakedownForm l={l} />}
        <nav className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/10 pt-6 text-[12.5px] text-ink/55">
          {Object.keys(legalDocuments).map((k) => (
            <a key={k} href={"/legal/" + k} aria-current={k === doc ? "page" : undefined} className="hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink">
              {legal(k, l, brand())!.title}
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
