import { brand, language } from "../../lib/server";
import { MarketingPage } from "../../components/marketing/MarketingPage";
import "../../components/home/home.css";

export async function generateMetadata() {
  return { title: ((await language()) === "en" ? "Discover artists" : "Descubra artistas") + " · " + brand() };
}
export default async function Page() {
  return <MarketingPage page="explore" lang={await language()} name={brand()} domain={process.env.PLATFORM_DOMAIN || "localhost"} />;
}
