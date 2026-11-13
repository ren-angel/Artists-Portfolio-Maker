import { Report } from "../../components/Report";
import { brand, language } from "../../lib/server";
import "../../components/ui/ui.css";
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
