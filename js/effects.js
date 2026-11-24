// Efectos visuales: luces, nieve, confeti, chispas, brillo con el ratón y la ruleta.
import { el, reduced, shuffled } from "./ui.js";

// ---------- guirnalda de luces ----------
export function startLights() {
  const ul = document.getElementById("lights");
  for (let i = 0; i < 60; i++) ul.append(el("li", { style: `--d:${(-Math.random() * 2.6).toFixed(2)}s` }));
}

// ---------- nieve con profundidad (se inclina un poco hacia donde mueves el ratón) ----------
export function startSnow() {
  if (reduced) return;
  const c = document.getElementById("snow"), x = c.getContext("2d");
  let W, H, wind = 0, windTarget = 0;
  const resize = () => { W = c.width = innerWidth * devicePixelRatio; H = c.height = innerHeight * devicePixelRatio; };
  resize(); addEventListener("resize", resize);
  addEventListener("pointermove", e => { windTarget = (e.clientX / innerWidth - .5) * .0016; }, { passive: true });
  const flakes = Array.from({ length: 90 }, () => {
    const z = Math.random();                       // 0 = lejos, 1 = cerca
    return { x: Math.random(), y: Math.random(), z, r: .6 + z * 2.6, s: .0003 + z * .0013, w: Math.random() * 6, a: .2 + z * .65 };
  });
  (function loop(t) {
    wind += (windTarget - wind) * .02;
    x.clearRect(0, 0, W, H);
    x.fillStyle = "#ffffff";
    for (const f of flakes) {
      f.y += f.s; f.x += wind * (.4 + f.z);
      if (f.y > 1.02) { f.y = -.02; f.x = Math.random(); }
      if (f.x > 1.02) f.x = -.02; else if (f.x < -.02) f.x = 1.02;
      x.globalAlpha = f.a;
      x.beginPath(); x.arc((f.x + Math.sin(t / 1800 + f.w) * .012) * W, f.y * H, f.r * devicePixelRatio, 0, 7); x.fill();
    }
    requestAnimationFrame(loop);
  })(0);
}

// ---------- confeti ----------
export function confetti() {
  if (reduced) return;
  const c = document.getElementById("confetti"), x = c.getContext("2d"), dpr = devicePixelRatio;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const cols = ["#e5484d", "#f2c14e", "#30a46c", "#ffffff", "#ffd166"];
  const ps = Array.from({ length: 200 }, () => ({
    x: c.width / 2, y: c.height * .45, vx: (Math.random() - .5) * 26 * dpr, vy: (-Math.random() * 22 - 6) * dpr,
    w: (5 + Math.random() * 7) * dpr, h: (3 + Math.random() * 5) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
    col: cols[Math.floor(Math.random() * cols.length)]
  }));
  const start = performance.now();
  (function loop(now) {
    const t = now - start;
    x.clearRect(0, 0, c.width, c.height);
    for (const p of ps) {
      p.vy += .55 * dpr; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, 1 - t / 3400);
      x.fillStyle = p.col; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
    }
    if (t < 3400) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height);
  })(start);
}

// ---------- chispas que salen de un elemento ----------
export function burst(target, count = 14) {
  if (reduced || !target) return;
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const cols = ["#f2c14e", "#ffe7a3", "#ff6b70", "#ffffff", "#5fe0a0"];
  for (let i = 0; i < count; i++) {
    const s = el("span", { class: "spark", style: `left:${cx}px;top:${cy}px;background:${cols[i % cols.length]}` });
    document.body.append(s);
    const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 110, sc = (.6 + Math.random() * .9).toFixed(2);
    s.animate([
      { transform: `translate(-50%,-50%) scale(${sc}) rotate(0deg)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0) rotate(180deg)`, opacity: 0 }
    ], { duration: 650 + Math.random() * 450, easing: "cubic-bezier(.15,.8,.3,1)" }).onfinish = () => s.remove();
  }
}

// ---------- brillo que sigue al ratón y tarjetas que se inclinan ----------
export function startPointerFX() {
  if (!matchMedia("(hover: hover)").matches) return;
  document.addEventListener("pointermove", e => {
    const t = e.target.closest?.(".spot");
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty("--mx", `${e.clientX - r.left}px`);
    t.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (t.classList.contains("tilt") && !reduced) {
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      t.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
      t.style.setProperty("--rx", `${(-py * 12).toFixed(2)}deg`);
    }
  }, { passive: true });
  document.addEventListener("pointerout", e => {
    const t = e.target.closest?.(".tilt");
    if (t && !t.contains(e.relatedTarget)) { t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); }
  });
}

