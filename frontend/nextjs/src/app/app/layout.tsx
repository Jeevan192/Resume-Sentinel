"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Layers,
  GitCompareArrows,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkHealth } from "@/lib/api";
import { AppStoreProvider } from "@/lib/app-store";

const navItems = [
  { label: "Analyze", href: "/app/analyze", icon: Search },
  { label: "Batch", href: "/app/batch", icon: Layers },
  { label: "Compare", href: "/app/compare", icon: GitCompareArrows },
  { label: "Dashboard", href: "/app/dashboard", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
    const timer = setInterval(() => {
      checkHealth()
        .then(() => setHealthy(true))
        .catch(() => setHealthy(false));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppStoreProvider>
    <div className="min-h-screen bg-[#030304]">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundSize: "60px 60px",
            backgroundImage:
              "linear-gradient(rgba(252,194,0,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(252,194,0,.03) 1px,transparent 1px)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(252,194,0,.12),transparent)]" />
      </div>

      {/* App nav */}
      <header className="sticky top-0 z-50 bg-[#030304]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Left: back to home + logo */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[#94A3B8] hover:text-[#FCC200] transition-colors text-xs font-mono tracking-wider uppercase"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <Link href="/app/analyze" className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span className="font-heading font-semibold text-sm tracking-tight text-white hidden sm:inline">
                Resume Sentinel
              </span>
            </Link>
          </div>

          {/* Center: desktop nav tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.08] p-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-mono text-xs tracking-wider uppercase transition-all",
                    active
                      ? "bg-[#FCC200]/12 text-[#FCC200] shadow-[0_0_15px_-5px_rgba(252,194,0,0.3)]"
                      : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: status + mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  healthy === true
                    ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    : healthy === false
                    ? "bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                    : "bg-[#94A3B8] animate-pulse"
                )}
              />
              <span className="text-xs font-mono text-[#94A3B8] hidden sm:inline">
                {healthy === true ? "Online" : healthy === false ? "Offline" : "..."}
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-b border-white/[0.06] bg-[#030304]/95 backdrop-blur-md">
            <nav className="mx-auto flex max-w-7xl flex-col gap-0.5 px-6 py-3">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-mono text-xs tracking-wider uppercase transition-colors",
                      active
                        ? "bg-[#FCC200]/10 text-[#FCC200]"
                        : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
    </AppStoreProvider>
  );
}
