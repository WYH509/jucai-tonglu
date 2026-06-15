"use client";

import { useState, useRef } from "react";
import type { RenovationMaterial, MaterialStatus } from "@/types/renovation";

interface Props {
  materials: RenovationMaterial[];
  onEdit: (m: RenovationMaterial) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const STATUS_COLORS: Record<MaterialStatus, string> = {
  "待采购": "bg-yellow-100 text-yellow-700",
  "已下单": "bg-blue-100 text-blue-700",
  "到货待装": "bg-purple-100 text-purple-700",
  "已安装": "bg-green-100 text-green-700",
  "有质量问题": "bg-red-100 text-red-700",
};

const STATUS_ORDER: MaterialStatus[] = ["待采购", "已下单", "到货待装", "已安装", "有质量问题"];

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function MaterialList({ materials, onEdit, onDelete, loading }: Props) {
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-zinc-400">
        <span className="text-5xl mb-4">🧱</span>
        <p className="text-sm">暂无主材记录</p>
      </div>
    );
  }

  // 按状态分组
  const grouped = new Map<MaterialStatus, RenovationMaterial[]>();
  for (const s of STATUS_ORDER) grouped.set(s, []);
  for (const m of materials) {
    const arr = grouped.get(m.status) || [];
    arr.push(m);
    grouped.set(m.status, arr);
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries())
        .filter(([, items]) => items.length > 0)
        .map(([status, items]) => (
          <div key={status}>
            <div className="flex items-center gap-2 px-1 py-2">
              <span className="text-xs font-medium text-zinc-500">{status}</span>
              <span className="text-[10px] text-zinc-400">({items.length})</span>
            </div>
            <div className="space-y-2">
              {items.map((m) => (
                <div
                  key={m._id}
                  className="relative overflow-hidden rounded-xl"
                  onTouchStart={(e) => {
                    touchStartX.current = e.touches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    const diff = touchStartX.current - e.changedTouches[0].clientX;
                    if (diff > 60 && m._id) {
                      setSwipingId(m._id);
                    } else {
                      setSwipingId(null);
                    }
                  }}
                >
                  {m._id && swipingId === m._id && (
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        onClick={() => {
                          onDelete(m._id!);
                          setSwipingId(null);
                        }}
                        className="h-full bg-red-500 text-white px-6 text-sm font-medium rounded-r-xl"
                      >
                        删除
                      </button>
                    </div>
                  )}
                  <div
                    className={`bg-white border border-zinc-100 rounded-xl p-3 transition-transform ${
                      swipingId === m._id ? "-translate-x-20" : ""
                    }`}
                    onClick={() => onEdit(m)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-zinc-900 truncate">
                            {m.name}
                          </span>
                          {m.brand && (
                            <span className="text-[10px] text-zinc-400">{m.brand}</span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[m.status]}`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                          {m.spec && <span>{m.spec}</span>}
                          {m.warrantyUntil && (
                            <span className="text-orange-500">
                              保修至 {m.warrantyUntil}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-zinc-900">
                          {fmt(m.subtotal || m.unitPrice * m.quantity)}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          ¥{m.unitPrice} × {m.quantity}{m.unit || "件"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
