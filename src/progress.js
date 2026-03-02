// Progresso e desbloqueio de aulas
import { APP } from "./config.js";
import { db, Fs } from "./firebase.js";

function lessonKey(unit, lesson) {
  return `${unit}-${lesson}`;
}

export async function ensureUserDoc(uid, profile) {
  const ref = Fs.doc(db, APP.collections.users, uid);
  const snap = await Fs.getDoc(ref);
  if (!snap.exists()) {
    await Fs.setDoc(ref, {
      displayName: profile?.displayName ?? null,
      email: profile?.email ?? null,
      photoURL: profile?.photoURL ?? null,
      createdAt: Fs.serverTimestamp(),
      progress: {}, // { [subject]: { currentUnit, currentLesson, completed: [ "1-1", ... ] } }
    });
  } else if (profile?.displayName || profile?.photoURL) {
    // Atualiza dados básicos sem sobrescrever progresso
    await Fs.updateDoc(ref, {
      displayName: profile?.displayName ?? null,
      email: profile?.email ?? null,
      photoURL: profile?.photoURL ?? null,
      updatedAt: Fs.serverTimestamp(),
    });
  }
  return ref;
}

export async function getProgress(uid, subject) {
  const ref = Fs.doc(db, APP.collections.users, uid);
  const snap = await Fs.getDoc(ref);
  if (!snap.exists()) return { currentUnit: 1, currentLesson: 1, completed: [] };
  const data = snap.data() || {};
  const p = (data.progress && data.progress[subject]) || null;
  if (!p) return { currentUnit: 1, currentLesson: 1, completed: [] };
  return {
    currentUnit: Number(p.currentUnit || 1),
    currentLesson: Number(p.currentLesson || 1),
    completed: Array.isArray(p.completed) ? p.completed : [],
  };
}

export async function setProgress(uid, subject, progress) {
  const ref = Fs.doc(db, APP.collections.users, uid);
  const key = `progress.${subject}`;
  await Fs.updateDoc(ref, {
    [key]: {
      currentUnit: Number(progress.currentUnit || 1),
      currentLesson: Number(progress.currentLesson || 1),
      completed: Array.isArray(progress.completed) ? progress.completed : [],
      updatedAt: Fs.serverTimestamp(),
    },
  });
}

export function canAccessLesson(progress, unit, lesson) {
  if (unit < progress.currentUnit) return true;
  if (unit > progress.currentUnit) return false;
  return lesson <= progress.currentLesson;
}

export async function markLessonCompleted(uid, subject, unit, lesson) {
  const p = await getProgress(uid, subject);
  const k = lessonKey(unit, lesson);
  const completed = new Set(p.completed);
  completed.add(k);

  // avança para próxima aula (mantemos regra simples: 5 aulas por unidade)
  let nextUnit = unit;
  let nextLesson = lesson + 1;
  if (nextLesson > 5) {
    nextUnit = unit + 1;
    nextLesson = 1;
  }

  await setProgress(uid, subject, {
    currentUnit: Math.max(p.currentUnit, nextUnit),
    currentLesson: (p.currentUnit > unit) ? p.currentLesson : Math.max(p.currentLesson, nextLesson),
    completed: Array.from(completed),
  });

  return { nextUnit, nextLesson };
}
