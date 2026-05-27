"use client";

import { useEffect, useState } from "react";

// ---------- Types ----------

interface FundData {
  "基金名称": string;
  "基金代码": string;
  "成立/购买日期": string;
  "购买金额": number;
  "持有份额": number;
  "当前净值": number;
  "当前市值": number;
  "累计收益率": number;
  "备注": string | null;
  "本周收益": number;
  "本月收益": number;
  "本年收益": number;
}

interface SummaryData {
  totalInvestment: number;
  totalAssets: number;
  totalMonthlyProfit: number;
  totalYearlyProfit: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    funds: FundData[];
    summary: SummaryData;
  };
}

// ---------- Helpers ----------

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

function fmtPercent(n: number): string {
  return (n * 100).toFixed(2) + "%";
}

function profitColorClass(value: number): string {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-500";
  return "text-gray-500";
}

function profitText(value: number): string {
  if (value > 0) return `+¥${fmtCurrency(value)}`;
  if (value < 0) return `-¥${fmtCurrency(Math.abs(value))}`;
  return "¥0.00";
}

type TabKey = "overview" | "list" | "profit";

const TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "概览" },
  { key: "list", label: "基金列表" },
  { key: "profit", label: "收益趋势" },
];

// ---------- Component ----------

export default function PrivateFundDashboard() {
  const [funds, setFunds] = useState<FundData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/private-fund");
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error("获取数据失败");
      setFunds(json.data.funds);
      setSummary(json.data.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Computed ----------

  const totalTodayNav = funds.reduce((s, f) => s + f.当前净值, 0);

  // ---------- Loading State ----------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="rounded-2xl bg-white shadow-sm p-6 text-center max-w-sm w-full">
          <svg
            className="w-12 h-12 mx-auto text-red-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const s = summary!;

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* iOS Tab Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex justify-around">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ──────── 概览 Tab ──────── */}
      {activeTab === "overview" && (
        <div className="px-4 pt-4 space-y-4">
          {/* 4 个汇总卡片 */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              title="总资产"
              value={`¥${fmtCurrency(s.totalAssets)}`}
              badge="当前市值"
            />
            <SummaryCard
              title="总投入"
              value={`¥${fmtCurrency(s.totalInvestment)}`}
              badge="累计投入"
            />
            <SummaryCard
              title="本月收益"
              value={profitText(s.totalMonthlyProfit)}
              badge="5月"
              positive={s.totalMonthlyProfit >= 0}
            />
            <SummaryCard
              title="本年收益"
              value={profitText(s.totalYearlyProfit)}
              badge="1-5月"
              positive={s.totalYearlyProfit >= 0}
            />
          </div>

          {/* 总盈亏比率 */}
          <div className="rounded-2xl bg-white shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">累计总收益率</span>
              <span
                className={`text-lg font-semibold ${
                  s.totalYearlyProfit >= 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {s.totalYearlyProfit >= 0 ? "+" : ""}
                {(
                  (s.totalYearlyProfit / s.totalInvestment) *
                  100
                ).toFixed(2)}
                %
              </span>
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  s.totalYearlyProfit >= 0
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(
                    Math.abs(
                      (s.totalYearlyProfit / s.totalInvestment) * 100
                    ),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* 净值汇总 */}
          <div className="rounded-2xl bg-white shadow-sm p-4">
            <div className="text-sm text-gray-500 mb-2">基金净值汇总</div>
            <div className="space-y-3">
              {funds.map((fund) => (
                <div
                  key={fund.基金代码}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {fund.基金名称}
                    </div>
                    <div className="text-xs text-gray-400">
                      {fund.基金代码} · 持有{fmt(fund.持有份额)}份
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-semibold text-gray-900">
                      {fmt(fund.当前净值)}
                    </div>
                    <div
                      className={`text-xs ${profitColorClass(
                        fund.累计收益率
                      )}`}
                    >
                      {fmtPercent(fund.累计收益率)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────── 基金列表 Tab ──────── */}
      {activeTab === "list" && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-3 py-3 font-medium text-gray-500">
                      名称
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500">
                      净值
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500">
                      份额
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500">
                      累计收益
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500">
                      本月收益
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500">
                      本年收益
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funds.map((fund) => (
                    <tr
                      key={fund.基金代码}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900 whitespace-nowrap">
                          {fund.基金名称}
                        </div>
                        <div className="text-gray-400">{fund.基金代码}</div>
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {fmt(fund.当前净值)}
                      </td>
                      <td className="px-3 py-3 text-gray-500">
                        {fmt(fund.持有份额)}
                      </td>
                      <td
                        className={`px-3 py-3 font-medium ${profitColorClass(
                          fund.累计收益率
                        )}`}
                      >
                        <div>{fmtPercent(fund.累计收益率)}</div>
                        <div className="font-normal text-[10px]">
                          市值 ¥{fmtCurrency(fund.当前市值)}
                        </div>
                      </td>
                      <td
                        className={`px-3 py-3 ${profitColorClass(
                          fund.本月收益
                        )}`}
                      >
                        {profitText(fund.本月收益)}
                      </td>
                      <td
                        className={`px-3 py-3 ${profitColorClass(
                          fund.本年收益
                        )}`}
                      >
                        {profitText(fund.本年收益)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────── 收益趋势 Tab ──────── */}
      {activeTab === "profit" && (
        <div className="px-4 pt-4 space-y-4">
          {/* 总盈亏 */}
          <div className="rounded-2xl bg-white shadow-sm p-4">
            <div className="text-sm text-gray-500 mb-1">当前总盈亏</div>
            <div
              className={`text-2xl font-bold ${
                s.totalYearlyProfit >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {s.totalYearlyProfit >= 0 ? "+" : ""}
              ¥{fmtCurrency(Math.abs(s.totalYearlyProfit))}
            </div>
          </div>

          {/* 月度收益柱状图 */}
          <div className="rounded-2xl bg-white shadow-sm p-4">
            <div className="text-sm font-medium text-gray-900 mb-4">
              每月收益明细（2026年）
            </div>
            <BarChart funds={funds} />
          </div>

          {/* 各基金月度收益表格 */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-100">
              各基金月度收益
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-3 py-2.5 font-medium text-gray-500">
                      基金
                    </th>
                    <th className="px-3 py-2.5 font-medium text-gray-500">
                      1月
                    </th>
                    <th className="px-3 py-2.5 font-medium text-gray-500">
                      2月
                    </th>
                    <th className="px-3 py-2.5 font-medium text-gray-500">
                      3月
                    </th>
                    <th className="px-3 py-2.5 font-medium text-gray-500">
                      4月
                    </th>
                    <th className="px-3 py-2.5 font-medium text-gray-500">
                      5月
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funds.map((fund) => {
                    const months = ["1月", "2月", "3月", "4月", "5月"];
                    // 用 fund.基金名称 从月度数据查
                    // 暂时用 fund.本年收益 反算 - 需要更好的方式
                    // 直接从原始数据计算
                    return (
                      <tr
                        key={fund.基金代码}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                          {fund.基金名称}
                        </td>
                        {months.map((m) => {
                          // We stored the yearly data, but we need per-month
                          // Use the fund.本月收益 for May, others approximated by proportion
                          const profit = getMonthProfitForFund(
                            fund.基金名称,
                            m
                          );
                          return (
                            <td
                              key={m}
                              className={`px-3 py-2.5 ${profitColorClass(
                                profit
                              )}`}
                            >
                              {profitText(profit)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function SummaryCard({
  title,
  value,
  badge,
  positive,
}: {
  title: string;
  value: string;
  badge?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{title}</span>
        {badge && (
          <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {badge}
          </span>
        )}
      </div>
      <div
        className={`text-lg font-bold ${
          positive === undefined
            ? "text-gray-900"
            : positive
            ? "text-green-600"
            : "text-red-500"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** 收益柱状图 */
function BarChart({ funds }: { funds: FundData[] }) {
  const months = ["1月", "2月", "3月", "4月", "5月"];

  // 计算每月总收益
  const monthlyTotals = months.map((m) => {
    let sum = 0;
    for (const f of funds) {
      sum += getMonthProfitForFund(f.基金名称, m);
    }
    return sum;
  });

  const maxAbs = Math.max(...monthlyTotals.map(Math.abs), 1);

  return (
    <div className="space-y-3">
      {/* Bars */}
      <div className="flex items-end gap-2 h-40">
        {monthlyTotals.map((val, i) => {
          const heightPct = Math.max((Math.abs(val) / maxAbs) * 100, 4);
          const isPositive = val >= 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
              <div className="text-[10px] font-medium text-gray-500 mb-1">
                {val >= 0 ? "+" : ""}
                {fmtCurrency(val)}
              </div>
              <div
                className={`w-full rounded-t ${
                  isPositive ? "bg-green-400" : "bg-red-400"
                }`}
                style={{ height: `${heightPct}%`, maxHeight: "120px" }}
              />
              <div className="text-[10px] text-gray-400 mt-1">
                {months[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Data helpers ----------

// Lazy-load the monthly profit data for client-side use
function getMonthProfitForFund(name: string, month: string): number {
  // Inline the monthly data to avoid async import complexity
  const data: Record<string, Record<string, number>> = {
    "衍盛指数增强1号": {
      "1月": 3624820.23,
      "2月": 1934489.55,
      "3月": -3418224.25,
      "4月": 3211628.28,
      "5月": 507099.2,
    },
    "幻方量化300指数专享16号11期": {
      "1月": 198159.29,
      "2月": 233845.89,
      "3月": -241557.07,
      "4月": 446710.22,
      "5月": 182557.61,
    },
    "量锐指数增强1000一号A": {
      "1月": 455652.77,
      "2月": 296138.16,
      "3月": -486254.52,
      "4月": 496856.7,
      "5月": 253488.48,
    },
    "量锐指增22号三期": {
      "1月": 126553,
      "2月": 92617,
      "3月": -129078,
      "4月": 141905,
      "5月": 70296,
    },
    "宽德鸿图7号一期": {
      "1月": 444074.87,
      "2月": 354268.93,
      "3月": -612538.41,
      "4月": 421778.22,
      "5月": 169082.9,
    },
    "明汯股票精选招享3号": {
      "1月": 459500,
      "2月": 321500,
      "3月": -526000,
      "4月": 499500,
      "5月": 245000,
    },
    "招商财富-丰元联动108号": {
      "5月": 260527.27,
    },
  };
  return data[name]?.[month] || 0;
}
