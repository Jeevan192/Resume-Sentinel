import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#030304]">
      {/* Navbar skeleton */}
      <div className="fixed top-0 inset-x-0 z-50 bg-[#030304]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md bg-white/[0.06]" />
            <Skeleton className="h-4 w-32 bg-white/[0.06]" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12 bg-white/[0.06]" />
            <Skeleton className="hidden sm:block h-8 w-24 rounded-full bg-[#FCC200]/10" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="mx-auto max-w-7xl px-6 pt-32 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div className="space-y-6">
            <Skeleton className="h-3 w-40 rounded-full bg-[#FCC200]/10" />
            <Skeleton className="h-16 w-full max-w-lg bg-white/[0.04]" />
            <Skeleton className="h-16 w-3/4 bg-white/[0.04]" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full max-w-md bg-white/[0.04]" />
              <Skeleton className="h-4 w-5/6 bg-white/[0.04]" />
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-11 w-40 rounded-full bg-[#FCC200]/10" />
              <Skeleton className="h-11 w-36 rounded-full bg-white/[0.06]" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-[300px] h-[300px]">
              <Skeleton className="absolute inset-8 rounded-full bg-white/[0.03]" />
              <Skeleton className="absolute inset-16 rounded-full bg-[#FCC200]/[0.04]" />
            </div>
          </div>
        </div>
      </div>

      {/* Features skeleton */}
      <div className="mx-auto max-w-7xl px-6 py-24 bg-[#0F1115]">
        <Skeleton className="h-10 w-64 mb-12 bg-white/[0.04]" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      </div>

      {/* Animated loader overlay */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030304]/80 backdrop-blur-sm pointer-events-none">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-[#FCC200]/20 border-t-[#FCC200] animate-spin" />
          <p className="font-mono text-xs text-[#94A3B8] tracking-widest uppercase animate-pulse">
            Loading Resume Sentinel...
          </p>
        </div>
      </div>
    </div>
  );
}
