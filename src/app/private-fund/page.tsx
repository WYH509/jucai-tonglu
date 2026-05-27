"use client";

import { useRouter } from "next/navigation";
import PrivateFundDashboard from "@/components/private-fund/PrivateFundDashboard";

export default function PrivateFundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 flex items-center h-12 bg-white border-b border-gray-200 px-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-blue-500 text-sm"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回
        </button>
        <span className="flex-1 text-center font-semibold text-gray-900 text-sm">
          私募基金看板
        </span>
        <div className="w-14" />
      </div>
      <PrivateFundDashboard />
    </div>
  );
}
