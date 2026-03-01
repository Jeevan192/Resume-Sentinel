"use client";

import { Separator } from "@/components/ui/separator";
import { Magnetic } from "@/components/animate-ui/primitives/effects/magnetic";
import { LoaderPinwheelIcon } from "@/components/animate-ui/icons/loader-pinwheel";

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Signals", href: "#signals" },
  { label: "Tech", href: "#tech" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#030304]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          {/* Logo with Magnetic */}
          <Magnetic strength={0.2} range={80}>
            <div className="flex items-center gap-2.5">
              <LoaderPinwheelIcon size={18} className="text-[#FCC200]" />
              <span className="font-heading font-semibold text-sm tracking-tight text-white">
                Resume Sentinel
              </span>
            </div>
          </Magnetic>

          {/* Navigation links — mono uppercase */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((l) => (
              <Magnetic key={l.label} strength={0.15} range={50}>
                <a
                  href={l.href}
                  className="font-mono text-[10px] tracking-widest uppercase text-[#94A3B8] hover:text-[#FCC200] transition-colors"
                >
                  {l.label}
                </a>
              </Magnetic>
            ))}
          </nav>
        </div>

        <Separator className="my-8 bg-white/[0.06]" />

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="font-mono text-[10px] tracking-wider text-[#94A3B8]/40 uppercase">
            &copy; {new Date().getFullYear()} Resume Sentinel — AI-Powered
            Fraud Detection
          </p>
          <p className="font-mono text-[10px] tracking-wider text-[#94A3B8]/30 uppercase">
            Built with Next.js + FastAPI + Gemini AI
          </p>
        </div>
      </div>
    </footer>
  );
}
