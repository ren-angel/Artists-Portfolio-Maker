import { studioIntent } from "../../../shared/lib/studio-intent";
import { notFound } from "next/navigation";
import { language, brand } from "../../../shared/lib/server";
import { Auth } from "../../../features/identity/Auth";
import "../../../shared/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function AuthPage({
  params, searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { mode } = await params;
  if (!["login", "register", "forgot", "reset", "verify"].includes(mode))
    notFound();
  const choices = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) if (typeof value === "string") choices.set(key, value);
  return (
    <Auth
      mode={mode as "login" | "register" | "forgot" | "reset" | "verify"}
      name={brand()}
      query={studioIntent(choices.toString()).query}
      lang={await language()}
    />
  );
}
