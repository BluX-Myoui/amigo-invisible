// Pantallas y navegación de la web.
import { el, show, toast, copy, sleep, reduced, colorFor, initials, drawLink, fmtDate, drawLabel, christmasCountdown } from "./ui.js";
import { startLights, startSnow, startPointerFX, confetti, burst, spinReel, treeSvg, progressRing } from "./effects.js";
import * as store from "./firebase.js";

startLights();
startSnow();
startPointerFX();

// ---------- arranque ----------
if (!store.isConfigured()) {
  show(el("header", { class: "hero" }, el("div", { class: "eyebrow" }, "Falta un paso"), el("h1", {}, "Conecta la base de datos"),
    el("p", { class: "lead" }, "Esta web necesita un proyecto de Firebase. Abre js/config.js, pega tu firebaseConfig y vuelve a subir el archivo.")));
  throw new Error("Falta firebaseConfig");
}
try {
  await store.initFirebase();
} catch (e) {
  console.error(e);
  show(el("header", { class: "hero" }, el("h1", {}, "No se puede ", el("em", {}, "conectar")),
    el("p", { class: "lead" }, "Revisa tu conexión a internet y recarga la página. Si eres quien organiza: comprueba que en Firebase está activado el inicio de sesión Anónimo y creada la base de datos Firestore."),
    el("p", { class: "hint" }, "Detalle: " + (e.code || e.message))));
  throw e;
}

// ---------- navegación ----------
let unsub = null;
function stopWatching() { if (unsub) { unsub(); unsub = null; } }
function route() {
  stopWatching();
  const id = new URLSearchParams(location.search).get("s");
  if (id) return screenDraw(id);
  if (location.hash === "#crear") return screenCreate();
  screenHome();
}
addEventListener("popstate", route);
function go(url) { history.pushState(null, "", url); route(); }

// Pregunta "¿Borrar?" dentro de `container`; `restore` lo deja como estaba.
function askDelete(container, restore, d, id, onDone) {
  const yes = el("button", { class: "danger sm" }, "Sí, borrar");
  yes.addEventListener("click", async () => {
    yes.disabled = true; yes.textContent = "Borrando…";
    try { await store.deleteDraw(id, d.people.length); toast("Sorteo borrado"); onDone(); }
    catch (e) {
      console.error(e);
      toast(e.code === "permission-denied" ? "Sin permiso para borrar. Publica las reglas nuevas de Firestore." : "No se ha podido borrar");
      restore();
    }
  });
  container.replaceChildren(el("div", { class: "confirm" },
    el("p", {}, "¿Borrar el sorteo de ", el("strong", {}, drawLabel(d)), "? El enlace dejará de funcionar para todos y no se puede deshacer."),
    el("div", { class: "actions" }, yes, el("button", { class: "ghost sm", onclick: restore }, "Cancelar"))));
}

