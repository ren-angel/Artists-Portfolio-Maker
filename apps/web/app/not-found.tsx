import { language } from "../lib/server";
import { t } from "../lib/copy";
export default async function Missing() {
  const l = await language();
  return (
    <main className="narrow panel stack">
      <h1>{t(l, "notFound")}</h1>
      <p>{t(l, "missingPage")}</p>
    </main>
  );
}
