import { Report } from "../../features/reporting/Report";
import { brand, language } from "../../shared/lib/server";
import "../../shared/ui/ui.css";
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  return (
    <Report
      handle={(await searchParams).site || ""}
      l={await language()}
      name={brand()}
    />
  );
}
