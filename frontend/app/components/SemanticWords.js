"use client";

import { useEffect, useRef } from "react";

const WORDS = [
  "index", "embed", "retrieve", "context", "chunk", "vector",
  "query", "document", "source", "paragraph", "citation", "extract",
  "section", "analysis", "result", "reference", "summary", "method",
  "conclusion", "data", "figure", "table", "note", "annex",
];

const FONT_SIZE_MIN = 11;
const FONT_SIZE_MAX = 15;
const OPACITY_MIN = 0.03;
const OPACITY_MAX = 0.07;
const SPEED = 0.12;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function resolveCSSColor(varName) {
  const el = document.documentElement;
  const computed = getComputedStyle(el).getPropertyValue(varName).trim();
  if (!computed) return "#8B94AC";
  if (computed.startsWith("#")) return computed;
  if (computed.startsWith("rgb")) return computed;
  return "#8B94AC";
}

export default function SemanticWords({ color = "var(--dq-accent)", className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];

    const reducedMotion = window.matchMedia(
      "(prefers-color-scheme: reduce)"
    ).matches;

    function resolveColor(c) {
      if (c.startsWith("var(")) {
        const varName = c.slice(4, -1);
        return resolveCSSColor(varName);
      }
      return c;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 30000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          word: WORDS[Math.floor(Math.random() * WORDS.length)],
          size: randomBetween(FONT_SIZE_MIN, FONT_SIZE_MAX),
          opacity: randomBetween(OPACITY_MIN, OPACITY_MAX),
          vx: randomBetween(-SPEED, SPEED),
          vy: randomBetween(-SPEED, SPEED),
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '400 13px "IBM Plex Mono", monospace';

      const rgb = resolveColor(color);

      for (const p of particles) {
        ctx.fillStyle = `rgba(${rgbToChannels(rgb)}, ${p.opacity})`;
        ctx.fillText(p.word, p.x, p.y);

        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -60) p.x = canvas.width + 60;
          if (p.x > canvas.width + 60) p.x = -60;
          if (p.y < -20) p.y = canvas.height + 20;
          if (p.y > canvas.height + 20) p.y = -20;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    function rgbToChannels(colorStr) {
      if (colorStr.startsWith("#")) {
        const hex = colorStr.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      }
      if (colorStr.startsWith("rgb")) {
        const match = colorStr.match(/[\d.]+/g);
        if (match && match.length >= 3) {
          return `${Math.round(match[0])}, ${Math.round(match[1])}, ${Math.round(match[2])}`;
        }
      }
      return "139, 143, 154";
    }

    resize();
    createParticles();
    draw();

    const onResize = () => {
      resize();
      createParticles();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className={`semantic-canvas ${className}`}
      aria-hidden="true"
    />
  );
}
