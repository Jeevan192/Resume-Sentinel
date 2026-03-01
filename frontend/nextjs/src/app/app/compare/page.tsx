"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/lib/app-store";
import { compareResumes, diffCompare, getRiskColor } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiffView } from "@/components/app/diff-view";
import {
  Upload,
  FileText,
  X,
  Loader2,
  AlertTriangle,
  ArrowLeftRight,
  Mail,
  Phone,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  GitCompareArrows,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComparePage() {
  // Local state for File objects (can't persist in context)
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  // Persisted state from global store
  const {
    compareResult: result,
    compareDiff: diffResult,
    compareError: error,
    compareLoading: loading,
    compareFile1Name,
    compareFile2Name,
    setCompareResult,
    setCompareDiff,
    setCompareError,
    setCompareLoading,
    setCompareFile1Name,
    setCompareFile2Name,
    resetCompare,
  } = useAppStore();

  const handleCompare = async () => {
    if (!file1 || !file2) return;
    setCompareError(null);
    setCompareLoading(true);
    setCompareResult(null);
    setCompareDiff(null);
    setCompareFile1Name(file1.name);
    setCompareFile2Name(file2.name);
    try {
      const [compareRes, diffRes] = await Promise.all([
        compareResumes(file1, file2),
        diffCompare(file1, file2),
      ]);
      setCompareResult(compareRes);
      setCompareDiff(diffRes);
    } catch (err) {
      setCompareError(
        err instanceof Error ? err.message : "Comparison failed"
      );
    } finally {
      setCompareLoading(false);
    }
  };

  const handleReset = () => {
    resetCompare();
    setFile1(null);
    setFile2(null);
  };

  // Show results if we have them (persisted), otherwise show upload UI
  const hasResults = !!result && !loading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl tracking-tight">
          Compare Resumes
        </h1>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Upload two resumes to detect similarity, shared contacts, and possible duplication.
        </p>
      </div>

      {/* Previous result banner */}
      {hasResults && (
        <div className="flex items-center justify-between rounded-xl bg-[#FCC200]/[0.06] border border-[#FCC200]/20 px-5 py-3">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="h-4 w-4 text-[#FCC200]" />
            <span className="text-sm text-[#E2E8F0]">
              Comparing{" "}
              <span className="font-mono font-semibold text-[#FCC200]">
                {compareFile1Name || "File 1"}
              </span>
              {" vs "}
              <span className="font-mono font-semibold text-[#FCC200]">
                {compareFile2Name || "File 2"}
              </span>
            </span>
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-mono text-[#CBD5E1] hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            New Comparison
          </button>
        </div>
      )}

      {/* Two-file upload — show when no results */}
      {!hasResults && !loading && (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <SingleFileUpload
              label="Resume 1"
              file={file1}
              onFile={setFile1}
            />
            <SingleFileUpload
              label="Resume 2"
              file={file2}
              onFile={setFile2}
            />
          </div>

          {/* Compare Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCompare}
              disabled={!file1 || !file2 || loading}
              className={cn(
                "inline-flex items-center gap-2.5 rounded-full px-8 py-3 font-mono text-sm tracking-wider uppercase transition-all",
                file1 && file2 && !loading
                  ? "bg-gradient-to-r from-[#EA580C] to-[#FCC200] text-white shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(252,194,0,0.6)] hover:-translate-y-0.5"
                  : "bg-white/5 text-[#94A3B8]/50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeftRight className="h-4 w-4" />
              )}
              {loading ? "Comparing..." : "Compare"}
            </button>
          </div>
        </>
      )}

      {/* Loading */}
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
              Comparing resumes...
            </p>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Analyzing similarity & generating diff
            </p>
          </div>
        </div>
      )}

      {/* Error */}
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

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Similarity Score */}
          <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30">
            <CardContent className="flex flex-col items-center gap-4 p-8">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full border-4"
                style={{
                  borderColor: getRiskColor(result.similarity_score),
                  background: `${getRiskColor(result.similarity_score)}10`,
                }}
              >
                <span
                  className="font-heading text-4xl font-bold"
                  style={{ color: getRiskColor(result.similarity_score) }}
                >
                  {result.similarity_score}
                </span>
              </div>
              <div className="text-center">
                <p className="font-heading text-lg font-semibold text-white">
                  Similarity Score
                </p>
                <p className="mt-1 text-sm text-[#CBD5E1]">
                  {result.similarity_score >= 95
                    ? "Near-identical resumes — likely duplicate"
                    : result.similarity_score >= 85
                    ? "Very high similarity — suspicious"
                    : result.similarity_score >= 60
                    ? "Moderate similarity"
                    : "Low similarity — likely different candidates"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side names */}
          <div className="grid gap-4 sm:grid-cols-2">
            <NameCard label="Resume 1" name={result.name1} filename={result.file1} />
            <NameCard label="Resume 2" name={result.name2} filename={result.file2} />
          </div>

          {/* Fraud Indicators */}
          <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#FCC200]" />
                Fraud Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Indicator
                  label="Same Contact Info"
                  active={result.fraud_indicators.same_contact}
                />
                <Indicator
                  label="High Similarity (≥85%)"
                  active={result.fraud_indicators.high_similarity}
                />
                <Indicator
                  label="Possible Duplicate (≥95%)"
                  active={result.fraud_indicators.possible_duplicate}
                />
              </div>
            </CardContent>
          </Card>

          {/* Shared Data */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SharedList
              icon={Mail}
              label="Shared Emails"
              items={result.shared_emails}
            />
            <SharedList
              icon={Phone}
              label="Shared Phones"
              items={result.shared_phones}
            />
            <SharedList
              icon={Wrench}
              label="Skills Overlap"
              items={result.skills_overlap}
            />
          </div>

          {/* Deterministic Diff View */}
          {diffResult && (
            <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30">
              <CardContent className="p-6">
                <DiffView diff={diffResult} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SingleFileUpload({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs tracking-wider uppercase text-[#CBD5E1]">
        {label}
      </p>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl bg-black/50 border border-[#FCC200]/30 px-4 py-3.5 shadow-md shadow-black/20">
          <FileText className="h-4 w-4 text-[#FCC200] shrink-0" />
          <span className="flex-1 truncate font-mono text-xs text-white">
            {file.name}
          </span>
          <button
            onClick={() => onFile(null)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-[#94A3B8]" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/[0.12] bg-black/30 p-6 hover:border-[#FCC200]/30 hover:bg-black/40 transition-all cursor-pointer"
        >
          <Upload className="h-5 w-5 text-[#94A3B8]" />
          <span className="text-xs text-[#CBD5E1]">Drop or browse</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function NameCard({
  label,
  name,
  filename,
}: {
  label: string;
  name: string | null;
  filename: string;
}) {
  return (
    <Card className="bg-black/50 border-white/[0.08] rounded-xl shadow-lg shadow-black/20">
      <CardContent className="p-4">
        <p className="font-mono text-[10px] tracking-wider uppercase text-[#94A3B8]">
          {label}
        </p>
        <p className="font-heading text-lg font-semibold text-white mt-1">
          {name || "Unknown"}
        </p>
        <p className="font-mono text-xs text-[#CBD5E1] truncate">{filename}</p>
      </CardContent>
    </Card>
  );
}

function Indicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-4 py-3 transition-all",
        active
          ? "bg-[#ef4444]/10 border-[#ef4444]/30"
          : "bg-[#22c55e]/5 border-[#22c55e]/20"
      )}
    >
      {active ? (
        <AlertTriangle className="h-4 w-4 text-[#ef4444] shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-[#22c55e] shrink-0" />
      )}
      <span
        className={cn(
          "text-xs font-medium",
          active ? "text-[#ef4444]" : "text-[#22c55e]"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function SharedList({
  icon: Icon,
  label,
  items,
}: {
  icon: React.ElementType;
  label: string;
  items: string[];
}) {
  return (
    <Card className="bg-black/50 border-white/[0.08] rounded-xl shadow-lg shadow-black/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-[#94A3B8]" />
          <p className="font-mono text-[10px] tracking-wider uppercase text-[#94A3B8]">
            {label}
          </p>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-[#94A3B8]/60">None found</p>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="mr-1 border-[#FCC200]/30 text-[#FCC200] font-mono text-[10px]"
              >
                {item}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
