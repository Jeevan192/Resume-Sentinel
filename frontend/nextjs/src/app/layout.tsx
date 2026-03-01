import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Resume Sentinel — AI-Powered Resume Fraud Detection",
  description:
    "Detect fraudulent resumes with 6 intelligent signals: timeline analysis, email verification, phone validation, plagiarism detection, semantic similarity, and skills mismatch.",
  keywords: [
    "resume fraud detection",
    "AI resume analysis",
    "hiring verification",
    "email validation",
    "phone verification",
    "plagiarism detection",
  ],
  authors: [{ name: "Resume Sentinel" }],
  openGraph: {
    title: "Resume Sentinel — AI-Powered Resume Fraud Detection",
    description:
      "6 intelligent signals for real-time resume risk scoring. Stop fraud before it starts.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FCC200",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
