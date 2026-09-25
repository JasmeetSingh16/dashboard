"use client";

import { useEffect, useRef } from "react";

/*
 * A twisting 3D ribbon of glowing dots (violet → cyan with pink edges)
 * plus drifting sparkles. Plain canvas, no libraries. Pauses when off
 * screen and draws a single still frame with reduced motion.
 */
export default function RagParticleWave() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const COLS = 150;
    const ROWS = 30;
    const sparkles = Array.from({ length: 34 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.8,
      speed: 0.00004 + Math.random() * 0.0001,
      phase: Math.random() * Math.PI * 2,
      pink: Math.random() < 0.35,
    }));

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = time * 0.00035;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const cx = width * 0.6;
      const cy = height * 0.5;
      const scale = Math.min(width * 0.62, height * 1.25);
      const ry = -0.55 + Math.sin(t * 0.5) * 0.15;
      const rx = 0.35;
      const tilt = -0.55; // lays the ribbon diagonally across the band
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      for (let i = 0; i < COLS; i++) {
        const u = i / (COLS - 1);
        const X = (u - 0.5) * 3.4;
        const twist = X * 1.15 + t * 1.6;
        const sway = 0.32 * Math.sin(X * 1.3 + t * 1.2);

        for (let j = 0; j < ROWS; j++) {
          const w = (j / (ROWS - 1) - 0.5) * 1.15;
          // A twisting ribbon: each cross-section is rotated along X.
          const Y = w * Math.sin(twist) + sway;
          const Z = w * Math.cos(twist);

          const x1 = X * cosY - Z * sinY;
          const z1 = X * sinY + Z * cosY;
          const y2 = Y * cosX - z1 * sinX;
          const z2 = Y * sinX + z1 * cosX;
          const perspective = 2.4 / (z2 + 3.2);

          const px = x1 * perspective * scale;
          const py = y2 * perspective * scale;
          const sx = cx + px * cosT - py * sinT;
          const sy = cy + px * sinT + py * cosT;
          if (sx < -4 || sx > width + 4 || sy < -4 || sy > height + 4) continue;

          const edge = Math.abs(w) / 0.575;
          const facing = Math.abs(Math.cos(twist));
          const pink = Math.max(0, edge - 0.55) * (1 - facing) * 2;
          const r = Math.round(90 - 60 * u + 150 * pink);
          const g = Math.round(110 + 110 * u - 60 * pink);
          const b = Math.round(255 - 20 * u - 50 * pink);
          const alpha = Math.min(1, 0.22 + perspective * 0.6 + facing * 0.15);
          const size = 0.9 + perspective * 1.25;

          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fillRect(sx, sy, size, size);
        }
      }

      for (const s of sparkles) {
        const y = (s.y - time * s.speed) % 1;
        const py = (y < 0 ? y + 1 : y) * height;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.0012 + s.phase));
        ctx.beginPath();
        ctx.fillStyle = s.pink
          ? `rgba(236, 72, 153, ${twinkle})`
          : `rgba(34, 211, 238, ${twinkle})`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.arc(s.x * width, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (time: number) => {
      draw(time);
      if (running) frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();
    draw(4000);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw(4000);
    });
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) =>
      entry.isIntersecting ? start() : stop()
    );
    intersection.observe(canvas);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="rag-wave" aria-hidden="true" />;
}
