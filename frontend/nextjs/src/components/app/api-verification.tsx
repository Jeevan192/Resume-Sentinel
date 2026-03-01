"use client";

import type {
  EmailVerification,
  PhoneVerification,
  ProfileVerification,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Shield,
  Wifi,
  WifiOff,
  Link2,
  ExternalLink,
  Fingerprint,
  MapPin,
  Smartphone,
  PhoneForwarded,
  ServerCrash,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Helpers ──────────────────────────────────────────── */

function StatusIcon({
  state,
  size = 16,
}: {
  state: boolean | null;
  size?: number;
}) {
  if (state === true)
    return <CheckCircle2 style={{ width: size, height: size }} className="text-[#22c55e] shrink-0" />;
  if (state === false)
    return <XCircle style={{ width: size, height: size }} className="text-[#ef4444] shrink-0" />;
  return <HelpCircle style={{ width: size, height: size }} className="text-[#94A3B8] shrink-0" />;
}

function statusColor(state: boolean | null): string {
  if (state === true) return "#22c55e";
  if (state === false) return "#ef4444";
  return "#94A3B8";
}

function StatusBadge({ label, state }: { label: string; state: boolean | null }) {
  const color = statusColor(state);
  return (
    <Badge
      variant="outline"
      className="font-mono text-[10px] tracking-wider gap-1"
      style={{ color, borderColor: `${color}40` }}
    >
      <StatusIcon state={state} size={10} />
      {label}
    </Badge>
  );
}

function InfoCell({
  icon: Icon,
  label,
  value,
  color,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#94A3B8]" />
      <div className="min-w-0">
        <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
          {label}
        </p>
        <p
          className={cn(
            "text-xs truncate",
            mono && "font-mono",
            color ? "" : "text-[#E2E8F0]"
          )}
          style={color ? { color } : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── ZeroBounce Email Verification Section ────────────── */

function emailStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    valid: { label: "Valid", color: "#22c55e" },
    invalid: { label: "Invalid", color: "#ef4444" },
    "catch-all": { label: "Catch-All", color: "#eab308" },
    spamtrap: { label: "Spam Trap", color: "#ef4444" },
    abuse: { label: "Abuse", color: "#f97316" },
    do_not_mail: { label: "Do Not Mail", color: "#f97316" },
    unknown: { label: "Unknown", color: "#94A3B8" },
    api_unavailable: { label: "API N/A", color: "#94A3B8" },
  };
  return map[status?.toLowerCase()] ?? { label: status || "Unknown", color: "#94A3B8" };
}

export function EmailVerificationCard({
  emails,
}: {
  emails: EmailVerification[];
}) {
  if (!emails || emails.length === 0) return null;

  return (
    <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30">
            <Mail className="h-4 w-4 text-[#3b82f6]" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-heading text-lg font-semibold text-white">
              Email Verification
            </CardTitle>
            <p className="text-xs text-[#94A3B8] font-mono">
              Powered by ZeroBounce API
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-white/10 text-[#94A3B8]"
          >
            {emails.length} email{emails.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {emails.map((e, i) => {
          const { label, color } = emailStatusLabel(e.status);
          const apiAvailable = e.status !== "api_unavailable";

          return (
            <div
              key={`${e.email}-${i}`}
              className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 hover:border-white/[0.12] transition-colors"
            >
              {/* Header row */}
              <div className="flex items-center gap-3 mb-3">
                <StatusIcon state={e.is_valid} />
                <span className="font-mono text-sm font-medium text-white truncate flex-1">
                  {e.email}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] tracking-wider shrink-0"
                  style={{ color, borderColor: `${color}40` }}
                >
                  {label}
                </Badge>
              </div>

              {/* Detail grid */}
              {apiAvailable ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge label="Deliverable" state={e.is_valid} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge
                      label="Disposable"
                      state={e.is_disposable === null ? null : !e.is_disposable}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge
                      label={e.is_free ? "Free Provider" : "Business Email"}
                      state={e.is_free === null ? null : !e.is_free}
                    />
                  </div>
                  {e.sub_status && (
                    <InfoCell
                      icon={Fingerprint}
                      label="Sub-Status"
                      value={e.sub_status}
                      mono
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <ServerCrash className="h-3.5 w-3.5" />
                  ZeroBounce API unavailable — heuristic checks only
                </div>
              )}

              {/* Did-you-mean suggestion */}
              {e.did_you_mean && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#eab308] shrink-0" />
                  <span className="text-xs text-[#eab308]">
                    Did you mean{" "}
                    <span className="font-mono font-semibold">
                      {e.did_you_mean}
                    </span>
                    ?
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── NumVerify Phone Verification Section ─────────────── */

function lineTypeLabel(lineType: string | null): {
  label: string;
  icon: React.ElementType;
  color: string;
} {
  if (!lineType) return { label: "Unknown", icon: Phone, color: "#94A3B8" };
  const map: Record<
    string,
    { label: string; icon: React.ElementType; color: string }
  > = {
    mobile: { label: "Mobile", icon: Smartphone, color: "#22c55e" },
    landline: { label: "Landline", icon: Phone, color: "#3b82f6" },
    voip: { label: "VoIP", icon: PhoneForwarded, color: "#f97316" },
    toll_free: { label: "Toll-Free", icon: PhoneForwarded, color: "#eab308" },
  };
  return map[lineType.toLowerCase()] ?? { label: lineType, icon: Phone, color: "#94A3B8" };
}

export function PhoneVerificationCard({
  phones,
}: {
  phones: PhoneVerification[];
}) {
  if (!phones || phones.length === 0) return null;

  return (
    <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
            <Phone className="h-4 w-4 text-[#8b5cf6]" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-heading text-lg font-semibold text-white">
              Phone Verification
            </CardTitle>
            <p className="text-xs text-[#94A3B8] font-mono">
              Powered by NumVerify API
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-white/10 text-[#94A3B8]"
          >
            {phones.length} number{phones.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {phones.map((p, i) => {
          const { label: ltLabel, icon: LtIcon, color: ltColor } = lineTypeLabel(
            p.line_type
          );
          const apiAvailable = p.is_valid !== null;

          return (
            <div
              key={`${p.phone}-${i}`}
              className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 hover:border-white/[0.12] transition-colors"
            >
              {/* Header row */}
              <div className="flex items-center gap-3 mb-3">
                <StatusIcon state={p.is_valid} />
                <span className="font-mono text-sm font-medium text-white truncate flex-1">
                  {p.phone}
                </span>
                {apiAvailable && (
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] tracking-wider shrink-0"
                    style={{
                      color: p.is_valid ? "#22c55e" : "#ef4444",
                      borderColor: p.is_valid
                        ? "rgba(34,197,94,0.4)"
                        : "rgba(239,68,68,0.4)",
                    }}
                  >
                    {p.is_valid ? "Valid" : "Invalid"}
                  </Badge>
                )}
              </div>

              {/* Detail grid */}
              {apiAvailable ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{
                        background: `${ltColor}15`,
                        border: `1px solid ${ltColor}30`,
                      }}
                    >
                      <LtIcon className="h-3.5 w-3.5" style={{ color: ltColor }} />
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
                        Line Type
                      </p>
                      <p className="text-xs font-medium" style={{ color: ltColor }}>
                        {ltLabel}
                      </p>
                    </div>
                  </div>
                  {p.country && (
                    <InfoCell icon={Globe} label="Country" value={p.country} />
                  )}
                  {p.state && (
                    <InfoCell icon={MapPin} label="Location" value={p.state} />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <ServerCrash className="h-3.5 w-3.5" />
                  NumVerify API unavailable — heuristic checks only
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Serper / Profile Link Verification Section ───────── */

function verdictDisplay(verdict: string): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  const map: Record<
    string,
    { label: string; color: string; icon: React.ElementType }
  > = {
    VERIFIED: { label: "Verified", color: "#22c55e", icon: CheckCircle2 },
    ACTIVE: { label: "Active", color: "#22c55e", icon: CheckCircle2 },
    PRIVATE: { label: "Private", color: "#3b82f6", icon: Shield },
    RATE_LIMITED: { label: "Rate Limited", color: "#3b82f6", icon: Shield },
    SERPER_INDEXED: { label: "Google Indexed", color: "#22c55e", icon: Globe },
    NOT_INDEXED: { label: "Not in Google", color: "#f97316", icon: AlertTriangle },
    NOT_FOUND: { label: "Not Found", color: "#ef4444", icon: XCircle },
    MISMATCH: { label: "Name Mismatch", color: "#eab308", icon: AlertTriangle },
    EMPTY: { label: "Empty Profile", color: "#eab308", icon: AlertTriangle },
    DNS_FAIL: { label: "DNS Failed", color: "#ef4444", icon: WifiOff },
    UNREACHABLE: { label: "Unreachable", color: "#f97316", icon: WifiOff },
  };
  return (
    map[verdict] ?? {
      label: verdict || "Unknown",
      color: "#94A3B8",
      icon: HelpCircle,
    }
  );
}

function platformLabel(url: string): { name: string; color: string } {
  if (url.includes("linkedin.com"))
    return { name: "LinkedIn", color: "#0a66c2" };
  if (url.includes("github.com"))
    return { name: "GitHub", color: "#f0f6fc" };
  if (url.includes("serper") || url.includes("Serper"))
    return { name: "OSINT Search", color: "#FCC200" };
  return { name: "Web Link", color: "#CBD5E1" };
}

export function ProfileVerificationCard({
  profiles,
}: {
  profiles: ProfileVerification[];
}) {
  if (!profiles || profiles.length === 0) return null;

  return (
    <Card className="bg-black/50 border-white/[0.08] rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f97316]/10 border border-[#f97316]/30">
            <Globe className="h-4 w-4 text-[#f97316]" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-heading text-lg font-semibold text-white">
              Profile &amp; OSINT Verification
            </CardTitle>
            <p className="text-xs text-[#94A3B8] font-mono">
              Serper Google OSINT + Direct Link Checks
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-white/10 text-[#94A3B8]"
          >
            {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {profiles.map((p, i) => {
          const { label, color, icon: VerdictIcon } = verdictDisplay(p.verdict);
          const { name: platformName, color: platformColor } = platformLabel(
            p.url
          );

          return (
            <div
              key={`${p.url}-${i}`}
              className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 hover:border-white/[0.12] transition-colors"
            >
              {/* Header row */}
              <div className="flex items-center gap-3 mb-3">
                <VerdictIcon
                  className="h-4 w-4 shrink-0"
                  style={{ color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] tracking-wider shrink-0"
                      style={{
                        color: platformColor,
                        borderColor: `${platformColor}40`,
                      }}
                    >
                      {platformName}
                    </Badge>
                    <span className="font-mono text-xs text-[#CBD5E1] truncate">
                      {p.url}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] tracking-wider shrink-0"
                  style={{ color, borderColor: `${color}40` }}
                >
                  {label}
                </Badge>
              </div>

              {/* Status detail */}
              <p className="text-xs text-[#CBD5E1] leading-relaxed mb-3">
                {p.status}
              </p>

              {/* Verification checks */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="DNS" state={p.dns_ok} />
                <StatusBadge
                  label={
                    p.http_status ? `HTTP ${p.http_status}` : "HTTP"
                  }
                  state={
                    p.http_status === null
                      ? null
                      : p.http_status === 200
                  }
                />
                <StatusBadge label="Name Match" state={p.name_found} />
                <StatusBadge label="Link Valid" state={p.is_valid} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
