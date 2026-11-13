import { language } from "../lib/server";
import { t } from "../lib/copy";
import { Status } from "../components/ui/Status";
import "../components/ui/ui.css";
export default async function Missing() {
  const l = await language();
  return (
    <Status
      code="404"
      title={t(l, "notFound")}
      body={t(l, "missingPage")}
      back={t(l, "back")}
      home={l === "en" ? "Start over" : "Recomeçar"}
    />
  );
}
