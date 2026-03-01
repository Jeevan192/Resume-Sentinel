"use client";

import { Upload, Cpu, BarChart3, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { Magnetic } from "@/components/animate-ui/primitives/effects/magnetic";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    text: "Upload a PDF or DOCX resume through the Streamlit dashboard. Batch upload supported.",
  },
  {
    icon: Cpu,
    title: "Analyze",
    text: "Engine extracts entities, calls verification APIs, checks timelines, and runs AI similarity.",
  },
  {
    icon: BarChart3,
    title: "Score",
    text: "Six weighted signals combine into a single 0–100 risk score with severity classification.",
  },
  {
    icon: FileCheck,
    title: "Explain",
    text: "Google Gemini generates a human-readable explanation of every flag detected.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      {/* Ambient glow */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#EA580C] opacity-[0.03] blur-[120px] rounded-full -translate-y-1/2" />

      <div className="relative mx-auto max-w-4xl px-6">
        {/* Section header */}
        <Blur inViewOnce>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            How It{" "}
            <span className="bg-gradient-to-r from-[#EA580C] to-[#FCC200] bg-clip-text text-transparent">
              Works
            </span>
          </h2>
        </Blur>
        <Fade inViewOnce delay={100}>
          <p className="mt-4 max-w-lg text-base text-[#94A3B8] leading-relaxed md:text-lg">
            From upload to verdict — four precision-engineered steps.
          </p>
        </Fade>

        {/* Blockchain timeline */}
        <div className="relative mt-16">
          {/* Vertical gradient line — mimicking blockchain ledger */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#FCC200] via-[#FCC200]/30 to-transparent" />

          <div className="space-y-0">
            {steps.map((s, i) => (
              <Fade key={s.title} inViewOnce delay={i * 150}>
                <div className="relative flex gap-6 md:gap-10 pb-12 last:pb-0">
                  {/* Numbered circular node with Magnetic hover */}
                  <Magnetic strength={0.3} range={80}>
                    <div className="relative z-10 flex-shrink-0 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full border-2 border-[#FCC200]/40 bg-[#0F1115] transition-all duration-300 hover:border-[#FCC200] hover:shadow-[0_0_20px_rgba(252, 194, 0,0.3)]">
                      <CountingNumber
                        number={i + 1}
                        inViewOnce
                        className="font-mono text-lg md:text-xl font-bold text-[#FCC200]"
                      />
                    </div>
                  </Magnetic>

                  {/* Glass card with corner border accents */}
                  <Card className="group relative flex-1 bg-black/40 backdrop-blur-sm border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FCC200]/40 hover:shadow-[0_0_30px_-10px_rgba(252, 194, 0,0.15)]">
                    {/* Corner accents — "selected node" effect */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#FCC200]/40 rounded-tl-2xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#FCC200]/40 rounded-br-2xl" />

                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EA580C]/15 border border-[#EA580C]/30 group-hover:shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-shadow duration-300">
                          <s.icon className="h-4 w-4 text-[#FCC200]" />
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-white">
                          {s.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-[#94A3B8]">
                        {s.text}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
