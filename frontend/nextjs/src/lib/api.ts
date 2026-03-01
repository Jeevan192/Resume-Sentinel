/**
 * Resume Sentinel — API Service Layer
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "deet-telangana-hackathon-2026";

// ── Types ──────────────────────────────────────────────

export interface SignalScores {
  timeline_score: number;
  email_score: number;
  phone_score: number;
  plagiarism_score: number;
  similarity_score: number;
  mismatch_score: number;
  profile_score: number;
  gleif_score: number;
}

export interface SignalDetail {
  signal: string;
  score: number;
  severity: string;
  explanation: string;
}

/** Backend returns signal_details as a dict keyed by signal name */
export interface RawSignalDetail {
  score: number;
  severity: string;
  headline: string;
}

/** Convert the backend dict into an array the UI components expect */
export function normalizeSignalDetails(
  raw: Record<string, RawSignalDetail> | SignalDetail[] | undefined
): SignalDetail[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Object.entries(raw).map(([key, val]) => ({
    signal: key,
    score: val.score ?? 0,
    severity: val.severity ?? "NONE",
    explanation: val.headline ?? "",
  }));
}

export interface Experience {
  company: string;
  role: string;
  start: string;
  end: string;
}

export interface Entities {
  name: string | null;
  emails: string[];
  phones: string[];
  skills_count: number;
  experiences: Experience[];
  education: string[];
}

export interface DuplicateSubmission {
  is_duplicate: boolean;
  times_submitted: number;
  penalty_applied: number;
  original_score?: number;
}

export interface AnalysisResult {
  filename: string;
  analyzed_at: string;
  name: string;
  emails: string[];
  phones: string[];
  skills: Record<string, unknown>;
  experience_count: number;
  word_count: number;
  risk_score: number;
  risk_level: string;
  risk_label: string;
  risk_color: string;
  alert: boolean;
  active_signals: number;
  most_critical_signal: string;
  signals: SignalScores;
  email_verification: EmailVerification[];
  phone_verification: PhoneVerification[];
  profile_verification: ProfileVerification[];
  signal_details: Record<string, RawSignalDetail> | SignalDetail[];
  breakdown: Record<string, unknown>;
  llm_explanation: string;
  entities: Entities;
  duplicate_submission: DuplicateSubmission;
  gleif_verification: GleifCompany[];
}

