import { Studio } from "../../features/studio/Studio";
import { brand, language } from "../../shared/lib/server";
import "../../shared/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function StudioPage() {
  return (
    <Studio
      l={await language()}
      name={brand()}
      domain={process.env.PLATFORM_DOMAIN || "localhost"}
      origin={process.env.APP_ORIGIN || "http://localhost:3000"}
    />
  );
}