// ---------- ruleta tipo tragaperras ----------
// Los nombres suben por una tira continua que acelera hasta su velocidad máxima.
// Nunca hay dos nombres iguales seguidos, y a cualquier velocidad se ve cómo cambian.
// Al acabar el tiempo se resuelve la promesa y quien llama pone el nombre ganador de golpe.
export function spinReel(host, pool, receiver) {
  const ROWS = 5;
  const rows = Array.from({ length: ROWS }, () => el("div", { class: "reel-row" }));
  const strip = el("div", { class: "reel-strip" }, rows);
  host.replaceChildren(el("div", { class: "reel" }, el("div", { class: "reel-frame" }), strip));
  if (reduced) return Promise.resolve();

  const DURATION = 2800;      // ms girando
  const V0 = 3, V1 = 17;      // nombres por segundo: al principio y a tope (17/s ≈ uno cada 60 ms)
  const seq = [];
  let queue = [];
  const nextName = () => {
    if (!queue.length) {
      queue = shuffled(pool);
      if (queue[0] === seq[seq.length - 1]) queue.push(queue.shift());   // sin repetir al empezar otra vuelta
    }
    return queue.shift();
  };
  const ensure = i => { while (seq.length <= i) seq.push(nextName()); };

  const H = rows[0].offsetHeight || 60;
  return new Promise(resolve => {
    const t0 = performance.now();
    let last = t0, pos = 2, shownK = -1;
    const frame = now => {
      const t = now - t0;
      if (t >= DURATION) return resolve();
      const dt = Math.min(50, now - last) / 1000; last = now;
      const p = Math.min(1, t / (DURATION * .75));          // llega a tope al 75% y sigue a tope
      const v = V0 * Math.pow(V1 / V0, p * p * (3 - 2 * p)); // aceleración suave
      pos += v * dt;
      const k = Math.floor(pos), f = pos - k;
      if (k !== shownK) {
        ensure(k + 2);
        rows.forEach((r, j) => (r.textContent = seq[k - 2 + j]));
        shownK = k;
      }
      strip.style.transform = `translate3d(0,${(-1 - f) * H}px,0)`;
      rows.forEach((r, j) => {
        const d = Math.abs(j - 2 - f);                          // distancia al centro, en filas
        r.style.opacity = Math.max(0, 1 - d * .6).toFixed(3);
        r.style.transform = `scale(${(1 - Math.min(d, 2) * .14).toFixed(3)})`;
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

// ---------- árbol de la portada ----------
export function treeSvg() {
  const s = el("div", { "aria-hidden": "true" });
  s.innerHTML = `<svg class="tree" viewBox="0 0 100 120">
    <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46d796"/><stop offset="1" stop-color="#145a3b"/></linearGradient></defs>
    <polygon points="50,16 71,46 29,46" fill="url(#tg)"/>
    <polygon points="50,30 80,70 20,70" fill="url(#tg)"/>
    <polygon points="50,50 90,100 10,100" fill="url(#tg)"/>
    <rect x="44" y="100" width="12" height="14" rx="2" fill="#6b4226"/>
    <circle class="orn" cx="42" cy="40" r="3" fill="#60a5fa"/>
    <circle class="orn" cx="60" cy="60" r="3.5" fill="#ffd166"/>
    <circle class="orn" cx="37" cy="64" r="3.5" fill="#ff5a5f"/>
    <circle class="orn" cx="56" cy="84" r="3.5" fill="#ff5a5f"/>
    <circle class="orn" cx="30" cy="90" r="3.5" fill="#ffd166"/>
    <circle class="orn" cx="74" cy="92" r="3" fill="#60a5fa"/>
    <polygon class="star" points="50,2 53.5,9.2 61.4,10.3 55.7,15.9 57,23.8 50,20.1 43,23.8 44.3,15.9 38.6,10.3 46.5,9.2" fill="#f2c14e"/>
  </svg>`;
  return s.firstElementChild;
}

// ---------- anillo de progreso (organizador) ----------
export function progressRing(count, total) {
  const R = 26, C = 2 * Math.PI * R;
  const off = total ? C * (1 - count / total) : C;
  const s = el("div", { class: "ring", role: "img", "aria-label": `Han entrado ${count} de ${total}` });
  s.innerHTML = `<svg viewBox="0 0 64 64"><circle class="track" cx="32" cy="32" r="${R}"/><circle class="bar" cx="32" cy="32" r="${R}" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/></svg><span>${count}/${total}</span>`;
  return s;
}
