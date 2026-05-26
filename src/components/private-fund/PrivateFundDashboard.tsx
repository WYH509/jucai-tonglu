"use client";

import { useEffect, useState } from "react";

// ---------- Types ----------

interface FundRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

interface OverviewData {
  totalAssets: number;
  totalInvestment: number;
  weeklyProfit: number;
  yearlyProfit: number;
}

interface StatsCard {
  todayNav: number;
  lastWeekNav: number;
  monthlyProfit: number;
  yearlyProfit: number;
}

// ---------- Helper ----------

function fmt(n: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// ---------- Component ----------

export default function PrivateFundDashboard() {
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [fundName, setFundName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---------- Fetch funds ----------

  const fetchFunds = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/private-fund");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "获取数据失败");
      setFunds(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  // ---------- Compute metrics ----------

  const overview: OverviewData = funds.reduce(
    (acc, rec) => {
      const f = rec.fields;
      const amount = Number(f["购买金额"]) || 0;
      const weeks = Number(f["本周收益"]) || 0;
      const years = Number(f["本年收益"]) || 0;
      const shares = Number(f["持仓份额"]) || 0;
      const nav = Number(f["当前净值"]) || 0;
      return {
        totalAssets: acc.totalAssets + shares * nav,
        totalInvestment: acc.totalInvestment + amount,
        weeklyProfit: acc.weeklyProfit + weeks,
        yearlyProfit: acc.yearlyProfit + years,
      };
    },
    { totalAssets: 0, totalInvestment: 0, weeklyProfit: 0, yearlyProfit: 0 }
  );

  const stats: StatsCard = funds.reduce(
    (acc, rec) => {
      const f = rec.fields;
      return {
        todayNav: acc.todayNav + (Number(f["当前净值"]) || 0),
        lastWeekNav: acc.lastWeekNav + (Number(f["上周净值"]) || 0),
        monthlyProfit: acc.monthlyProfit + (Number(f["本月收益"]) || 0),
        yearlyProfit: acc.yearlyProfit + (Number(f["本年收益"]) || 0),
      };
    },
    { todayNav: 0, lastWeekNav: 0, monthlyProfit: 0, yearlyProfit: 0 }
  );

  // ---------- Submit new fund ----------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundName || !purchaseDate || !purchaseAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/private-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundName,
          purchaseDate: new Date(purchaseDate).getTime(),
          purchaseAmount: Number(purchaseAmount),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "提交失败");
      setFundName("");
      setPurchaseDate("");
      setPurchaseAmount("");
      setShowForm(false);
      await fetchFunds();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Profit Trend (text-based) ----------

  const profitTrendText = (() => {
    if (overview.yearlyProfit > 0) return "📈 本年总体盈利";
    if (overview.yearlyProfit < 0) return "📉 本年总体亏损";
    return "➖ 本年盈亏持平";
  })();

  const navDiff = stats.todayNav - stats.lastWeekNav;
  const navDiffText =
    navDiff > 0
      ? `📈 较上周上涨 ${fmtCurrency(navDiff)}`
      : navDiff < 0
      ? `📉 较上周下跌 ${fmtCurrency(Math.abs(navDiff))}`
      : "➖ 较上周持平";

  // ---------- Render ----------

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              私募基金看板
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              数据来源：飞书 Bitable
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {showForm ? "取消录入" : "录入新基金"}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Add fund form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              录入新基金
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  基金名称
                </label>
                <input
                  type="text"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                  placeholder="如：XX私募基金"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  购买日期
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  购买金额（元）
                </label>
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                  placeholder="如：100000"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "提交中..." : "确认录入"}
            </button>
          </form>
        )}

        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="总资产"
            value={`¥${fmtCurrency(overview.totalAssets)}`}
            color="blue"
          />
          <OverviewCard
            title="总投入"
            value={`¥${fmtCurrency(overview.totalInvestment)}`}
            color="zinc"
          />
          <OverviewCard
            title="本周收益"
            value={`¥${fmtCurrency(overview.weeklyProfit)}`}
            color={overview.weeklyProfit >= 0 ? "green" : "red"}
          />
          <OverviewCard
            title="本年收益"
            value={`¥${fmtCurrency(overview.yearlyProfit)}`}
            color={overview.yearlyProfit >= 0 ? "green" : "red"}
          />
        </div>

        {/* Stats data cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCardItem
            title="今日净值 vs 上周净值"
            value={navDiffText}
          />
          <StatsCardItem
            title="本月收益"
            value={
              stats.monthlyProfit >= 0
                ? `+¥${fmtCurrency(stats.monthlyProfit)}`
                : `-¥${fmtCurrency(Math.abs(stats.monthlyProfit))}`
            }
            positive={stats.monthlyProfit >= 0}
          />
          <StatsCardItem
            title="本年收益"
            value={
              stats.yearlyProfit >= 0
                ? `+¥${fmtCurrency(stats.yearlyProfit)}`
                : `-¥${fmtCurrency(Math.abs(stats.yearlyProfit))}`
            }
            positive={stats.yearlyProfit >= 0}
          />
        </div>

        {/* Profit Trend */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            收益趋势
          </h3>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {profitTrendText}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <span>本周收益：¥{fmtCurrency(overview.weeklyProfit)}</span>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span>本年收益：¥{fmtCurrency(overview.yearlyProfit)}</span>
          </div>
        </div>

        {/* Fund list */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              基金列表
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <svg
                className="mr-2 h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              加载中...
            </div>
          ) : funds.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              暂无基金数据。点击右上角「录入新基金」开始录入。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    <th className="px-5 py-3 font-medium">基金名称</th>
                    <th className="px-5 py-3 font-medium">当前净值</th>
                    <th className="px-5 py-3 font-medium">持仓份额</th>
                    <th className="px-5 py-3 font-medium">累计收益</th>
                    <th className="px-5 py-3 font-medium">本周收益</th>
                  </tr>
                </thead>
                <tbody>
                  {funds.map((rec) => {
                    const f = rec.fields;
                    const nav = Number(f["当前净值"]) || 0;
                    const shares = Number(f["持仓份额"]) || 0;
                    const cumReturn = Number(f["累计收益"]) || 0;
                    const weekProfit = Number(f["本周收益"]) || 0;
                    return (
                      <tr
                        key={rec.record_id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-750"
                      >
                        <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                          {String(f["基金名称"] || "-")}
                        </td>
                        <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                          {nav > 0 ? fmt(nav) : "-"}
                        </td>
                        <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                          {shares > 0 ? fmt(shares) : "-"}
                        </td>
                        <td
                          className={`px-5 py-3 font-medium ${
                            cumReturn >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {cumReturn >= 0
                            ? `+${fmtCurrency(cumReturn)}`
                            : `-${fmtCurrency(Math.abs(cumReturn))}`}
                        </td>
                        <td
                          className={`px-5 py-3 ${
                            weekProfit >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {weekProfit >= 0
                            ? `+${fmtCurrency(weekProfit)}`
                            : `-${fmtCurrency(Math.abs(weekProfit))}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pb-8 text-center text-xs text-zinc-400">
          数据来源：飞书多维表格 · {funds.length} 条记录
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function OverviewCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "blue" | "zinc" | "green" | "red";
}) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
    zinc:
      "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800",
    green:
      "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    red: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  };

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${colorMap[color] || colorMap.zinc}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function StatsCardItem({
  title,
  value,
  positive,
}: {
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <p
        className={`mt-2 text-lg font-bold ${
          positive === undefined
            ? "text-zinc-900 dark:text-zinc-50"
            : positive
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
