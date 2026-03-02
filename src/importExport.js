// Import/Export em JSON (sem depender de backend)
import { APP } from "./config.js";
import { db, Fs } from "./firebase.js";

function normalizeCard(raw) {
  const subject = String(raw.subject ?? raw.category ?? "").trim();
  const unit = Number(raw.unit ?? 1);
  const lesson = Number(raw.lesson ?? 1);
  const topic = String(raw.topic ?? raw.subcategory ?? "").trim();
  const front = String(raw.front ?? "").trim();
  const back = String(raw.back ?? "").trim();
  const order = Number(raw.order ?? 0);

  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : [];
  return { subject, unit, lesson, topic, front, back, order, tags };
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportAllCards() {
  const q = Fs.query(Fs.collection(db, APP.collections.cards), Fs.orderBy("subject"), Fs.limit(5000));
  const snap = await Fs.getDocs(q);
  const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  downloadJson(`nosso-site-export-${APP.collections.cards}.json`, cards);
}

export async function importCardsFromJson(jsonText, { onProgress } = {}) {
  let arr;
  try {
    arr = JSON.parse(jsonText);
  } catch (e) {
    throw new Error("JSON inválido.");
  }
  if (!Array.isArray(arr)) throw new Error("O JSON deve ser uma lista de cards.");

  const cleaned = arr.map(normalizeCard).filter(c => c.subject && c.front && c.back);
  if (!cleaned.length) throw new Error("Nenhum card válido encontrado (precisa subject/front/back).");

  // Batch write (500 ops por batch)
  let written = 0;
  let batch = Fs.writeBatch(db);
  let ops = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    // ID determinístico simples para evitar duplicata acidental:
    const key = `${c.subject}__u${c.unit}__l${c.lesson}__o${c.order}__${c.front.slice(0,40)}`;
    const safeId = key
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.]/g, "")
      .slice(0, 250);

    const ref = Fs.doc(db, APP.collections.cards, safeId);
    batch.set(ref, {
      ...c,
      createdAt: Fs.serverTimestamp(),
    }, { merge: true });

    ops++;
    if (ops >= 450) { // margem de segurança
      await batch.commit();
      written += ops;
      ops = 0;
      batch = Fs.writeBatch(db);
      onProgress && onProgress({ written, total: cleaned.length });
    }
  }

  if (ops > 0) {
    await batch.commit();
    written += ops;
    onProgress && onProgress({ written, total: cleaned.length });
  }

  return { written, total: cleaned.length };
}
