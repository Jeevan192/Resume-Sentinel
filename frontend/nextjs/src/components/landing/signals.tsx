"use client";

import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";

const signals = [
  {
    name: "Timeline Overlap",
    weight: 20,
    range: "0 – 20",
    tip: "Detects overlapping employment dates and fabricated concurrent roles",
  },
  {
    name: "Email Validation",
    weight: 12,
    range: "0 – 20",
    tip: "ZeroBounce-powered deliverability and disposable email detection",
  },
  {
    name: "Phone Validation",
    weight: 7,
    range: "0 – 15",
    tip: "NumVerify carrier lookup with VoIP and geo-location analysis",
  },
  {
    name: "JD Plagiarism",
    weight: 16,
    range: "0 – 15",
    tip: "N-gram matching to detect copy-pasted job description content",
  },
  {
    name: "Semantic Similarity",
    weight: 15,
    range: "0 – 20",
    tip: "AI sentence-transformer embedding comparison across resumes",
  },
  {
    name: "Skills Mismatch",
    weight: 7,
    range: "0 – 10",
    tip: "Role-skill mapping with implausibility scoring per claim",
  },
  {
    name: "Profile & OSINT",
    weight: 13,
    range: "0 – 15",
    tip: "Serper Google OSINT + DNS/HTTP link validation and name-match checks",
  },
  {
    name: "GLEIF Verification",
    weight: 10,
    range: "0 – 15",
    tip: "Cross-checks employers against the GLEIF global entity registry",
  },
];

export function Signals() {
  return (
    <section id="signals" className="relative py-24 sm:py-32 bg-[#0F1115]">
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-[#FFD600] opacity-[0.02] blur-[120px] rounded-full" />

      <div className="relative mx-auto max-w-4xl px-6">
        {/* Section header */}
        <Blur inViewOnce>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Scoring{" "}
            <span className="bg-gradient-to-r from-[#FCC200] to-[#FFD600] bg-clip-text text-transparent">
              Weights
            </span>
          </h2>
        </Blur>
        <Fade inViewOnce delay={100}>
          <p className="mt-4 max-w-lg text-base text-[#94A3B8] leading-relaxed md:text-lg">
            Each signal contributes a weighted score to the final risk
            assessment. Transparent methodology — nothing hidden.
          </p>
        </Fade>

        {/* Signal rows */}
        <div className="mt-12 space-y-5">
          {signals.map((s, i) => (
            <Fade key={s.name} inViewOnce delay={i * 80}>
              <div className="group flex items-center gap-4 sm:gap-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm px-5 py-4 transition-all duration-300 hover:border-[#FCC200]/30 hover:shadow-[0_0_20px_-8px_rgba(252, 194, 0,0.15)]">
                {/* Pulsing dot — live network feel */}
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FCC200] opacity-40 group-hover:animate-ping" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FCC200]" />
                </span>

                {/* Signal name with Tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="min-w-[130px] sm:min-w-[170px] font-mono text-xs tracking-wider uppercase text-white cursor-help">
                      {s.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[240px] bg-[#0F1115] border-white/10 text-[#94A3B8] text-xs"
                  >
                    {s.tip}
                  </TooltipContent>
                </Tooltip>

                {/* Progress bar — orange gradient */}
                <div className="flex-1">
                  <Progress
                    value={s.weight}
                    className="h-2.5 bg-white/5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-[#EA580C] [&>[data-slot=progress-indicator]]:to-[#FCC200] [&>[data-slot=progress-indicator]]:shadow-[0_0_10px_rgba(252, 194, 0,0.3)]"
                  />
                </div>

                {/* Animated weight number */}
                <span className="min-w-[42px] text-right font-mono text-sm font-bold text-[#FCC200]">
                  <CountingNumber number={s.weight} inViewOnce />%
                </span>

                {/* Range badge — hidden on mobile */}
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex border-white/10 text-[#94A3B8] font-mono text-[10px] tracking-wider"
                >
                  {s.range}
                </Badge>
              </div>
            </Fade>
          ))}
        </div>

        {/* Total row */}
        <Fade inViewOnce delay={600}>
          <div className="mt-6 flex items-center justify-end gap-3 px-5">
            <span className="font-mono text-xs text-[#94A3B8] tracking-wider uppercase">
              Total
            </span>
            <span className="font-mono text-lg font-bold text-[#FFD600]">
              <CountingNumber number={100} inViewOnce />%
            </span>
          </div>
        </Fade>
      </div>
    </section>
  );
}
