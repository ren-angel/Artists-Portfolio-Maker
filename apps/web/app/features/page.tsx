import { brand, language } from "../../shared/lib/server";
import { MarketingPage } from "../../features/marketing/MarketingPage";
import "../../features/marketing/home/home.css";

export async function generateMetadata() {
  return { title: ((await language()) === "en" ? "Features" : "Recursos") + " · " + brand() };
}
export default async function Page() {
  return <MarketingPage page="features" lang={await language()} name={brand()} domain={process.env.PLATFORM_DOMAIN || "localhost"} />;
}
