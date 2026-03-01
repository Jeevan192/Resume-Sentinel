"use client";

import { ArrowRight, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoaderPinwheelIcon } from "@/components/animate-ui/icons/loader-pinwheel";
import {
  TypingText,
  TypingTextCursor,
} from "@/components/animate-ui/primitives/texts/typing";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/primitives/buttons/ripple";

const marqueeItems = [
  "Timeline Overlap",
  "Email Verification",
  "Phone Validation",
  "JD Plagiarism",
  "Semantic Similarity",
  "Skills Mismatch",
  "ZeroBounce API",
  "NumVerify API",
  "Google Gemini",
  "FastAPI",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14">
      {/* Background layers — grid pattern + ambient glow blobs */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FCC200] opacity-[0.04] blur-[150px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#EA580C] opacity-[0.03] blur-[120px] rounded-full" />

      {/* ── Main split content ─────────────────────────── */}
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pt-24 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-36 lg:pb-28">
        {/* Left — headline + CTAs */}
        <div className="flex flex-col justify-center">
          {/* Pre-title badge with pulsing live dot */}
          <Fade inViewOnce>
            <Badge
              variant="outline"
              className="w-fit mb-6 border-[#FCC200]/30 text-[#FCC200] font-mono text-[10px] tracking-widest uppercase px-3 py-1"
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FCC200] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FCC200]" />
              </span>
              AI-Powered Detection
            </Badge>
          </Fade>

          {/* Main headline — geometric heading + gradient accent */}
          <Blur inViewOnce initialBlur={8}>
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
              Detect fraud in{" "}
              <GradientText
                text="every resume."
                gradient="linear-gradient(to right, #FCC200, #FFD600)"
              />
            </h1>
          </Blur>

          {/* Typing subtitle — cycling through detection signals */}
          <div className="mt-6 h-8">
            <span className="font-mono text-sm text-[#94A3B8] tracking-wide">
              Analyzing:{" "}
            </span>
            <TypingText
              text={[
                "timeline overlaps",
                "email validity",
                "phone authenticity",
                "JD plagiarism",
                "semantic duplicates",
                "skills mismatches",
              ]}
              loop
              duration={60}
              holdDelay={2000}
              className="font-mono text-sm text-[#FCC200] tracking-wide"
            >
              <TypingTextCursor className="text-[#FCC200]" />
            </TypingText>
          </div>

          {/* Description */}
          <Fade inViewOnce delay={200}>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[#94A3B8] md:text-lg">
              Six weighted intelligence signals combine into a real-time
              risk score. Powered by AI. Trusted by recruiters.
            </p>
          </Fade>

          {/* CTAs — gradient primary + outline secondary */}
          <Fade inViewOnce delay={400}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Shine
                enableOnHover
                duration={800}
                color="rgba(255,214,0,0.15)"
              >
                <RippleButton asChild hoverScale={1.05} tapScale={0.95}>
                  <Button
                    size="lg"
                    className="rounded-full px-8 bg-gradient-to-r from-[#EA580C] to-[#FCC200] border-0 text-white font-semibold tracking-wider shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(252, 194, 0,0.6)] transition-all"
                    asChild
                  >
                    <a href="/app/analyze">
                      Start Scanning
                      <ArrowRight className="h-4 w-4 ml-1" />
                      <RippleButtonRipples color="rgba(255,255,255,0.3)" />
                    </a>
                  </Button>
                </RippleButton>
              </Shine>

              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 border-2 border-white/20 bg-transparent text-white hover:border-white hover:bg-white/10 transition-all"
                asChild
              >
                <a href="#signals">View Signals</a>
              </Button>
            </div>
          </Fade>
        </div>

        {/* Right — 3D Orbital with spinning rings & floating cards */}
        <div className="relative flex items-center justify-center h-[300px] md:h-[450px]">
          {/* Ambient glow blobs */}
          <div className="absolute w-[300px] h-[300px] bg-[#FCC200] opacity-[0.08] blur-[120px] rounded-full" />
          <div className="absolute w-[200px] h-[200px] bg-[#FFD600] opacity-[0.04] blur-[100px] rounded-full translate-x-12 -translate-y-8" />

          {/* Outer orbital ring */}
          <div className="absolute w-[240px] h-[240px] md:w-[360px] md:h-[360px] rounded-full border border-white/[0.08] animate-orbit">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#FCC200] shadow-[0_0_12px_rgba(252, 194, 0,0.6)]" />
          </div>

          {/* Inner orbital ring (reverse direction) */}
          <div className="absolute w-[160px] h-[160px] md:w-[240px] md:h-[240px] rounded-full border border-[#FCC200]/20 animate-orbit-reverse">
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FFD600] shadow-[0_0_8px_rgba(255,214,0,0.5)]" />
          </div>

          {/* Center — LoaderPinwheel in glowing container */}
          <div className="relative z-10 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#FCC200]/10 border border-[#FCC200]/30 shadow-[0_0_30px_rgba(252, 194, 0,0.2)]">
            <LoaderPinwheelIcon
              size={40}
              className="text-[#FCC200]"
              animate
              loop
            />
          </div>

          {/* Floating stat card — top right */}
          <Fade inViewOnce delay={600}>
            <div className="absolute top-0 right-0 md:top-4 md:right-4 glass rounded-xl px-3 py-2 animate-float">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FCC200] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FCC200]" />
                </span>
                <span className="font-mono text-[10px] text-[#FCC200] tracking-widest uppercase">
                  6 Signals
                </span>
              </div>
            </div>
          </Fade>

          {/* Floating stat card — bottom left */}
          <Fade inViewOnce delay={900}>
            <div
              className="absolute bottom-4 left-0 md:bottom-8 md:left-4 glass rounded-xl px-3 py-2 animate-float"
              style={{ animationDelay: "2.5s" }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-[#FFD600]" />
                <span className="font-mono text-[10px] text-[#FFD600] tracking-widest uppercase">
                  &lt; 3s
                </span>
              </div>
            </div>
          </Fade>

          {/* Floating stat card — mid right */}
          <Fade inViewOnce delay={1200}>
            <div
              className="absolute top-1/2 -right-4 md:right-[-1rem] -translate-y-1/2 glass rounded-xl px-3 py-2 animate-float"
              style={{ animationDelay: "5s" }}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-white/60" />
                <span className="font-mono text-[10px] text-white/60 tracking-widest uppercase">
                  Secure
                </span>
              </div>
            </div>
          </Fade>
        </div>
      </div>

      {/* ── Scrolling marquee bar ──────────────────────── */}
      <div className="relative border-y border-white/[0.06] bg-[#0F1115]/60 py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="mx-8 font-mono text-[10px] font-medium tracking-[0.2em] text-[#94A3B8]/50 uppercase select-none"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
