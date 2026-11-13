import { notFound } from "next/navigation";
import { templateNames } from "@studio/shared";
import { demo, print } from "../../../lib/demo";
import { language, brand } from "../../../lib/server";
import { t } from "../../../lib/copy";
import { Brand } from "../../../components/Brand";
import { Portfolio } from "../../../components/Portfolio";
type Props = { params: Promise<{ template: string }> };
export default async function Demo({ params }: Props) {
  const { template } = await params;
  const selected = templateNames.find((v) => v === template);
  if (!selected) notFound();
  const l = await language();
  return (
    <>
      <header className="marketing-head">
        <Brand name={brand()} />
        <span>
          {t(l, "preview")} · {selected}
        </span>
        <a className="btn ink" href="/auth/register">
          {t(l, "register")} →
        </a>
      </header>
      <main>
        <Portfolio
          site=""
          base={"/demo/" + selected}
          draft={demo(selected, l)}
          demoImage={print(selected)}
        />
      </main>
    </>
  );
}
