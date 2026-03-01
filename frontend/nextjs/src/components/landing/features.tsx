"use client";

import {
  Shield,
  Mail,
  Phone,
  FileText,
  Brain,
  Wrench,
  Link,
  Building2,
  ShieldX,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tilt, TiltContent } from "@/components/animate-ui/primitives/effects/tilt";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";

const features = [
  {
    icon: ShieldX,
    title: "ATS Gatekeeper",
    subtitle: "Resume content validation",
    description:
      "Heuristic pre-screening rejects non-resume documents (invoices, papers, legal docs) before analysis. Checks for contact info, section headings, skills, and education markers.",
    tag: "Pre-Screen",
    accent: "#ef4444",
  },
  {
    icon: Shield,
    title: "Timeline Analysis",
    subtitle: "Employment overlap detection",
    description:
      "Identifies contradictory or overlapping dates in work history. Flags fabricated concurrent roles and unrealistic tenure patterns.",
    tag: "Core Signal",
    accent: "#FCC200",
  },
  {
    icon: Mail,
    title: "Email Verification",
    subtitle: "ZeroBounce-powered validation",
    description:
      "Validates email deliverability in real-time. Catches disposable addresses, spam traps, abuse accounts, and typo-domains.",
    tag: "API Signal",
    accent: "#FFD600",
  },
  {
    icon: Phone,
    title: "Phone Validation",
    subtitle: "NumVerify-powered checks",
    description:
      "Verifies phone numbers against carrier databases. Detects VoIP lines, toll-free numbers, and provides geo-location.",
    tag: "API Signal",
    accent: "#EA580C",
  },
  {
    icon: FileText,
    title: "JD Plagiarism",
    subtitle: "Copy-paste detection",
    description:
      "Compares resume text against job descriptions to detect wholesale copy-pasting — a major indicator of fraud.",
    tag: "NLP Signal",
    accent: "#FCC200",
  },
  {
    icon: Brain,
    title: "Semantic Similarity",
    subtitle: "AI embedding comparison",
    description:
      "Uses sentence transformers to compare resumes across submissions, catching duplicates even when wording differs.",
    tag: "AI Signal",
    accent: "#FFD600",
  },
  {
    icon: Wrench,
    title: "Skills Mismatch",
    subtitle: "Claim vs experience verification",
    description:
      "Cross-references claimed skills with job titles and experiences. Flags implausible combinations suggesting fabrication.",
    tag: "Logic Signal",
    accent: "#EA580C",
  },
  {
    icon: Link,
    title: "Profile & OSINT",
    subtitle: "Serper Google OSINT + link checks",
    description:
      "Validates LinkedIn, GitHub, and web links via DNS, HTTP, and Google indexing. Confirms name presence to catch fake profiles.",
    tag: "API Signal",
    accent: "#FCC200",
  },
  {
    icon: Building2,
    title: "GLEIF Verification",
    subtitle: "Company registry lookup",
    description:
      "Cross-checks employer names against the GLEIF global registry. Verifies LEI codes and match scores to expose fabricated companies.",
    tag: "API Signal",
    accent: "#FFD600",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-[#0F1115]">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-[#FCC200] opacity-[0.02] blur-[150px] rounded-full" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header — gradient accent on last word */}
        <Blur inViewOnce>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Detection{" "}
            <span className="bg-gradient-to-r from-[#FCC200] to-[#FFD600] bg-clip-text text-transparent">
              Signals
            </span>
          </h2>
        </Blur>
        <Fade inViewOnce delay={100}>
          <p className="mt-4 max-w-xl text-base text-[#94A3B8] leading-relaxed md:text-lg">
            Eight intelligent signals plus an ATS gatekeeper work in concert
            to produce a comprehensive fraud risk assessment.
          </p>
        </Fade>

        {/* Feature card grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Fade key={f.title} inViewOnce delay={i * 100}>
              <Shine enableOnHover duration={800} color={`${f.accent}20`}>
                <Tilt maxTilt={8}>
                  <TiltContent>
                    <Card className="group relative h-full bg-[#0F1115] border-white/10 rounded-2xl p-0 overflow-hidden transition-all duration-300 hover:border-[#FCC200]/50 hover:shadow-[0_0_30px_-10px_rgba(252, 194, 0,0.2)] hover:-translate-y-1">
                      {/* Background watermark icon — reveals on hover */}
                      <f.icon className="absolute -right-4 -bottom-4 h-32 w-32 text-white opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12" />

                      <CardHeader className="pb-3">
                        {/* Glowing icon container */}
                        <div
                          className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                          style={{
                            backgroundColor: `${f.accent}15`,
                            border: `1px solid ${f.accent}30`,
                          }}
                        >
                          <f.icon
                            className="h-5 w-5"
                            style={{ color: f.accent }}
                          />
                        </div>
                        <CardTitle className="font-heading text-lg font-semibold text-white">
                          {f.title}
                        </CardTitle>
                        <CardDescription className="font-mono text-[10px] tracking-widest uppercase text-[#94A3B8]">
                          {f.subtitle}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <p className="text-sm leading-relaxed text-[#94A3B8]">
                          {f.description}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-4 border-white/10 text-[10px] font-mono tracking-widest uppercase"
                          style={{
                            color: f.accent,
                            borderColor: `${f.accent}30`,
                          }}
                        >
                          {f.tag}
                        </Badge>
                      </CardContent>
                    </Card>
                  </TiltContent>
                </Tilt>
              </Shine>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
