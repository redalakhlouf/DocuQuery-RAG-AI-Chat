"use client";

import ScrollReveal from "@/app/components/ScrollReveal";
import Footer from "@/app/components/Footer";

/* ══════════════════════════════════════════════
   Icons — SVG inline, clean, no emoji
   ══════════════════════════════════════════════ */

function IconUpload({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
      <path d="M20 16.7c1.3-1.2 2-2.8 2-4.7a6.3 6.3 0 00-6.3-6.3H12a6 6 0 00-5.8 4.3" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}

function IconSearch({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconMessage({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconLock({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconFileText({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </svg>
  );
}

function IconZap({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconShield({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconArrowRight({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════ */

const STEPS = [
  {
    num: "01",
    icon: IconUpload,
    title: "Uploade ton PDF",
    description:
      "Glisse ton document dans la plateforme. Le texte est extrait automatiquement, page par page.",
  },
  {
    num: "02",
    icon: IconSearch,
    title: "Pose ta question",
    description:
      "Écris ce que tu veux savoir. « Quel est le revenu annuel ? », « Quelles sont les conclusions ? »",
  },
  {
    num: "03",
    icon: IconMessage,
    title: "Reçois la réponse",
    description:
      "L'assistant te répond en citant la page exacte d'où vient l'information. Vérifiable, traçable.",
  },
];

const BENEFITS = [
  {
    icon: IconLock,
    title: "Isolation totale",
    description:
      "Tes documents restent à toi. Aucun autre utilisateur n'y accède. Chaque compte est un espace fermé.",
  },
  {
    icon: IconFileText,
    title: "Sources vérifiables",
    description:
      "Chaque réponse indique la page exacte d'où vient l'information. Tu peux vérifier en un coup d'œil.",
  },
  {
    icon: IconZap,
    title: "Réponse instantanée",
    description:
      "Plus besoin de chercher dans des dizaines de pages. La réponse arrive en quelques secondes.",
  },
  {
    icon: IconShield,
    title: "Pas de hallucination",
    description:
      "L'assistant ne invente pas. Il cite le document, ou dit clairement qu'il ne trouve pas l'information.",
  },
];

/* ══════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--dq-text) 1px, transparent 1px), linear-gradient(90deg, var(--dq-text) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Radial glow behind text */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] -z-10 rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--dq-navy) 0%, transparent 70%)" }}
        />

        <div className="max-w-4xl mx-auto px-6 text-center pt-24 pb-16">
          {/* Label */}
          <ScrollReveal>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-dq-accent mb-6">
              Documents · Questions · Réponses
            </p>
          </ScrollReveal>

          {/* Title */}
          <ScrollReveal delay={80}>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Pose des questions
              <br />
              sur tes documents.
            </h1>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal delay={160}>
            <p className="text-lg sm:text-xl text-dq-text-secondary max-w-xl mx-auto leading-relaxed mb-10">
              Uploade un PDF, pose ta question, obtiens une réponse précise avec
              les sources. DocuQuery analyse tes documents et répond avec les
              citations exactes.
            </p>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal delay={240}>
            <a
              href="/login"
              className="inline-flex items-center gap-2.5 bg-dq-accent hover:bg-dq-accent-hover text-dq-text font-medium text-base px-7 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-[0_0_24px_color-mix(in_srgb,var(--dq-accent)_25%,transparent)] hover:shadow-[0_0_32px_color-mix(in_srgb,var(--dq-accent)_35%,transparent)] no-underline"
            >
              Commencer gratuitement
              <IconArrowRight className="w-4 h-4" />
            </a>
          </ScrollReveal>

          {/* Trust line */}
          <ScrollReveal delay={320}>
            <p className="mt-8 text-xs text-dq-text-muted font-mono">
              Gratuit · Aucune carte bancaire · Données privées
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section
        id="comment-ca-marche"
        className="relative py-24 sm:py-32 border-t border-dq-border-subtle"
      >
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-dq-accent mb-3">
              Processus
            </p>
          </ScrollReveal>
          <ScrollReveal delay={60}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Trois étapes, pas de jargon
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <p className="text-dq-text-secondary text-base max-w-lg mb-16">
              De l&apos;upload du PDF à la réponse citée, tout se passe en trois
              clics.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 100}>
                <div className="group relative bg-dq-surface border border-dq-border rounded-xl p-8 hover:border-dq-border/80 transition-colors duration-300">
                  {/* Step number */}
                  <span className="font-mono text-xs text-dq-text-muted tracking-widest block mb-5">
                    {step.num}
                  </span>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-dq-navy/50 border border-dq-border flex items-center justify-center mb-5 group-hover:border-dq-accent/30 transition-colors duration-300">
                    <step.icon className="w-5 h-5 text-dq-accent" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-lg font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-dq-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BENEFITS ═══ */}
      <section
        id="avantages"
        className="relative py-24 sm:py-32 border-t border-dq-border-subtle"
      >
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-dq-accent mb-3">
              Avantages
            </p>
          </ScrollReveal>
          <ScrollReveal delay={60}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Pourquoi DocuQuery
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <p className="text-dq-text-secondary text-base max-w-lg mb-16">
              Un outil conçu pour les gens qui travaillent avec des documents,
              pas pour les gens qui veulent jouer avec l&apos;IA.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {BENEFITS.map((benefit, i) => (
              <ScrollReveal key={benefit.title} delay={i * 80}>
                <div className="group flex gap-4 p-6 rounded-xl border border-transparent hover:border-dq-border hover:bg-dq-surface/50 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-dq-navy/40 border border-dq-border flex items-center justify-center flex-shrink-0 group-hover:border-dq-accent/30 transition-colors duration-300">
                    <benefit.icon className="w-5 h-5 text-dq-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-dq-text-secondary leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 sm:py-32 border-t border-dq-border-subtle">
        <div className="max-w-3xl mx-auto px-6">
          <ScrollReveal>
            <div className="relative bg-dq-surface border border-dq-border rounded-2xl p-10 sm:p-14 text-center overflow-hidden">
              {/* Subtle accent line at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-dq-accent to-transparent" />

              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Prêt à interroger tes documents&nbsp;?
              </h2>
              <p className="text-dq-text-secondary text-base mb-8 max-w-md mx-auto">
                Crée un compte gratuit en 30 secondes. Uploade ton premier PDF
                et pose ta première question.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2.5 bg-dq-accent hover:bg-dq-accent-hover text-dq-text font-medium text-base px-7 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-[0_0_24px_color-mix(in_srgb,var(--dq-accent)_25%,transparent)] hover:shadow-[0_0_32px_color-mix(in_srgb,var(--dq-accent)_35%,transparent)] no-underline"
              >
                Commencer
                <IconArrowRight className="w-4 h-4" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <Footer />
    </>
  );
}