// ---------- inicio ----------
async function screenHome() {
  const mine = el("div", { class: "stack" }, el("div", { class: "spinner" }));
  const count = el("span", { class: "count", hidden: true });
  const step = (n, t, d) => el("div", { class: "step spot" }, el("span", { class: "step-n" }, n), el("strong", {}, t), el("span", { class: "hint" }, d));
  show(
    el("header", { class: "hero" },
      treeSvg(),
      el("span", { class: "badge" }, el("i", { class: "live" }), christmasCountdown()),
      el("h1", { class: "title" }, "Amigo ", el("em", {}, "Invisible")),
      el("p", { class: "lead" }, "Crea un sorteo, manda el enlace al grupo y cada uno descubre a quién le regala. Nadie más puede verlo.")),
    el("div", { class: "actions", style: "justify-content:center" },
      el("button", { class: "primary big shine", onclick: () => go(location.pathname + "#crear") }, "🎁  Crear nuevo sorteo")),
    el("div", { class: "steps" },
      step("1", "Añade los nombres", "Solo hace falta escribirlos."),
      step("2", "Comparte el enlace", "Uno para todo el grupo."),
      step("3", "Abre tu regalo", "Y descubre a quién le regalas.")),
    el("section", { class: "card spot" }, el("div", { class: "card-head" }, el("h2", {}, "Tus sorteos"), count), mine)
  );

  let items;
  try { items = await store.listMyDraws(); }
  catch (e) { console.error(e); mine.replaceChildren(el("p", { class: "err" }, "No se han podido cargar tus sorteos.")); return; }

  const renderList = () => {
    count.hidden = !items.length; count.textContent = items.length;
    if (!items.length) { mine.replaceChildren(el("p", { class: "hint" }, "Aún no has creado ninguno en este navegador.")); return; }
    mine.replaceChildren(el("ul", { class: "list" }, items.map(row)));
  };
  const row = (d, i) => {
    const li = el("li", { style: `--i:${i}` });
    const normal = () => li.replaceChildren(
      el("div", { class: "info" },
        el("span", { class: "who" }, drawLabel(d)),
        el("span", { class: "hint" }, `${d.people.length} personas` + (fmtDate(d.createdAt) ? ` · ${fmtDate(d.createdAt)}` : ""))),
      el("div", { class: "actions" },
        el("button", { class: "ghost sm", onclick: () => copy(drawLink(d.id), "Enlace copiado") }, "Copiar enlace"),
        el("button", { class: "ghost sm", onclick: () => go("?s=" + d.id) }, "Abrir"),
        el("button", { class: "danger sm", "aria-label": "Borrar sorteo", onclick: () => askDelete(li, normal, d, d.id, () => { items = items.filter(x => x !== d); renderList(); }) }, "Borrar")));
    normal();
    return li;
  };
  renderList();
}

// ---------- crear: solo nombres ----------
const form = { names: [] };
function screenCreate() {
  const input = el("input", { id: "name", placeholder: "Escribe un nombre y pulsa Intro", autocomplete: "off", enterkeyhint: "done", "aria-label": "Nombre del participante" });
  const chips = el("ul", { class: "chips" });
  const countEl = el("span", { class: "count" });
  const errEl = el("p", { class: "err", hidden: true });
  const empty = el("p", { class: "hint" }, "Puedes pegar varios separados por comas.");
  const need = el("p", { class: "hint" });
  const goBtn = el("button", { class: "primary big shine", onclick: () => doCreate() }, "✨ Hacer el sorteo");

  const renderChips = (added = []) => {
    chips.replaceChildren(...form.names.map(n => {
      const li = el("li", { class: added.includes(n) ? "new" : "" },
        el("i", { class: "dot", style: `--c:${colorFor(n)}` }), n,
        el("button", { "aria-label": `Quitar a ${n}`, onclick: () => {
          if (li.classList.contains("out")) return;
          li.classList.add("out");
          setTimeout(() => { const i = form.names.indexOf(n); if (i >= 0) form.names.splice(i, 1); errEl.hidden = true; renderChips(); }, reduced ? 0 : 200);
        } }, "×"));
      return li;
    }));
    const n = form.names.length, enough = n >= 3;
    countEl.textContent = n;
    chips.hidden = !n; empty.hidden = !!n;
    goBtn.disabled = !enough;
    need.hidden = enough; need.textContent = `Hacen falta al menos 3 personas (${n} de 3).`;
  };

  const add = () => {
    const parts = input.value.split(/[,;\n]/).map(v => v.trim().replace(/\s+/g, " ").slice(0, 40)).filter(Boolean);
    if (!parts.length) return;
    const added = []; let error = "";
    for (const v of parts) {
      if (form.names.some(n => n.toLowerCase() === v.toLowerCase())) { error = `"${v}" ya está en la lista. Añade un apellido para distinguirlos.`; continue; }
      if (form.names.length >= 60) { error = "Máximo 60 personas."; break; }
      form.names.push(v); added.push(v);
    }
    errEl.hidden = !error; errEl.textContent = error;
    if (error && !added.length) input.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 260 });
    input.value = "";
    renderChips(added);
    input.focus();
  };
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); add(); } });

  show(
    el("header", { class: "hero" },
      el("div", { class: "eyebrow" }, "Nuevo sorteo"),
      el("h1", {}, "¿Quién ", el("em", {}, "participa"), "?")),
    el("div", { class: "card glow" },
      el("div", { class: "card-head" }, el("h2", {}, "Participantes"), countEl),
      el("div", { class: "row" }, input, el("button", { class: "ghost add", onclick: add, "aria-label": "Añadir" }, "+ Añadir")),
      errEl, chips, empty,
      el("div", { class: "divider" }),
      el("div", { class: "actions" }, goBtn, el("button", { class: "ghost", onclick: () => go(location.pathname) }, "Cancelar")),
      need)
  );
  renderChips();
  input.focus();
}

