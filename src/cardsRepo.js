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
  const q = Fs.query(
    Fs.collection(db, APP.collections.cards),
    Fs.where("subject", "==", subject),
    Fs.where("unit", "==", Number(unit)),
    Fs.where("lesson", "==", Number(lesson)),
    Fs.orderBy("order", "asc"),
    Fs.limit(500)
  );
  const snap = await Fs.getDocs(q);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function countLessonCards(subject, unit, lesson) {
  const cards = await fetchLessonCards(subject, unit, lesson);
  return cards.length;
}
