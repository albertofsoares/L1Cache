// Repositório de cards (Firestore)
import { APP } from "./config.js";
import { db, Fs } from "./firebase.js";

export async function listSubjects() {
  // Estratégia simples (sem agregação no Firestore):
  // Busca até 500 cards e deduz subjects. Para escalar, criaremos site_config.subjects.
  // Se existir site_config.subjects, usa ela.
  const cfgRef = Fs.doc(db, APP.collections.siteConfig, "public");
  const cfgSnap = await Fs.getDoc(cfgRef);
  if (cfgSnap.exists()) {
    const cfg = cfgSnap.data() || {};
    if (Array.isArray(cfg.subjects) && cfg.subjects.length) {
      return cfg.subjects.map(String);
    }
  }

  const q = Fs.query(
    Fs.collection(db, APP.collections.cards),
    Fs.orderBy("subject"),
    Fs.limit(500)
  );
  const snap = await Fs.getDocs(q);
  const set = new Set();
  snap.forEach((d) => {
    const s = d.data()?.subject;
    if (typeof s === "string" && s.trim()) set.add(s.trim());
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b,"pt-BR"));
}

export async function fetchLessonCards(subject, unit, lesson) {
  // Query simples (sem índice composto): busca por subject e filtra localmente
  const q = Fs.query(
    Fs.collection(db, APP.collections.cards),
    Fs.where("subject", "==", String(subject)),
    Fs.limit(2000)
  );

  const snap = await Fs.getDocs(q);

  const u = Number(unit);
  const l = Number(lesson);

  const cards = snap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((c) => Number(c.unit) === u && Number(c.lesson) === l)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

  return cards;
}

export async function countLessonCards(subject, unit, lesson) {
  const cards = await fetchLessonCards(subject, unit, lesson);
  return cards.length;
}
