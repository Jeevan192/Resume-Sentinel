"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  SignalDetail,
  EmailVerification,
  PhoneVerification,
  ProfileVerification,
  GleifCompany,
} from "@/lib/api";
import { getSeverityColor } from "@/lib/api";
import {
  Shield,
  Mail,
  Phone,
  FileText,
  Brain,
  Wrench,
  Link,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Globe,
  MapPin,
  Smartphone,
  PhoneForwarded,
  ServerCrash,
  ExternalLink,
  WifiOff,
  Fingerprint,
} from "lucide-react";

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  timeline_overlap: Shield,
  email_validation: Mail,
  phone_validation: Phone,
  jd_plagiarism: FileText,
  semantic_similarity: Brain,
  skills_mismatch: Wrench,
  profile_validation: Link,
  gleif_verification: Building2,
};

const SIGNAL_LABELS: Record<string, string> = {
  timeline_overlap: "Timeline Overlap",
  email_validation: "Email Validation",
  phone_validation: "Phone Validation",
  jd_plagiarism: "JD Plagiarism",
  semantic_similarity: "Semantic Similarity",
  skills_mismatch: "Skills Mismatch",
  profile_validation: "Profile Validation",
  gleif_verification: "Company Verification (GLEIF)",
};

/* ─── Inline helpers ──────────────────────────────────── */

function StatusIcon({ state, size = 12 }: { state: boolean | null; size?: number }) {
  if (state === true) return <CheckCircle2 style={{ width: size, height: size }} className="text-[#22c55e] shrink-0" />;
  if (state === false) return <XCircle style={{ width: size, height: size }} className="text-[#ef4444] shrink-0" />;
  return <HelpCircle style={{ width: size, height: size }} className="text-[#94A3B8] shrink-0" />;
}

function statusColor(state: boolean | null): string {
  if (state === true) return "#22c55e";
  if (state === false) return "#ef4444";
  return "#94A3B8";
}

function MiniTag({ label, state }: { label: string; state: boolean | null }) {
  const c = statusColor(state);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] tracking-wider"
      style={{ color: c, background: `${c}12`, border: `1px solid ${c}25` }}
    >
      <StatusIcon state={state} size={9} />
      {label}
    </span>
  );
}

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

function lineTypeLabel(lt: string | null): { label: string; icon: React.ElementType; color: string } {
  if (!lt) return { label: "Unknown", icon: Phone, color: "#94A3B8" };
  const map: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    mobile: { label: "Mobile", icon: Smartphone, color: "#22c55e" },
    landline: { label: "Landline", icon: Phone, color: "#3b82f6" },
    voip: { label: "VoIP", icon: PhoneForwarded, color: "#f97316" },
    toll_free: { label: "Toll-Free", icon: PhoneForwarded, color: "#eab308" },
  };
  return map[lt.toLowerCase()] ?? { label: lt, icon: Phone, color: "#94A3B8" };
}

