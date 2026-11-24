import { after, NextResponse } from "next/server";
import { contactHref } from "@doodallery/shared";
import { published, recordHit, visit } from "../../../../../../shared/lib/server";

/* Counts a click on a commission contact button, then redirects. The target
   comes from the artist's published snapshot by index, never from the URL,
   so this cannot be used as an open redirect. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string; n: string }> },
) {
  const { handle, n } = await params;
  const { draft } = await published(handle);
  const contact = draft.commissions.contacts[Number(n)];
  if (!/^\d+$/.test(n) || !contact)
    return new NextResponse(null, { status: 404 });
  const v = await visit();
  after(() =>
    recordHit({
      handle,
      kind: "click",
      path: "contact:" + (contact.label || contact.kind),
      referrer: v.referrer,
      agent: v.agent,
    }),
  );
  return NextResponse.redirect(contactHref(contact), {
    status: 302,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
