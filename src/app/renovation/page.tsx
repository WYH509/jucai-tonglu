"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const RenovationDashboard = dynamic(
  () => import("@/components/renovation/RenovationDashboard"),
  { ssr: false }
);

export default function RenovationPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RenovationDashboard />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="flex items-center h-12 px-4 max-w-3xl mx-auto">
          <div className="w-8" />
          <div className="flex-1 text-center font-semibold text-zinc-900">
            装修记账
          </div>
          <div className="w-8" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
