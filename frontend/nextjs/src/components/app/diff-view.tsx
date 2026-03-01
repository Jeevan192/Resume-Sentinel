"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DiffResult, DiffHighlight } from "@/lib/api";
import {
  GitCompare,
  Fingerprint,
  BarChart3,
  FileText,
} from "lucide-react";

interface DiffViewProps {
  diff: DiffResult;
}

const COLOR_MAP: Record<string, { bg: string; text: string; label: string }> = {
  exact: { bg: "#22c55e", text: "#22c55e", label: "Exact Match" },
  high: { bg: "#eab308", text: "#eab308", label: "High Similarity" },
  moderate: { bg: "#f97316", text: "#f97316", label: "Moderate" },
};

function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: DiffHighlight[];
}) {
  if (!text || !highlights || highlights.length === 0) {
    return (
      <pre className="whitespace-pre-wrap break-words text-xs text-[#94A3B8] font-mono leading-relaxed">
        {text}
      </pre>
    );
  }

  // Sort highlights by start position
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const hl of sorted) {
    // Text before this highlight
    if (cursor < hl.start) {
      segments.push(
        <span key={`t-${cursor}`} className="text-[#94A3B8]">
          {text.slice(cursor, hl.start)}
        </span>
      );
    }

    const color = COLOR_MAP[hl.color] ?? COLOR_MAP.moderate;
    segments.push(
      <span
        key={`h-${hl.start}`}
        className="rounded px-0.5 font-medium"
        style={{
          backgroundColor: `${color.bg}20`,
          color: color.text,
          borderBottom: `2px solid ${color.bg}60`,
        }}
        title={`${color.label} — ${hl.word_count} words`}
      >
        {text.slice(hl.start, hl.end)}
      </span>
    );
    cursor = hl.end;
  }

  // Remaining text
  if (cursor < text.length) {
    segments.push(
      <span key={`t-${cursor}`} className="text-[#94A3B8]">
        {text.slice(cursor)}
      </span>
    );
  }

  return (
    <pre className="whitespace-pre-wrap break-words text-xs font-mono leading-relaxed">
      {segments}
    </pre>
  );
}

export function DiffView({ diff }: DiffViewProps) {
  const pct = Math.round(diff.similarity * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCC200]/10 border border-[#FCC200]/30">
          <GitCompare className="h-4 w-4 text-[#FCC200]" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-white">
            Deterministic Diff Analysis
          </h3>
          <p className="text-xs text-[#94A3B8] font-mono">
            SequenceMatcher + N-gram overlap — fully local, no ML
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Similarity"
          value={`${pct}%`}
          color={pct >= 85 ? "#ef4444" : pct >= 50 ? "#eab308" : "#22c55e"}
        />
        <StatCard
          icon={FileText}
          label="Matching Blocks"
          value={`${diff.diff_blocks.length}`}
          color="#FCC200"
        />
        <StatCard
          icon={BarChart3}
          label="N-gram Overlap"
          value={`${Math.round(diff.ngram_overlap.overlap_ratio * 100)}%`}
          color="#a78bfa"
        />
        <StatCard
          icon={Fingerprint}
          label="Same Template"
          value={diff.same_template ? "YES" : "NO"}
          color={diff.same_template ? "#ef4444" : "#22c55e"}
        />
      </div>

      {/* Template Fingerprints */}
      <div className="flex flex-wrap gap-3 text-xs font-mono">
        <span className="text-[#94A3B8]">
          Fingerprint A:{" "}
          <code className="text-[#FCC200]">{diff.fingerprint_a}</code>
        </span>
        <span className="text-[#94A3B8]">
          Fingerprint B:{" "}
          <code className="text-[#FCC200]">{diff.fingerprint_b}</code>
        </span>
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(COLOR_MAP).map(([key, c]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: `${c.bg}40` }}
            />
            <span className="text-[10px] font-mono uppercase text-[#94A3B8]">
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Side-by-side diff view */}
      {diff.highlights && diff.above_threshold ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="bg-black/40 border-white/10 rounded-xl overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-xs font-mono text-[#94A3B8] flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#FCC200]" />
                {diff.file1}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 max-h-80 overflow-y-auto">
              <HighlightedText
                text={diff.highlights.text_a_preprocessed}
                highlights={diff.highlights.highlights_a}
              />
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10 rounded-xl overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-3">
              <CardTitle className="text-xs font-mono text-[#94A3B8] flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#FCC200]" />
                {diff.file2}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 max-h-80 overflow-y-auto">
              <HighlightedText
                text={diff.highlights.text_b_preprocessed}
                highlights={diff.highlights.highlights_b}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-black/40 border-white/10 rounded-xl">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-[#94A3B8]">
              {diff.above_threshold
                ? "Diff view not available."
                : `Similarity (${pct}%) is below the 50% threshold — diff view not triggered.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Matching Blocks Detail */}
      {diff.diff_blocks.length > 0 && (
        <Card className="bg-black/40 border-white/10 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-sm font-semibold text-white">
              Matching Blocks ({diff.diff_blocks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {diff.diff_blocks.map((block, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-[#FCC200] border-[#FCC200]/30"
                    >
                      {block.word_count} words
                    </Badge>
                    <span className="text-[10px] font-mono text-[#94A3B8]/60">
                      A[{block.start_a}:{block.end_a}] → B[{block.start_b}:
                      {block.end_b}]
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] font-mono leading-relaxed line-clamp-2">
                    {block.text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-black/40 border border-white/10 px-4 py-3"
      style={{ borderColor: `${color}20` }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <div>
        <p className="font-mono text-[10px] tracking-wider uppercase text-[#94A3B8]/60">
          {label}
        </p>
        <p className="text-sm font-bold font-mono" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}
