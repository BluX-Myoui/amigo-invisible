// Utilidades de interfaz: crear elementos, cambiar de pantalla, avisos, colores...

export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "style") n.style.cssText = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach(c => {
    if (c == null || c === "" || c === false) return;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return n;
};

const app = document.getElementById("app");

// Cambia la pantalla. Cada bloque entra con un pequeño retraso escalonado.
export function show(...nodes) {
  const screen = el("div", { class: "screen" }, ...nodes);
  [...screen.children].forEach((c, i) => c.style.setProperty("--n", i));
  app.replaceChildren(screen);
  window.scrollTo({ top: 0, behavior: "auto" });
  return screen;
}

let toastT;
export function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  t.classList.remove("in"); void t.offsetWidth; t.classList.add("in");
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.hidden = true), 2600);
}

export async function copy(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg); }
  catch (e) { prompt("Copia este enlace:", text); }
}

export const sleep = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));

const PALETTE = ["#d6343f", "#c08a12", "#1f8a5b", "#2f6fb0", "#8a4fbf", "#c2602e", "#0f7c7c", "#b03a78"];
export const colorFor = name => PALETTE[[...name].reduce((a, c) => a + c.codePointAt(0), 0) % PALETTE.length];
export const initials = n => n.split(" ").filter(Boolean).slice(0, 2).map(w => [...w][0].toUpperCase()).join("");

export const shuffled = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export const drawLink = id => location.origin + location.pathname + "?s=" + encodeURIComponent(id);
export const fmtDate = ts => ts && ts.toDate ? ts.toDate().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "";
export const namesPreview = people => people.slice(0, 3).join(", ") + (people.length > 3 ? ` y ${people.length - 3} más` : "");
export const drawLabel = d => d.title || namesPreview(d.people);

export function christmasCountdown() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let xmas = new Date(now.getFullYear(), 11, 25);
  if (today > xmas) xmas = new Date(now.getFullYear() + 1, 11, 25);
  const days = Math.round((xmas - today) / 864e5);
  if (days === 0) return "¡Hoy es Navidad!";
  if (days === 1) return "Mañana es Navidad";
  return `Faltan ${days} días para Navidad`;
}
