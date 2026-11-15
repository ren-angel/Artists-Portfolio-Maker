import { language } from "../../../../lib/server";
import { MockInvoice } from "../../../../components/billing/MockInvoice";
import "../../../../components/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <MockInvoice id={(await params).id} l={await language()} />;
}
