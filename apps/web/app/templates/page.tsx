import { brand, language } from "../../lib/server";
import { MarketingPage } from "../../components/marketing/MarketingPage";
import "../../components/home/home.css";

export async function generateMetadata() {
  return { title: ((await language()) === "en" ? "Templates" : "Modelos") + " · " + brand() };
}
export default async function Page() {
  return <MarketingPage page="templates" lang={await language()} name={brand()} domain={process.env.PLATFORM_DOMAIN || "localhost"} />;
}
