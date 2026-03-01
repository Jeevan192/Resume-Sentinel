"use client";

/**
 * Global App Store — Persists state across tab navigation.
 * Uses React Context so all /app/* pages share one state tree
 * that survives mounting/unmounting during route changes.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  AnalysisResult,
  BatchResult,
  CompareResult,
  DiffResult,
  AtsRejectionData,
} from "@/lib/api";

// ── State shape ────────────────────────────────────────
interface AppState {
  // Analyze tab
  analyzeResult: AnalysisResult | null;
  analyzeError: string | null;
  analyzeLoading: boolean;
  analyzeFileName: string | null;
  analyzeAtsRejection: AtsRejectionData | null;

  // Batch tab
  batchResult: BatchResult | null;
  batchError: string | null;
  batchLoading: boolean;
  batchExpanded: string | null;
  batchFileCount: number;

  // Compare tab
  compareResult: CompareResult | null;
  compareDiff: DiffResult | null;
  compareError: string | null;
  compareLoading: boolean;
  compareFile1Name: string | null;
  compareFile2Name: string | null;
}

interface AppActions {
  // Analyze
  setAnalyzeResult: (r: AnalysisResult | null) => void;
  setAnalyzeError: (e: string | null) => void;
  setAnalyzeLoading: (l: boolean) => void;
  setAnalyzeFileName: (n: string | null) => void;
  setAnalyzeAtsRejection: (d: AtsRejectionData | null) => void;

  // Batch
  setBatchResult: (r: BatchResult | null) => void;
  setBatchError: (e: string | null) => void;
  setBatchLoading: (l: boolean) => void;
  setBatchExpanded: (e: string | null) => void;
  setBatchFileCount: (n: number) => void;

  // Compare
  setCompareResult: (r: CompareResult | null) => void;
  setCompareDiff: (d: DiffResult | null) => void;
  setCompareError: (e: string | null) => void;
  setCompareLoading: (l: boolean) => void;
  setCompareFile1Name: (n: string | null) => void;
  setCompareFile2Name: (n: string | null) => void;

  // Utility
  resetAnalyze: () => void;
  resetBatch: () => void;
  resetCompare: () => void;
}

type AppStore = AppState & AppActions;

const AppStoreContext = createContext<AppStore | null>(null);

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  // ── Analyze ──────────────────────────────────────────
  const [analyzeResult, setAnalyzeResult] = useState<AnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeFileName, setAnalyzeFileName] = useState<string | null>(null);
  const [analyzeAtsRejection, setAnalyzeAtsRejection] = useState<AtsRejectionData | null>(null);

  // ── Batch ────────────────────────────────────────────
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchExpanded, setBatchExpanded] = useState<string | null>(null);
  const [batchFileCount, setBatchFileCount] = useState(0);

  // ── Compare ──────────────────────────────────────────
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareDiff, setCompareDiff] = useState<DiffResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareFile1Name, setCompareFile1Name] = useState<string | null>(null);
  const [compareFile2Name, setCompareFile2Name] = useState<string | null>(null);

  // ── Resets ───────────────────────────────────────────
  const resetAnalyze = useCallback(() => {
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setAnalyzeLoading(false);
    setAnalyzeFileName(null);
    setAnalyzeAtsRejection(null);
  }, []);

  const resetBatch = useCallback(() => {
    setBatchResult(null);
    setBatchError(null);
    setBatchLoading(false);
    setBatchExpanded(null);
    setBatchFileCount(0);
  }, []);

  const resetCompare = useCallback(() => {
    setCompareResult(null);
    setCompareDiff(null);
    setCompareError(null);
    setCompareLoading(false);
    setCompareFile1Name(null);
    setCompareFile2Name(null);
  }, []);

  const value: AppStore = {
    analyzeResult, setAnalyzeResult,
    analyzeError, setAnalyzeError,
    analyzeLoading, setAnalyzeLoading,
    analyzeFileName, setAnalyzeFileName,
    analyzeAtsRejection, setAnalyzeAtsRejection,

    batchResult, setBatchResult,
    batchError, setBatchError,
    batchLoading, setBatchLoading,
    batchExpanded, setBatchExpanded,
    batchFileCount, setBatchFileCount,

    compareResult, setCompareResult,
    compareDiff, setCompareDiff,
    compareError, setCompareError,
    compareLoading, setCompareLoading,
    compareFile1Name, setCompareFile1Name,
    compareFile2Name, setCompareFile2Name,

    resetAnalyze,
    resetBatch,
    resetCompare,
  };

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}