export interface BatchSummary {
  total_analyzed: number;
  total_errors: number;
  avg_risk_score: number;
  max_risk_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface BatchResult {
  summary: BatchSummary;
  results: AnalysisResult[];
  errors: { filename: string; error: string }[];
}

export interface CompareResult {
  file1: string;
  file2: string;
  similarity_score: number;
  shared_emails: string[];
  shared_phones: string[];
  name1: string | null;
  name2: string | null;
  skills_overlap: string[];
  fraud_indicators: {
    same_contact: boolean;
    high_similarity: boolean;
    possible_duplicate: boolean;
  };
}

export interface HealthStatus {
  status: string;
  timestamp: string;
}

export interface Stats {
  total_resumes_analyzed: number;
  unique_emails: number;
  unique_phones: number;
  embeddings_stored: number;
  experiences_indexed: number;
}

export interface HistoryEntry {
  filename: string;
  analyzed_at: string;
  name: string;
  emails: string[];
  phones: string[];
  risk_score: number;
  risk_level: string;
}

export interface HistoryResponse {
  total_resumes: number;
  resumes: HistoryEntry[];
}

export interface GleifCompany {
  resume_company: string;
  normalized_query: string;
  gleif_found: boolean;
  gleif_entity: string | null;
  lei: string | null;
  match_score: number;
  error: string | null;
}

/** ZeroBounce email verification result */
export interface EmailVerification {
  email: string;
  status: string;
  sub_status: string;
  is_valid: boolean | null;
  is_disposable: boolean | null;
  is_free: boolean | null;
  did_you_mean: string | null;
}

/** NumVerify phone verification result */
export interface PhoneVerification {
  phone: string;
  is_valid: boolean | null;
  line_type: string | null;
  state: string | null;
  country: string | null;
}

/** Serper / Link Validator profile verification result */
export interface ProfileVerification {
  url: string;
  is_valid: boolean;
  status: string;
  verdict: string;
  dns_ok: boolean | null;
  http_status: number | null;
  name_found: boolean | null;
}

export interface DiffHighlight {
  start: number;
  end: number;
  color: "exact" | "high" | "moderate";
  word_count: number;
}

export interface DiffBlock {
  start_a: number;
  end_a: number;
  start_b: number;
  end_b: number;
  text: string;
  word_count: number;
  similarity: number;
}

export interface DiffResult {
  file1: string;
  file2: string;
  similarity: number;
  above_threshold: boolean;
  diff_blocks: DiffBlock[];
  ngram_overlap: {
    overlap_ratio: number;
    shared_ngrams: number;
    total_a: number;
    total_b: number;
  };
  highlights: {
    text_a_preprocessed: string;
    text_b_preprocessed: string;
    highlights_a: DiffHighlight[];
    highlights_b: DiffHighlight[];
  } | null;
  fingerprint_a: string;
  fingerprint_b: string;
  same_template: boolean;
}

// ── ATS Rejection ──────────────────────────────────────

export interface AtsRejectionData {
  message: string;
  confidence: number;
  word_count: number;
  signals_found: string[];
  suggestion: string;
}

export class NotResumeError extends Error {
  public readonly ats: AtsRejectionData;
  constructor(data: AtsRejectionData) {
    super(data.message);
    this.name = "NotResumeError";
    this.ats = data;
  }
}

// ── Helpers ────────────────────────────────────────────

function headers(): HeadersInit {
  return { "X-API-Key": API_KEY };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      // Detect ATS rejection from backend
      if (
        typeof body.detail === "object" &&
        body.detail !== null &&
        body.detail.error === "NOT_A_RESUME"
      ) {
        throw new NotResumeError({
          message: body.detail.message ?? "This document does not appear to be a resume.",
          confidence: body.detail.confidence ?? 0,
          word_count: body.detail.word_count ?? 0,
          signals_found: body.detail.signals_found ?? [],
          suggestion: body.detail.suggestion ?? "Please upload a valid resume document.",
        });
      }
      detail = typeof body.detail === "string"
        ? body.detail
        : JSON.stringify(body.detail);
    } catch (e) {
      if (e instanceof NotResumeError) throw e;
      /* empty */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ── API Functions ──────────────────────────────────────

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  return handleResponse<HealthStatus>(res);
}

export async function validateResume(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/validate_resume`, {
    method: "POST",
    headers: headers(),
    body: form,
  });
  return handleResponse<AnalysisResult>(res);
}

export async function batchValidate(files: File[]): Promise<BatchResult> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await fetch(`${API_BASE}/batch_validate`, {
    method: "POST",
    headers: headers(),
    body: form,
  });
  return handleResponse<BatchResult>(res);
}

export async function compareResumes(file1: File, file2: File): Promise<CompareResult> {
  const form = new FormData();
  form.append("file1", file1);
  form.append("file2", file2);
  const res = await fetch(`${API_BASE}/compare_resumes`, {
    method: "POST",
    headers: headers(),
    body: form,
  });
  return handleResponse<CompareResult>(res);
}

export async function diffCompare(file1: File, file2: File): Promise<DiffResult> {
  const form = new FormData();
  form.append("file1", file1);
  form.append("file2", file2);
  const res = await fetch(`${API_BASE}/diff_compare`, {
    method: "POST",
    headers: headers(),
    body: form,
  });
  return handleResponse<DiffResult>(res);
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
  return handleResponse<Stats>(res);
}

export async function getHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/history`, { cache: "no-store" });
  return handleResponse<HistoryResponse>(res);
}

export async function exportCsv(): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export_csv`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.blob();
}

export async function resetStore(): Promise<void> {
  const res = await fetch(`${API_BASE}/reset`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
}

// ── Utility ────────────────────────────────────────────

export function getRiskColor(score: number): string {
  if (score >= 85) return "#ef4444";
  if (score >= 65) return "#f97316";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#22c55e";
  return "#FCC200";
}

export function getRiskLabel(score: number): string {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "CLEAN";
}

export function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#22c55e",
    NONE: "#FCC200",
  };
  return map[severity] ?? "#94A3B8";
}
