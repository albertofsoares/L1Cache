// Nosso Site 3.0 (ChatGPT) — App principal
import { APP } from "./config.js";
import { Auth } from "./firebase.js";
import { ensureUserDoc, getProgress, markLessonCompleted } from "./progress.js";
import { listSubjects, fetchLessonCards } from "./cardsRepo.js";
import { exportAllCards, importCardsFromJson } from "./importExport.js";
import { renderShell, renderLogin, renderHome, renderStudy, renderAdmin, toast } from "./ui.js";

const container = document.getElementById("app");
const shell = renderShell(container);

let state = {
  user: null,
  subjects: [],
  subject: null,
  view: "loading", // login | home | study | admin
  progress: null,
  unit: 1,
  lesson: 1,
  cards: [],
  index: 0,
  seen: new Set(), // visto nesta aula
  importStatus: "",
};

function isAdmin(user) {
  if (!user) return false;
  if (!APP.adminEmails || APP.adminEmails.length === 0) return true; // liberado para todos (mais simples)
  return APP.adminEmails.includes(user.email);
}

function setTopActions() {
  shell.topActions.innerHTML = "";
  if (!state.user) return;

  const wrap = document.createElement("div");
  wrap.className = "flex items-center gap-2";

  const who = document.createElement("div");
  who.className = "hidden sm:flex items-center gap-2 text-sm text-zinc-300";
  who.innerHTML = `
    <span class="inline-block h-7 w-7 overflow-hidden rounded-full bg-zinc-800">
      ${state.user.photoURL ? `<img src="${state.user.photoURL}" class="h-7 w-7" />` : ""}
    </span>
    <span class="text-zinc-400">${state.user.displayName || "Usuário"}</span>
  `;

  const btn = document.createElement("button");
  btn.className = "rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:bg-zinc-900/60";
  btn.textContent = "Sair";
  btn.addEventListener("click", async () => {
    await Auth.signOut();
  });

  wrap.appendChild(who);
  wrap.appendChild(btn);
  shell.topActions.appendChild(wrap);
}

function render() {
  setTopActions();

  if (state.view === "login") {
    renderLogin(shell.view, { onLogin: doLogin });
    return;
  }

  if (state.view === "home") {
    renderHome(shell.view, {
      user: state.user,
      subjects: state.subjects,
      onPickSubject: openSubject,
      onOpenAdmin: () => {
        if (!isAdmin(state.user)) return toast("Sem permissão.");
        state.view = "admin";
        render();
      }
    });
    return;
  }

  if (state.view === "admin") {
    renderAdmin(shell.view, {
      onBack: () => { state.view = "home"; render(); },
      onExport: async () => {
        try { await exportAllCards(); toast("Export iniciado."); } 
        catch (e) { console.error(e); toast("Falha ao exportar."); }
      },
      onImportFile: async (file) => {
        try {
          state.importStatus = "Importando...";
          render();
          const text = await file.text();
          const res = await importCardsFromJson(text, {
            onProgress: ({written, total}) => {
              state.importStatus = `Importando... ${written}/${total}`;
              render();
            }
          });
          state.importStatus = `Import concluído: ${res.written}/${res.total}`;
          toast("Import concluído!");
          // Recarrega subjects
          state.subjects = await listSubjects();
          render();
        } catch (e) {
          console.error(e);
          state.importStatus = e.message || "Erro no import.";
          toast("Erro no import.");
          render();
        }
      },
      importStatus: state.importStatus
    });
    return;
  }

  if (state.view === "study") {
    const totalCount = state.cards.length;
    const seenCount = state.seen.size;
    renderStudy(shell.view, {
      subject: state.subject,
      unit: state.unit,
      lesson: state.lesson,
      cards: state.cards,
      index: state.index,
      seenCount,
      totalCount,
      onBack: () => { state.view = "home"; state.subject = null; render(); },
      onPrev: () => { state.index = Math.max(0, state.index - 1); render(); },
      onNext: () => { state.index = Math.min(state.cards.length - 1, state.index + 1); render(); },
      onMarkSeen: () => {
        const c = state.cards[state.index];
        if (c?.id) state.seen.add(c.id);
        toast("Marcado como visto ✅");
        render();
      },
      onFinishLesson: async () => {
        if (state.seen.size < state.cards.length) return;
        const { nextUnit, nextLesson } = await markLessonCompleted(state.user.uid, state.subject, state.unit, state.lesson);
        toast(`Aula concluída! Liberado: Unidade ${nextUnit} — Aula ${nextLesson}`);
        await loadCurrentLesson(state.subject);
      }
    });
    return;
  }

  // loading fallback
  shell.view.innerHTML = `<div class="text-sm text-zinc-400">Carregando...</div>`;
}

async function doLogin() {
  try {
    await Auth.signInWithGoogle();
  } catch (e) {
    console.error(e);
    toast("Falha ao entrar. Verifique popups.");
  }
}

async function openSubject(subject) {
  await loadCurrentLesson(subject);
}

async function loadCurrentLesson(subject) {
  state.subject = subject;
  state.seen = new Set();
  state.index = 0;

  const p = await getProgress(state.user.uid, subject);
  state.progress = p;
  state.unit = p.currentUnit;
  state.lesson = p.currentLesson;

  state.cards = await fetchLessonCards(subject, state.unit, state.lesson);
  state.view = "study";
  render();
}

async function boot() {
  Auth.onAuthStateChanged(async (user) => {
    state.user = user || null;

    if (!user) {
      state.view = "login";
      state.subjects = [];
      state.subject = null;
      render();
      return;
    }

    await ensureUserDoc(user.uid, user);

    // Carrega matérias
    try {
      state.subjects = await listSubjects();
    } catch (e) {
      console.error(e);
      state.subjects = [];
    }

    state.view = "home";
    render();
  });

  render();
}

boot();
