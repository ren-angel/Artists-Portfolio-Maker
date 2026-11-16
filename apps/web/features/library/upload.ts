import { api } from "../../shared/lib/client";

/** Reserve, transfer and finalize one image; abandoned reservations are released. */
export async function upload(
  site: string,
  file: File,
  progress: (n: number) => void,
  replacement?: string,
) {
  const path = "/sites/" + site + "/uploads";
  const { id, uploadUrl } = await api<{ id: string; uploadUrl: string | null }>(
    path,
    "POST",
    {
      bytes: file.size,
      replacement,
    },
  );
  try {
    await new Promise<void>((resolve, reject) => {
      const r = new XMLHttpRequest();
      r.open("PUT", uploadUrl || "/api" + path + "/" + id);
      r.setRequestHeader("content-type", "application/octet-stream");
      if (!uploadUrl) r.setRequestHeader("x-studio-request", "1");
      r.upload.onprogress = (e) => {
        if (e.lengthComputable) progress(Math.round((e.loaded / e.total) * 95));
      };
      r.onload = () =>
        r.status >= 200 && r.status < 300
          ? resolve()
          : reject(Error("request_failed"));
      r.onerror = () => reject(Error("request_failed"));
      r.send(file);
    });
    await api(path + "/" + id + "/finish", "POST", {
      title:
        file.name
          .replace(/\.[^.]+$/, "")
          .trim()
          .slice(0, 120) || "Artwork",
    });
    progress(100);
  } catch (err) {
    await api(path + "/" + id, "DELETE").catch(() => {});
    throw err;
  }
}
