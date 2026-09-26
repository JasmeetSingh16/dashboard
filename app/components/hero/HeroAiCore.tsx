"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import "./HeroAiCore.css";

/* ------------------------------------------------------------------ */
/* Hero AI core — React port of the "viz" in design/hero-prototype.html */
/*                                                                    */
/* The static scene is rendered by React; the animation (layout,      */
/* particles, typing, story player) runs imperatively in one effect,  */
/* exactly like the prototype. The component holds no state, so      */
/* React never re-renders over the DOM the effect is driving.         */
/* ------------------------------------------------------------------ */

const NS = "http://www.w3.org/2000/svg";

const STAGE = ["#2F5BFF", "#7A4DFF", "#D6409F", "#DB8416"];
const SRC_COLOR = ["#2F5BFF", "#1FA971", "#7A4DFF", "#D6409F"];

const ICONS: Record<string, string> = {
  idle: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  0: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  1: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.6 7.6L10.8 16M16.4 7.6L13.2 16M8.2 6h7.6"/></svg>',
  2: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/></svg>',
  3: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/></svg>',
};

type OutputType = "insight" | "content" | "automation" | "opportunity";

const TYPE: Record<OutputType, { label: string; c: string; soft: string; icon: string }> = {
  insight: { label: "Insight", c: "#2F5BFF", soft: "#E8EDFF", icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 16V9M10 16V4M16 16v-5"/></svg>' },
  content: { label: "Content", c: "#7A4DFF", soft: "#EFE9FF", icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M7.5 10h5M7.5 13h3"/></svg>' },
  automation: { label: "Automation", c: "#DB8416", soft: "#FFF0DC", icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5L4.5 11H10l-1 6.5L15.5 9H10z"/></svg>' },
  opportunity: { label: "Opportunity", c: "#D6409F", soft: "#FCE7F3", icon: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3"/></svg>' },
};

type Story = { src: number; type: OutputType; steps: string[]; body: () => string };

const STORIES: Story[] = [
  {
    src: 1,
    type: "insight",
    steps: ["Reading your sales sheet", "Spotting a 32% jump", "Writing a short summary", "Sent to your inbox"],
    body: () => `<p class="hac-oc-title">Sales · this month</p>
      <p class="hac-oc-kpi">↑ 32%</p><p class="hac-oc-sub">vs last month</p>
      <div class="hac-bars">${[38, 52, 46, 63, 58, 78, 96].map((h, i) => `<b style="--h:${h}%;--d:${0.15 + i * 0.08}s"></b>`).join("")}</div>`,
  },
  {
    src: 0,
    type: "content",
    steps: ["Reading 14 documents", "Finding the key points", "Drafting a blog post", "Published to your site"],
    body: () => `<p class="hac-oc-title">Blog draft</p>
      <h4 class="hac-oc-h">5 ways to cut support time</h4>
      ${[92, 78, 86, 60].map((w, i) => `<div class="hac-ln" style="--w:${w}%;--d:${0.2 + i * 0.28}s"></div>`).join("")}
      <span class="hac-chip ok">✓ Published</span>`,
  },
  {
    src: 3,
    type: "automation",
    steps: ["Reading 40 customer chats", "Finding repeat questions", "Building a reply flow", "Automation switched on"],
    body: () => `<p class="hac-oc-title">Reply flow</p>
      <div class="hac-flowrow">
        <span class="hac-node" style="--d:.2s">Question</span><span class="hac-arrow">→</span>
        <span class="hac-node" style="--d:.55s">Find answer</span><span class="hac-arrow">→</span>
        <span class="hac-node" style="--d:.9s">Reply</span>
      </div>
      <div class="hac-toggle-row">Automation <span class="hac-switch"></span></div>`,
  },
  {
    src: 2,
    type: "opportunity",
    steps: ["Scanning competitor sites", "Comparing their offers", "Listing 3 gaps to fill", "Added to your plan"],
    body: () => `<p class="hac-oc-title">3 gaps found</p>
      ${["No live chat on their pricing page", "Nobody offers WhatsApp support", "Shipping FAQ is missing"].map((t, i) => `<div class="hac-gap" style="--d:${0.2 + i * 0.25}s"><i></i>${t}</div>`).join("")}`,
  },
];

/* ---------------- layouts (design px) ---------------- */

type Pt = [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Layout = {
  W: number;
  H: number;
  src: (i: number) => Rect;
  core: { cx: number; cy: number; orb: number; ring: number; labelDX: number; labelDY: number; orbit: number };
  caption: { cx: number; y: number; w: number };
  out: Rect;
  inA: (i: number) => Pt;
  inB: () => Pt;
  outA: () => Pt;
  outB: () => Pt;
  curve: (a: Pt, b: Pt) => string;
  aurora: [number, number, number][];
};

const WIDE: Layout = {
  W: 760,
  H: 520,
  src: (i) => ({ x: 0, y: 92 + i * 86, w: 200, h: 66 }),
  core: { cx: 380, cy: 252, orb: 58, ring: 94, labelDX: 84, labelDY: 136, orbit: 132 },
  caption: { cx: 380, y: 452, w: 300 },
  out: { x: 562, y: 120, w: 198, h: 270 },
  inA: (i) => {
    const r = WIDE.src(i);
    return [r.x + r.w, r.y + r.h / 2];
  },
  inB: () => [380 - 94 - 10, 252],
  outA: () => [380 + 94 + 10, 252],
  outB: () => [562, 255],
  curve: (a, b) => {
    const mx = a[0] + (b[0] - a[0]) * 0.55;
    return `M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}`;
  },
  aurora: [[250, 120, 260], [360, 210, 300], [300, 280, 220]],
};

const NARROW: Layout = {
  W: 380,
  H: 780,
  src: (i) => ({ x: (i % 2) * 198, y: Math.floor(i / 2) * 74, w: 182, h: 62 }),
  core: { cx: 190, cy: 330, orb: 50, ring: 80, labelDX: 76, labelDY: 118, orbit: 112 },
  caption: { cx: 190, y: 476, w: 300 },
  out: { x: 10, y: 538, w: 360, h: 236 },
  inA: (i) => {
    const r = NARROW.src(i);
    return [r.x + r.w / 2, r.y + r.h];
  },
  inB: () => [190, 330 - 80 - 10],
  outA: () => [190, 330 + 80 + 10],
  outB: () => [190, 538],
  curve: (a, b) => {
    const my = a[1] + (b[1] - a[1]) * 0.55;
    return `M${a[0]},${a[1]} C${a[0]},${my} ${b[0]},${my} ${b[0]},${b[1]}`;
  },
  aurora: [[60, 200, 240], [150, 260, 260], [120, 330, 200]],
};

/* ---------------- static markup data ---------------- */

const SOURCES = [
  {
    name: "Documents",
    sub: "PDFs, notes, SOPs",
    c: "#2F5BFF",
    soft: "#E8EDFF",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2.5h7l3.5 3.5v11.5H5z" />
        <path d="M12 2.5V6h3.5M7.5 10h5M7.5 13h5" />
      </svg>
    ),
  },
  {
    name: "Data",
    sub: "Sheets, CRM",
    c: "#1FA971",
    soft: "#E3F6EE",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3.5" width="14" height="13" rx="2" />
        <path d="M3 8h14M8 8v8.5" />
      </svg>
    ),
  },
  {
    name: "Web",
    sub: "Sites, competitors",
    c: "#7A4DFF",
    soft: "#EFE9FF",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="10" cy="10" r="7" />
        <path d="M3 10h14M10 3c2.2 2.3 2.2 11.7 0 14M10 3c-2.2 2.3-2.2 11.7 0 14" />
      </svg>
    ),
  },
  {
    name: "Conversations",
    sub: "Chats, email, calls",
    c: "#D6409F",
    soft: "#FCE7F3",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 5.5a2 2 0 012-2h9a2 2 0 012 2v6a2 2 0 01-2 2H9l-3.5 3v-3a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const LABELS = [
  { text: "Understand", c: "#2F5BFF", soft: "#DDE5FF" },
  { text: "Reason", c: "#7A4DFF", soft: "#E7DEFF" },
  { text: "Create", c: "#D6409F", soft: "#F9D9EC" },
  { text: "Take action", c: "#DB8416", soft: "#FBE3C2" },
];

const tone = (c: string, soft: string) => ({ "--c": c, "--c-soft": soft }) as CSSProperties;

/* ------------------------------------------------------------------ */

export default function HeroAiCore() {
  const vizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viz = vizRef.current;
    if (!viz) return;

    const q = <T extends Element>(sel: string) => viz.querySelector(sel) as T;
    const inner = q<HTMLDivElement>(".hac-inner");
    const pathsSvg = q<SVGSVGElement>(".hac-paths");
    const arcsSvg = q<SVGSVGElement>(".hac-arcs");
    const orbit = q<HTMLDivElement>(".hac-orbit");
    const orb = q<HTMLDivElement>(".hac-orb");
    const orbIcon = q<HTMLSpanElement>(".hac-orb-icon");
    const caption = q<HTMLDivElement>(".hac-caption");
    const capDot = caption.querySelector("i") as HTMLElement;
    const capText = q<HTMLSpanElement>(".hac-cap-text");
    const out = q<HTMLDivElement>(".hac-out");
    const ocHead = q<HTMLDivElement>(".hac-oc-head");
    const ocBody = q<HTMLDivElement>(".hac-oc-body");
    const auroras = Array.from(viz.querySelectorAll<HTMLDivElement>(".hac-aurora"));
    const srcs = Array.from(viz.querySelectorAll<HTMLDivElement>(".hac-src"));
    const labels = Array.from(viz.querySelectorAll<HTMLDivElement>(".hac-label"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let L = WIDE;
    let inPaths: SVGPathElement[] = [];
    let outPath: SVGPathElement | null = null;
    let arcEls: SVGPathElement[] = [];
    let particleG: SVGGElement | null = null;

    const place = (el: HTMLElement, r: Rect) =>
      Object.assign(el.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
    const pt = (cx: number, cy: number, r: number, deg: number): Pt => {
      const a = (deg * Math.PI) / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };

    function build() {
      const narrow = viz!.clientWidth < 560;
      L = narrow ? NARROW : WIDE;
      inner.style.width = L.W + "px";
      inner.style.height = L.H + "px";
      [pathsSvg, arcsSvg].forEach((s) => {
        s.setAttribute("viewBox", `0 0 ${L.W} ${L.H}`);
        s.setAttribute("width", String(L.W));
        s.setAttribute("height", String(L.H));
      });

      const k = L.core;
      srcs.forEach((el, i) => place(el, L.src(i)));
      place(orb, { x: k.cx - k.orb, y: k.cy - k.orb, w: k.orb * 2, h: k.orb * 2 });
      place(orbit, { x: k.cx - k.orbit, y: k.cy - k.orbit, w: k.orbit * 2, h: k.orbit * 2 });
      const lp = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      labels.forEach((el, s) => {
        const w = s === 3 ? 136 : 124;
        place(el, { x: k.cx + lp[s][0] * k.labelDX - w / 2, y: k.cy + lp[s][1] * k.labelDY - 15, w, h: 30 });
      });
      Object.assign(caption.style, {
        left: L.caption.cx - L.caption.w / 2 + "px",
        top: L.caption.y + "px",
        width: L.caption.w + "px",
      });
      place(out, L.out);
      auroras.forEach((el, i) => {
        const [x, y, s] = L.aurora[i];
        place(el, { x, y, w: s, h: s });
      });

      // paths
      pathsSvg.innerHTML = "";
      inPaths = [];
      for (let i = 0; i < 4; i++) {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", L.curve(L.inA(i), L.inB()));
        p.setAttribute("class", "hac-path-base");
        pathsSvg.appendChild(p);
        inPaths.push(p);
      }
      outPath = document.createElementNS(NS, "path");
      outPath.setAttribute("d", L.curve(L.outA(), L.outB()));
      outPath.setAttribute("class", "hac-path-base");
      pathsSvg.appendChild(outPath);
      particleG = document.createElementNS(NS, "g");
      pathsSvg.appendChild(particleG);

      // arcs: start at 9 o'clock, clockwise
      arcsSvg.innerHTML = "";
      arcEls = [];
      for (let s = 0; s < 4; s++) {
        const a0 = 180 + s * 90 + 7;
        const a1 = 180 + (s + 1) * 90 - 7;
        const [x0, y0] = pt(k.cx, k.cy, k.ring, a0);
        const [x1, y1] = pt(k.cx, k.cy, k.ring, a1);
        const d = `M${x0},${y0} A${k.ring},${k.ring} 0 0 1 ${x1},${y1}`;
        const tr = document.createElementNS(NS, "path");
        tr.setAttribute("d", d);
        tr.setAttribute("class", "hac-arc-track");
        arcsSvg.appendChild(tr);
        const ar = document.createElementNS(NS, "path");
        ar.setAttribute("d", d);
        ar.setAttribute("class", "hac-arc");
        ar.setAttribute("pathLength", "100");
        ar.style.stroke = STAGE[s];
        ar.style.filter = `drop-shadow(0 0 6px ${STAGE[s]}88)`;
        arcsSvg.appendChild(ar);
        arcEls.push(ar);
      }
      fit();
    }

    function fit() {
      const scale = Math.min(1.1, viz!.clientWidth / L.W);
      inner.style.transform = `scale(${scale})`;
      // Explicit height replaces the CSS aspect-ratio placeholder.
      viz!.style.aspectRatio = "auto";
      viz!.style.height = L.H * scale + "px";
    }

    /* ---------- particles ---------- */
    type Particle = { path: SVGPathElement; len: number; color: string; dur: number; start: number; r: number; el: SVGCircleElement | null };
    let parts: Particle[] = [];
    let rafId: number | null = null;
    const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    function emit(path: SVGPathElement, color: string, dur: number, delay: number, r: number) {
      parts.push({ path, len: path.getTotalLength(), color, dur, start: performance.now() + delay, r, el: null });
      if (!rafId) rafId = requestAnimationFrame(tick);
    }
    function tick(now: number) {
      rafId = null;
      parts = parts.filter((p) => {
        const t = (now - p.start) / p.dur;
        if (t < 0) return true;
        if (t >= 1) {
          p.el?.remove();
          return false;
        }
        if (!p.el) {
          p.el = document.createElementNS(NS, "circle");
          p.el.setAttribute("r", String(p.r));
          p.el.setAttribute("fill", p.color);
          p.el.setAttribute("class", "hac-particle");
          p.el.style.color = p.color;
          particleG?.appendChild(p.el);
        }
        const pos = p.path.getPointAtLength(p.len * easeIO(t));
        p.el.setAttribute("cx", String(pos.x));
        p.el.setAttribute("cy", String(pos.y));
        p.el.setAttribute("opacity", String(t < 0.12 ? t / 0.12 : t > 0.88 ? (1 - t) / 0.12 : 1));
        return true;
      });
      if (parts.length) rafId = requestAnimationFrame(tick);
    }
    function clearParticles() {
      parts.forEach((p) => p.el?.remove());
      parts = [];
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    /* ---------- caption typing ---------- */
    let typeTimer: ReturnType<typeof setInterval> | undefined;
    function say(text: string, color?: string) {
      clearInterval(typeTimer);
      capDot.style.background = color || "#7E86A3";
      if (reduceMotion) {
        capText.textContent = text;
        return;
      }
      let n = 0;
      capText.textContent = "";
      typeTimer = setInterval(() => {
        n++;
        capText.textContent = text.slice(0, n);
        if (n >= text.length) clearInterval(typeTimer);
      }, 22);
    }

    let iconTimer: ReturnType<typeof setTimeout> | undefined;
    function setOrbIcon(key: string | number) {
      orbIcon.style.opacity = "0";
      clearTimeout(iconTimer);
      iconTimer = setTimeout(() => {
        orbIcon.innerHTML = ICONS[key];
        orbIcon.style.opacity = "1";
      }, reduceMotion ? 0 : 160);
    }

    /* ---------- output card ---------- */
    function showIdle() {
      ocHead.innerHTML = `<span class="hac-oc-type"><i>${ICONS.idle.replace(/#fff/g, "#9AA2BA")}</i>Output</span>`;
      ocBody.innerHTML = `<div class="hac-skel" style="width:60%"></div><div class="hac-skel" style="width:90%"></div><div class="hac-skel" style="width:75%"></div><div class="hac-skel" style="width:82%"></div><p class="hac-idle-note">Waiting for the next result</p>`;
    }
    function showOutput(st: Story) {
      const t = TYPE[st.type];
      out.style.setProperty("--c", t.c);
      out.style.setProperty("--c-soft", t.soft);
      ocHead.innerHTML = `<span class="hac-oc-type"><i>${t.icon}</i>${t.label}</span><span class="hac-oc-new">NEW</span>`;
      ocBody.innerHTML = st.body();
      out.classList.add("flash");
      later(() => out.classList.remove("flash"), 900);
    }

    /* ---------- story player ---------- */
    let timers: ReturnType<typeof setTimeout>[] = [];
    let idx = 0;
    let active = true;
    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
      clearInterval(typeTimer);
      clearParticles();
    };

    function resetCore() {
      srcs.forEach((e) => e.classList.remove("on"));
      labels.forEach((e) => e.classList.remove("on"));
      arcEls.forEach((e) => e.classList.remove("on"));
      orb.classList.remove("busy");
    }

    function play(i: number) {
      stop();
      resetCore();
      idx = i;
      const st = STORIES[i];
      const srcEl = srcs[st.src];
      srcEl.classList.add("on");
      say("New information from " + (srcEl.querySelector("b")?.textContent ?? ""), SRC_COLOR[st.src]);
      for (let n = 0; n < 8; n++) emit(inPaths[st.src], SRC_COLOR[st.src], 950, 80 + n * 95, n % 3 === 0 ? 3.6 : 2.6);
      later(() => orb.classList.add("busy"), 900);

      const T0 = 1150;
      const STEP = 720;
      st.steps.forEach((txt, s) => {
        later(() => {
          arcEls[s].classList.add("on");
          labels[s].classList.add("on");
          setOrbIcon(s);
          say(txt, STAGE[s]);
        }, T0 + s * STEP);
      });
      const outAt = T0 + 3 * STEP + 520;
      later(() => {
        for (let n = 0; n < 5; n++) emit(outPath!, n === 0 ? "#7A4DFF" : "#B39BFF", 700, n * 70, n === 0 ? 4.2 : 2.6);
      }, outAt);
      later(() => {
        showOutput(st);
        orb.classList.remove("busy");
        setOrbIcon("idle");
        say("Done · " + st.steps[3], "#1FA971");
      }, outAt + 650);
      later(() => resetCore(), outAt + 3300);
      later(() => {
        if (active) play((i + 1) % STORIES.length);
      }, outAt + 3700);
    }

    function showStatic() {
      const st = STORIES[0];
      srcs[st.src].classList.add("on");
      arcEls.forEach((a) => a.classList.add("on"));
      labels.forEach((l) => l.classList.add("on"));
      orbIcon.innerHTML = ICONS[3];
      capText.textContent = "Done · " + st.steps[3];
      capDot.style.background = "#1FA971";
      showOutput(st);
    }

    /* ---------- interaction ---------- */
    const handlers = srcs.map((el, i) => {
      const go = () => {
        if (!reduceMotion) play(STORIES.findIndex((s) => s.src === i));
      };
      el.addEventListener("mouseenter", go);
      el.addEventListener("focus", go);
      el.addEventListener("click", go);
      return go;
    });

    /* ---------- sizing ---------- */
    let ro: ResizeObserver | null = null;
    const onResize = () => fit();
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        const narrow = viz.clientWidth < 560;
        if ((L === NARROW) !== narrow) {
          stop();
          build();
          if (reduceMotion) {
            resetCore();
            showStatic();
          } else if (active) play(idx);
        } else fit();
      });
      ro.observe(viz);
    } else window.addEventListener("resize", onResize);

    build();
    orbIcon.innerHTML = ICONS.idle;
    showIdle();
    viz.dataset.ready = "true";

    /* ---------- pause offscreen / hidden ---------- */
    const resume = () => {
      if (active) play(idx);
    };
    const onVisibility = () => {
      if (document.hidden) {
        active = false;
        stop();
      } else {
        active = true;
        resume();
      }
    };
    let io: IntersectionObserver | null = null;

    if (reduceMotion) {
      showStatic();
    } else {
      document.addEventListener("visibilitychange", onVisibility);
      if (typeof IntersectionObserver !== "undefined") {
        let seen = true;
        io = new IntersectionObserver((es) => {
          const v = es[0].isIntersecting;
          if (v && !seen) {
            seen = true;
            active = !document.hidden;
            resume();
          } else if (!v && seen) {
            seen = false;
            active = false;
            stop();
          }
        });
        io.observe(viz);
      }
      later(() => play(0), 600);
    }

    return () => {
      stop();
      clearTimeout(iconTimer);
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      srcs.forEach((el, i) => {
        el.removeEventListener("mouseenter", handlers[i]);
        el.removeEventListener("focus", handlers[i]);
        el.removeEventListener("click", handlers[i]);
      });
    };
  }, []);

  return (
    <div className="hac-host">
      <div
        ref={vizRef}
        className="hac-viz"
        data-ready="false"
        role="img"
        aria-label="Animation: information from documents, data, the web and conversations streams into an AI core, which understands, reasons, creates and takes action, then builds a result such as a chart, a blog draft, an automation or a list of opportunities."
      >
        <div className="hac-inner">
          <div className="hac-aurora hac-a1" />
          <div className="hac-aurora hac-a2" />
          <div className="hac-aurora hac-a3" />
          <svg className="hac-layer hac-paths" aria-hidden="true" />
          <div className="hac-orbit" />
          <svg className="hac-layer hac-arcs" aria-hidden="true" />

          {SOURCES.map((s) => (
            <div key={s.name} className="hac-src" tabIndex={0} style={tone(s.c, s.soft)}>
              <span className="hac-ic">{s.icon}</span>
              <span className="hac-tx">
                <b>{s.name}</b>
                <small>{s.sub}</small>
              </span>
            </div>
          ))}

          {LABELS.map((l) => (
            <div key={l.text} className="hac-label" style={tone(l.c, l.soft)}>
              <i />
              {l.text}
            </div>
          ))}

          <div className="hac-orb">
            <div className="hac-orb-in">
              <span className="hac-orb-icon" />
              <span className="hac-orb-name">JASEIR AI</span>
            </div>
          </div>

          <div className="hac-caption">
            <i />
            <span className="hac-cap-text">Waiting for new information</span>
            <span className="hac-cursor" />
          </div>

          <div className="hac-out">
            <div className="hac-oc-head" />
            <div className="hac-oc-body" />
          </div>
        </div>
      </div>
    </div>
  );
}
