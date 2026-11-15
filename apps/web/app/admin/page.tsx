import { Admin } from "../../components/admin/Admin";
import { brand, language } from "../../lib/server";
import "../../components/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function AdminPage() {
  return <Admin l={await language()} name={brand()} />;
}
