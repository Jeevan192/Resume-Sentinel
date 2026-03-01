"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tilt, TiltContent } from "@/components/animate-ui/primitives/effects/tilt";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";

const stack = [
  {
    category: "Backend",
    items: ["FastAPI", "Python 3.10+", "pdfplumber", "python-docx"],
  },
  {
    category: "AI & Verification",
    items: [
      "Google Gemini",
      "ZeroBounce",
      "NumVerify",
      "Serper OSINT",
      "GLEIF Registry",
      "Sentence Transformers",
    ],
  },
  {
    category: "Frontend",
    items: ["Streamlit", "Next.js 16", "Plotly", "shadcn/ui + Animate-UI"],
  },
];

export function TechStack() {
  return (
    <section id="tech" className="relative py-24 sm:py-32">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/3 w-[400px] h-[300px] bg-[#FCC200] opacity-[0.02] blur-[130px] rounded-full" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <Blur inViewOnce>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Built With{" "}
            <span className="bg-gradient-to-r from-[#EA580C] to-[#FFD600] bg-clip-text text-transparent">
              Precision
            </span>
          </h2>
        </Blur>
        <Fade inViewOnce delay={100}>
          <p className="mt-4 max-w-xl text-base text-[#94A3B8] leading-relaxed md:text-lg">
            Enterprise-grade stack engineered for accuracy, speed, and
            reliability.
          </p>
        </Fade>

        {/* Tech stack cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stack.map((group, gi) => (
            <Fade key={group.category} inViewOnce delay={gi * 120}>
              <Tilt maxTilt={6}>
                <TiltContent>
                  <Card className="h-full bg-[#0F1115] border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FCC200]/40 hover:shadow-[0_0_30px_-10px_rgba(252, 194, 0,0.15)] hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="font-mono text-xs font-medium tracking-[0.2em] uppercase text-[#FCC200]">
                        {group.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <Badge
                            key={item}
                            variant="outline"
                            className="border-white/10 text-white/80 font-mono text-[11px] tracking-wide hover:border-[#FCC200]/40 hover:text-[#FCC200] transition-colors cursor-default"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TiltContent>
              </Tilt>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
