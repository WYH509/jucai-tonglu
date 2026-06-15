"use client";

import { useState, useEffect } from "react";
import type { RenovationBill, BillCategory, PayMethod, PayStatus } from "@/types/renovation";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<RenovationBill, "_id" | "createdAt" | "updatedAt">) => void;
  editBill: RenovationBill | null;
  saving: boolean;
}

const CATEGORIES: BillCategory[] = ["硬装", "软装", "家电", "工程", "设计费", "其他"];
const PAY_METHODS: PayMethod[] = ["现金", "转账", "信用卡", "花呗", "其他"];
const PAY_STATUSES: PayStatus[] = ["已付款", "待付款", "已退款"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BillFormModal({ open, onClose, onSave, editBill, saving }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BillCategory>("硬装");
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(todayStr());
  const [payMethod, setPayMethod] = useState<PayMethod>("转账");
  const [payStatus, setPayStatus] = useState<PayStatus>("已付款");
  const [supplier, setSupplier] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editBill) {
      setName(editBill.name);
      setCategory(editBill.category);
      setAmount(String(editBill.amount));
      setPayDate(editBill.payDate);
      setPayMethod(editBill.payMethod);
      setPayStatus(editBill.payStatus);
      setSupplier(editBill.supplier || "");
      setSupplierContact(editBill.supplierContact || "");
      setNotes(editBill.notes || "");
    } else {
      setName("");
      setCategory("硬装");
      setAmount("");
      setPayDate(todayStr());
      setPayMethod("转账");
      setPayStatus("已付款");
      setSupplier("");
      setSupplierContact("");
      setNotes("");
    }
  }, [editBill, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!name.trim() || isNaN(amountNum) || amountNum <= 0) return;
    onSave({
      name: name.trim(),
      category,
      amount: amountNum,
      payDate,
      payMethod,
      payStatus,
      supplier: supplier.trim() || undefined,
      supplierContact: supplierContact.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-900">
            {editBill ? "编辑账单" : "新增账单"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">项目名称 *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：全屋瓷砖铺贴"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BillCategory)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">付款状态</label>
              <select
                value={payStatus}
                onChange={(e) => setPayStatus(e.target.value as PayStatus)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              >
                {PAY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">金额（元）*</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">付款日期</label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">付款方式</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PayMethod)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              >
                {PAY_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">供应商</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="可选"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="可选"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-blue-500 text-white py-3 text-sm font-semibold hover:bg-blue-600 active:scale-[0.98] transition disabled:opacity-50"
          >
            {saving ? "保存中..." : editBill ? "保存修改" : "添加账单"}
          </button>
        </form>
      </div>
    </div>
  );
}