function verdictDisplay(verdict: string): { label: string; color: string; icon: React.ElementType } {
  const map: Record<string, { label: string; color: string; icon: React.ElementType }> = {
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
  return map[verdict] ?? { label: verdict || "Unknown", color: "#94A3B8", icon: HelpCircle };
}

function platformLabel(url: string): { name: string; color: string } {
  if (url.includes("linkedin.com")) return { name: "LinkedIn", color: "#0a66c2" };
  if (url.includes("github.com")) return { name: "GitHub", color: "#f0f6fc" };
  if (url.includes("serper") || url.includes("Serper")) return { name: "OSINT", color: "#FCC200" };
  return { name: "Web", color: "#CBD5E1" };
}

/* ─── Inline detail renderers ────────────────────────── */

function EmailInlineDetails({ emails }: { emails: EmailVerification[] }) {
  if (!emails || emails.length === 0) return null;
  return (
    <div className="mt-2.5 space-y-2">
      <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
        ZeroBounce API Results
      </p>
      {emails.map((e, i) => {
        const { label, color } = emailStatusLabel(e.status);
        const apiAvail = e.status !== "api_unavailable";
        return (
          <div key={`${e.email}-${i}`} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <StatusIcon state={e.is_valid} size={12} />
              <span className="font-mono text-[11px] text-white truncate flex-1">{e.email}</span>
              <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded" style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}>{label}</span>
            </div>
            {apiAvail ? (
              <div className="flex flex-wrap gap-1.5">
                <MiniTag label="Deliverable" state={e.is_valid} />
                <MiniTag label="Disposable" state={e.is_disposable === null ? null : !e.is_disposable} />
                <MiniTag label={e.is_free ? "Free" : "Business"} state={e.is_free === null ? null : !e.is_free} />
                {e.sub_status && (
                  <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-[#94A3B8] bg-white/[0.04] border border-white/[0.06]">
                    <Fingerprint className="h-2.5 w-2.5" /> {e.sub_status}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                <ServerCrash className="h-3 w-3" /> API unavailable — heuristic only
              </div>
            )}
            {e.did_you_mean && (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-[#eab308]/10 border border-[#eab308]/20 px-2 py-1">
                <AlertTriangle className="h-2.5 w-2.5 text-[#eab308]" />
                <span className="text-[10px] text-[#eab308]">Did you mean <span className="font-mono font-semibold">{e.did_you_mean}</span>?</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PhoneInlineDetails({ phones }: { phones: PhoneVerification[] }) {
  if (!phones || phones.length === 0) return null;
  return (
    <div className="mt-2.5 space-y-2">
      <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
        NumVerify API Results
      </p>
      {phones.map((p, i) => {
        const { label: ltLabel, icon: LtIcon, color: ltColor } = lineTypeLabel(p.line_type);
        const apiAvail = p.is_valid !== null;
        return (
          <div key={`${p.phone}-${i}`} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <StatusIcon state={p.is_valid} size={12} />
              <span className="font-mono text-[11px] text-white truncate flex-1">{p.phone}</span>
              {apiAvail && (
                <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded" style={{ color: p.is_valid ? "#22c55e" : "#ef4444", background: p.is_valid ? "#22c55e12" : "#ef444412", border: `1px solid ${p.is_valid ? "#22c55e25" : "#ef444425"}` }}>
                  {p.is_valid ? "Valid" : "Invalid"}
                </span>
              )}
            </div>
            {apiAvail ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-[9px]" style={{ color: ltColor, background: `${ltColor}12`, border: `1px solid ${ltColor}25` }}>
                  <LtIcon className="h-2.5 w-2.5" /> {ltLabel}
                </div>
                {p.country && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#CBD5E1]">
                    <Globe className="h-2.5 w-2.5 text-[#94A3B8]" /> {p.country}
                  </span>
                )}
                {p.state && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#CBD5E1]">
                    <MapPin className="h-2.5 w-2.5 text-[#94A3B8]" /> {p.state}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                <ServerCrash className="h-3 w-3" /> API unavailable — heuristic only
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileInlineDetails({ profiles }: { profiles: ProfileVerification[] }) {
  if (!profiles || profiles.length === 0) return null;
  return (
    <div className="mt-2.5 space-y-2">
      <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
        Serper OSINT + Link Results
      </p>
      {profiles.map((p, i) => {
        const { label, color, icon: VIcon } = verdictDisplay(p.verdict);
        const { name: plat, color: platColor } = platformLabel(p.url);
        return (
          <div key={`${p.url}-${i}`} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <VIcon className="h-3 w-3 shrink-0" style={{ color }} />
              <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded" style={{ color: platColor, background: `${platColor}12`, border: `1px solid ${platColor}25` }}>{plat}</span>
              <span className="font-mono text-[10px] text-[#CBD5E1] truncate flex-1">{p.url}</span>
              <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded" style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}>{label}</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] mb-1.5 leading-relaxed">{p.status}</p>
            <div className="flex flex-wrap gap-1.5">
              <MiniTag label="DNS" state={p.dns_ok} />
              <MiniTag label={p.http_status ? `HTTP ${p.http_status}` : "HTTP"} state={p.http_status === null ? null : p.http_status === 200} />
              <MiniTag label="Name" state={p.name_found} />
              <MiniTag label="Valid" state={p.is_valid} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GleifInlineDetails({ companies }: { companies: GleifCompany[] }) {
  if (!companies || companies.length === 0) return null;
  const verified = companies.filter((c) => c.gleif_found).length;
  const total = companies.length;
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[9px] tracking-wider uppercase text-[#94A3B8]">
          GLEIF Registry
        </p>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]">{verified}/{total} verified</span>
      </div>
      {companies.map((c, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg p-2.5"
          style={{
            background: c.gleif_found ? "rgba(34,197,94,0.04)" : "rgba(249,115,22,0.04)",
            border: `1px solid ${c.gleif_found ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.15)"}`,
          }}
        >
          {c.gleif_found ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e] shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-white truncate">{c.resume_company}</p>
            {c.gleif_found && c.gleif_entity && (
              <p className="text-[9px] text-[#94A3B8] truncate">GLEIF: {c.gleif_entity}</p>
            )}
            {c.error && (
              <p className="text-[9px] text-[#f97316]/80 truncate">{c.error}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="font-mono text-[9px] px-1.5 py-0.5 rounded"
              style={{
                color: c.gleif_found ? "#22c55e" : "#f97316",
                background: c.gleif_found ? "#22c55e12" : "#f9731612",
                border: `1px solid ${c.gleif_found ? "#22c55e25" : "#f9731625"}`,
              }}
            >
              {c.gleif_found ? `${Math.round(c.match_score * 100)}%` : "N/F"}
            </span>
            {c.lei && (
              <a
                href={`https://search.gleif.org/#/record/${c.lei}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FCC200]/60 hover:text-[#FCC200] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */

interface SignalBreakdownProps {
  details: SignalDetail[];
  emailVerification?: EmailVerification[];
  phoneVerification?: PhoneVerification[];
  profileVerification?: ProfileVerification[];
  gleifVerification?: GleifCompany[];
}

export function SignalBreakdown({
  details,
  emailVerification,
  phoneVerification,
  profileVerification,
  gleifVerification,
}: SignalBreakdownProps) {
  if (!details || details.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-lg font-semibold text-white">
        Signal Breakdown
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {details.map((d) => {
          const Icon = SIGNAL_ICONS[d.signal] ?? Shield;
          const label = SIGNAL_LABELS[d.signal] ?? d.signal;
          const color = getSeverityColor(d.severity);

          /* Pick inline detail for this signal */
          let inlineDetail: React.ReactNode = null;
          if (d.signal === "email_validation" && emailVerification && emailVerification.length > 0) {
            inlineDetail = <EmailInlineDetails emails={emailVerification} />;
          } else if (d.signal === "phone_validation" && phoneVerification && phoneVerification.length > 0) {
            inlineDetail = <PhoneInlineDetails phones={phoneVerification} />;
          } else if (d.signal === "profile_validation" && profileVerification && profileVerification.length > 0) {
            inlineDetail = <ProfileInlineDetails profiles={profileVerification} />;
          } else if (d.signal === "gleif_verification" && gleifVerification && gleifVerification.length > 0) {
            inlineDetail = <GleifInlineDetails companies={gleifVerification} />;
          }

          return (
            <Card
              key={d.signal}
              className="bg-black/50 border-white/[0.08] rounded-xl hover:border-[#FCC200]/30 transition-all shadow-lg shadow-black/20"
            >
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        background: `${color}15`,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <CardTitle className="text-sm font-medium text-white">
                      {label}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color }}
                    >
                      {d.score}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono tracking-wider"
                      style={{ color, borderColor: `${color}40` }}
                    >
                      {d.severity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <p className="text-xs leading-relaxed text-[#CBD5E1]">
                  {d.explanation}
                </p>
                {inlineDetail}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
