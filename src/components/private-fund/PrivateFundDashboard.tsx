"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import FundDetailModal from "./FundDetailModal";
import FundEditModal from "./FundEditModal";

// 延迟加载非首屏 Tab
const NetValueInput = lazy(() => import("./NetValueInput"));
const MonthlyStats = lazy(() => import("./MonthlyStats"));

// ---------- Types ----------
// 注：含 / 的属性名必须加引号

export interface FundDisplayRecord {
  "日期": string;
  "金额": number;
  "份额": number;
  "类型": "分红" | "补回" | "赎回";
}

export interface FundDisplayData {
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
  "购买渠道": string;
  "records": FundDisplayRecord[];
}

export interface SummaryDisplayData {
  totalAssets: number;
  weeklyProfit: number;
  weeklyProfitRate: number;
  monthlyProfit: number;
  monthlyProfitRate: number;
  yearlyProfit: number;
  yearlyProfitRate: number;
  totalProfit: number;
  totalProfitRate: number;
  fullCaliberProfit: number;
  fullCaliberProfitRate: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    funds: FundDisplayData[];
    summary: SummaryDisplayData;
  };
  fallback?: boolean;
}

// Tab 配置
type TabKey = "overview" | "list" | "nav-input" | "monthly-stats" | "profit" | "config";

interface TabItem {
  key: TabKey;
  label: string;
}

const TAB_ITEMS: TabItem[] = [
  { key: "overview", label: "总览" },
  { key: "list", label: "基金明细" },
  { key: "nav-input", label: "净值录入" },
  { key: "monthly-stats", label: "月度统计" },
  { key: "profit", label: "收益趋势" },
  { key: "config", label: "配置" },
];

// ---------- Format Helpers ----------

