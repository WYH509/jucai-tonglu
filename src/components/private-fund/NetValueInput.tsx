"use client";

import { useCallback, useEffect, useState } from "react";

// ---------- Types ----------

interface NavRecord {
  id?: string;
  date: string;
  values: Record<string, number>;
}

interface FundNavState {
  name: string;
  value: string; // 输入框文本
  lastNav: number | null; // 上次记录的净值
}

// ---------- Helpers ----------

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmt(n: number): string {
  return n.toFixed(4);
}

// ---------- Component ----------

export default function NetValueInput() {
  const [date, setDate] = useState(todayStr());
  const [funds, setFunds] = useState<FundNavState[]>([]);
  const [fundNames, setFundNames] = useState<string[]>([]);
  const [lastRecordDate, setLastRecordDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ---------- 加载数据 ----------

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      // 并发获取基金列表和上次净值记录
      const [navRes] = await Promise.all([
        fetch("/api/private-fund/nav?latest=true"),
      ]);

      const navJson = await navRes.json();

      // 获取基金名称列表
      const names: string[] = navJson.data?.fundNames || [];
      setFundNames(names);

      const latestRecord: NavRecord | null =
        navJson.data?.record || null;

      if (latestRecord) {
        setLastRecordDate(latestRecord.date);
      }

      // 初始化每个基金的输入状态
      const fundStates: FundNavState[] = names.map((name) => ({
        name,
        value: "",
        lastNav: latestRecord?.values?.[name] ?? null,
      }));
      setFunds(fundStates);
    } catch (err) {
      console.error("加载数据失败:", err);
      setMessage({ type: "error", text: "加载数据失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------- 输入更新 ----------

  const handleValueChange = (name: string, newValue: string) => {
    // 只允许数字和小数点
    if (newValue !== "" && !/^\d*\.?\d*$/.test(newValue)) return;
    setFunds((prev) =>
      prev.map((f) => (f.name === name ? { ...f, value: newValue } : f))
    );
  };

  // ---------- 【上次净值】按钮 ----------

  const handleFillLastNav = () => {
    setFunds((prev) =>
      prev.map((f) => ({
        ...f,
        value: f.lastNav !== null ? fmt(f.lastNav) : "",
      }))
    );
    if (lastRecordDate) {
      setDate(lastRecordDate);
    }
    setMessage({ type: "success", text: "已回填上次净值" });
    setTimeout(() => setMessage(null), 2000);
  };

  // ---------- 【保存净值】按钮 ----------

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // 构建 values 对象：填写的用新值，未填写的传空字符串让后端处理
      const values: Record<string, number | ""> = {};
      for (const f of funds) {
        values[f.name] = f.value !== "" ? Number(f.value) : "";
      }

      const res = await fetch("/api/private-fund/nav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, values }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "保存失败");
      }

      // 保存成功后，重新加载以更新 lastNav
      const savedRecord: NavRecord = json.data.record;
      setFunds((prev) =>
        prev.map((f) => ({
          ...f,
          value: "", // 清空输入框
          lastNav: savedRecord.values[f.name] ?? f.lastNav,
        }))
      );
      setLastRecordDate(savedRecord.date);
      setMessage({ type: "success", text: "净值已保存" });
      setTimeout(() => setMessage(null), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "保存失败";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  // ---------- 渲染 ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4 pb-8">
      {/* 日期选择器 - iOS 风格 */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <label className="text-xs text-gray-500 mb-2 block">日期</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none outline-none appearance-none
                     [color-scheme:light]
                     focus:outline-none"
        />
      </div>

      {/* 提示信息 */}
      {message && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium text-center ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 净值录入列表 */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-900">
            基金净值录入
          </span>
          {lastRecordDate && (
            <span className="text-xs text-gray-400 ml-2">
              上次记录: {lastRecordDate}
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {funds.map((fund) => (
            <div
              key={fund.name}
              className="flex items-center px-4 py-3 gap-3"
            >
              {/* 基金名称 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {fund.name}
                </div>
                {fund.lastNav !== null && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    上次: {fmt(fund.lastNav)}
                  </div>
                )}
              </div>

              {/* 净值输入框 */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="输入净值"
                  value={fund.value}
                  onChange={(e) =>
                    handleValueChange(fund.name, e.target.value)
                  }
                  className="w-28 text-right text-sm font-semibold text-gray-900 bg-gray-50 rounded-lg px-3 py-2
                             border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                             outline-none transition-colors placeholder:text-gray-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleFillLastNav}
          disabled={!lastRecordDate}
          className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all ${
            lastRecordDate
              ? "bg-gray-100 text-gray-700 active:bg-gray-200"
              : "bg-gray-50 text-gray-300 cursor-not-allowed"
          }`}
        >
          上次净值
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 rounded-xl py-3 text-sm font-medium text-white transition-all ${
            saving
              ? "bg-blue-300"
              : "bg-blue-500 active:bg-blue-600 shadow-sm"
          }`}
        >
          {saving ? "保存中..." : "保存净值"}
        </button>
      </div>
    </div>
  );
}
