"use client";

import type {
  FundDisplayData,
  FundDisplayRecord,
} from "./PrivateFundDashboard";

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

/** 中国颜色：正红负绿 */
function profitColor(value: number): string {
  if (value > 0) return "text-red-600";
  if (value < 0) return "text-green-600";
  return "text-gray-500";
}

// ---------- Record helpers ----------

const recordTypeLabels: Record<FundDisplayRecord["类型"], string> = {
  "分红": "分红记录",
  "补回": "补回记录",
  "赎回": "赎回记录",
};

const recordTypeColors: Record<FundDisplayRecord["类型"], string> = {
  "分红": "text-amber-600 bg-amber-50",
  "补回": "text-blue-600 bg-blue-50",
  "赎回": "text-purple-600 bg-purple-50",
};

// ---------- Props ----------

interface Props {
  fund: FundDisplayData;
  onClose: () => void;
  onEdit: (fund: FundDisplayData) => void;
}

// ---------- Component ----------

export default function FundDetailModal({ fund, onClose, onEdit }: Props) {
  const totalFundProfit = fund["当前市值"] - fund["购买金额"];
  const totalFundRate =
    fund["购买金额"] > 0 ? totalFundProfit / fund["购买金额"] : 0;

  // Group records by type
  const recordsByType: Record<string, FundDisplayRecord[]> = {};
  for (const r of fund.records || []) {
    if (!recordsByType[r["类型"]]) recordsByType[r["类型"]] = [];
    recordsByType[r["类型"]].push(r);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-xl">
        {/* Close handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {fund["基金名称"]}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {fund["基金代码"]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ──────── 基本信息 ──────── */}
          <section>
            <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
              基本信息
            </h3>
            <div className="rounded-2xl bg-gray-50 p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <InfoItem label="购买日期" value={fund["成立/购买日期"]} />
              <InfoItem
                label="购买金额"
                value={`¥${fmtAmount(fund["购买金额"])}`}
              />
              <InfoItem
                label="持有份额"
                value={`${fmtAmount(fund["持有份额"])} 份`}
              />
              <InfoItem
                label="当前净值"
                value={fmtAmount(fund["当前净值"])}
              />
              <InfoItem
                label="当前市值"
                value={`¥${fmtAmount(fund["当前市值"])}`}
              />
              <InfoItem
                label="购买渠道"
                value={fund["购买渠道"] || "—"}
              />
              {fund["备注"] && (
                <div className="col-span-2">
                  <span className="text-gray-400 text-xs">备注</span>
                  <p className="text-gray-700 mt-0.5">{fund["备注"]}</p>
                </div>
              )}
            </div>
          </section>

          {/* ──────── 收益概览 ──────── */}
          <section>
            <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
              收益概览
            </h3>
            <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">累计收益率</span>
                <span
                  className={`text-lg font-bold ${profitColor(
                    totalFundProfit
                  )}`}
                >
                  {fmtPercent(fund["累计收益率"])}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">持仓总收益</span>
                <span
                  className={`text-base font-semibold ${profitColor(
                    totalFundProfit
                  )}`}
                >
                  {profitText(totalFundProfit)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">本周</span>
                  <span className={profitColor(fund["本周收益"])}>
                    {profitText(fund["本周收益"])}
                    <span className="text-[10px] ml-1">
                      {fund["购买金额"] > 0
                        ? fmtPercent(fund["本周收益"] / fund["购买金额"])
                        : "+0.00%"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">本月</span>
                  <span className={profitColor(fund["本月收益"])}>
                    {profitText(fund["本月收益"])}
                    <span className="text-[10px] ml-1">
                      {fund["购买金额"] > 0
                        ? fmtPercent(fund["本月收益"] / fund["购买金额"])
                        : "+0.00%"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">本年</span>
                  <span className={profitColor(fund["本年收益"])}>
                    {profitText(fund["本年收益"])}
                    <span className="text-[10px] ml-1">
                      {fund["购买金额"] > 0
                        ? fmtPercent(fund["本年收益"] / fund["购买金额"])
                        : "+0.00%"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ──────── 交易记录 ──────── */}
          {(["分红", "补回", "赎回"] as const).map((type) => {
            const records = recordsByType[type] || [];
            return (
              <section key={type}>
                <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                  {recordTypeLabels[type]}
                </h3>
                {records.length === 0 ? (
                  <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-400">
                    暂无{recordTypeLabels[type]}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-50 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-2.5 font-medium text-gray-600">
                            日期
                          </th>
                          <th className="px-3 py-2.5 font-medium text-gray-600">
                            金额
                          </th>
                          <th className="px-3 py-2.5 font-medium text-gray-600">
                            份额
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-3 py-2.5 text-gray-700">
                              {r["日期"]}
                            </td>
                            <td
                              className={`px-3 py-2.5 font-medium ${profitColor(
                                r["金额"]
                              )}`}
                            >
                              {profitText(r["金额"])}
                            </td>
                            <td className="px-3 py-2.5 text-gray-700">
                              {fmtAmount(r["份额"])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}

          {/* ──────── 编辑按钮 ──────── */}
          <div className="pt-2 pb-4">
            <button
              onClick={() => onEdit(fund)}
              className="w-full h-11 rounded-xl bg-blue-500 text-white text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors"
            >
              编辑基金信息
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-xs">{label}</span>
      <p className="text-gray-800 font-medium mt-0.5">{value}</p>
    </div>
  );
}
