import { language } from "../../../../shared/lib/server";
import { MockInvoice } from "../../../../features/billing/MockInvoice";
import "../../../../shared/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <MockInvoice id={(await params).id} l={await language()} />;
}
