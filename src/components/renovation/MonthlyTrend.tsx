"use client";

import { useState } from "react";
import type { MonthlyTrendItem } from "@/types/renovation";

interface Props {
  data: MonthlyTrendItem[];
}

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function MonthlyTrend({ data }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const barHeight = 120; // px
  const barWidth = 36;

  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-zinc-700 mb-3">月度趋势</h3>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <svg
          width={data.length * (barWidth + 12) + 20}
          height={barHeight + 40}
          viewBox={`0 0 ${data.length * (barWidth + 12) + 20} ${barHeight + 40}`}
          className="w-full"
          style={{ maxWidth: "100%", height: "auto" }}
        >
          {data.map((item, i) => {
            const x = 10 + i * (barWidth + 12);
            const h = (item.total / maxVal) * barHeight;
            const y = barHeight - h + 20;
            const isHover = hoverIdx === i;

            return (
              <g key={item.month}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={4}
                  fill={isHover ? "#2563eb" : "#93c5fd"}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
                {/* 金额 tooltip */}
                {isHover && (
                  <>
                    <rect
                      x={x - 10}
                      y={y - 22}
                      width={barWidth + 20}
                      height={18}
                      rx={4}
                      fill="#1e293b"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 10}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                    >
                      {fmt(item.total)}
                    </text>
                  </>
                )}
                {/* 月份标签 */}
                <text
                  x={x + barWidth / 2}
                  y={barHeight + 34}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize="9"
                >
                  {item.month.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
