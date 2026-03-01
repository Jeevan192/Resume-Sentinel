"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GleifCompany } from "@/lib/api";
import {
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface GleifVerificationProps {
  companies: GleifCompany[];
}

export function GleifVerification({ companies }: GleifVerificationProps) {
  if (!companies || companies.length === 0) return null;

  const verified = companies.filter((c) => c.gleif_found);
  const unverified = companies.filter((c) => !c.gleif_found);

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[#FCC200]" />
        GLEIF Company Verification
      </h3>
      <p className="text-xs text-[#94A3B8] font-mono">
        Companies verified against the Global Legal Entity Identifier Foundation
        registry
      </p>

      {/* Summary Row */}
      <div className="flex gap-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 px-3 py-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
          <span className="text-xs font-mono text-[#22c55e]">
            {verified.length} Verified
          </span>
        </div>
        {unverified.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20 px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[#f97316]" />
            <span className="text-xs font-mono text-[#f97316]">
              {unverified.length} Unverified
            </span>
          </div>
        )}
      </div>

      {/* Company Cards */}
      <div className="grid gap-2.5">
        {companies.map((company, i) => (
          <Card
            key={i}
            className={`rounded-xl transition-all ${
              company.gleif_found
                ? "bg-[#22c55e]/5 border-[#22c55e]/20 hover:border-[#22c55e]/40"
                : "bg-[#f97316]/5 border-[#f97316]/20 hover:border-[#f97316]/40"
            }`}
          >
            <CardContent className="flex items-center gap-3 px-4 py-3">
              {/* Status Icon */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  company.gleif_found
                    ? "bg-[#22c55e]/15 border border-[#22c55e]/30"
                    : "bg-[#f97316]/15 border border-[#f97316]/30"
                }`}
              >
                {company.gleif_found ? (
                  <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#f97316]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold text-white truncate">
                  {company.resume_company}
                </p>
                {company.gleif_found && company.gleif_entity && (
                  <p className="text-xs text-[#94A3B8] truncate">
                    GLEIF: {company.gleif_entity}
                  </p>
                )}
                {company.error && (
                  <p className="text-xs text-[#f97316]/80 truncate">
                    {company.error}
                  </p>
                )}
              </div>

              {/* Right Side: Badge + LEI */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono"
                  style={{
                    color: company.gleif_found ? "#22c55e" : "#f97316",
                    borderColor: company.gleif_found
                      ? "#22c55e40"
                      : "#f9731640",
                    backgroundColor: company.gleif_found
                      ? "#22c55e10"
                      : "#f9731610",
                  }}
                >
                  {company.gleif_found
                    ? `${Math.round(company.match_score * 100)}% match`
                    : "Not Found"}
                </Badge>
                {company.lei && (
                  <a
                    href={`https://search.gleif.org/#/record/${company.lei}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-[#FCC200]/70 hover:text-[#FCC200] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    LEI
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
