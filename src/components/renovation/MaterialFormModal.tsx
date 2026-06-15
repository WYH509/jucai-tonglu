"use client";

import { useState, useEffect } from "react";
import type { RenovationMaterial, MaterialStatus } from "@/types/renovation";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<RenovationMaterial, "_id" | "createdAt" | "updatedAt">) => void;
  editMaterial: RenovationMaterial | null;
  saving: boolean;
}

const STATUSES: MaterialStatus[] = ["待采购", "已下单", "到货待装", "已安装", "有质量问题"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MaterialFormModal({ open, onClose, onSave, editMaterial, saving }: Props) {
  const [name, setName] = useState("");
  const [spec, setSpec] = useState("");
  const [brand, setBrand] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("件");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [expectedInstallDate, setExpectedInstallDate] = useState("");
  const [status, setStatus] = useState<MaterialStatus>("待采购");
  const [warrantyUntil, setWarrantyUntil] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editMaterial) {
      setName(editMaterial.name);
      setSpec(editMaterial.spec || "");
      setBrand(editMaterial.brand || "");
      setUnitPrice(String(editMaterial.unitPrice));
      setQuantity(String(editMaterial.quantity));
      setUnit(editMaterial.unit || "件");
      setPurchaseDate(editMaterial.purchaseDate || "");
      setInstallDate(editMaterial.installDate || "");
      setExpectedInstallDate(editMaterial.expectedInstallDate || "");
      setStatus(editMaterial.status);
      setWarrantyUntil(editMaterial.warrantyUntil || "");
      setSupplier(editMaterial.supplier || "");
      setNotes(editMaterial.notes || "");
    } else {
      setName("");
      setSpec("");
      setBrand("");
      setUnitPrice("");
      setQuantity("");
      setUnit("件");
      setPurchaseDate("");
      setInstallDate("");
      setExpectedInstallDate("");
      setStatus("待采购");
      setWarrantyUntil("");
      setSupplier("");
      setNotes("");
    }
  }, [editMaterial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const up = parseFloat(unitPrice);
    const qty = parseFloat(quantity);
    if (!name.trim() || isNaN(up) || up <= 0 || isNaN(qty) || qty <= 0) return;

    onSave({
      name: name.trim(),
      spec: spec.trim() || undefined,
      brand: brand.trim() || undefined,
      unitPrice: up,
      quantity: qty,
      unit: unit || "件",
      purchaseDate: purchaseDate || undefined,
      installDate: installDate || undefined,
      expectedInstallDate: expectedInstallDate || undefined,
      status,
      warrantyUntil: warrantyUntil || undefined,
      supplier: supplier.trim() || undefined,
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
            {editMaterial ? "编辑主材" : "新增主材"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">材料名称 *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：客厅瓷砖"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">品牌</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="可选"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">规格型号</label>
              <input
                type="text"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder="可选"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">单价 *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">数量 *</label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">单位</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="件"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MaterialStatus)}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">采购日期</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">保修至</label>
              <input
                type="date"
                value={warrantyUntil}
                onChange={(e) => setWarrantyUntil(e.target.value)}
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
            {saving ? "保存中..." : editMaterial ? "保存修改" : "添加主材"}
          </button>
        </form>
      </div>
    </div>
  );
}
