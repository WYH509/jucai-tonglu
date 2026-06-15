"use client";

import type { RenovationSummary } from "@/types/renovation";

interface Props {
  summary: RenovationSummary;
}

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function PayProgressCircle({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      <svg width="72" height="72" viewBox="0 0 72 72" className="transform -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-lg font-bold text-blue-600 -mt-10">{pct}%</span>
      <span className="text-[10px] text-zinc-400 mt-1">已付款</span>
    </div>
  );
}

export default function SummaryCards({ summary }: Props) {
  const { totalSpent, totalPaid, totalPending, payProgress, thisMonthSpent, billCount } = summary;

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {/* 总花费 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <p className="text-xs text-zinc-500 mb-1">总花费</p>
        <p className="text-xl font-bold text-red-600">{fmt(totalSpent)}</p>
        <p className="text-[10px] text-zinc-400 mt-1">{billCount} 笔</p>
      </div>

      {/* 本月支出 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <p className="text-xs text-zinc-500 mb-1">本月支出</p>
        <p className="text-xl font-bold text-zinc-900">{fmt(thisMonthSpent)}</p>
        <p className="text-[10px] text-zinc-400 mt-1">当前月份</p>
      </div>

      {/* 已付款 / 待付款 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <p className="text-xs text-zinc-500 mb-1">付款状态</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-600 font-medium">已付款</span>
              <span className="font-semibold text-green-600">{fmt(totalPaid)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-600 font-medium">待付款</span>
              <span className="font-semibold text-amber-600">{fmt(totalPending)}</span>
            </div>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(payProgress * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 付款进度圆环 */}
      <PayProgressCircle progress={payProgress} />
    </div>
  );
}
