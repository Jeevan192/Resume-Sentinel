"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getStats,
  getHistory,
  exportCsv,
  resetStore,
  getRiskColor,
  getRiskLabel,
} from "@/lib/api";
import type { Stats, HistoryEntry } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Phone,
  Brain,
  Briefcase,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([getStats(), getHistory()]);
      setStats(s);
      setHistory(h.resumes.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    try {
      const blob = await exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resumeguard_report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed");
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure? This will delete ALL analysis data.")) return;
    setResetting(true);
    try {
      await resetStore();
      await loadData();
    } catch {
      alert("Reset failed");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <Loader2 className="h-8 w-8 text-[#FCC200] animate-spin" />
        <p className="text-sm text-[#CBD5E1]">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#ef4444]/10 border-[#ef4444]/30 rounded-xl mt-8">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#ef4444]">Error</p>
            <p className="mt-1 text-sm text-[#CBD5E1]">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#CBD5E1]">
            System overview and analysis history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono tracking-wider uppercase text-[#94A3B8] border border-white/10 hover:bg-white/5 hover:text-white transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono tracking-wider uppercase text-[#FCC200] border border-[#FCC200]/30 hover:bg-[#FCC200]/10 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono tracking-wider uppercase text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/10 transition-all disabled:opacity-50"
          >
            {resetting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Reset
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Users}
            label="Resumes Analyzed"
            value={stats.total_resumes_analyzed}
            color="#FCC200"
          />
          <StatCard
            icon={Mail}
            label="Unique Emails"
            value={stats.unique_emails}
            color="#FFD600"
          />
          <StatCard
            icon={Phone}
            label="Unique Phones"
            value={stats.unique_phones}
            color="#EA580C"
          />
          <StatCard
            icon={Brain}
            label="Embeddings"
            value={stats.embeddings_stored}
            color="#FCC200"
          />
          <StatCard
            icon={Briefcase}
            label="Experiences"
            value={stats.experiences_indexed}
            color="#FFD600"
          />
        </div>
      )}

      {/* History Table */}
      <Card className="bg-black/50 border-white/[0.08] rounded-2xl overflow-hidden shadow-xl shadow-black/30">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-base text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#FCC200]" />
            Recent Analyses
            <Badge variant="outline" className="ml-2 text-[10px] font-mono border-white/10 text-[#94A3B8]">
              {history.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                <FileText className="h-5 w-5 text-[#94A3B8]/40" />
              </div>
              <p className="text-sm text-[#94A3B8]/60">
                No analyses yet. Start by uploading a resume.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <Th>Candidate</Th>
                    <Th>File</Th>
                    <Th>Score</Th>
                    <Th>Level</Th>
                    <Th>Emails</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => {
                    const color = getRiskColor(h.risk_score);
                    return (
                      <tr
                        key={`${h.filename}-${i}`}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <Td className="font-medium text-white">
                          {h.name || "Unknown"}
                        </Td>
                        <Td className="font-mono text-[11px] text-[#94A3B8] max-w-[140px] truncate">
                          {h.filename}
                        </Td>
                        <Td>
                          <span
                            className="font-mono text-sm font-bold"
                            style={{ color }}
                          >
                            {Math.round(h.risk_score)}
                          </span>
                        </Td>
                        <Td>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] tracking-wider"
                            style={{ color, borderColor: `${color}40` }}
                          >
                            {getRiskLabel(h.risk_score)}
                          </Badge>
                        </Td>
                        <Td className="font-mono text-[11px] text-[#94A3B8] max-w-[160px] truncate">
                          {h.emails?.join(", ") || "—"}
                        </Td>
                        <Td className="font-mono text-[11px] text-[#94A3B8]/60 whitespace-nowrap">
                          {h.analyzed_at
                            ? new Date(h.analyzed_at).toLocaleDateString()
                            : "—"}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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
          <p className="font-heading text-2xl font-bold" style={{ color }}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-mono text-[10px] tracking-wider uppercase text-[#94A3B8] font-medium",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-3 text-sm", className)}>
      {children}
    </td>
  );
}
