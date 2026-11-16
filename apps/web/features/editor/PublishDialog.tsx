"use client";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, ExternalLink, Rocket, Sparkles, X } from "lucide-react";
import { t, message } from "../../shared/lib/copy";
import { Sparkle } from "../../shared/ui/bits";
import { cn } from "../../shared/lib/cn";
import type { EditorProps } from "./Editor";

/* Port of Design/src/components/editor/PublishDialog.jsx with the real
   publication request, verification requirement and public address. */
export function PublishDialog({
  d,
  l,
  site,
  address,
  publicHref,
  status,
  published,
  publishedAt,
  verified,
  onPublish,
  onResend,
  open,
  onClose,
}: EditorProps & { open: boolean; onClose: () => void }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle"),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false),
    [sent, setSent] = useState(false);
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  useEffect(() => {
    if (open) {
      setState("idle");
      setError("");
      setCopied(false);
    }
  }, [open]);
  if (!open) return null;
  const cover = d.artworks.find((a) => a.featured) ?? d.artworks[0];
  const blocks = d.pages.reduce((n, p) => n + p.blocks.filter((b) => b.visible).length, 0);
  const lines = [
    d.pages.length + " " + t(l, "pages").toLowerCase() + " · " + blocks + " " + t(l, "sections"),
    d.galleries.filter((g) => g.visible).length + " " + tr("visible galleries", "galerias visíveis"),
    publishedAt
      ? t(l, "publishedAt") + " · " + new Date(publishedAt).toLocaleString(l)
      : tr("First publication", "Primeira publicação"),
  ];
  const publish = async () => {
    setState("busy");
    setError("");
    try {
      await onPublish();
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(publicHref, location.href).href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={t(l, "publishChanges")}>
      <button type="button" aria-label={t(l, "cancel")} className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose} />

      <div className="u-pop relative w-full max-w-[440px] overflow-hidden rounded-[1.5rem] border border-ink/10 bg-ivory shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t(l, "cancel")}
          className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-paper/80 text-ink/50 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {state === "done" ? (
          <div className="px-6 py-9 text-center">
            <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint">
              <Sparkles className="h-6 w-6 text-ink/70" />
              <Sparkle size={12} className="absolute -right-3 -top-1 animate-float text-coral" />
              <Sparkle size={9} className="absolute -left-4 bottom-0 animate-float-slow text-lilac" />
            </span>
            <h2 className="mt-5 font-display text-[26px] font-semibold leading-tight tracking-[-0.03em]">
              {t(l, "itsLive")}
              <br />
              <span className="font-serif italic text-coral">{t(l, "showOff")}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[300px] text-[13px] leading-relaxed text-ink/55">{t(l, "liveNote")}</p>
            <div className="mt-5 flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-3 py-2">
              <span className="flex-1 truncate text-left font-mono text-[11px] text-ink/60">{address}</span>
              <button type="button" onClick={copy} aria-label={t(l, "copyLink")} className="inline-flex items-center gap-1 text-[10px] text-ink/45 hover:text-ink">
                {copied ? <Check className="h-3.5 w-3.5 text-[#3d9b78]" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="sr-only">{copied ? t(l, "copied") : t(l, "copyLink")}</span>
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a
                href={publicHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-ink text-[12.5px] font-medium text-paper"
              >
                {t(l, "viewSite")} <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button type="button" onClick={onClose} className="h-10 flex-1 rounded-full border border-ink/20 text-[12.5px] font-medium hover:border-ink/60">
                {t(l, "backEditing")}
              </button>
            </div>
            <Sparkle size={12} className="mx-auto mt-5 text-lilac" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-3">
              <Rocket className="h-3.5 w-3.5 text-coral" />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/45">{t(l, "publishChanges")}</p>
            </div>

            <div className="p-5">
              <div className="flex gap-4">
                <div className="h-[74px] w-[92px] shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-paper">
                  {cover && <img src={"/api/media/" + site + "/" + cover.assetId + "/thumb"} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-[18px] font-semibold leading-tight tracking-tight">{d.title}</h2>
                  <p className="mt-1 text-[11.5px] text-ink/45">
                    {d.theme.template[0].toUpperCase() + d.theme.template.slice(1)} · {d.pages.length} {t(l, "pages").toLowerCase()} · {d.artworks.length} {t(l, "works")}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={cn("rounded-full px-2 py-[2px] text-[9px] font-semibold uppercase tracking-wider", published ? "bg-mint" : "bg-butter")}>
                      {t(l, published ? "live" : "draft")}
                    </span>
                    <span className="text-[10px] text-ink/40">{t(l, status === "saved" ? "allSaved" : status === "saving" ? "saving" : "dirty")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-ink/12 bg-paper px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-[0.16em] text-ink/35">{t(l, "publicAddress")}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 truncate font-mono text-[12px] text-ink/70">{address}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-ink/40">
                    <Check className="h-3 w-3 text-[#3d9b78]" /> {tr("reserved", "reservado")}
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-[11.5px] text-ink/55">
                {lines.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-coral" />
                    {line}
                  </li>
                ))}
              </ul>

              {!verified && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-butter/50 px-3 py-2.5 text-[11.5px] text-ink/70">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    {t(l, "unverified")}{" "}
                    <button
                      type="button"
                      disabled={sent}
                      onClick={async () => {
                        await onResend().catch(() => {});
                        setSent(true);
                      }}
                      className="font-medium underline underline-offset-2 disabled:no-underline disabled:opacity-60"
                    >
                      {sent ? t(l, "sent") : t(l, "resend")}
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <p role="alert" className="mt-4 rounded-xl bg-coral/15 px-3 py-2.5 text-[11.5px] text-[#8a2f25]">
                  {message(l, error)}
                </p>
              )}

              <button
                type="button"
                onClick={publish}
                disabled={state === "busy"}
                className={cn(
                  "mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-coral text-[13px] font-medium text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)] transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60",
                )}
              >
                {state === "busy" ? (
                  t(l, "publishing")
                ) : (
                  <>
                    {t(l, "publishWorld")} <Sparkles className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="mt-2.5 text-center text-[10px] text-ink/35">
                {tr("Later edits stay private until you publish again.", "Edições futuras ficam privadas até você publicar de novo.")}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
