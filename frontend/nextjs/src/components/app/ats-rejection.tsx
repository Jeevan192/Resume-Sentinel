"use client";

import type { AtsRejectionData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldX,
  FileWarning,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Link,
  Wrench,
  Hash,
} from "lucide-react";

/* All the resume signals the backend checks for */
const ATS_CHECKS = [
  { key: "adequate_length", label: "Adequate Length", icon: FileText, desc: "80+ words" },
  { key: "has_email", label: "Email Address", icon: Mail, desc: "Contains email" },
  { key: "has_phone", label: "Phone Number", icon: Phone, desc: "Contains phone" },
  { key: "has_date_ranges", label: "Date Ranges", icon: Calendar, desc: "Employment dates" },
  { key: "has_education", label: "Education", icon: GraduationCap, desc: "Degree keywords" },
  { key: "has_profile_link", label: "Profile Links", icon: Link, desc: "LinkedIn / GitHub" },
] as const;

function signalPass(signals: string[], key: string): boolean {
  return signals.some((s) => s.startsWith(key));
}

export function AtsRejectionCard({
  data,
  fileName,
  onRetry,
}: {
  data: AtsRejectionData;
  fileName: string | null;
  onRetry: () => void;
}) {
  const passedCount = ATS_CHECKS.filter((c) => signalPass(data.signals_found, c.key)).length;
  const sectionHits = data.signals_found.find((s) => s.startsWith("section_keywords"));
  const skillHits = data.signals_found.find((s) => s.startsWith("skills_found"));
  const hasNonResume = data.signals_found.includes("non_resume_content_detected");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main rejection card */}
      <Card className="bg-[#ef4444]/[0.06] border-[#ef4444]/25 rounded-2xl shadow-xl shadow-red-900/10 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30">
              <ShieldX className="h-6 w-6 text-[#ef4444]" />
            </div>
            <div className="flex-1">
              <CardTitle className="font-heading text-xl font-bold text-white">
                ATS Gatekeeper — Document Rejected
              </CardTitle>
              <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                Applicant Tracking System pre-screening
              </p>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[10px] tracking-wider border-[#ef4444]/30 text-[#ef4444]"
            >
              NOT A RESUME
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Reason */}
          <div className="rounded-xl bg-black/40 border border-white/[0.06] p-4">
            <div className="flex items-start gap-3">
              <FileWarning className="h-5 w-5 text-[#f97316] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  {fileName && (
                    <span className="font-mono text-[#f97316]">{fileName}</span>
                  )}{" "}
                  failed ATS pre-screening
                </p>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  {data.message}
                </p>
              </div>
            </div>
          </div>

          {/* Confidence + Word Count stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-black/30 border border-white/[0.06] px-4 py-3 text-center">
              <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
                Resume Confidence
              </p>
              <p className="font-heading text-2xl font-bold text-[#ef4444] mt-1">
                {Math.round(data.confidence * 100)}%
              </p>
              <p className="font-mono text-[9px] text-[#94A3B8] mt-0.5">
                threshold: 36%
              </p>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/[0.06] px-4 py-3 text-center">
              <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
                Word Count
              </p>
              <p className="font-heading text-2xl font-bold text-white mt-1">
                {data.word_count}
              </p>
              <p className="font-mono text-[9px] text-[#94A3B8] mt-0.5">
                minimum: 30
              </p>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/[0.06] px-4 py-3 text-center">
              <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
                Signals Detected
              </p>
              <p className="font-heading text-2xl font-bold mt-1" style={{ color: passedCount >= 3 ? "#22c55e" : passedCount >= 1 ? "#eab308" : "#ef4444" }}>
                {passedCount} / {ATS_CHECKS.length}
              </p>
              <p className="font-mono text-[9px] text-[#94A3B8] mt-0.5">
                need 5+ to pass
              </p>
            </div>
          </div>

          {/* Signal checklist */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] tracking-wider uppercase text-[#94A3B8] mb-2">
              ATS Resume Signal Checklist
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ATS_CHECKS.map((check) => {
                const passed = signalPass(data.signals_found, check.key);
                const Icon = check.icon;
                return (
                  <div
                    key={check.key}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                    style={{
                      background: passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                      border: `1px solid ${passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                    }}
                  >
                    {passed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#22c55e] shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#ef4444] shrink-0" />
                    )}
                    <Icon className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white">{check.label}</p>
                      <p className="text-[10px] text-[#94A3B8]">{check.desc}</p>
                    </div>
                  </div>
                );
              })}

              {/* Section keywords */}
              <div
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                style={{
                  background: sectionHits ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${sectionHits ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                }}
              >
                {sectionHits ? (
                  <CheckCircle2 className="h-4 w-4 text-[#22c55e] shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#ef4444] shrink-0" />
                )}
                <Hash className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">Section Keywords</p>
                  <p className="text-[10px] text-[#94A3B8]">
                    {sectionHits ?? "No resume headings found"}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                style={{
                  background: skillHits ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${skillHits ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                }}
              >
                {skillHits ? (
                  <CheckCircle2 className="h-4 w-4 text-[#22c55e] shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#ef4444] shrink-0" />
                )}
                <Wrench className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">Technical Skills</p>
                  <p className="text-[10px] text-[#94A3B8]">
                    {skillHits ?? "No recognized skills found"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Non-resume warning */}
          {hasNonResume && (
            <div className="flex items-center gap-2.5 rounded-xl bg-[#f97316]/10 border border-[#f97316]/20 px-4 py-3">
              <FileWarning className="h-4 w-4 text-[#f97316] shrink-0" />
              <p className="text-xs text-[#f97316]">
                Document contains patterns typical of non-resume content (invoices, legal docs, research papers, etc.)
              </p>
            </div>
          )}

          {/* Suggestion + retry */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl bg-[#FCC200]/[0.05] border border-[#FCC200]/20 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-white">What to do?</p>
              <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed max-w-lg">
                {data.suggestion}
              </p>
            </div>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-[#FCC200]/10 border border-[#FCC200]/30 px-4 py-2.5 text-sm font-mono font-semibold text-[#FCC200] hover:bg-[#FCC200]/20 transition-all shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              Try Another File
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