async function doCreate() {
  const people = form.names.slice();
  const box = el("div", { class: "shuffle" });
  const tags = people.map(n => { const t = el("div", { class: "tag" }, n); box.append(t); return t; });
  show(el("div", { class: "card glow center" }, el("div", { class: "eyebrow" }, "Sorteando"), el("h2", {}, "Mezclando papelitos…"), box));
  const saving = store.createDraw(people);
  for (let r = 0; r < 5; r++) {
    tags.forEach(t => {
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
      t.style.transform = `translate(calc(-50% + ${Math.cos(a) * d * 1.6}px), calc(-50% + ${Math.sin(a) * d * .7}px)) rotate(${(Math.random() - .5) * 34}deg)`;
    });
    await sleep(420);
  }
  tags.forEach(t => (t.style.transform = "translate(-50%,-50%) scale(.6)"));
  try {
    const id = await saving;
    form.names = [];
    confetti();
    const url = drawLink(id);
    show(
      el("header", { class: "hero" },
        el("div", { class: "eyebrow" }, "Sorteo hecho"),
        el("h1", {}, "Manda este ", el("em", {}, "enlace"), " al grupo")),
      el("div", { class: "card glow" },
        el("div", { class: "linkbox" }, url),
        el("div", { class: "actions" },
          el("button", { class: "primary big shine", onclick: () => copy(url, "Enlace copiado") }, "Copiar enlace"),
          el("button", { class: "ghost", onclick: () => go("?s=" + id) }, "Abrir el sorteo")),
        el("p", { class: "hint" }, "Cada persona entra, toca su nombre y abre su regalo. Ese nombre queda bloqueado para los demás. Nadie, tampoco tú, puede ver lo que les ha tocado a los otros."))
    );
  } catch (e) {
    console.error(e);
    show(el("div", { class: "card" }, el("h2", {}, "No se ha podido guardar el sorteo"),
      el("p", { class: "lead" }, "Comprueba tu conexión y vuelve a intentarlo."),
      el("p", { class: "hint" }, "Detalle: " + (e.code || e.message)),
      el("div", { class: "actions" }, el("button", { class: "primary", onclick: () => { form.names = people; screenCreate(); } }, "Volver"))));
  }
}

