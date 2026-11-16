import { brand, language } from "../../shared/lib/server";
import { MarketingPage } from "../../features/marketing/MarketingPage";
import "../../features/marketing/home/home.css";

export async function generateMetadata() {
  return { title: ((await language()) === "en" ? "Discover artists" : "Descubra artistas") + " · " + brand() };
}
export default async function Page() {
  return <MarketingPage page="explore" lang={await language()} name={brand()} domain={process.env.PLATFORM_DOMAIN || "localhost"} />;
}
