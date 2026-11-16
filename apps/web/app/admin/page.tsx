import { Admin } from "../../features/admin/Admin";
import { brand, language } from "../../shared/lib/server";
import "../../shared/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminPage() {
  return <Admin l={await language()} name={brand()} />;
}