// ---------- un sorteo: ¿quién eres? ----------
async function screenDraw(id) {
  show(el("div", { class: "spinner" }));
  let d = null;
  try { d = await store.getDraw(id); } catch (e) { console.error(e); }
  if (!d) {
    return show(el("header", { class: "hero" }, el("h1", {}, "Sorteo no ", el("em", {}, "encontrado")),
      el("p", { class: "lead" }, "El enlace está incompleto o el sorteo se ha borrado. Pide a quien lo organizó que te lo vuelva a mandar.")));
  }
  const isOwner = d.ownerUid === store.uid;
  let claims = {};
  const grid = el("div", { class: "people intro" });
  setTimeout(() => grid.classList.remove("intro"), 1600);
  const ownerBox = el("div");
  const meta = [d.budget && `Presupuesto: ${d.budget}`, d.date && `Intercambio: ${d.date}`].filter(Boolean);

  // zona de borrar del organizador (se conserva aunque el panel se repinte)
  const delBox = el("div");
  const delNormal = () => delBox.replaceChildren(el("button", { class: "danger sm", onclick: () => askDelete(delBox, delNormal, d, id, () => go(location.pathname)) }, "Borrar sorteo"));
  delNormal();

  show(
    el("header", { class: "hero" },
      el("div", { class: "eyebrow" }, d.title || "Amigo Invisible"),
      el("h1", {}, "¿Quién ", el("em", {}, "eres"), "?"),
      el("p", { class: "lead" }, "Toca tu nombre. Al entrar, tu nombre se bloquea y nadie más podrá abrirlo."),
      meta.length && el("div", { class: "meta" }, meta.map(m => el("span", { class: "pill" }, m)))),
    grid, ownerBox
  );

  const render = () => {
    grid.replaceChildren(...d.people.map((n, i) => {
      const c = claims[String(i)], mine = c && c.uid === store.uid, taken = c && !mine;
      return el("button", {
        class: "person spot" + (taken ? " taken" : " tilt") + (mine ? " mine" : ""), style: `--i:${i}`, "aria-disabled": taken ? "true" : null,
        onclick: () => taken ? toast(`${n} ya ha entrado. Si eres tú, avisa a quien organiza.`) : mine ? screenGift(id, d, String(i)) : screenConfirm(id, d, String(i))
      },
        el("div", { class: "avatar", style: `--c:${colorFor(n)}` }, initials(n)), el("span", {}, n),
        mine ? el("small", {}, "★ Eres tú") : taken ? el("small", {}, "🔒 Ya ha entrado") : el("small", { class: "go" }, "Soy yo →"));
    }));
    if (isOwner) renderOwner();
  };

  const renderOwner = () => {
    const count = Object.keys(claims).length;
    ownerBox.replaceChildren(el("div", { class: "card spot" },
      el("div", { class: "owner-head" },
        progressRing(count, d.people.length),
        el("div", { class: "stack", style: "gap:4px" },
          el("div", { class: "eyebrow" }, "Solo lo ves tú"),
          el("h2", {}, `Han entrado ${count} de ${d.people.length}`))),
      el("div", { class: "actions" },
        el("button", { class: "primary sm", onclick: () => copy(drawLink(id), "Enlace copiado") }, "Copiar enlace del grupo"),
        el("button", { class: "ghost sm", onclick: () => go(location.pathname) }, "Mis sorteos")),
      el("ul", { class: "list" }, d.people.map((n, i) => {
        const k = String(i), c = claims[k];
        const li = el("li", {}, el("span", { class: "who" }, n));
        if (!c) { li.append(el("span", { class: "status out" }, "Sin entrar")); return li; }
        const free = el("button", { class: "ghost sm" }, "Liberar");
        free.addEventListener("click", () => {
          li.replaceChildren(el("span", { class: "hint", style: "flex:1 1 200px" }, `¿Liberar a ${n}? Úsalo solo si ${n} no ha podido entrar o si otra persona entró por error.`),
            el("div", { class: "actions" },
              el("button", { class: "primary sm", onclick: async () => { try { await store.freeClaim(id, k); toast(`${n} liberado`); } catch (e) { toast("No se ha podido liberar"); } } }, "Liberar"),
              el("button", { class: "ghost sm", onclick: render }, "Cancelar")));
        });
        li.append(el("div", { class: "actions", style: "align-items:center" }, el("span", { class: "status in" }, c.uid === store.uid ? "Eres tú" : "Ha entrado"), free));
        return li;
      })),
      el("div", { class: "divider" }),
      delBox
    ));
  };

  render();
  unsub = store.watchClaims(id, c => {
    claims = c;
    if (document.body.contains(grid)) render();
  });
}

function screenConfirm(id, d, key) {
  stopWatching();
  const name = d.people[Number(key)];
  const yes = el("button", { class: "primary big shine" }, "Sí, soy yo");
  const err = el("p", { class: "err", hidden: true });
  yes.addEventListener("click", async () => {
    yes.disabled = true; yes.textContent = "Entrando…";
    try { await store.claim(id, key); screenGift(id, d, key); }
    catch (e) {
      console.error(e);
      yes.disabled = false; yes.textContent = "Sí, soy yo";
      err.hidden = false;
      err.textContent = (e.code === "taken" || e.code === "permission-denied")
        ? `Alguien ya ha entrado como ${name}. Si eres tú, avisa a quien organiza para que lo libere.`
        : "No se ha podido entrar. Comprueba tu conexión y vuelve a intentarlo.";
    }
  });
  show(el("div", { class: "card glow center", style: "padding:40px 22px" },
    el("div", { class: "avatar xl", style: `--c:${colorFor(name)}` }, initials(name)),
    el("h1", {}, "¿Eres ", el("em", {}, name), "?"),
    el("p", { class: "lead" }, `Al confirmar, el nombre ${name} quedará bloqueado en este móvil u ordenador. Nadie más podrá abrirlo.`),
    err,
    el("div", { class: "actions" }, yes, el("button", { class: "ghost", onclick: () => screenDraw(id) }, "No, volver"))));
}

