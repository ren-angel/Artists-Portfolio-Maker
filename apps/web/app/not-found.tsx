import { language } from "../shared/lib/server";
import { t } from "../shared/lib/copy";
import { Status } from "../shared/ui/Status";
import "../shared/ui/ui.css";
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
