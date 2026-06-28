import JSZip from "jszip";
import { saveAs } from "file-saver";

type Chapter = { chapter_number: number; title: string; pdf_url: string };

function safeName(s: string) {
  return s.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80);
}

export async function downloadChaptersZip(
  subjectName: string,
  chapters: Chapter[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ ok: number; failed: { title: string; url: string }[] }> {
  const zip = new JSZip();
  const folder = zip.folder(safeName(subjectName)) ?? zip;
  const failed: { title: string; url: string }[] = [];
  let ok = 0;
  let done = 0;

  for (const c of chapters) {
    try {
      const res = await fetch(c.pdf_url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = (c.pdf_url.split(".").pop() || "pdf").split("?")[0].slice(0, 5);
      const name = `${String(c.chapter_number).padStart(2, "0")}_${safeName(c.title)}.${ext}`;
      folder.file(name, blob);
      ok++;
    } catch {
      failed.push({ title: c.title, url: c.pdf_url });
    } finally {
      done++;
      onProgress?.(done, chapters.length);
    }
  }

  if (failed.length > 0) {
    const list = failed
      .map((f) => `${f.title}\n${f.url}`)
      .join("\n\n");
    folder.file(
      "UNDOWNLOADABLE_LINKS.txt",
      `These PDFs blocked direct download (CORS). Open the links manually:\n\n${list}`,
    );
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${safeName(subjectName)}.zip`);
  return { ok, failed };
}
