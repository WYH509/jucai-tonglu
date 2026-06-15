"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { RenovationBill, RenovationMaterial, RenovationSummary } from "@/types/renovation";
import SummaryCards from "./SummaryCards";
import CategoryBreakdown from "./CategoryBreakdown";
import MonthlyTrend from "./MonthlyTrend";
import WarrantyAlerts from "./WarrantyAlerts";
import BillList from "./BillList";
import MaterialList from "./MaterialList";
import BillFormModal from "./BillFormModal";
import MaterialFormModal from "./MaterialFormModal";
import FloatingActionButton from "./FloatingActionButton";

type TabType = "bills" | "materials";

const API_BASE = "/api/renovation";

export default function RenovationDashboard() {
  const router = useRouter();

  const [bills, setBills] = useState<RenovationBill[]>([]);
  const [materials, setMaterials] = useState<RenovationMaterial[]>([]);
  const [summary, setSummary] = useState<RenovationSummary | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("bills");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [editBill, setEditBill] = useState<RenovationBill | null>(null);
  const [editMaterial, setEditMaterial] = useState<RenovationMaterial | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [billsRes, materialsRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE}/bills`),
        axios.get(`${API_BASE}/materials`),
        axios.get(`${API_BASE}/summary`),
      ]);

      const b = billsRes.data.bills || [];
      setBills(b);
      setMaterials(materialsRes.data.materials || []);
      setSummary(summaryRes.data);

      // 如果 bills 为空，自动 seed
      if (b.length === 0) {
        try {
          const seedRes = await axios.post(`${API_BASE}/seed`);
          if (seedRes.data.ok) {
            // 重新加载
            const [b2, m2, s2] = await Promise.all([
              axios.get(`${API_BASE}/bills`),
              axios.get(`${API_BASE}/materials`),
              axios.get(`${API_BASE}/summary`),
            ]);
            setBills(b2.data.bills || []);
            setMaterials(m2.data.materials || []);
            setSummary(s2.data);
          }
        } catch (seedErr: any) {
          // seed 可能返回 409（已有数据），忽略
          if (seedErr.response?.status !== 409) {
            console.warn("Seed warning:", seedErr.message);
          }
        }
      }
    } catch (err: any) {
      console.error("Fetch data error:", err);
      setError("加载失败，请重试");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── CRUD: Bill ──
  const handleSaveBill = async (data: Omit<RenovationBill, "_id" | "createdAt" | "updatedAt">) => {
    setSaving(true);
    try {
      if (editBill && editBill._id) {
        await axios.put(`${API_BASE}/bills/${editBill._id}`, data);
      } else {
        await axios.post(`${API_BASE}/bills`, data);
      }
      setBillFormOpen(false);
      setEditBill(null);
      fetchData();
    } catch (err: any) {
      console.error("Save bill error:", err);
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBill = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/bills/${id}`);
      fetchData();
    } catch (err: any) {
      console.error("Delete bill error:", err);
      setError("删除失败，请重试");
    }
  };

  const handleEditBill = (bill: RenovationBill) => {
    setEditBill(bill);
    setBillFormOpen(true);
  };

  // ── CRUD: Material ──
  const handleSaveMaterial = async (
    data: Omit<RenovationMaterial, "_id" | "createdAt" | "updatedAt">
  ) => {
    setSaving(true);
    try {
      if (editMaterial && editMaterial._id) {
        await axios.put(`${API_BASE}/materials/${editMaterial._id}`, data);
      } else {
        await axios.post(`${API_BASE}/materials`, data);
      }
      setMaterialFormOpen(false);
      setEditMaterial(null);
      fetchData();
    } catch (err: any) {
      console.error("Save material error:", err);
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/materials/${id}`);
      fetchData();
    } catch (err: any) {
      console.error("Delete material error:", err);
      setError("删除失败，请重试");
    }
  };

  const handleEditMaterial = (m: RenovationMaterial) => {
    setEditMaterial(m);
    setMaterialFormOpen(true);
  };

  const isDemoData = bills.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* ── 顶部导航 ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="flex items-center h-12 px-4 max-w-3xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 p-1 -ml-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="flex-1 text-center font-semibold text-zinc-900 text-sm">
            装修记账 · 湘江公寓
          </span>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="text-blue-500 p-1"
          >
            <svg className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* ── 演示数据角标 ── */}
        {isDemoData && (
          <div className="mb-4 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-blue-600">演示数据，可手动修改/删除</span>
          </div>
        )}

        {/* ── 错误提示 ── */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-600">{error}</span>
            <button onClick={() => setError("")} className="text-red-400 text-sm">关闭</button>
          </div>
        )}

        {/* ── 总览卡片 ── */}
        {summary && (
          <>
            <SummaryCards summary={summary} />

            {/* 保修提醒 */}
            <WarrantyAlerts items={summary.warrantyExpiring} />

            {/* 分类统计 */}
            <CategoryBreakdown
              breakdown={summary.categoryBreakdown}
              totalSpent={summary.totalSpent}
            />

            {/* 月度趋势 */}
            <MonthlyTrend data={summary.monthlyTrend} />
          </>
        )}

        {/* ── Tab 切换 ── */}
        <div className="sticky top-12 z-20 bg-zinc-50 -mx-4 px-4 pt-2 pb-3 border-b border-zinc-200">
          <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("bills")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "bills"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              账单明细
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === "materials"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              主材清单
            </button>
          </div>
        </div>

        {/* ── 列表区 ── */}
        <div className="pt-4">
          {activeTab === "bills" ? (
            <BillList
              bills={bills}
              onEdit={handleEditBill}
              onDelete={handleDeleteBill}
              loading={loading}
            />
          ) : (
            <MaterialList
              materials={materials}
              onEdit={handleEditMaterial}
              onDelete={handleDeleteMaterial}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* ── FAB ── */}
      <FloatingActionButton
        onAddBill={() => {
          setEditBill(null);
          setBillFormOpen(true);
        }}
        onAddMaterial={() => {
          setEditMaterial(null);
          setMaterialFormOpen(true);
        }}
      />

      {/* ── Modals ── */}
      <BillFormModal
        open={billFormOpen}
        onClose={() => {
          setBillFormOpen(false);
          setEditBill(null);
        }}
        onSave={handleSaveBill}
        editBill={editBill}
        saving={saving}
      />
      <MaterialFormModal
        open={materialFormOpen}
        onClose={() => {
          setMaterialFormOpen(false);
          setEditMaterial(null);
        }}
        onSave={handleSaveMaterial}
        editMaterial={editMaterial}
        saving={saving}
      />
    </div>
  );
}
