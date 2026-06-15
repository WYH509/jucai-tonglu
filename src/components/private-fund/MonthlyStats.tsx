"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------- Types ----------

interface FundInfo {
  "基金名称": string;
  "基金代码": string;
  "购买金额": number;
}

interface MonthlyStatsData {
  funds: FundInfo[];
  rates: Record<string, Record<string, number>>; // { fundName: { "1月": rate, ... } }
  months: string[];
  profitData: Record<string, Record<string, number>>; // { fundName: { "1月": profit, ... } }
  year: string;
}

// ---------- Helpers ----------

function fmtPercent(p: number): string {
  return (p * 100).toFixed(2) + "%";
}

function fmtCurrency(n: number): string {
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat("zh-CN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return n >= 0 ? formatted : `-${formatted}`;
}

function rateColorClass(value: number | undefined): string {
  if (value === undefined || value === null) return "text-gray-300";
  // 中国习惯：正数红色，负数绿色
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-green-600";
  return "text-gray-400"; // 0
}

function profitColorClass(value: number | undefined): string {
  if (value === undefined || value === null) return "text-gray-300";
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-green-600";
  return "text-gray-400";
}

function bgClass(value: number | undefined): string {
  if (value === undefined || value === null) return "";
  if (value > 0) return "bg-red-50/80";
  if (value < 0) return "bg-green-50/80";
  return "bg-gray-50";
}

// ---------- Component ----------

export default function MonthlyStats() {
  const [data, setData] = useState<MonthlyStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState("2026");
  const [showProfit, setShowProfit] = useState(false); // 切换显示金额还是收益率
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `/api/private-fund/monthly-stats?year=${year}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "获取数据失败");
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- 年份 ----------

  const years = ["2025", "2026", "2027"];

  // ---------- 打印 / PDF ----------

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // 简单做法：调用打印，用户可选择保存为 PDF
    window.print();
  };

  // ---------- 渲染 ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-red-50 px-4 py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { funds, rates, months, profitData } = data;

  return (
    <div className="px-4 pt-4 space-y-4 pb-8" ref={tableRef}>
      {/* 年份选择器 - iOS 风格 */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <label className="text-xs text-gray-500 mb-2 block">选择年份</label>
        <div className="flex gap-2">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                year === y
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 active:bg-gray-200"
              }`}
            >
              {y}年
            </button>
          ))}
        </div>
      </div>

      {/* 显示模式切换 */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowProfit(!showProfit)}
          className="text-xs text-blue-500 bg-blue-50 rounded-full px-3 py-1.5 font-medium
                     active:bg-blue-100 transition-colors"
        >
          {showProfit ? "切换为收益率" : "切换为收益金额"}
        </button>
      </div>

      {/* 月度统计表格 */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            {year}年 月度{showProfit ? "收益金额" : "收益率"}
          </span>
          <span className="text-[10px] text-gray-400">
            {showProfit ? "单位：元" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 font-medium text-gray-500 min-w-[140px]">
                  基金名称
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="px-3 py-2.5 font-medium text-gray-500 text-center min-w-[90px]"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funds.map((fund) => {
                const fundRates = rates[fund["基金名称"]] || {};
                const fundProfits = profitData[fund["基金名称"]] || {};

                return (
                  <tr
                    key={fund["基金代码"]}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 font-medium text-gray-900 whitespace-nowrap text-sm">
                      {fund["基金名称"]}
                    </td>
                    {months.map((m) => {
                      if (showProfit) {
                        const profit = fundProfits[m];
                        return (
                          <td
                            key={m}
                            className={`px-3 py-3 text-center ${profitColorClass(
                              profit
                            )} ${bgClass(profit)}`}
                          >
                            {profit !== undefined ? (
                              <span className="font-semibold">
                                {fmtCurrency(profit)}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      }

                      const rate = fundRates[m];
                      return (
                        <td
                          key={m}
                          className={`px-3 py-3 text-center ${rateColorClass(
                            rate
                          )} ${bgClass(rate)}`}
                        >
                          {rate !== undefined ? (
                            <span className="font-semibold">
                              {fmtPercent(rate)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
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

      {/* 底部操作按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handlePrint}
          className="flex-1 rounded-xl py-3 text-sm font-medium bg-gray-100 text-gray-700
                     active:bg-gray-200 transition-all"
        >
          打印
        </button>
        <button
          onClick={handleExportPDF}
          className="flex-1 rounded-xl py-3 text-sm font-medium bg-blue-500 text-white shadow-sm
                     active:bg-blue-600 transition-all"
        >
          导出 PDF
        </button>
      </div>
    </div>
  );
}
