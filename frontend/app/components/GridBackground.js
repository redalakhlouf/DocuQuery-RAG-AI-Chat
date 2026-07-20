"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  landing:   { gridOpacity: 0.04 },
  auth:      { gridOpacity: 0.025 },
  dashboard: { gridOpacity: 0.045 },
  chat:      { gridOpacity: 0.018 },
  upload:    { gridOpacity: 0.035 },
  settings:  { gridOpacity: 0.025 },
};

export function setGridSpeed() {}
export function boostGrid() {}

export default function GridBackground({ variant = "landing" }) {
  const canvasRef = useRef(null);
  const cfg = CONFIG[variant] || CONFIG.landing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cellW = 60, cellH = 60;
    let mounted = true;

    function getAccent() {
      const light = document.documentElement.getAttribute("data-theme") === "light";
      return light ? "rgba(42,74,140,0.35)" : "rgba(42,59,92,0.4)";
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.scale(dpr, dpr);
    }

    let debounceTimer;
    function debouncedResize() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(resize, 200);
    }

    resize();
    window.addEventListener("resize", debouncedResize);

    function draw() {
      if (!mounted) return;
      const cw = canvas.width / (window.devicePixelRatio || 1);
      const ch = canvas.height / (window.devicePixelRatio || 1);
      const columns = Math.ceil(cw / cellW) + 1;
      const rows = Math.ceil(ch / cellH) + 1;

      ctx.clearRect(0, 0, cw, ch);
      ctx.strokeStyle = getAccent();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 0.5;

      for (let c = 0; c <= columns; c++) {
        const x = c * cellW;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * cellH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }
    }

    draw();

    return () => {
      mounted = false;
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(debounceTimer);
    };
  }, [variant, cfg]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
