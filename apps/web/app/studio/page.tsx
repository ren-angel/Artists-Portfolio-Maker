import { Studio } from "../../components/Studio";
import { brand, language } from "../../lib/server";
export const metadata = { robots: { index: false, follow: false } };
export default async function StudioPage() {
  return <Studio l={await language()} name={brand()} />;
}
