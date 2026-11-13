"use client";
import { useState } from "react";
import { api } from "../lib/client";
import { t, message, type Lang } from "../lib/copy";
export function Report({ handle, l }: { handle: string; l: Lang }) {
  const [status, setStatus] = useState(""),
    [done, setDone] = useState(false);
  return (
    <main className="narrow panel">
      <h1>{t(l, "report")}</h1>
      <p>{handle}</p>
      {done ? (
        <p role="status">{t(l, "received")}</p>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const reason = new FormData(e.currentTarget).get("reason");
            try {
              await api("/reports", "POST", { handle, reason });
              setDone(true);
            } catch (err) {
              setStatus(message(l, (err as Error).message));
            }
          }}
        >
          <label>
            {t(l, "reason")}
            <textarea name="reason" minLength={5} maxLength={2000} required />
          </label>
          <button>{t(l, "reportSend")}</button>
          {status && <p role="alert">{status}</p>}
        </form>
      )}
    </main>
  );
}
