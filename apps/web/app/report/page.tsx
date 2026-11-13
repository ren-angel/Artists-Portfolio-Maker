import { Report } from "../../components/Report";
import { language } from "../../lib/server";
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  return (
    <Report handle={(await searchParams).site || ""} l={await language()} />
  );
}
