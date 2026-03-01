"use client";

import { useCallback } from "react";
import { useAppStore } from "@/lib/app-store";
import { FileUpload } from "@/components/app/file-upload";
import { batchValidate, getRiskColor, getRiskLabel } from "@/lib/api";
import type { AnalysisResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskGauge } from "@/components/app/risk-gauge";
import { SignalRadar } from "@/components/app/signal-radar";
import { SignalBreakdown } from "@/components/app/signal-breakdown";
import { normalizeSignalDetails } from "@/lib/api";
import {
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  TrendingUp,
  ShieldAlert,
  RotateCcw,
  FolderCheck,
} from "lucide-react";

export default function BatchPage() {
  const {
    batchResult: batch,
    batchError: error,
    batchLoading: loading,
    batchExpanded: expanded,
    batchFileCount,
    setBatchResult,
    setBatchError,
    setBatchLoading,
    setBatchExpanded,
    setBatchFileCount,
    resetBatch,
  } = useAppStore();

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setBatchError(null);
      setBatchLoading(true);
      setBatchResult(null);
      setBatchFileCount(files.length);
      try {
        const res = await batchValidate(files);
        setBatchResult(res);
      } catch (err) {
        setBatchError(
          err instanceof Error ? err.message : "Batch analysis failed"
        );
      } finally {
        setBatchLoading(false);
      }
    },
    [setBatchError, setBatchLoading, setBatchResult, setBatchFileCount]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl tracking-tight">
          Batch Analysis
        </h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Upload up to 50 resumes for parallel fraud analysis.
        </p>
      </div>

      {/* Upload — show when no result, or always allow re-upload */}
      {!batch && !loading && (
        <FileUpload onFilesSelected={handleFiles} multiple maxFiles={50} />
      )}

      {/* Previous result banner */}
      {batch && !loading && (
        <div className="flex items-center justify-between rounded-xl bg-[#FCC200]/[0.06] border border-[#FCC200]/20 px-5 py-3">
          <div className="flex items-center gap-3">
            <FolderCheck className="h-4 w-4 text-[#FCC200]" />
            <span className="text-sm text-[#E2E8F0]">
              Batch results for{" "}
              <span className="font-mono font-semibold text-[#FCC200]">
                {batchFileCount} files
              </span>
            </span>
          </div>
          <button
            onClick={resetBatch}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono text-[#CBD5E1] hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            New Batch
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#FCC200]/20 animate-ping" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#FCC200]/10 border border-[#FCC200]/30">
              <Loader2 className="h-7 w-7 text-[#FCC200] animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-heading font-semibold text-white">
              Processing batch...
            </p>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Analyzing {batchFileCount} resume{batchFileCount !== 1 ? "s" : ""} in parallel
            </p>
          </div>
        </div>
      )}

      {error && (
        <Card className="bg-[#ef4444]/10 border-[#ef4444]/30 rounded-xl shadow-lg shadow-red-900/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#ef4444]">Error</p>
              <p className="mt-1 text-sm text-[#CBD5E1]">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {batch && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Analyzed"
              value={batch.summary.total_analyzed}
              color="#FCC200"
            />
            <StatCard
              icon={BarChart3}
              label="Avg Risk Score"
              value={batch.summary.avg_risk_score}
              color={getRiskColor(batch.summary.avg_risk_score)}
            />
            <StatCard
              icon={TrendingUp}
              label="Max Risk Score"
              value={batch.summary.max_risk_score}
              color={getRiskColor(batch.summary.max_risk_score)}
            />
            <StatCard
              icon={ShieldAlert}
              label="High Risk"
              value={batch.summary.high_risk_count}
              color="#ef4444"
            />
          </div>

          {/* Risk Distribution */}
          <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base text-white">
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <RiskPill
                  label="High"
                  count={batch.summary.high_risk_count}
                  color="#ef4444"
                  total={batch.summary.total_analyzed}
                />
                <RiskPill
                  label="Medium"
                  count={batch.summary.medium_risk_count}
                  color="#eab308"
                  total={batch.summary.total_analyzed}
                />
                <RiskPill
                  label="Low"
                  count={batch.summary.low_risk_count}
                  color="#22c55e"
                  total={batch.summary.total_analyzed}
                />
              </div>
              {/* Bar visualization */}
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/[0.06]">
                {batch.summary.total_analyzed > 0 && (
                  <>
                    <div
                      className="transition-all duration-500"
                      style={{
                        width: `${(batch.summary.high_risk_count / batch.summary.total_analyzed) * 100}%`,
                        background: "linear-gradient(90deg, #ef4444, #f87171)",
                      }}
                    />
                    <div
                      className="transition-all duration-500"
                      style={{
                        width: `${(batch.summary.medium_risk_count / batch.summary.total_analyzed) * 100}%`,
                        background: "linear-gradient(90deg, #eab308, #facc15)",
                      }}
                    />
                    <div
                      className="transition-all duration-500"
                      style={{
                        width: `${(batch.summary.low_risk_count / batch.summary.total_analyzed) * 100}%`,
                        background: "linear-gradient(90deg, #22c55e, #4ade80)",
                      }}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-white">
              Individual Results
            </h3>
            {batch.results
              .sort((a, b) => b.risk_score - a.risk_score)
              .map((r) => (
                <ResultRow
                  key={r.filename}
                  result={r}
                  isExpanded={expanded === r.filename}
                  onToggle={() =>
                    setBatchExpanded(expanded === r.filename ? null : r.filename)
                  }
                />
              ))}
            {batch.errors.map((e) => (
              <div
                key={e.filename}
                className="flex items-center gap-3 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/20 px-4 py-3"
              >
                <AlertTriangle className="h-4 w-4 text-[#ef4444] shrink-0" />
                <span className="font-mono text-xs text-white truncate">
                  {e.filename}
                </span>
                <span className="ml-auto text-xs text-[#ef4444]">{e.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="bg-black/50 border-white/[0.08] rounded-xl shadow-lg shadow-black/20">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}35` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-wider uppercase text-[#94A3B8]">
            {label}
          </p>
          <p className="font-heading text-xl font-bold" style={{ color }}>
            {typeof value === "number" && !Number.isInteger(value)
              ? value.toFixed(1)
              : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskPill({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-xs text-[#CBD5E1]">
        {label}: <span className="font-bold text-white">{count}</span>
        <span className="text-[#94A3B8]">
          {" "}
          ({total ? Math.round((count / total) * 100) : 0}%)
        </span>
      </span>
    </div>
  );
}

function ResultRow({
  result: r,
  isExpanded,
  onToggle,
}: {
  result: AnalysisResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = getRiskColor(r.risk_score);

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden transition-all hover:border-[#FCC200]/20 shadow-md shadow-black/20">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 bg-black/50 px-5 py-3.5 text-left hover:bg-black/60 transition-colors"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-bold"
          style={{ background: `${color}18`, color }}
        >
          {Math.round(r.risk_score)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{r.name || r.filename}</p>
          <p className="font-mono text-[10px] text-[#94A3B8] truncate">{r.filename}</p>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider shrink-0"
          style={{ color, borderColor: `${color}40` }}
        >
          {getRiskLabel(r.risk_score)}
        </Badge>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-[#94A3B8] shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#94A3B8] shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-white/[0.06] bg-black/30 p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
            <RiskGauge score={r.risk_score} size={180} />
            <SignalRadar signals={r.signals} size={220} />
          </div>
          <SignalBreakdown
            details={normalizeSignalDetails(r.signal_details)}
            emailVerification={r.email_verification}
            phoneVerification={r.phone_verification}
            profileVerification={r.profile_verification}
            gleifVerification={r.gleif_verification}
          />
          {r.llm_explanation && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4">
              <p className="font-mono text-[10px] tracking-wider uppercase text-[#FCC200] mb-2">
                AI Explanation
              </p>
              <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                {r.llm_explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