function fmtAmount(n: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPercent(n: number): string {
  const pct = (n * 100).toFixed(2) + "%";
  return n > 0 ? "+" + pct : pct;
}

function profitText(value: number): string {
  if (value > 0) return `+¥${fmtAmount(value)}`;
  if (value < 0) return `-¥${fmtAmount(Math.abs(value))}`;
  return "¥0.00";
}

/**
 * 中国颜色习惯：正数红色，负数绿色
 */
function profitColor(value: number): string {
  if (value > 0) return "text-red-600";
  if (value < 0) return "text-green-600";
  return "text-gray-500";
}

/**
 * 缩略显示大数字（万/亿）
 */
function fmtCompact(n: number): string {
  if (n >= 100_000_000) {
    return (n / 100_000_000).toFixed(2) + "亿";
  }
  if (n >= 10_000) {
    return (n / 10_000).toFixed(2) + "万";
  }
  return fmtAmount(n);
}

// ---------- Component ----------

export default function PrivateFundDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [funds, setFunds] = useState<FundDisplayData[]>([]);
  const [summary, setSummary] = useState<SummaryDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFund, setSelectedFund] = useState<FundDisplayData | null>(null);
  const [editingFund, setEditingFund] = useState<FundDisplayData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintPdf = useReactToPrint({
    contentRef: printRef,
    documentTitle: "私募基金持仓明细",
    pageStyle: `
      @page { size: A4 landscape; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    `,
  });

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

  // ---------- Handlers ----------

  const handleRowClick = (fund: FundDisplayData) => {
    setSelectedFund(fund);
    setShowDetailModal(true);
  };

  const handleEditClick = (fund: FundDisplayData) => {
    setEditingFund(fund);
    setShowEditModal(true);
  };

  const handleDetailClose = () => {
    setShowDetailModal(false);
    setSelectedFund(null);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditingFund(null);
  };

  const handleEditSave = async (_data: FundDisplayData) => {
    setShowEditModal(false);
    setEditingFund(null);
    await fetchData();
  };

  // ---------- Loading / Error ----------

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

  // ---------- Summary Cards ----------

  const summaryCards = [
    { title: "总持仓市值", value: `¥${fmtAmount(s.totalAssets)}`, badge: "" },
    {
      title: "本周收益",
      value: profitText(s.weeklyProfit),
      badge: fmtPercent(s.weeklyProfitRate),
      hasColor: true,
      profit: s.weeklyProfit,
    },
    {
      title: "本月收益",
      value: profitText(s.monthlyProfit),
      badge: fmtPercent(s.monthlyProfitRate),
      hasColor: true,
      profit: s.monthlyProfit,
    },
    {
      title: "本年收益",
      value: profitText(s.yearlyProfit),
      badge: fmtPercent(s.yearlyProfitRate),
      hasColor: true,
      profit: s.yearlyProfit,
    },
    {
      title: "持仓总收益",
      value: profitText(s.totalProfit),
      badge: fmtPercent(s.totalProfitRate),
      hasColor: true,
      profit: s.totalProfit,
    },
    {
      title: "全口径收益",
      value: profitText(s.fullCaliberProfit),
      badge: fmtPercent(s.fullCaliberProfitRate),
      hasColor: true,
      profit: s.fullCaliberProfit,
    },
  ];

  // ==================== Tab Loading Fallback ====================

  const tabFallback = (
    <div className="flex items-center justify-center py-20">
      <div className="text-sm text-gray-400">加载中...</div>
    </div>
  );

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ──────── Tab 导航栏 ──────── */}
      <div className="sticky top-0 z-20 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200/80 no-print">
        <div className="flex overflow-x-auto hide-scrollbar px-2">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                activeTab === tab.key
                  ? "text-blue-600 border-blue-500"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──────── 总览 Tab ──────── */}
      {activeTab === "overview" && (
        <>
          <div ref={printRef}>
            {/* ──────── 总览卡片 2x3 ──────── */}
            <div className="px-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                {summaryCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl bg-white shadow-sm p-4"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {card.title}
                      {card.badge && !card.hasColor && (
                        <span className="ml-2 text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        card.hasColor
                          ? profitColor(card.profit!)
                          : "text-gray-900"
                      }`}
                    >
                      {card.value}
                    </div>
                    {card.hasColor && card.badge && (
                      <div
                        className={`text-[11px] mt-0.5 font-medium ${profitColor(
                          card.profit!
                        )}`}
                      >
                        {card.badge}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ──────── 基金收益明细表 ──────── */}
            <div className="px-4 pt-4">
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">
                  基金收益明细表
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 font-medium text-gray-500 min-w-[120px]">
                          基金名称
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[90px]">
                          购买日期
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[90px]">
                          购买金额
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[90px]">
                          当前金额
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[100px]">
                          本周收益
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[100px]">
                          本月收益
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[100px]">
                          本年收益
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[90px]">
                          总收益
                        </th>
                        <th className="px-3 py-3 font-medium text-gray-500 min-w-[80px]">
                          购买渠道
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {funds.map((fund) => {
                        const totalFundProfit =
                          fund["当前市值"] - fund["购买金额"];
                        const totalFundRate =
                          fund["购买金额"] > 0
                            ? totalFundProfit / fund["购买金额"]
                            : 0;
                        return (
                          <tr
                            key={fund["基金代码"]}
                            onClick={() => handleRowClick(fund)}
                            className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors"
                          >
                            <td className="sticky left-0 z-10 bg-white px-3 py-3">
                              <div className="font-medium text-gray-900 text-sm">
                                {fund["基金名称"]}
                              </div>
                              <div className="text-gray-400 text-[10px] mt-0.5">
                                {fund["基金代码"]}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-gray-500">
                              {fund["成立/购买日期"]}
                            </td>
                            <td className="px-3 py-3 text-gray-900 font-medium">
                              ¥{fmtCompact(fund["购买金额"])}
                            </td>
                            <td className="px-3 py-3 text-gray-900 font-medium">
                              ¥{fmtCompact(fund["当前市值"])}
                            </td>
                            {/* 本周收益 + 收益率 */}
                            <td className="px-3 py-3">
                              <div className={profitColor(fund["本周收益"])}>
                                {profitText(fund["本周收益"])}
                              </div>
                              <div
                                className={`text-[10px] mt-0.5 ${profitColor(
                                  fund["本周收益"]
                                )}`}
                              >
                                {fund["购买金额"] > 0
                                  ? fmtPercent(fund["本周收益"] / fund["购买金额"])
                                  : "+0.00%"}
                              </div>
                            </td>
                            {/* 本月收益 + 收益率 */}
                            <td className="px-3 py-3">
                              <div className={profitColor(fund["本月收益"])}>
                                {profitText(fund["本月收益"])}
                              </div>
                              <div
                                className={`text-[10px] mt-0.5 ${profitColor(
                                  fund["本月收益"]
                                )}`}
                              >
                                {fund["购买金额"] > 0
                                  ? fmtPercent(fund["本月收益"] / fund["购买金额"])
                                  : "+0.00%"}
                              </div>
                            </td>
                            {/* 本年收益 + 收益率 */}
                            <td className="px-3 py-3">
                              <div className={profitColor(fund["本年收益"])}>
                                {profitText(fund["本年收益"])}
                              </div>
                              <div
                                className={`text-[10px] mt-0.5 ${profitColor(
                                  fund["本年收益"]
                                )}`}
                              >
                                {fund["购买金额"] > 0
                                  ? fmtPercent(fund["本年收益"] / fund["购买金额"])
                                  : "+0.00%"}
                              </div>
                            </td>
                            {/* 总收益 + 收益率 */}
                            <td className="px-3 py-3">
                              <div className={profitColor(totalFundProfit)}>
                                {profitText(totalFundProfit)}
                              </div>
                              <div
                                className={`text-[10px] mt-0.5 ${profitColor(
                                  totalFundProfit
                                )}`}
                              >
                                {fmtPercent(totalFundRate)}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-gray-500">
                              {fund["购买渠道"] || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ──────── 底部按钮（不可打印） ──────── */}
          <div className="px-4 pt-4 flex gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="flex-1 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
            >
              🖨️ 打印
            </button>
            <button
              onClick={() => handlePrintPdf()}
              className="flex-1 h-10 rounded-xl bg-blue-500 text-white text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors"
            >
              📄 导出 PDF
            </button>
          </div>

          {/* ──────── 基金详情弹窗 ──────── */}
          {showDetailModal && selectedFund && (
            <FundDetailModal
              fund={selectedFund}
              onClose={handleDetailClose}
              onEdit={handleEditClick}
            />
          )}

          {/* ──────── 编辑弹窗 ──────── */}
          {showEditModal && editingFund && (
            <FundEditModal
              fund={editingFund}
              onClose={handleEditClose}
              onSave={handleEditSave}
            />
          )}

        </>
      )}

      {/* ──────── 基金明细 Tab ──────── */}
      {activeTab === "list" && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">
              基金明细
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 font-medium text-gray-500 min-w-[120px]">
                      基金名称
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500 min-w-[70px]">
                      代码
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500 min-w-[90px]">
                      购买金额
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500 min-w-[80px]">
                      持有份额
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500 min-w-[70px]">
                      当前净值
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500 min-w-[90px]">
                      当前市值
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-500 min-w-[80px]">
                      累计收益率
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funds.map((fund) => (
                    <tr
                      key={fund["基金代码"]}
                      onClick={() => handleRowClick(fund)}
                      className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="sticky left-0 z-10 bg-white px-3 py-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {fund["基金名称"]}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-500">
                        {fund["基金代码"]}
                      </td>
                      <td className="px-3 py-3 text-gray-900 font-medium">
                        ¥{fmtCompact(fund["购买金额"])}
                      </td>
                      <td className="px-3 py-3 text-gray-500">
                        {new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2 }).format(fund["持有份额"])}
                      </td>
                      <td className="px-3 py-3 text-gray-900 font-medium">
                        {fund["当前净值"].toFixed(4)}
                      </td>
                      <td className="px-3 py-3 text-gray-900 font-medium">
                        ¥{fmtCompact(fund["当前市值"])}
                      </td>
                      <td className={`px-3 py-3 font-semibold ${profitColor(fund["累计收益率"])}`}>
                        {fmtPercent(fund["累计收益率"])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────── 净值录入 Tab ──────── */}
      {activeTab === "nav-input" && (
        <Suspense fallback={tabFallback}>
          <NetValueInput />
        </Suspense>
      )}

      {/* ──────── 月度统计 Tab ──────── */}
      {activeTab === "monthly-stats" && (
        <Suspense fallback={tabFallback}>
          <MonthlyStats />
        </Suspense>
      )}

      {/* ──────── 收益趋势 Tab ──────── */}
      {activeTab === "profit" && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white shadow-sm p-8 text-center">
            <svg
              className="w-14 h-14 mx-auto text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <p className="text-sm text-gray-400 mb-1">收益趋势图</p>
            <p className="text-xs text-gray-300">开发中，敬请期待</p>
          </div>
        </div>
      )}

      {/* ──────── 配置 Tab ──────── */}
      {activeTab === "config" && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white shadow-sm p-8 text-center">
            <svg
              className="w-14 h-14 mx-auto text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm text-gray-400 mb-1">系统配置</p>
            <p className="text-xs text-gray-300">开发中，敬请期待</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
