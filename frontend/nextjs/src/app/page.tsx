"use client";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Signals } from "@/components/landing/signals";
import { TechStack } from "@/components/landing/tech-stack";
import { Footer } from "@/components/landing/footer";
import {
  ScrollProgressProvider,
  ScrollProgress,
} from "@/components/animate-ui/primitives/animate/scroll-progress";

export default function Home() {
  return (
    <ScrollProgressProvider global>
      {/* Global scroll progress bar — Bitcoin orange to gold gradient */}
      <ScrollProgress
        mode="width"
        className="fixed top-0 left-0 z-[60] h-[3px] scroll-progress-bar origin-left"
      />

      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Signals />
        <TechStack />
      </main>
      <Footer />
    </ScrollProgressProvider>
  );
}
