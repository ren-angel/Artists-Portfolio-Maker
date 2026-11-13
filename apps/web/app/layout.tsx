import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif/400.css";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/archivo";
import "./style.css";
import { language, brand } from "../lib/server";
import type { ReactNode } from "react";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: brand() };
}
export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang={await language()}>
      <body>{children}</body>
    </html>
  );
}
