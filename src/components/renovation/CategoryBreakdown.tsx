"use client";

interface Props {
  breakdown: Record<string, number>;
  totalSpent: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  "硬装": "🔨",
  "软装": "🛋️",
  "家电": "📺",
  "工程": "🔧",
  "设计费": "📐",
  "其他": "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  "硬装": "bg-blue-500",
  "软装": "bg-emerald-500",
  "家电": "bg-amber-500",
  "工程": "bg-purple-500",
  "设计费": "bg-pink-500",
  "其他": "bg-zinc-500",
};

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function CategoryBreakdown({ breakdown, totalSpent }: Props) {
  const entries = Object.entries(breakdown).filter(([, v]) => v > 0);

  if (entries.length === 0) {
    return (
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-zinc-700 mb-3">分类统计</h3>
        <p className="text-xs text-zinc-400">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-zinc-700 mb-3">分类统计</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {entries.map(([cat, amount]) => {
          const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
          return (
            <div
              key={cat}
              className="flex-shrink-0 w-28 bg-white rounded-2xl p-3 shadow-sm border border-zinc-100"
            >
              <div className="flex items-center gap-1 mb-1">
                <span>{CATEGORY_ICONS[cat] || "📦"}</span>
                <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat] || "bg-zinc-400"}`} />
              </div>
              <p className="text-sm font-bold text-zinc-900">{fmt(amount)}</p>
              <p className="text-[10px] text-zinc-400">{cat} · {pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
