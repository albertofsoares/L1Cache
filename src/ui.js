// UI (renderização) — sem framework, simples e previsível
import { APP } from "./config.js";

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function renderShell(container) {
  container.innerHTML = "";
  const root = el(`
    <div class="min-h-screen">
      <header class="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-2xl bg-zinc-800 grid place-items-center">🧠</div>
            <div>
              <div class="text-sm text-zinc-400">Anki digital</div>
              <div class="text-base font-semibold">${APP.name}</div>
            </div>
          </div>
          <div id="top-actions" class="flex items-center gap-2"></div>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-4 py-6">
        <div id="view"></div>
      </main>

      <footer class="mx-auto max-w-5xl px-4 pb-10 text-xs text-zinc-500">
        <div class="border-t border-zinc-800 pt-4">
          Feito para estudo com progressão por aula. Firebase + Firestore.
        </div>
      </footer>
    </div>
  `);
  container.appendChild(root);
  return {
    view: root.querySelector("#view"),
    topActions: root.querySelector("#top-actions"),
  };
}

export function toast(msg) {
  const n = el(`
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm shadow-lg">
      ${msg}
    </div>
  `);
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2500);
}

export function renderLogin(view, { onLogin }) {
  view.innerHTML = "";
  view.appendChild(el(`
    <div class="grid place-items-center py-16">
      <div class="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 shadow">
        <div class="text-xl font-semibold">Entrar</div>
        <div class="mt-2 text-sm text-zinc-400">
          Use sua conta Google para salvar seu progresso por matéria.
        </div>
        <button id="btn" class="mt-6 w-full rounded-2xl bg-white px-4 py-2 font-semibold text-zinc-900 hover:opacity-90">
          Entrar com Google
        </button>
        <div class="mt-4 text-xs text-zinc-500">
          Dica: se o login não abrir, verifique no Firebase &gt; Authentication &gt; Google.
        </div>
      </div>
    </div>
  `));
  view.querySelector("#btn").addEventListener("click", onLogin);
}

export function renderHome(view, { user, subjects, onPickSubject, onOpenAdmin }) {
  view.innerHTML = "";
  const cards = subjects.map(s => `
    <button class="w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 text-left hover:bg-zinc-900/60"
            data-subject="${encodeURIComponent(s)}">
      <div class="text-sm text-zinc-400">Matéria</div>
      <div class="mt-1 text-lg font-semibold">${s}</div>
      <div class="mt-2 text-xs text-zinc-500">Clique para continuar de onde parou</div>
    </button>
  `).join("");

  view.appendChild(el(`
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-xl font-semibold">Olá, ${user.displayName || "estudante"} 👋</div>
          <div class="mt-1 text-sm text-zinc-400">Escolha uma matéria para estudar em ordem (aula por aula).</div>
        </div>
        <button id="admin" class="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:bg-zinc-900/60">
          Importar/Exportar
        </button>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        ${cards || `<div class="text-sm text-zinc-400">Sem matérias ainda. Use Importar/Exportar para adicionar cards.</div>`}
      </div>
    </div>
  `));

  view.querySelector("#admin").addEventListener("click", onOpenAdmin);
  view.querySelectorAll("button[data-subject]").forEach(btn => {
    btn.addEventListener("click", () => onPickSubject(decodeURIComponent(btn.dataset.subject)));
  });
}

export function renderStudy(view, opts) {
  const {
    subject, unit, lesson,
    cards, index,
    seenCount, totalCount,
    onNext, onPrev, onMarkSeen, onFinishLesson, onBack
  } = opts;

  const card = cards[index] || null;
  view.innerHTML = "";

  const progressPct = totalCount ? Math.round((seenCount / totalCount) * 100) : 0;

  view.appendChild(el(`
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button id="back" class="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:bg-zinc-900/60">← Voltar</button>
        <div class="text-sm text-zinc-400">
          <span class="font-semibold text-zinc-200">${subject}</span>
          <span class="mx-2 text-zinc-600">•</span>
          Unidade ${unit} — Aula ${lesson}
        </div>
      </div>

      <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div class="flex items-center justify-between text-xs text-zinc-400">
          <div>Progresso da aula</div>
          <div>${seenCount}/${totalCount} (${progressPct}%)</div>
        </div>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div class="h-full rounded-full bg-white" style="width:${progressPct}%"></div>
        </div>
      </div>

      ${card ? `
        <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div class="text-xs text-zinc-400">${card.topic ? `Tópico: ${card.topic}` : "Sem tópico"}</div>
          <div class="mt-3 text-lg font-semibold">${escapeHtml(card.front)}</div>

          <details class="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <summary class="cursor-pointer text-sm text-zinc-300">Mostrar resposta</summary>
            <div class="mt-3 whitespace-pre-wrap text-sm text-zinc-200">${escapeHtml(card.back)}</div>
          </details>

          <div class="mt-5 flex flex-wrap gap-2">
            <button id="seen" class="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:opacity-90">
              Marcar como visto
            </button>

            <div class="ml-auto flex gap-2">
              <button id="prev" class="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:bg-zinc-900/60">←</button>
              <button id="next" class="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:bg-zinc-900/60">→</button>
            </div>
          </div>

          <div class="mt-3 text-xs text-zinc-500">Card ${index + 1} de ${cards.length}</div>
        </div>
      ` : `
        <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div class="text-lg font-semibold">Sem cards nesta aula.</div>
          <div class="mt-2 text-sm text-zinc-400">Importe cards para esta matéria/unidade/aula.</div>
        </div>
      `}

      <div class="flex justify-end">
        <button id="finish" class="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-4 py-2 text-sm hover:bg-zinc-900/60"
          ${totalCount && seenCount >= totalCount ? "" : "disabled"}>
          Concluir aula e liberar próxima
        </button>
      </div>
    </div>
  `));

  view.querySelector("#back").addEventListener("click", onBack);
  if (card) {
    view.querySelector("#prev").addEventListener("click", onPrev);
    view.querySelector("#next").addEventListener("click", onNext);
    view.querySelector("#seen").addEventListener("click", onMarkSeen);
  }
  view.querySelector("#finish").addEventListener("click", onFinishLesson);
}

export function renderAdmin(view, { onBack, onExport, onImportFile, importStatus }) {
  view.innerHTML = "";
  const status = importStatus ? `<div class="mt-3 text-sm text-zinc-300">${importStatus}</div>` : "";
  view.appendChild(el(`
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <button id="back" class="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm hover:bg-zinc-900/60">← Voltar</button>
        <div class="text-sm text-zinc-400">Ferramentas</div>
      </div>

      <div class="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div class="text-lg font-semibold">Importar / Exportar</div>
        <div class="mt-2 text-sm text-zinc-400">
          Importa um JSON com cards (subject/unit/lesson/topic/front/back/order). Exporta todos os cards da coleção v3.
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button id="export" class="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:opacity-90">
            Exportar JSON
          </button>

          <label class="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-4 py-2 text-sm hover:bg-zinc-900/60 cursor-pointer">
            Importar JSON
            <input id="file" type="file" accept="application/json" class="hidden" />
          </label>
        </div>

        ${status}

        <div class="mt-5 text-xs text-zinc-500">
          Dica: você pode me enviar o JSON exportado e eu reorganizo (unidade/aula/tópicos/ordem) e devolvo pronto para importar.
        </div>
      </div>
    </div>
  `));
  view.querySelector("#back").addEventListener("click", onBack);
  view.querySelector("#export").addEventListener("click", onExport);
  view.querySelector("#file").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) onImportFile(f);
    e.target.value = "";
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
