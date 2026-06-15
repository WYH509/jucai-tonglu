"use client";

import { useState, useEffect, useCallback } from "react";
import { listRecords, createRecord } from "@/lib/feishu";

// ── Types ──────────────────────────────────────────────────────────────
type Category = "硬装" | "软装" | "家电" | "其他";
type Status = "进行中" | "已完工" | "待验收";

interface RenovationItem {
  id: string;
  name: string;
  category: Category;
  amount: number;
  date: string;
  notes: string;
  status: Status;
}

interface FormData {
  name: string;
  category: Category;
  amount: string;
  date: string;
  notes: string;
  status: Status;
}

// ── Constants ──────────────────────────────────────────────────────────
const CATEGORIES: Category[] = ["硬装", "软装", "家电", "其他"];
const STATUSES: Status[] = ["进行中", "已完工", "待验收"];

const CATEGORY_COLORS: Record<Category, string> = {
  硬装: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  软装: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  家电: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  其他: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

const STATUS_COLORS: Record<Status, string> = {
  进行中: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  已完工: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  待验收: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

// Feishu Bitable 配置（替换为实际值）
const FEISHU_CONFIG = {
  appToken: process.env.NEXT_PUBLIC_FEISHU_RENOVATION_APP_TOKEN || "",
  tableId: process.env.NEXT_PUBLIC_FEISHU_RENOVATION_TABLE_ID || "",
};

// ── Format Helpers ─────────────────────────────────────────────────────
function fmt(n: number): string {
  return n.toLocaleString("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 0 });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Component ──────────────────────────────────────────────────────────
export default function RenovationTracker() {
  const [items, setItems] = useState<RenovationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    category: "硬装",
    amount: "",
    date: todayStr(),
    notes: "",
    status: "进行中",
  });

  // ── Fetch data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (FEISHU_CONFIG.appToken && FEISHU_CONFIG.tableId) {
        const data = await listRecords(FEISHU_CONFIG.appToken, FEISHU_CONFIG.tableId, 100);
        const records: RenovationItem[] = (data.data?.items || []).map((r: any) => ({
          id: r.record_id,
          name: r.fields?.项目名称 || "",
          category: (r.fields?.分类 as Category) || "其他",
          amount: Number(r.fields?.金额) || 0,
          date: r.fields?.日期 || "",
          notes: r.fields?.备注 || "",
          status: (r.fields?.状态 as Status) || "进行中",
        }));
        setItems(records);
      } else {
        // 演示数据
        setItems(getDemoData());
      }
    } catch (e: any) {
      console.warn("Feishu API 调用失败，使用演示数据：", e.message);
      setItems(getDemoData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived stats ────────────────────────────────────────────────────
  const totalCost = items.reduce((s, i) => s + i.amount, 0);
  const monthPrefix = currentMonth();
  const thisMonthCost = items
    .filter((i) => i.date.startsWith(monthPrefix))
    .reduce((s, i) => s + i.amount, 0);

  const categoryStats = CATEGORIES.map((cat) => {
    const filtered = items.filter((i) => i.category === cat);
    const sum = filtered.reduce((s, i) => s + i.amount, 0);
    return { category: cat, count: filtered.length, total: sum };
  });

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amountNum) || amountNum <= 0) return;

    setSaving(true);
    try {
      if (FEISHU_CONFIG.appToken && FEISHU_CONFIG.tableId) {
        await createRecord(FEISHU_CONFIG.appToken, FEISHU_CONFIG.tableId, {
          项目名称: form.name.trim(),
          分类: form.category,
          金额: amountNum,
          日期: form.date,
          备注: form.notes.trim(),
          状态: form.status,
        });
      }
      // 添加到本地状态
      const newItem: RenovationItem = {
        id: `local-${Date.now()}`,
        name: form.name.trim(),
        category: form.category,
        amount: amountNum,
        date: form.date,
        notes: form.notes.trim(),
        status: form.status,
      };
      setItems((prev) => [newItem, ...prev]);
      setForm({ name: "", category: "硬装", amount: "", date: todayStr(), notes: "", status: "进行中" });
      setShowForm(false);
    } catch (e: any) {
      console.warn("Feishu 保存失败，仅本地添加：", e.message);
      const newItem: RenovationItem = {
        id: `local-${Date.now()}`,
        name: form.name.trim(),
        category: form.category,
        amount: amountNum,
        date: form.date,
        notes: form.notes.trim(),
        status: form.status,
      };
      setItems((prev) => [newItem, ...prev]);
      setForm({ name: "", category: "硬装", amount: "", date: todayStr(), notes: "", status: "进行中" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Refresh ──────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ────── Header ────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              装修记账
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              管理装修预算与支出
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              {refreshing ? "刷新中..." : "刷新"}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {showForm ? "收起表单" : "新增项目"}
            </button>
          </div>
        </div>

        {/* ────── New Item Form ────── */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <h2 className="mb-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              新增装修项目
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* 项目名称 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：厨房瓷砖铺贴"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-500/30"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-500/30"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 金额 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  金额（元）<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-500/30"
                />
              </div>

              {/* 日期 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-500/30"
                />
              </div>

              {/* 状态 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  状态 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-500/30"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* 备注 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  备注
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="可选"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-500/30"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                取消
              </button>
            </div>
          </form>
        )}

        {/* ────── Overview Cards ────── */}
        {loading ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">总装修费用</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{fmt(totalCost)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">本月支出</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{fmt(thisMonthCost)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">项目数量</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{items.length}</p>
            </div>
          </div>
        )}

        {/* ────── Category Stats ────── */}
        {!loading && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              分类统计
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {categoryStats.map(({ category, count, total }) => (
                <div
                  key={category}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[category]}`}
                  >
                    {category}
                  </span>
                  <p className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">{fmt(total)}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{count} 个项目</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────── Project List ────── */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            所有项目
            {!loading && <span className="ml-2 text-sm font-normal text-zinc-400">({items.length})</span>}
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
              <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-sm">暂无装修项目</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                添加第一个项目
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {item.name}
                      </span>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category]}`}
                      >
                        {item.category}
                      </span>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{item.date}</span>
                      {item.notes && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">|</span>
                          <span className="truncate">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {fmt(item.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Demo Data ──────────────────────────────────────────────────────────
function getDemoData(): RenovationItem[] {
  return [
    {
      id: "demo-1",
      name: "全屋瓷砖铺贴",
      category: "硬装",
      amount: 18500,
      date: "2026-05-10",
      notes: "客厅+卧室+厨房",
      status: "进行中",
    },
    {
      id: "demo-2",
      name: "客厅沙发",
      category: "软装",
      amount: 6800,
      date: "2026-05-15",
      notes: "米白色布艺沙发",
      status: "待验收",
    },
    {
      id: "demo-3",
      name: "冰箱",
      category: "家电",
      amount: 5200,
      date: "2026-04-28",
      notes: "双开门 600L",
      status: "已完工",
    },
    {
      id: "demo-4",
      name: "墙面乳胶漆",
      category: "硬装",
      amount: 3200,
      date: "2026-05-08",
      notes: "三棵树环保漆",
      status: "已完工",
    },
    {
      id: "demo-5",
      name: "窗帘定制",
      category: "软装",
      amount: 2800,
      date: "2026-05-20",
      notes: "全屋定制窗帘",
      status: "进行中",
    },
    {
      id: "demo-6",
      name: "洗衣机",
      category: "家电",
      amount: 3500,
      date: "2026-04-25",
      notes: "洗烘一体机",
      status: "已完工",
    },
    {
      id: "demo-7",
      name: "设计费",
      category: "其他",
      amount: 8000,
      date: "2026-05-01",
      notes: "全案设计",
      status: "已完工",
    },
    {
      id: "demo-8",
      name: "卫生间防水",
      category: "硬装",
      amount: 4500,
      date: "2026-05-12",
      notes: "主卫+客卫",
      status: "进行中",
    },
  ];
}