// ---------- el regalo ----------
async function screenGift(id, d, key) {
  stopWatching();
  const giver = d.people[Number(key)];
  show(el("div", { class: "spinner" }));
  let receiver = null;
  try { receiver = await store.readSecret(id, key); } catch (e) { console.error(e); }
  if (!receiver) return show(el("div", { class: "card" }, el("h2", {}, "No se puede abrir tu regalo"),
    el("p", { class: "lead" }, "Este nombre está bloqueado en otro móvil u ordenador, o el sorteo se ha borrado. Si eres tú, pide a quien organiza que lo libere y vuelve a entrar."),
    el("div", { class: "actions" }, el("button", { class: "ghost", onclick: () => screenDraw(id) }, "Volver"))));

  let taps = 0;
  const dots = el("div", { class: "taps" }, el("i"), el("i"), el("i"));
  const hint = el("p", { class: "hint" }, "Toca el regalo 3 veces para abrirlo");
  const slot = el("div", { class: "slot", hidden: true });
  const after = el("div", { class: "center stack", hidden: true },
    el("div", { class: "meta" }, d.budget && el("span", { class: "pill" }, `Presupuesto: ${d.budget}`), d.date && el("span", { class: "pill" }, `Intercambio: ${d.date}`)),
    el("p", { class: "hint" }, "🤫 Es secreto. Puedes volver a verlo desde este mismo móvil u ordenador."),
    el("div", { class: "actions" }, el("button", { class: "ghost", onclick: () => screenDraw(id) }, "Volver")));
  const gift = el("button", { class: "gift", "aria-label": "Tocar el regalo" },
    el("div", { class: "box" }, el("div", { class: "rib" })),
    el("div", { class: "lid" }, el("div", { class: "rib" }), el("div", { class: "bow" })));
  const stage = el("div", { class: "card glow stage" });

  gift.addEventListener("click", async () => {
    if (taps >= 3) return;
    taps++;
    dots.children[taps - 1].classList.add("on");
    gift.style.setProperty("--glow", taps);
    gift.classList.remove("s1", "s2"); void gift.offsetWidth;
    if (taps < 3) {
      gift.classList.add(taps === 1 ? "s1" : "s2");
      burst(gift, 6 + taps * 6);
      hint.textContent = taps === 1 ? "Un poco más…" : "¡Una vez más!";
      return;
    }
    gift.classList.add("open");
    burst(gift, 34);
    if (!reduced) stage.animate([{ transform: "translate(0,0)" }, { transform: "translate(-4px,2px)" }, { transform: "translate(4px,-2px)" }, { transform: "translate(0,0)" }], { duration: 220 });
    hint.textContent = "Te ha tocado regalar a…";
    await sleep(550);
    gift.hidden = true; dots.hidden = true; slot.hidden = false;
    await spinReel(slot, d.people.filter(n => n !== giver), receiver);
    // de golpe, sin frenar
    slot.replaceChildren(el("div", { class: "name land" }, receiver));
    stage.classList.add("revealed");
    hint.textContent = "Te ha tocado regalar a";
    confetti(); burst(slot, 40);
    after.hidden = false;
  });

  stage.append(el("h1", { style: "text-align:center" }, "Hola, ", el("em", {}, giver)), gift, dots, hint, slot, after);
  show(el("div", { class: "eyebrow", style: "align-self:center" }, d.title || "Amigo Invisible"), stage);
}

route();
