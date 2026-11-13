import { notFound } from "next/navigation";
import { language, brand } from "../../../lib/server";
import { Auth } from "../../../components/Auth";
import "../../../components/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function AuthPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  if (!["login", "register", "forgot", "reset", "verify"].includes(mode))
    notFound();
  return (
    <Auth
      mode={mode as "login" | "register" | "forgot" | "reset" | "verify"}
      name={brand()}
      lang={await language()}
    />
  );
}
