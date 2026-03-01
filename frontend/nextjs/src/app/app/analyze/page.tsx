"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/app-store";
import { FileUpload } from "@/components/app/file-upload";
import { RiskGauge } from "@/components/app/risk-gauge";
import { SignalRadar } from "@/components/app/signal-radar";
import { SignalBreakdown } from "@/components/app/signal-breakdown";
import { AtsRejectionCard } from "@/components/app/ats-rejection";
import { normalizeSignalDetails } from "@/lib/api";
import { validateResume, getRiskColor, getRiskLabel, NotResumeError } from "@/lib/api";
import type { AtsRejectionData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Brain,
  Shield,
  Sparkles,
  RotateCcw,
  FileCheck,
} from "lucide-react";

export default function AnalyzePage() {
  const {
    analyzeResult: result,
    analyzeError: error,
    analyzeLoading: loading,
    analyzeFileName,
    analyzeAtsRejection: atsRejection,
    setAnalyzeResult,
    setAnalyzeError,
    setAnalyzeLoading,
    setAnalyzeFileName,
    setAnalyzeAtsRejection,
    resetAnalyze,
  } = useAppStore();

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setAnalyzeError(null);
      setAnalyzeLoading(true);
      setAnalyzeResult(null);
      setAnalyzeFileName(files[0].name);
      try {
        const res = await validateResume(files[0]);
        setAnalyzeResult(res);
        setAnalyzeAtsRejection(null);
      } catch (err) {
        if (err instanceof NotResumeError) {
          setAnalyzeAtsRejection(err.ats);
          setAnalyzeError(null);
        } else {
          setAnalyzeError(
            err instanceof Error ? err.message : "Analysis failed"
          );
          setAnalyzeAtsRejection(null);
        }
      } finally {
        setAnalyzeLoading(false);
      }
    },
    [setAnalyzeError, setAnalyzeLoading, setAnalyzeResult, setAnalyzeFileName, setAnalyzeAtsRejection]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl tracking-tight">
          Analyze Resume
        </h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Upload a single resume for comprehensive 8-signal fraud analysis.
        </p>
      </div>

      {/* Upload — show when no result, or always allow re-upload */}
      {!result && !loading && !atsRejection && <FileUpload onFilesSelected={handleFiles} />}

      {/* ATS Rejection — document is not a resume */}
      {atsRejection && !loading && (
        <AtsRejectionCard
          data={atsRejection}
          fileName={analyzeFileName}
          onRetry={resetAnalyze}
        />
      )}

      {/* Previous result banner */}
      {result && !loading && (
        <div className="flex items-center justify-between rounded-xl bg-[#FCC200]/[0.06] border border-[#FCC200]/20 px-5 py-3">
          <div className="flex items-center gap-3">
            <FileCheck className="h-4 w-4 text-[#FCC200]" />
            <span className="text-sm text-[#E2E8F0]">
              Showing results for{" "}
              <span className="font-mono font-semibold text-[#FCC200]">
                {analyzeFileName || "uploaded file"}
              </span>
            </span>
          </div>
          <button
            onClick={resetAnalyze}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono text-[#CBD5E1] hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            New Analysis
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#FCC200]/20 animate-ping" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#FCC200]/10 border border-[#FCC200]/30">
              <Loader2 className="h-7 w-7 text-[#FCC200] animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-heading font-semibold text-white">
              Analyzing resume...
            </p>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Running 8 intelligence signals
              {analyzeFileName && (
                <span className="text-[#94A3B8]"> on {analyzeFileName}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="bg-[#ef4444]/10 border-[#ef4444]/30 rounded-xl shadow-lg shadow-red-900/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#ef4444]">Analysis Error</p>
              <p className="mt-1 text-sm text-[#CBD5E1]">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Risk Overview Row */}
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Gauge + Level */}
            <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/40 flex flex-col items-center justify-center p-6">
              <RiskGauge score={result.risk_score} />
              <Badge
                className="mt-4 font-mono text-xs tracking-wider uppercase px-3 py-1"
                style={{
                  backgroundColor: `${getRiskColor(result.risk_score)}20`,
                  color: getRiskColor(result.risk_score),
                  borderColor: `${getRiskColor(result.risk_score)}40`,
                }}
                variant="outline"
              >
                {getRiskLabel(result.risk_score)} Risk
              </Badge>
              {result.duplicate_submission?.is_duplicate && (
                <p className="mt-2 text-xs text-[#f97316] font-mono text-center">
                  ⚠ Submitted {result.duplicate_submission.times_submitted}x
                  (+{result.duplicate_submission.penalty_applied} penalty)
                </p>
              )}
            </Card>

            {/* Quick stats + radar */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Info Cards */}
              <div className="space-y-3">
                <InfoRow
                  icon={User}
                  label="Candidate"
                  value={result.name || "Unknown"}
                />
                <InfoRow
                  icon={Mail}
                  label="Emails"
                  value={result.emails.join(", ") || "None found"}
                />
                <InfoRow
                  icon={Phone}
                  label="Phones"
                  value={result.phones.join(", ") || "None found"}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Experiences"
                  value={`${result.experience_count} roles`}
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Skills"
                  value={`${result.entities.skills_count} identified`}
                />
                <InfoRow
                  icon={Shield}
                  label="Active Signals"
                  value={`${result.active_signals} / 8`}
                  highlight={result.active_signals >= 3}
                />
              </div>

              {/* Radar Chart */}
              <Card className="bg-black/50 border-white/[0.08] rounded-xl shadow-lg shadow-black/30 flex items-center justify-center p-2">
                <SignalRadar signals={result.signals} size={260} />
              </Card>
            </div>
          </div>

          {/* Signal Breakdown — with inline API verification details */}
          <SignalBreakdown
            details={normalizeSignalDetails(result.signal_details)}
            emailVerification={result.email_verification}
            phoneVerification={result.phone_verification}
            profileVerification={result.profile_verification}
            gleifVerification={result.gleif_verification}
          />

          {/* AI Explanation */}
          {result.llm_explanation && (
            <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCC200]/10 border border-[#FCC200]/30">
                    <Sparkles className="h-4 w-4 text-[#FCC200]" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-lg font-semibold text-white">
                      AI Explanation
                    </CardTitle>
                    <p className="text-xs text-[#94A3B8] font-mono">
                      Powered by Google Gemini
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                  {result.llm_explanation}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entities Detail */}
          {result.entities.experiences.length > 0 && (
            <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#FCC200]" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.entities.experiences.map((exp, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 hover:border-white/[0.12] transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EA580C]/10 border border-[#EA580C]/20 font-mono text-sm font-bold text-[#FCC200]">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-sm text-white truncate">
                          {exp.role || "Unknown Role"}
                        </p>
                        <p className="text-xs text-[#CBD5E1] truncate">
                          {exp.company || "Unknown Company"}
                        </p>
                        <p className="mt-1 font-mono text-[10px] tracking-wider uppercase text-[#94A3B8]">
                          {exp.start || "?"} — {exp.end || "Present"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-black/50 border border-white/[0.08] px-4 py-3 shadow-md shadow-black/20">
      <Icon
        className={`h-4 w-4 shrink-0 ${
          highlight ? "text-[#f97316]" : "text-[#94A3B8]"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] tracking-wider uppercase text-[#94A3B8]">
          {label}
        </p>
        <p
          className={`text-sm truncate ${
            highlight ? "text-[#f97316] font-semibold" : "text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
