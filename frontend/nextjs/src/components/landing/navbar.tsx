"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/animate-ui/primitives/effects/magnetic";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/primitives/buttons/ripple";
import { LoaderPinwheelIcon } from "@/components/animate-ui/icons/loader-pinwheel";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Signals", href: "#signals" },
  { label: "Tech Stack", href: "#tech" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 bg-[#030304]/80 backdrop-blur-md border-b border-white/[0.06]"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo with Magnetic effect */}
        <Magnetic strength={0.3} range={100}>
          <a href="#" className="flex items-center gap-2.5 group">
            <LoaderPinwheelIcon
              size={20}
              className="text-[#FCC200] transition-transform group-hover:rotate-180 duration-500"
            />
            <span className="font-heading font-semibold text-[1rem] tracking-tight text-white">
              Resume Sentinel
            </span>
          </a>
        </Magnetic>

        {/* Desktop nav links — monospace, uppercase, tracked */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Magnetic key={l.href} strength={0.15} range={60}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-1.5 font-mono text-xs tracking-wider uppercase text-[#94A3B8] transition-colors hover:text-[#FCC200] hover:bg-white/5"
              >
                {l.label}
              </a>
            </Magnetic>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>

          {/* CTA — gradient pill with Shine + Ripple */}
          <Shine enableOnHover duration={800} color="rgba(255,214,0,0.2)">
            <RippleButton asChild hoverScale={1.03} tapScale={0.97}>
              <Button
                size="sm"
                className="hidden sm:inline-flex rounded-full px-5 gap-2 bg-gradient-to-r from-[#EA580C] to-[#FCC200] border-0 text-white font-mono text-xs tracking-wider uppercase shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(252, 194, 0,0.6)]"
                asChild
              >
                <a href="/app/analyze">
                  Launch App
                  <RippleButtonRipples color="rgba(255,255,255,0.3)" />
                </a>
              </Button>
            </RippleButton>
          </Shine>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="md:hidden overflow-hidden border-b border-white/[0.06] bg-[#030304]/95 backdrop-blur-md"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-0.5 px-6 py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-mono text-xs tracking-wider uppercase text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-[#FCC200]"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="/app/analyze"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 font-mono text-xs tracking-wider uppercase text-[#FCC200] font-semibold transition-colors hover:bg-[#FCC200]/10"
              >
                Launch App →
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
